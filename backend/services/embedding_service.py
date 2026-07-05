import chromadb
from sentence_transformers import SentenceTransformer
from fastapi import HTTPException

model = SentenceTransformer("all-MiniLM-L6-v2")

client = chromadb.PersistentClient(path="./chroma_db")

collection = client.get_or_create_collection(
    name="codebase"
)


def create_embedding(text: str):
    embedding = model.encode(text)
    return embedding.tolist()


def store_chunks(chunks):
    if not chunks:
        return 0

    ids = [str(i) for i in range(len(chunks))]
    documents = [chunk["content"] for chunk in chunks]

    # Generate all embeddings in one batch
    embeddings = model.encode(documents).tolist()

    try:
        collection.add(
            ids=ids,
            documents=documents,
            embeddings=embeddings,
            metadatas=[
                {"file": chunk["file"]}
                for chunk in chunks
            ]
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"ChromaDB Error: {str(e)}"
        )

    return len(ids)


def search_chunks(query, n_results=5):

    query_embedding = create_embedding(query)

    try:
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Search Error: {str(e)}"
        )

    return {
        "documents": results["documents"][0],
        "metadatas": results["metadatas"][0]
    }
