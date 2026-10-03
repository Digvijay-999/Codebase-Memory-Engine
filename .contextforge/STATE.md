# ContextForge — Current System State

**Audit Date:** October 3, 2026  
**Repository Source:** `c:\Projects\codebase-memory-engine`  
**Git Branch:** `main` (commit `4d0ea51` + uncommitted working copy changes)

---

## 1. What Currently Works (Verified with Empirical Tests)

The following components and pipelines were directly executed and verified during the October 2026 reconnaissance:

1. **Backend Service Boot & Health Endpoint (`GET /health`):**
   - Starts cleanly, initializes ChromaDB persistent client, and reports status and document count.
2. **Repository Scanning (`file_service.py`):**
   - Scanned local repository `repos/codebase-memory-engine` in **6.2ms**, discovering 87 valid source files while strictly ignoring `.git`, `node_modules`, `venv`, `chroma_db`, lockfiles, and minified bundles.
3. **Document Ingestion & Chunking (`chunk_service.py`):**
   - Read 87 documents and chunked into 378 non-empty chunks in **18.1ms**.
4. **Local Embedding Model & Semantic Retrieval (`embedding_service.py`):**
   - `SentenceTransformer('all-MiniLM-L6-v2')` runs smoothly on CPU.
   - ChromaDB semantic queries return relevant chunks in **~16.6ms** (cached model execution).
5. **Repository Isolation in ChromaDB:**
   - Filtering via `where={"repo_name": repo_name}` is 100% verified. Queries targeting a non-existent or alternate repo return 0 results and never leak across projects.
6. **Token-Budgeted Context Assembly (`content_service.py`):**
   - Built a 15,913 character context window staying strictly within the 16,000–18,000 character limit (~4k tokens) without truncation crashes.
7. **End-to-End LLM RAG Q&A (`POST /ask`):**
   - Verified end-to-end via OpenRouter API in **2,357ms**, successfully citing `README.md` and specific documentation source files.
8. **Frontend Production Build (`vite build`):**
   - Cleanly builds 641 modules into `frontend/dist/` in **5.54s** without syntax or bundler failures.

---

## 2. What is Broken or Degraded

1. **ESLint Failures (49 Errors):**
   - Running `npm run lint` fails with 49 errors. These are mostly benign unused variables (e.g., `import React`, unused `node` parameters in `ReactMarkdown` renderers, unused imports in components) and React Hook warnings (`Calling setState synchronously within an effect` in `useReducedMotion.js` and `Dashboard.jsx`).
2. **Missing Frontend Routes for Footer Links:**
   - `Footer.jsx` links to `/pricing`, `/changelog`, `/api`, `/blog`, `/community`, `/about`, `/careers`, `/privacy`, `/terms`. None of these routes exist in `App.jsx`, causing dead links.
3. **Admin ChromaDB Inspection Scripts Path Mismatch:**
   - `backend/inspect_chroma.py` and `backend/inspect_chroma2.py` hardcode `chromadb.PersistentClient(path="./chroma_db")`. When executed from the workspace root, they connect to the empty root `./chroma_db` (0 documents) rather than `backend/chroma_db` (12,753 documents).
4. **Environment Variable Loading Timing in Backend:**
   - `backend/config/settings.py` reads `os.getenv()` at module import time, but does NOT call `load_dotenv()`. `load_dotenv()` is only invoked when `backend/services/llm_service.py` is imported. If `settings.py` is ever imported before `llm_service.py`, environment variables from `.env` are not populated.
5. **ChromaDB Database Cleanliness (Legacy Unlabeled Records):**
   - `backend/chroma_db` currently holds 12,753 chunks, of which **5,990 chunks have no `repo_name` metadata**. These are orphan records from early prototype iterations.

---

## 3. What is Incomplete

1. **Token-Aware Chunking:**
   - Proposed in `LLD.md` (switching from character-based sliding window to tokenizer-based chunking with `tiktoken`). Currently still uses fixed character window (`chunk_size=800`, `overlap=100`).
2. **Asynchronous Background Indexing & Job Tracking:**
   - `POST /index` is completely synchronous. Indexing large repos (>100k LOC) keeps the HTTP connection open for minutes. The frontend uses a static simulated timer (steps 1–5) rather than real job polling.
3. **Streaming LLM Responses:**
   - The backend waits for the full completion from OpenRouter before returning JSON. Server-Sent Events (SSE) or WebSockets are not yet implemented.
4. **Authentication & Multi-Tenant Access Control:**
   - No user identity, API keys, or JWT tokens exist. All indexed repos are publicly queryable by anyone who reaches the backend.
5. **Unused Frontend Components:**
   - Several components exist in `src/components/ui/` and `src/components/sections/` that are unreferenced: `SvgFollowScroll.jsx`, `HeroShader.tsx`, and `TrustedBy.jsx`.

---

## 4. Current Environment

- **Operating System:** Windows 11 (PowerShell)
- **Node.js:** `v24.21.0`
- **npm:** `11.19.0`
- **Python (System):** `3.13.10`
- **Python (Backend venv):** `3.13.10` (`c:\Projects\codebase-memory-engine\backend\venv`)
- **Docker CLI:** `29.3.1`
- **Docker Compose:** `v5.1.0`
- **Docker Daemon Status:** **Stopped / Not running** (`failed to connect to docker API at npipe:////./pipe/dockerDesktopLinuxEngine`)

---

## 5. Known Blockers

1. **Docker Execution Blocker:**
   - Docker Desktop is not running on the host machine. Running `docker compose up` will currently fail until Docker Desktop is started.
2. **Localhost / Port Conflict Potential:**
   - If port `8000` (FastAPI) or `3000` / `5173` (Vite / Frontend) is occupied by another process, services will require port overrides.

---

## 6. Exact Repository State (Git)

- **Branch:** `main` (tracked to `origin/main`)
- **Staged for Commit:**
  - `deleted: chroma_db/chroma.sqlite3`
- **Unstaged Changes in Working Directory:**
  - `.gitignore`: Enhanced to ignore IDEs, OS files, and database files; removed `docs/` from ignore list.
  - `backend/Dockerfile`: Optimization for CPU-only PyTorch and model caching.
  - `backend/services/llm_service.py`: Added dynamic `get_openai_client()`, missing API key checks, and environment-based model selection.
  - `docker-compose.yml`: Added `env_file` directives and adjusted health check start period.
  - `frontend/nginx.conf`: Added IPv6 listener `listen [::]:80;`.
- **Untracked Directory:**
  - `docs/` (containing comprehensive engineering handbook and system documentation).
