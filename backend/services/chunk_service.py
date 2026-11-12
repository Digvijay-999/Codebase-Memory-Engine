import re
from bisect import bisect_left

from config.settings import CHUNK_SIZE, CHUNK_OVERLAP

# Definition lines in common languages. Each chunk's text starts with its file path and the names defined in or
# around it, so both the embedding and the LLM see where the code lives (a raw slice often starts mid-function).
_DEF = re.compile(r"^[ \t]*(?:export\s+)?(?:async\s+)?(?:def|class|function|func|fn|interface|struct)\s+(\w+)", re.M)


def _header(filename, defs, start, end):
    i = bisect_left(defs, (start,))  # first definition at or after the chunk start
    names = ([defs[i - 1][1]] if i else []) + [name for pos, name in defs[i:] if pos < end]
    header = f"# File: {filename}\n"
    if names:
        header += "# Symbols: " + ", ".join(dict.fromkeys(names)) + "\n"
    return header


def chunk_documents(documents, chunk_size=CHUNK_SIZE, overlap=CHUNK_OVERLAP):
    chunks = []

    for document in documents:
        text = document["content"]
        filename = document["file"]

        if not text or not text.strip():
            continue

        defs = [(m.start(), m.group(1)) for m in _DEF.finditer(text)]
        start = 0
        text_length = len(text)

        while start < text_length:
            end = min(start + chunk_size, text_length)
            chunk = text[start:end]

            if chunk.strip():
                chunks.append({
                    "file": filename,
                    "content": _header(filename, defs, start, end) + chunk
                })

            if end >= text_length:
                break

            start += max(1, chunk_size - overlap)

    return chunks
