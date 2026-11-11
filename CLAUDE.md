# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

ContextForge is an AI codebase memory engine. It clones a Git repo, chunks and embeds its source files into ChromaDB, then answers questions about it via OpenRouter using two strategies: **RAG** (vector search over chunks) and **whole-repo context** (files read straight from disk, character-budgeted). Single-process FastAPI backend + React SPA; no auth, no job queue, no database other than ChromaDB.

## Technology stack

- **Backend** (`backend/`, Python 3.12 per `runtime.txt`; Docker image uses 3.11): FastAPI, Uvicorn, GitPython, ChromaDB (`PersistentClient`), ONNX Runtime + HuggingFace `tokenizers` (CPU-only, **no PyTorch / sentence-transformers**), OpenAI SDK pointed at OpenRouter, httpx, Pydantic, python-dotenv.
- **Frontend** (`frontend/`): React 19, Vite 8, Tailwind CSS v4 (`@tailwindcss/vite`, theme tokens in `src/styles/tokens.css`), React Router 7, Framer Motion, lucide-react, react-markdown + remark-gfm, Spline + `@paper-design/shaders-react` (landing page only). Mostly `.jsx`; a few `.tsx` files with no `tsconfig`.
- **Infra**: `docker-compose.yml` — nginx serves the Vite build on :3000 and proxies `/api/` to `BACKEND_URL` (`frontend/nginx.conf.template`, rendered by envsubst; security headers + CSP); backend runs as uid 10001, host port `127.0.0.1:8001` for debugging only; base images pinned by digest; named volumes for `chroma_db` and `repos` (owned by 10001). Fixed network subnet so the backend trusts `X-Forwarded-For` only from the proxy IP.

## Structure

```
backend/
  main.py                 App wiring: lifespan (ONNX warmup, close LLM client), CORS, OpenRouter exception handlers, GET /health
  config/settings.py      All env-driven settings (paths, chunking, batch sizes, TOP_K, CORS, PORT/HOST)
  routers/repo_router.py  Every API endpoint; orchestrates services; [PERF] logs + Server-Timing headers
  services/               Stateless module-level functions (see below)
  schemas/                Pydantic request bodies: RepoRequest{repo_url}, RepoNameRequest{repo_name}, AskRequest{question,repo_name}, SearchRequest{query,repo_name}, EmbeddingRequest{text}
  models/all-MiniLM-L6-v2/ tokenizer/config tracked; model.onnx gitignored (download required)
  scripts/download_model.py
  repos/, chroma_db/      runtime data (gitignored)
  test_*.py, test_rag.ps1, verify_audit.py, index_local_repo.py, inspect_chroma*.py, cleanup_chroma_legacy.py   manual scripts (see Testing)
frontend/src/
  App.jsx                 lazy routes: / Landing, /dashboard, /chat, /docs
  services/api.js         the ONLY HTTP client (fetchWithTimeout + per-endpoint timeouts)
  pages/                  Landing, Dashboard (index a repo), Chat (wraps AnimatedAiChat), Docs (architecture report)
  components/ui/AnimatedAiChat.tsx   chat UI, slash commands, quick actions (~900 lines)
  components/{sections,layout,graph,spline}/   landing/marketing + layout
  lib/                    markdownUtils (HTML→MD, repo link/image rewriting), utils (cn = clsx+twMerge), animations, mockData (landing only)
.contextforge/, docs/     design notes / ADRs — partly STALE (see bottom)
```

### Backend services

| Module | Responsibility |
|---|---|
| `repo_service.clone_repository` | Accepts only `https://github.com/<owner>/<repo>[.git][/]` (400 otherwise, before git runs). Name = repo segment. If the folder exists it is reused **without pulling**; else `git clone --depth 1 --no-recurse-submodules` via `subprocess` into `REPOS_DIR/~clone-<name>-*` with `CLONE_TIMEOUT_S`, then `MAX_REPO_MB`/`MAX_FILES` checks (413, temp deleted), then `os.rename` into place. A second request for a repo being cloned → 409 (in-process per-repo lock); `MAX_REPOS` → 409. |
| `file_service.scan_repository` | `os.walk` with `IGNORED_DIRS`, skips symlinks and anything resolving outside the repo, all dot-dirs/dotfiles, lockfiles, minified/map files, empty files, files > `MAX_FILE_SIZE_BYTES` (500 KB); keeps only `SUPPORTED_EXTENSIONS`. |
| `content_service` | `read_repository` (UTF-8, errors ignored, `/` paths); `get_repository_context` builds the whole-repo context: `IMPORTANT_FILES` first (2500 chars each), then other files (1500 chars each) in walk order until `MAX_CONTEXT_CHARS` (8000). |
| `chunk_service.chunk_documents` | Character sliding window, `CHUNK_SIZE` 800 / `CHUNK_OVERLAP` 100; output `{file, content}`. Not code-aware. |
| `embedding_service` | `ONNXEmbeddingModel` (singleton via `get_model`), Chroma client + `codebase` collection (created **at import time**), `store_chunks`, `search_chunks`, `create_embedding`, `warmup_model`. |
| `rate_limit` | In-memory per-client-IP sliding window as a FastAPI dependency: `LLM_RATE_LIMIT` (ask/analyze/explain/readme), `INDEX_RATE_LIMIT` (index/clone/store), `SEARCH_RATE_LIMIT` (search) per `RATE_LIMIT_WINDOW_S`; 429 + `Retry-After`. |
| `llm_service` | Shared OpenAI client → `https://openrouter.ai/api/v1`; `call_openrouter_with_backoff`; prompt builders `ask_llm`, `analyze_repository`, `explain_repository`, `generate_readme` (+ `_normalize_readme_output`); custom exceptions. |

## Workflows

**Ingestion — `POST /index {repo_url}`** (all synchronous inside the request; `POST /store/{repo_name}` re-runs steps 3–6 on an existing clone):
1. clone → 2. scan → 3. read → 4. chunk → 5. `store_chunks`: embed **all** chunks in memory (batch `EMBEDDING_BATCH_SIZE` 64) → `collection.delete(where={"repo_name"})` → `collection.add` in batches of `CHROMA_BATCH_SIZE` 500 with uuid4 ids and metadata `{file, repo_name, chunk_id}` → 6. return `{success, repo_name, total_files, stored_chunks}`.

**Embeddings**: tokenizer truncates to 256 tokens; ONNX CPU session; attention-masked mean pooling + L2 normalization → 384-d float32. One shared Chroma collection `codebase` (default L2 distance; equivalent ranking to cosine since vectors are normalized).

**RAG — `POST /ask`** (also `/search` without the LLM): embed question → Chroma top `TOP_K_RESULTS` (5) filtered by `repo_name` → dedupe identical texts → context = first 2000 chars of the repo's `README.md` (if present) + chunks → `ask_llm` (60 s timeout) → `{success, answer, sources}` where sources are file paths.

**Whole-repo — `/analyze`, `/explain`, `/generate-readme`**: re-scan and read from disk, `get_repository_context`, LLM call with 85 s timeout. `/explain` additionally computes metadata JSON in the router (language counts, LOC, `@router`/`@app` lines, service/schema paths, dependencies). `/generate-readme` post-processes via `_normalize_readme_output`.

**LLM call**: single user message (no system role, no chat history, no streaming). Env is read at call time; `config/settings.py` holds the defaults. `/ask` uses `OPENROUTER_MODEL` and sends `OPENROUTER_FALLBACK_MODELS` as OpenRouter's `models` fallback list. Whole-repo endpoints use `OPENROUTER_MODEL_LONG` + `OPENROUTER_FALLBACK_MODELS_LONG` (empty `OPENROUTER_MODEL_LONG` → the primary chain) and always send `reasoning: {effort: none}`. One total deadline per call = min(endpoint cap 60 s / 85 s, `LLM_TOTAL_TIMEOUT_S`), enforced with `anyio.fail_after` on the app's event loop (sync endpoints call in via `anyio.from_thread.run`), which cancels the upstream request. SDK retries disabled; one manual retry (2 s for 429/5xx, 1 s for connection errors) only if < 15 s elapsed; timeouts are never retried. Every call first takes a slot from the global `LLM_DAILY_LIMIT` (all visitors, resets 00:00 UTC, in memory); when it's used up `LLMDailyLimitException` → 429 "Demo limit reached for today…". Offline self-checks: `scripts/manual/test_llm_deadline.py`, `test_llm_routing.py`.

**Errors**: `OpenRouterTimeoutException`→504, `OpenRouterRateLimitException`→429, `OpenRouterRetryException`→503, `OpenRouterConfigException`→its status (401 missing/invalid key, 404 model, 500 other); these return `{success:false, error, detail}`. `HTTPException`s (clone 400/409/413, unknown repo 404, rate limit 429 + `Retry-After`, Chroma 500) return FastAPI's default `{detail}`. `api.js` reads `error || detail || message`.

**Frontend flow**: Dashboard calls `/index` and writes `localStorage` keys `repo_name`, `repo_url`, `stored_chunks`, `repositoryIndexed`; Chat and Docs read the active repo from those keys (no repo picker; `/repos` is unused by the UI). Chat history is one `chatHistory` key (not per repo). In chat: free text → `/ask`; `/docs` → `/generate-readme`; `/architecture` → `/explain`; `/explain X` → `/ask` ("Explain the module: X"); quick actions in `categoryBPrompts` (Find Dependencies, Find Dead Code, Generate Sequence Diagram, Security Review) → `/analyze`, others → `/ask`. Chat has Stop (AbortController) and Retry. The `/docs` **page** only calls `/explain`, caches per repo in `sessionStorage` (`docs_report_<repo>`), and supports Regenerate + Markdown export.

## Commands

Backend — run from `backend/` (imports are relative to it, e.g. `from services.x import ...`):
```bash
python -m venv venv && venv\Scripts\activate      # or: source venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt
python scripts/download_model.py                   # one-time: fetch model.onnx
uvicorn main:app --reload                          # :8000, GET /health
python -m pytest -q                                # tests/: LLM stubbed, fake embeddings, no network
```
Put `OPENROUTER_API_KEY` (and optionally `OPENROUTER_MODEL`) in `backend/.env`. Without a key, indexing/search work; LLM endpoints return 401.

Frontend — run from `frontend/`:
```bash
npm install
npm run dev        # :5173, proxies /api to http://localhost:8001 (the compose backend)
npm run build
npm run lint       # ESLint: covers .js/.jsx only, NOT .tsx
```
The UI calls the API on its own origin at `/api` (nginx or the Vite dev proxy forwards it). `VITE_API_URL` is an optional build-time override for hosting the frontend elsewhere; then also set the backend's `ALLOWED_ORIGINS` (empty by default). The CSP adds that origin to `connect-src` automatically (`frontend/api-origin.envsh`). Spline's scene/WASM and the fonts are self-hosted in `frontend/public/`; any new external asset needs a CSP change.

Docker: `docker compose up --build` (key via root `.env` or `backend/.env`); `docker compose down -v` wipes the index and clones.

## Testing and debugging

`backend/tests/` is a pytest suite (`python -m pytest -q` from `backend/`): health/repos/scan/search, 404/422, URL allowlist, clone limits, symlinks, rate limits and the LLM endpoints, with a throwaway `REPOS_DIR`/`CHROMA_DB_PATH`, a fake embedding model and a stubbed OpenRouter call. Symlink tests skip on Windows without symlink rights. CI (`.github/workflows/ci.yml`) runs pytest, frontend lint + build, and a docker build of both images. Also verify by running the app (`/health`, index a small repo such as `https://github.com/sindresorhus/is-number`, then ask). Old manual scripts live in `backend/scripts/manual/` (run from `backend/`):
- Need a running server: `python scripts/manual/test_api.py` (error paths; needs `requests`, not in requirements), `powershell scripts/manual/test_rag.ps1` (indexes two repos, checks source isolation). Both still target :8000.
- In-process: `python scripts/manual/verify_audit.py` (FastAPI `TestClient` audit; uses the real model and data).
- Chroma tools: `python inspect_chroma.py`, `python cleanup_chroma_legacy.py --dry-run` (omit `--dry-run` to delete), `python index_local_repo.py` (indexes `repos/codebase-memory-engine`).
- Known broken: `scripts/manual/test_sim.py` imports `sentence_transformers` (removed); `test_rag_debug.py` calls `ask()` without the now-required `response` argument.
- Debug-only endpoints for inspecting pipeline stages (404 unless `ENABLE_DEBUG_ENDPOINTS=true`; the UI uses none of them): `/clone`, `/content/{repo}`, `/chunks/{repo}` (first 5), `/embed` (first 10 dims), `/store/{repo}`. `APP_ENV=production` turns off `/docs`, `/redoc`, `/openapi.json`.
- Timing: every pipeline endpoint logs `[PERF] op=...` and sets a `Server-Timing` header (visible in browser devtools).

## Coding conventions

- **Backend**: services are plain module functions; endpoints live only in `repo_router.py` and are sync `def`. New config goes in `config/settings.py` as `os.getenv` with a default. Request bodies are Pydantic models in `schemas/`. Success responses include `success: True`. Raise `HTTPException` for client/storage errors; LLM failures raise the `OpenRouter*` exceptions (add a handler in `main.py` for any new type). Add `[PERF]` logging + `Server-Timing` to new pipeline endpoints. Resolve repo paths with `_get_repo_path`.
- **Frontend**: all network calls go through `api.js` methods that accept `options` (for `signal`) and set an explicit timeout. Style with Tailwind + `tokens.css` theme variables, `cn()` for class merging, lucide icons, Framer Motion for animation. Markdown output is rendered with `react-markdown` + `remark-gfm` via `lib/markdownUtils.js` helpers.

## Architectural constraints

- **Repo isolation is metadata-only**: every Chroma query/delete must include `where={"repo_name": ...}`. All repos share the single `codebase` collection.
- **Repo identity = directory name** under `REPOS_DIR` (last URL segment). Same-named repos from different owners collide. Re-indexing does not pull.
- **Timeouts are paired**: backend LLM timeouts (60 s ask; 85 s analyze/explain/readme) must stay below `api.js` timeouts (90 s; 110 s; 300 s index). Change both together.
- **Single process only**: local `PersistentClient`, on-disk clones and module-level singletons prevent multiple workers/replicas. LLM calls and indexing block threadpool threads. Rate-limit counters are in memory, per process.
- `store_chunks` is delete-then-add (not atomic); a mid-batch failure leaves a partial index.
- Whole-repo context is only 8000 chars — quality of analyze/explain/readme is bounded by it.
- `/explain` sends hard-coded `data_flow` / `rag_pipeline` strings describing ContextForge itself for every repo.
- Keep the backend CPU-only and PyTorch-free (Docker image size); embeddings must remain 384-d unless the collection is rebuilt.

## Security requirements

- Secrets only via environment (`backend/.env`, root `.env`); never commit them. `.gitignore` covers `.env*`, `chroma_db/`, `*.sqlite*`, `*.db`, `repos/`, `venv/`, `*.onnx` — keep it that way. Note `chroma_db/chroma.sqlite3` exists in past history (commits `4d0ea51`/`cfbb483`).
- Keep `os.path.basename` path-traversal guarding on any `repo_name` that touches the filesystem.
- No authentication. Per-IP rate limits and the GitHub-only clone allowlist exist, and the debug endpoints (incl. `/content/{repo}`, which returns full files) are off by default. Expose only the nginx origin, never the backend port.
- Repository content is inserted verbatim into LLM prompts (prompt-injection surface); don't give LLM output any privileges.
- `ALLOWED_ORIGINS` is empty by default (same-origin `/api`); list explicit origins only for a separately hosted frontend.
- Never read through symlinks in cloned repos (a link can point at `/proc/self/environ` or other secrets); the scanner and the `/ask` README read skip them.

## Stale documentation

`.contextforge/`, `docs/engineering-handbook/`, and root `HLD.md`/`LLD.md`/`PRD.md` (duplicates of `docs/`) partly describe older states — e.g. SentenceTransformer embeddings, a 16k context budget, 3-retry backoff. The root `chroma_db/` is an unused legacy store. Trust the code over these documents.
