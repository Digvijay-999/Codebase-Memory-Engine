from services.chunk_service import chunk_documents

SOURCE = (
    "import os\n\n"
    "class Router:\n"
    "    def add_url_rule(self, rule):\n"
    "        self.rules.append(rule)\n" + "        # padding\n" * 20 +
    "    def dispatch(self, request):\n"
    "        return self.rules[0]\n"
)


def _split(content):
    header, _, body = content.partition("\n# Symbols: ")
    if body:
        symbols, _, body = body.partition("\n")
        return header, symbols.split(", "), body
    header, _, body = content.partition("\n")
    return header, [], body


def test_chunks_keep_their_boundaries_and_get_a_file_and_symbol_header():
    chunks = chunk_documents([{"file": "src/router.py", "content": SOURCE}], chunk_size=120, overlap=20)
    plain = chunk_documents([{"file": "x", "content": SOURCE}], chunk_size=120, overlap=20)
    assert len(chunks) == len(plain) > 2

    start = 0
    for chunk in chunks:
        header, symbols, body = _split(chunk["content"])
        assert header == "# File: src/router.py"
        assert body == SOURCE[start:start + 120]  # the text after the header is the exact slice
        start += 100

    _, first, _ = _split(chunks[0]["content"])
    assert first == ["Router", "add_url_rule"]  # defined inside the chunk
    _, middle, body = _split(chunks[2]["content"])
    assert "def " not in body and middle == ["add_url_rule"]  # starts mid-function: names the enclosing one
    _, last, _ = _split(chunks[-1]["content"])
    assert "dispatch" in last


def test_file_without_definitions_gets_only_the_path():
    (chunk,) = chunk_documents([{"file": "README.md", "content": "# Title\nSome text.\n"}])
    assert chunk["content"] == "# File: README.md\n# Title\nSome text.\n"
