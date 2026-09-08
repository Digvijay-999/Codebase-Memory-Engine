import chromadb
from sentence_transformers import SentenceTransformer
from fastapi import HTTPException
import uuid
import logging
from config.settings import (
    CHROMA_DB_PATH,
    EMBEDDING_MODEL,
    EMBEDDING_BATCH_SIZE,
    CHROMA_BATCH_SIZE,
    TOP_K_RESULTS
)

logger = logging.getLogger(__name__)

_model = None

def get_model():
    global _model
    if _model is None:
        logger.info(f"Loading SentenceTransformer model: {EMBEDDING_MODEL}")
        _model = SentenceTransformer(EMBEDDING_MODEL)
    return _model

def warmup_model():
    """Pre-warm the embedding model and ChromaDB client during server startup."""
    model = get_model()
    # Quick dummy encoding to warm up PyTorch / CPU kernels
    model.encode(["Warmup text query"], show_progress_bar=False)
    # Ensure collection is ready
    _ = collection.count()
    logger.info("SentenceTransformer model and ChromaDB pre-warmed successfully.")

client = chromadb.PersistentClient(path=CHROMA_DB_PATH)

collection = client.get_or_create_collection(
    name="codebase"
)


def create_embedding(text: str):
    if not text:
        return []
    model = get_model()
    embedding = model.encode(text, show_progress_bar=False)
    return embedding.tolist()


def store_chunks(chunks, repo_name: str):
    if not chunks:
        return 0

    documents = [chunk["content"] for chunk in chunks]
    metadatas_raw = [
        {
            "file": chunk["file"],
            "repo_name": repo_name,
        }
        for chunk in chunks
    ]

    # Generate all embeddings using batch encoding
    model = get_model()
    embeddings = model.encode(
        documents,
        batch_size=EMBEDDING_BATCH_SIZE,
        show_progress_bar=False
    ).tolist()

    # Clear existing chunks for this repository
    try:
        collection.delete(where={"repo_name": repo_name})
    except Exception as e:
        logger.debug(f"Chroma delete non-fatal error: {e}")

    # Generate IDs
    ids = [str(uuid.uuid4()) for _ in range(len(chunks))]
    for i, meta in enumerate(metadatas_raw):
        meta["chunk_id"] = ids[i]

    # Batch inserts into ChromaDB to avoid memory spikes and batch size limits
    total_chunks = len(chunks)
    try:
        for i in range(0, total_chunks, CHROMA_BATCH_SIZE):
            end_idx = min(i + CHROMA_BATCH_SIZE, total_chunks)
            collection.add(
                ids=ids[i:end_idx],
                documents=documents[i:end_idx],
                embeddings=embeddings[i:end_idx],
                metadatas=metadatas_raw[i:end_idx]
            )
    except Exception as e:
        logger.error(f"ChromaDB batch insertion error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"ChromaDB Error: {str(e)}"
        )

    return total_chunks


def search_chunks(query: str, repo_name: str, n_results: int = TOP_K_RESULTS):
    if not query or not query.strip():
        return {"documents": [], "metadatas": []}

    query_embedding = create_embedding(query.strip())

    try:
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results,
            where={"repo_name": repo_name}
        )
    except Exception as e:
        logger.error(f"Search error in ChromaDB: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Search Error: {str(e)}"
        )

    docs = results.get("documents", [[]])
    metas = results.get("metadatas", [[]])

    retrieved_docs = docs[0] if docs and len(docs) > 0 else []
    retrieved_metas = metas[0] if metas and len(metas) > 0 else []

    # Deduplicate exact chunk contents if identical chunks returned
    unique_docs = []
    unique_metas = []
    seen = set()

    for doc, meta in zip(retrieved_docs, retrieved_metas):
        doc_hash = hash(doc)
        if doc_hash not in seen:
            seen.add(doc_hash)
            unique_docs.append(doc)
            unique_metas.append(meta)

    return {
        "documents": unique_docs,
        "metadatas": unique_metas
    }
