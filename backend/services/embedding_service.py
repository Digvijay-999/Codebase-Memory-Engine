import os
import uuid
import logging
from pathlib import Path
from typing import List, Union, Dict, Any

import numpy as np
import onnxruntime as ort
from tokenizers import Tokenizer
import chromadb
from fastapi import HTTPException

from config.settings import (
    CHROMA_DB_PATH,
    MODEL_DIR,
    EMBEDDING_BATCH_SIZE,
    CHROMA_BATCH_SIZE,
    TOP_K_RESULTS
)

logger = logging.getLogger(__name__)


class ONNXEmbeddingModel:
    """Lightweight ONNX Runtime embedding model for all-MiniLM-L6-v2."""

    def __init__(self, model_dir: Union[str, Path]):
        self.model_dir = Path(model_dir)
        tokenizer_path = self.model_dir / "tokenizer.json"
        model_path = self.model_dir / "model.onnx"

        if not tokenizer_path.exists():
            raise FileNotFoundError(f"Tokenizer not found at {tokenizer_path}")
        if not model_path.exists():
            raise FileNotFoundError(f"ONNX model not found at {model_path}")

        logger.info(f"Initializing ONNX tokenizer from {tokenizer_path}")
        self.tokenizer = Tokenizer.from_file(str(tokenizer_path))
        # max_length=256 matching sentence-transformers all-MiniLM-L6-v2 spec
        self.tokenizer.enable_truncation(max_length=256)
        self.tokenizer.enable_padding(pad_id=0, pad_token="[PAD]")

        logger.info(f"Initializing ONNX Runtime session from {model_path}")
        so = ort.SessionOptions()
        so.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
        so.log_severity_level = 3  # Warning level only

        # Explicit CPU-only provider
        self.session = ort.InferenceSession(
            str(model_path),
            sess_options=so,
            providers=["CPUExecutionProvider"]
        )
        self.input_names = {inp.name for inp in self.session.get_inputs()}

    def encode(
        self,
        texts: Union[str, List[str]],
        batch_size: int = EMBEDDING_BATCH_SIZE,
        show_progress_bar: bool = False
    ) -> np.ndarray:
        """
        Encode text or list of texts into normalized 384-dimensional embeddings.
        Maintains contract compatibility with SentenceTransformer.encode().
        """
        is_single = isinstance(texts, str)
        if is_single:
            texts = [texts]

        if not texts:
            return np.empty((0, 384), dtype=np.float32)

        all_embeddings = []
        for i in range(0, len(texts), batch_size):
            batch = texts[i : i + batch_size]
            encoded = self.tokenizer.encode_batch(batch)

            input_ids = np.array([e.ids for e in encoded], dtype=np.int64)
            attention_mask = np.array([e.attention_mask for e in encoded], dtype=np.int64)

            feed_dict = {
                "input_ids": input_ids,
                "attention_mask": attention_mask
            }
            if "token_type_ids" in self.input_names:
                feed_dict["token_type_ids"] = np.array([e.type_ids for e in encoded], dtype=np.int64)

            outputs = self.session.run(None, feed_dict)
            last_hidden_state = outputs[0]  # (batch_size, seq_len, 384)

            # Mean pooling with attention mask
            mask_expanded = np.expand_dims(attention_mask, -1).astype(np.float32)
            sum_embeddings = np.sum(last_hidden_state * mask_expanded, axis=1)
            sum_mask = np.clip(mask_expanded.sum(axis=1), a_min=1e-9, a_max=None)
            mean_pooled = sum_embeddings / sum_mask

            # L2 normalization
            norms = np.linalg.norm(mean_pooled, axis=1, keepdims=True)
            norms[norms == 0] = 1e-12
            normalized = mean_pooled / norms
            all_embeddings.append(normalized.astype(np.float32))

        result = np.vstack(all_embeddings)
        if is_single:
            return result[0]
        return result


_model: Union[ONNXEmbeddingModel, None] = None


def get_model() -> ONNXEmbeddingModel:
    """Singleton getter for the ONNX embedding model."""
    global _model
    if _model is None:
        logger.info(f"Loading ONNX embedding model from: {MODEL_DIR}")
        _model = ONNXEmbeddingModel(MODEL_DIR)
    return _model


def warmup_model():
    """Pre-warm the ONNX embedding session and ChromaDB client during server startup."""
    model = get_model()
    # Quick dummy encoding to warm up ONNX Runtime CPU graph
    model.encode(["Warmup text query"], show_progress_bar=False)
    # Ensure ChromaDB collection is ready
    _ = collection.count()
    logger.info("ONNX embedding model and ChromaDB pre-warmed successfully.")


client = chromadb.PersistentClient(path=CHROMA_DB_PATH)

collection = client.get_or_create_collection(
    name="codebase"
)


def create_embedding(text: str) -> List[float]:
    """Generate 384-dimensional embedding for a single query or text."""
    if not text:
        return []
    model = get_model()
    embedding = model.encode(text, show_progress_bar=False)
    return embedding.tolist()


def store_chunks(chunks: List[Dict[str, Any]], repo_name: str) -> int:
    """Embed and store repository code chunks into ChromaDB."""
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

    # Generate all embeddings using batch ONNX inference
    model = get_model()
    embeddings = model.encode(
        documents,
        batch_size=EMBEDDING_BATCH_SIZE,
        show_progress_bar=False
    ).tolist()

    # Clear existing chunks for this repository to ensure clean updates
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


def search_chunks(query: str, repo_name: str, n_results: int = TOP_K_RESULTS) -> Dict[str, Any]:
    """Perform repository-scoped semantic search using ONNX query embeddings."""
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
