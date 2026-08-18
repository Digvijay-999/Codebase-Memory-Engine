# HLD — ContextForge Architecture (High-Level Design)

## System Overview

Client (Frontend / API) → FastAPI backend → Services (Repo/File/Content/Chunk/Embedding/LLM) → ChromaDB & local filesystem.

## Major Components

- API Layer: FastAPI app defined in `backend/main.py` and routed by `backend/routers/repo_router.py`.
- Repo Service: clones and manages repositories on local disk (`backend/services/repo_service.py`).
- File Service: discovers files to include/exclude in indexing (`backend/services/file_service.py`).
- Content Service: reads files and selects important files for context (`backend/services/content_service.py`).
- Chunk Service: splits documents into chunks for embedding (`backend/services/chunk_service.py`).
- Embedding Service: creates embeddings with SentenceTransformers and persists to ChromaDB (`backend/services/embedding_service.py`).
- LLM Service: interacts with OpenRouter/OpenAI-style API with retry/backoff for QA and analysis (`backend/services/llm_service.py`).

## Data Stores & Formats

- Local filesystem: cloned repositories under `repos/`.
- ChromaDB persistent store at `./chroma_db` and a collection named `codebase` storing `documents`, `embeddings`, and `metadatas` with `file`, `repo_name`, and `chunk_id`.

## Data Flow

- Indexing: clone → scan files → read contents → chunk documents → batch embeddings → delete existing repo docs in Chroma → add new chunks to Chroma.
- Query/QA: receive query → search Chroma (top N) → assemble context (README + chunks) → call LLM → return answer + sources.

## API Summary

- `POST /clone` — clone repo.
- `GET /scan/{repo_name}` — list files.
- `GET /content/{repo_name}` — return file contents.
- `GET /chunks/{repo_name}` — return chunk samples.
- `POST /store/{repo_name}` — chunk & store repo embeddings.
- `POST /index` — clone + index (synchronous).
- `POST /search` — semantic search.
- `POST /ask` — QA using search results + LLM.
- `POST /analyze`, `POST /explain`, `POST /generate-readme` — LLM-based analysis/documentation.

## Scalability & Performance Considerations

- Indexing is CPU and I/O heavy (model encoding and DB writes). Move to background workers (Celery/RQ) to avoid blocking API.
- Batch embeddings (already batched in `embedding_service.store_chunks`) — keep large-batch sizes subject to memory.
- For large datasets, consider sharding or separate collections per tenant/repo to improve query isolation.

## Security & Operations

- Environment-based config for `OPENROUTER_API_KEY`.
- Add authentication (API keys, OAuth) before allowing clone/index operations.
- Add quotas/per-repo storage limits and periodic pruning.

## Admin & Debugging Tools

- `backend/inspect_chroma.py` and `inspect_chroma2.py` provide quick inspection of Chroma contents.
- Add admin endpoints for repo/chunk stats and deletion.

## Deployment

- Containerize with Docker; mount `./chroma_db` to persistent volume.
- Use Uvicorn/Gunicorn for production.
- Optionally host Chroma on dedicated infrastructure for scale.

---

(End of HLD)
