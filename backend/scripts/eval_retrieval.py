"""Retrieval eval: top-5/8/10 hits for a question set against a running ContextForge backend.

A question is a hit at k if one of the first k chunks from /search lies in a gold file and overlaps the body of
one of that file's gold definitions. Definitions are located with Python's ast in a local copy of the repo, which
must be at the same commit as the backend's clone (chunks that can't be found in it are reported).

    python scripts/eval_retrieval.py --base-url http://127.0.0.1:8001 --source repos/flask
    python scripts/eval_retrieval.py --base-url https://<host>/api --source <flask checkout>

Uses only the standard library. Sends one /search request per question (no LLM calls).
"""
import argparse
import ast
import json
import os
import re
import sys
import urllib.request

DEFAULT_QUESTIONS = os.path.join(os.path.dirname(__file__), "..", "..", "docs", "eval", "flask_questions.json")
HEADER = re.compile(r"\A# File: [^\n]*\n(?:# Symbols: [^\n]*\n)?")  # the header chunk_service adds
KS = (5, 8, 10)


def definitions(path):
    """{qualified name: (first line, last line)} for every def/class in a Python file."""
    with open(path, encoding="utf-8", errors="ignore") as f:  # universal newlines, like the indexer's read
        text = f.read()
    spans = {}

    def walk(node, prefix):
        for child in ast.iter_child_nodes(node):
            if isinstance(child, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
                name = prefix + child.name
                spans[name] = (child.lineno, child.end_lineno)
                walk(child, name + ".")

    walk(ast.parse(text), "")
    return text, spans


def chunk_lines(text, chunk):
    """Line span of a chunk inside its source file, or None if the chunk isn't in this copy of the file."""
    body = HEADER.sub("", chunk, count=1)
    offset = text.find(body)
    if offset < 0:
        return None
    first = text.count("\n", 0, offset) + 1
    return first, first + body.count("\n")


def search(base_url, repo, query, k):
    req = urllib.request.Request(
        base_url.rstrip("/") + "/search",
        data=json.dumps({"query": query, "repo_name": repo, "top_k": k}).encode(),
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        results = json.load(resp)["results"]
    return list(zip(results["documents"], results["metadatas"]))


def first_hit_rank(chunks, gold, source, cache, missing):
    for rank, (doc, meta) in enumerate(chunks, 1):
        names = [g["symbol"] for g in gold if g["file"] == meta["file"]]
        if not names:
            continue
        if meta["file"] not in cache:
            cache[meta["file"]] = definitions(os.path.join(source, meta["file"]))
        text, spans = cache[meta["file"]]
        lines = chunk_lines(text, doc)
        if lines is None:
            missing.append(meta["file"])
            continue
        a, b = lines
        if any(s <= b and e >= a for s, e in (spans[n] for n in names if n in spans)):
            return rank
    return None


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--base-url", default="http://127.0.0.1:8001", help="backend URL (the compose port, or <site>/api)")
    p.add_argument("--source", required=True, help="local checkout of the indexed repo, same commit as the backend's")
    p.add_argument("--questions", default=DEFAULT_QUESTIONS)
    args = p.parse_args()

    with open(args.questions, encoding="utf-8") as f:
        spec = json.load(f)
    questions = spec["questions"]
    for q in questions:  # fail fast on a typo in the gold set, not with a silent miss
        for g in q["gold"]:
            _, spans = definitions(os.path.join(args.source, g["file"]))
            assert g["symbol"] in spans, f"{g['symbol']} not found in {g['file']}"

    cache, missing, ranks = {}, [], []
    for i, q in enumerate(questions, 1):
        chunks = search(args.base_url, spec["repo_name"], q["question"], max(KS))
        rank = first_hit_rank(chunks, q["gold"], args.source, cache, missing)
        ranks.append(rank)
        print(f"Q{i:<2} first hit at rank {rank if rank else '-':<2} {q['question']}")

    print()
    for k in KS:
        print(f"top-{k}: {sum(1 for r in ranks if r and r <= k)}/{len(questions)}")
    if missing:
        print(f"\nWARNING: {len(missing)} retrieved gold-file chunk(s) were not found in --source "
              f"({', '.join(sorted(set(missing)))}). Check out the commit the backend indexed.", file=sys.stderr)
        sys.exit(2)


if __name__ == "__main__":
    main()
