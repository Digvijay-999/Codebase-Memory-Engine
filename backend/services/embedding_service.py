import chromadb
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("all-MiniLM-L6-v2")

client = chromadb.Client()

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

    collection.add(
        ids=ids,
        documents=documents,
        embeddings=embeddings
    )

    return len(ids)


def search_chunks(query, n_results=5):

    query_embedding = create_embedding(query)

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=n_results
    )

    return results
