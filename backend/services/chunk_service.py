def chunk_documents(documents, chunk_size=800, overlap=100):
    chunks = []

    for document in documents:

        text = document["content"]

        filename = document["file"]

        start = 0

        while start < len(text):

            end = start + chunk_size

            chunk = text[start:end]

            chunks.append({
                "file": filename,
                "content": chunk
            })

            start += chunk_size - overlap

    return chunks