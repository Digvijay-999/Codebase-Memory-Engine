import os
import re
from collections import Counter

from config.settings import MAX_FILE_SIZE_BYTES
from services.chunk_service import _DEF

# Root-level project files, read in this order.
MANIFESTS = ["pyproject.toml", "setup.py", "package.json", "requirements.txt", "go.mod", "Cargo.toml",
             "pom.xml", "Dockerfile", "docker-compose.yml"]
ENTRY_POINTS = {"main.py", "app.py", "__main__.py", "manage.py", "server.py", "wsgi.py",
                "index.js", "index.ts", "main.js", "main.ts", "server.js", "server.ts", "main.go", "main.rs"}
MAX_ENTRY_POINTS = 4

MAX_CONTEXT_CHARS = 24000  # about 6.7k prompt tokens for flask; output length, not this, drives report time
README_CHARS = 4000
MANIFEST_CHARS = 1500
FILE_CHARS = 2000
HEAD_CHARS = 600  # of a long code file: its head (docstring, imports), then its definition lines

_AUX_DIRS = {"test", "tests", "__tests__", "testing", "example", "examples", "docs", "doc", "fixtures", "benchmarks", "sample", "samples", "demo", "demos"}
_DEF_LINE = re.compile(_DEF.pattern + r".*$", re.M)
_PY_FROM = re.compile(r"^[ \t]*from[ \t]+(\.*)([\w.]*)[ \t]+import[ \t]+([^\n#]+)", re.M)
_PY_IMPORT = re.compile(r"^[ \t]*import[ \t]+([\w.]+)", re.M)
_JS_IMPORT = re.compile(r"""(?:from\s+|require\(\s*|import\(\s*)['"](\.{1,2}/[^'"]+)['"]""")


def read_repository(repo_path: str, files: list):
    documents = []

    for file in files:
        full_path = os.path.join(repo_path, file)

        try:
            # Check size before reading
            if os.path.getsize(full_path) > MAX_FILE_SIZE_BYTES:
                continue

            with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()

            if content.strip():
                documents.append({
                    "file": file.replace("\\", "/"),
                    "content": content
                })

        except Exception:
            continue

    return documents


def _module_key(path):
    """Name other files import this one by: 'src/flask/app.py' -> 'app', 'src/flask/__init__.py' -> 'flask'."""
    parts = path.split("/")
    stem = os.path.splitext(parts[-1])[0]
    return parts[-2] if stem in ("__init__", "index") and len(parts) > 1 else stem


def _import_counts(documents):
    """How many other files import each module key. Only relative imports and imports of the repo's own
    packages count, so stdlib names (typing, json) don't match same-named repo files.
    shortcut: matches by module name, not full path, so same-named modules share a count; good enough to rank."""
    # any folder holding .py files, so namespace packages (no __init__.py) count too
    packages = {d["file"].split("/")[-2] for d in documents if d["file"].endswith(".py") and "/" in d["file"]}
    keys = {_module_key(d["file"]) for d in documents}
    counts = Counter()
    for doc in documents:
        targets = set()
        for dots, module, names in _PY_FROM.findall(doc["content"]):
            parts = module.split(".") if module else []
            if dots or (parts and parts[0] in packages):
                targets.update(parts[-1:])
                # from . import views / from flask import json: the names may be submodules
                targets.update(n.split()[0] for n in names.replace("(", "").replace(")", "").split(",") if n.strip())
        for module in _PY_IMPORT.findall(doc["content"]):
            parts = module.split(".")
            if parts[0] in packages:
                targets.add(parts[-1])
        for path in _JS_IMPORT.findall(doc["content"]):
            targets.add(_module_key(os.path.splitext(path.rstrip("/"))[0]))
        targets &= keys
        targets.discard(_module_key(doc["file"]))
        counts.update(targets)
    return counts


def _is_aux(path):
    """Tests, examples and docs: read after the project's own code."""
    parts = path.lower().split("/")
    # first word of each folder name, so docs_src/ and test-apps/ count too
    return any(re.split(r"[-_.]", d)[0] in _AUX_DIRS for d in parts[:-1]) or parts[-1].startswith("test_")


def _code_snippet(content, limit=FILE_CHARS):
    """A short file whole; a long one as its head plus its definition lines."""
    if len(content) <= limit:
        return content
    outline = "\n".join(m.group(0).rstrip() for m in _DEF_LINE.finditer(content))
    return f"{content[:HEAD_CHARS]}\n...\n# Definitions in this file:\n{outline}"[:limit]


def get_repository_context(documents, max_chars: int = MAX_CONTEXT_CHARS):
    """Whole-repo context for analyze/explain/readme: root README, root manifests, entry points, then the
    modules other files import most."""
    by_file = {doc["file"]: doc for doc in documents}
    picked = []

    readme = next((f for f in by_file if f.lower() == "readme.md"), None)
    if readme:
        picked.append((readme, by_file[readme]["content"][:README_CHARS]))
    picked += [(m, by_file[m]["content"][:MANIFEST_CHARS]) for m in MANIFESTS if m in by_file]

    entries = sorted((f for f in by_file if os.path.basename(f) in ENTRY_POINTS and not _is_aux(f)),
                     key=lambda f: (f.count("/"), f))[:MAX_ENTRY_POINTS]
    picked += [(f, _code_snippet(by_file[f]["content"])) for f in entries]

    counts = _import_counts(documents)
    chosen = {f for f, _ in picked}
    rest = sorted((f for f in by_file if f not in chosen),
                  key=lambda f: (_is_aux(f), -counts[_module_key(f)], f.count("/"), f))
    picked += [(f, _code_snippet(by_file[f]["content"])) for f in rest]

    context_chunks, current_length = [], 0
    for file, text in picked:
        snippet = f"--- {file} ---\n{text}\n"
        if current_length + len(snippet) + 1 > max_chars:  # +1 for the joining newline
            continue  # a smaller file further down may still fit
        context_chunks.append(snippet)
        current_length += len(snippet) + 1
    return "\n".join(context_chunks)
