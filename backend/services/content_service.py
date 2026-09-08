import os
from config.settings import MAX_FILE_SIZE_BYTES

IMPORTANT_FILES = {
    "README.md",
    "package.json",
    "requirements.txt",
    "pyproject.toml",
    "main.py",
    "app.py",
    "index.js",
    "index.ts",
    "Dockerfile",
    "docker-compose.yml",
}

MAX_CONTEXT_CHARS = 16000 # ~4k tokens budget for repository context


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


def get_repository_context(documents, max_chars: int = MAX_CONTEXT_CHARS):
    context_chunks = []
    current_length = 0

    # 1. Add important architectural / config files first (truncated to 2500 chars each)
    for doc in documents:
        filename = os.path.basename(doc["file"])

        if filename in IMPORTANT_FILES:
            snippet = f"--- {doc['file']} ---\n{doc['content'][:2500]}\n"
            if current_length + len(snippet) <= max_chars:
                context_chunks.append(snippet)
                current_length += len(snippet)

    # 2. Add additional source files until context budget is reached
    for doc in documents:
        filename = os.path.basename(doc["file"])
        if filename not in IMPORTANT_FILES:
            snippet = f"--- {doc['file']} ---\n{doc['content'][:1500]}\n"
            if current_length + len(snippet) <= max_chars:
                context_chunks.append(snippet)
                current_length += len(snippet)
            else:
                break

    return "\n".join(context_chunks)
