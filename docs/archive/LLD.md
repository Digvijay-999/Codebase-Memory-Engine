# LLD — ContextForge Low-Level Design

## API Contracts

### `POST /clone`

- Request: `{ "repo_url": "string" }` (`RepoRequest`)
- Response: `{ "message": "...", "path": "repos/<name>" }`
- Errors: 400 for bad URL, 500 for clone errors.
- Implementation: `backend/services/repo_service.clone_repository`.

### `POST /index`

- Request: `{ "repo_url": "string" }`
- Behavior: clones repo, scans, reads, chunks, stores embeddings synchronously.
- Response: `{ "success": True, "repo_name": "<name>", "stored_chunks": <int> }`
- Improvement: dispatch a background job and return a job id.

### `POST /ask`

- Request: `{ "question": "text", "repo_name": "string" }` (`AskRequest`)
- Flow: `search_chunks` → assemble context → optionally include README excerpt → `llm_service.ask_llm` → return `answer` and `sources`.
- Response: `{ "success": True, "answer": "...", "sources": ["README.md", ...] }`

## Data Models

- Chunk: `{ "file": "<relative path>", "content": "<text>" }` (see `chunk_service.chunk_documents`).
- Chroma Metadata: `{ "file": "<relative path>", "repo_name": "<repo>", "chunk_id": "<uuid>" }`.
- Stored in Chroma collection `codebase` via `embedding_service.store_chunks`.

## Chunking Details

- Current implementation uses fixed character windows: `chunk_size=800`, `overlap=100`.
- Recommended change: switch to token-aware chunking using a tokenizer (e.g., `tiktoken` or `sentencepiece`) to align chunks with model context windows; prevents splitting tokens and improves retrieval quality.

Token-aware chunk pseudocode:

```python
# Rough outline
from tiktoken import encoding_for_model
enc = encoding_for_model(MODEL)
encoded = enc.encode(text)
start = 0
while start < len(encoded):
    end = start + token_chunk_size
    chunk_tokens = encoded[start:end]
    chunk_text = enc.decode(chunk_tokens)
    start += token_chunk_size - overlap_tokens
```

## Embedding Pipeline

- Model: `SentenceTransformer('all-MiniLM-L6-v2')` loaded once via `get_model()`.
- Batch encode document list: `model.encode(documents)`.
- On store: remove previous entries for a repo with `collection.delete(where={"repo_name": repo_name})`, then `collection.add(...)`.

## LLM Integration

- `llm_service.call_openrouter_with_backoff` handles retries for rate/timeout errors (backoff [1,2,4] seconds, up to 3 retries). Custom exceptions `OpenRouterRetryException` and `OpenRouterConfigException` map to FastAPI handlers in `main.py`.
- Prompts: `ask_llm`, `analyze_repository`, `explain_repository`, and `generate_readme` compose different structured prompts for tasks.

## Error Handling

- Embedding/Chroma exceptions raise `HTTPException(500)` with details.
- LLM auth or model-not-found return `OpenRouterConfigException` mapped to appropriate status code.
- Add validation and length checks for inputs (e.g., question length, repo_name sanitization).

## Background Indexing (Suggested Implementation)

- Use a job queue (Celery + Redis or RQ) or a lightweight thread/process worker pool.
- Endpoint `POST /index` enqueues a job and immediately returns `{ "job_id": "...", "status": "queued" }`.
- Worker executes: clone → scan → read → chunk → embed → store; updates job status in Redis or sqlite job table.

## Tests

- Unit tests for `file_service`, `chunk_service`, `embedding_service` (mock model), and `llm_service` (mock OpenRouter client).
- Integration tests for `POST /index` and `POST /ask` against a small fixture repo.

## Operational Scripts

- Keep `backend/inspect_chroma.py` and `inspect_chroma2.py` as admin utilities to count and sample stored chunks.

## Implementation Tasks (concrete)

1. Add `docs/` spec files (done).
2. Implement token-aware chunking in `backend/services/chunk_service.py` (replace char logic).
3. Add background worker and job endpoints (e.g., `POST /index` returns job id).
4. Add authentication middleware and per-repo quota enforcement.
5. Add tests and CI pipeline (pytest + pyright).

---

(End of LLD)
