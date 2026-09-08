from config.settings import CHUNK_SIZE, CHUNK_OVERLAP

def chunk_documents(documents, chunk_size=CHUNK_SIZE, overlap=CHUNK_OVERLAP):
    chunks = []

    for document in documents:
        text = document["content"]
        filename = document["file"]

        if not text or not text.strip():
            continue

        start = 0
        text_length = len(text)

        while start < text_length:
            end = min(start + chunk_size, text_length)
            chunk = text[start:end]

            if chunk.strip():
                chunks.append({
                    "file": filename,
                    "content": chunk
                })

            if end >= text_length:
                break

            start += max(1, chunk_size - overlap)

    return chunks