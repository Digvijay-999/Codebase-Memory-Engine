# ContextForge — Development Roadmap

This roadmap is derived strictly from the actual codebase state, existing `PRD.md`, `HLD.md`, `LLD.md`, and engineering handbook documentation.

---

## Phase 1: Urgent Hygiene & Stabilization (Immediate Priority)

These items address direct inconsistencies, uncommitted changes, and operational friction in the current codebase without altering core architectural contracts.

1. **Reconcile Git Working Directory & Commit Hygiene:**
   - Commit or stage the verified unstaged improvements:
     - `.gitignore` enhancements.
     - `backend/Dockerfile` CPU-PyTorch optimization.
     - `backend/services/llm_service.py` dynamic client and exception handling.
     - `docker-compose.yml` configuration updates.
     - `frontend/nginx.conf` IPv6 update.
   - Stage and track the `docs/` folder (Engineering Handbook).
   - Finalize removal of root `chroma_db/chroma.sqlite3` from git tracking.
2. **Backend Environment Loading Robustness:**
   - Add explicit `load_dotenv()` invocation inside `backend/config/settings.py` so configuration reads `.env` variables reliably regardless of import order.
3. **Database Maintenance & Cleanup:**
   - Prune or migrate the 5,990 orphan chunks in `backend/chroma_db` that lack `repo_name` metadata.
   - Update `backend/inspect_chroma.py` and `inspect_chroma2.py` to use `config.settings.CHROMA_DB_PATH` rather than hardcoding relative `./chroma_db`.
4. **Frontend Lint & Dead-Link Cleanup:**
   - Resolve the 49 ESLint errors in `frontend` (clean up unused variables, fix React Hook `setState` in `useEffect` patterns).
   - Either create lightweight landing/placeholder views for `Footer.jsx` links (`/privacy`, `/terms`, `/api`, etc.) or redirect them to section anchors to prevent 404 navigation.
   - Decide whether to integrate or remove unused visual components (`HeroShader.tsx`, `SvgFollowScroll.jsx`, `TrustedBy.jsx`).

---

## Phase 2: Core Engineering Refinements (Short-Term / 30 Days)

Derived from existing `LLD.md` implementation tasks:

1. **Token-Aware Chunking (`backend/services/chunk_service.py`):**
   - Replace fixed-character sliding window (`800` chars / `100` overlap) with tokenizer-aware chunking (e.g., `tiktoken` or HuggingFace tokenizers) to align chunks with transformer context limits and prevent cutting words/tokens mid-byte.
2. **Asynchronous Background Indexing Worker:**
   - Convert `POST /index` from a blocking synchronous call into a non-blocking job:
     - Return immediate response: `{ "job_id": "<uuid>", "status": "processing" }`.
     - Implement background processing via FastAPI `BackgroundTasks` or a lightweight task worker.
     - Add `GET /index/{job_id}/status` endpoint.
     - Update `frontend/src/pages/Dashboard.jsx` to poll real job progress instead of running simulated timers.
3. **ChromaDB Connection Management & Healthcheck:**
   - Add graceful error handling and retry mechanisms around persistent Chroma client locks when multiple processes or reloads occur.

---

## Phase 3: Developer Experience & Usability (Mid-Term / 60 Days)

1. **Token Streaming (Server-Sent Events / SSE):**
   - Add an SSE streaming endpoint for `/ask` (`POST /ask/stream`), streaming tokens from OpenRouter to the UI as they generate.
   - Update `AnimatedAiChat.tsx` to display tokens with live typewriter effect, drastically reducing perceived latency.
2. **Repository Management in UI:**
   - Enhance the dashboard to show a list of all currently cloned and indexed repositories with chunk statistics, rather than relying on a single `repo_name` stored in browser `localStorage`.
   - Provide a repository switcher dropdown in the sidebar/chat header.
   - Add an endpoint `DELETE /repos/{repo_name}` to allow clearing a repository and its vectors from disk and ChromaDB.

---

## Phase 4: Production Hardening & Multi-Tenancy (Long-Term / 90 Days)

Derived from `PRD.md` non-functional requirements and `10-Future-Improvements.md`:

1. **Authentication & Multi-Tenant Isolation:**
   - Implement user authentication (OAuth or JWT API keys).
   - Expand ChromaDB metadata to include `user_id` / `org_id` alongside `repo_name` to enforce strict tenant boundary separation.
2. **API Rate Limiting & Quota Management:**
   - Implement rate-limiting middleware (e.g., `slowapi` or Redis-backed token bucket) to protect OpenRouter API costs.
   - Enforce maximum storage quotas per repository.
3. **Automated CI/CD Pipeline:**
   - Add GitHub Actions workflow running `verify_audit.py` on backend and `npm run lint && npm run build` on frontend for all Pull Requests.
