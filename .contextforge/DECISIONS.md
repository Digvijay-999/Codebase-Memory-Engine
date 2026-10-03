# ContextForge — Architectural Decision Records (ADRs)

This document captures architectural and design decisions inferred directly from code evidence across the repository.

---

### ADR-01: Single ChromaDB Collection with Metadata Filtering
- **Decision:** All repositories are indexed into a single ChromaDB collection named `codebase`, utilizing metadata dictionary `{ "repo_name": repo_name, "file": file, "chunk_id": id }` and applying a strict filter `where={"repo_name": repo_name}` during queries.
- **Rationale Inferred:** Dynamic collection creation in ChromaDB adds schema overhead and degrades performance under scale. Metadata filtering provides clean logical multi-repo isolation within a single unified vector index.
- **Status:** IMPLEMENTED & VERIFIED.
- **File Evidence:** `backend/services/embedding_service.py` (lines 36–38, 109–113).

---

### ADR-02: Local CPU-Only Embeddings (`all-MiniLM-L6-v2`)
- **Decision:** Vector embeddings are generated locally on the CPU using HuggingFace's `SentenceTransformer('all-MiniLM-L6-v2')` (384 dimensions) rather than external cloud APIs (such as OpenAI `text-embedding-3-small`).
- **Rationale Inferred:** 
  1. Zero cost per embedding for ingesting large codebases.
  2. Eliminates risk of sending proprietary source code over external networks during ingestion.
  3. Extremely fast on standard CPU hardware (~16ms query latency).
  4. Dockerfile explicitly pulls CPU wheels to avoid installing 3GB+ of CUDA/NVIDIA GPU runtime packages.
- **Status:** IMPLEMENTED & VERIFIED.
- **File Evidence:** `backend/services/embedding_service.py`, `backend/Dockerfile`.

---

### ADR-03: OpenRouter as Unified LLM Gateway
- **Decision:** LLM interactions route through OpenRouter (`https://openrouter.ai/api/v1`) using the standard OpenAI client SDK rather than direct provider SDKs (OpenAI, Anthropic, Google).
- **Rationale Inferred:** Allows dynamic swapping of models (e.g., `nvidia/nemotron-3-super-120b-a12b:free`, `openai/gpt-4o-mini`, etc.) via environment configuration without modifying backend application code.
- **Status:** IMPLEMENTED & VERIFIED.
- **File Evidence:** `backend/services/llm_service.py` (lines 27–34).

---

### ADR-04: Hybrid Strategy: RAG for Q&A vs. Whole-Repo Ingestion for Architectural Reports
- **Decision:** 
  - Standard Q&A (`POST /ask`) uses semantic vector retrieval (top 5 chunks) augmented with `README.md`.
  - Architecture synthesis (`POST /explain`), README generation (`POST /generate-readme`), and deep analysis (`POST /analyze`) bypass vector retrieval and feed the entire parsed repository into the model within a 16,000-character token budget.
- **Rationale Inferred:** Architecture understanding, dead code detection, and documentation generation require global context across modules rather than isolated snippets.
- **Status:** IMPLEMENTED & VERIFIED.
- **File Evidence:** `backend/routers/repo_router.py` (lines 130–274), `backend/services/content_service.py` (lines 46–71).

---

### ADR-05: Client-Side State Persistence via LocalStorage
- **Decision:** Active repository selection, chunk counts, workspace status, and chat history are saved in browser `localStorage` (`repo_name`, `stored_chunks`, `repositoryIndexed`, `chatHistory`) rather than server-side session cookies or a relational database.
- **Rationale Inferred:** Keeps backend completely stateless for the MVP and avoids requiring user accounts or database migrations.
- **Status:** IMPLEMENTED.
- **File Evidence:** `frontend/src/pages/Dashboard.jsx`, `frontend/src/pages/Docs.jsx`, `frontend/src/components/ui/AnimatedAiChat.tsx`.

---

### ADR-06: Pre-warming ML Models on Server Startup
- **Decision:** The FastAPI lifespan hook (`backend/main.py`) calls `warmup_model()`, performing a dummy encoding and pinging ChromaDB before accepting incoming HTTP requests.
- **Rationale Inferred:** Eliminates "cold start" latency spikes for the first user query and ensures PyTorch CPU kernels and SQLite connections are hot.
- **Status:** IMPLEMENTED & VERIFIED.
- **File Evidence:** `backend/main.py` (lines 14–21), `backend/services/embedding_service.py` (lines 25–33).

---

### ADR-07: Shallow Git Clones (`--depth 1`)
- **Decision:** Repositories are cloned using `depth=1` via GitPython.
- **Rationale Inferred:** Minimizes network bandwidth, clone duration, and disk consumption by excluding the commit history.
- **Status:** IMPLEMENTED & VERIFIED.
- **File Evidence:** `backend/services/repo_service.py` (line 30).

---

### ADR-08: Architectural Report Format Constraints
- **Decision:** The system prompt for `/explain` mandates 18 specific Markdown sections, forbids mentioning "AI" or phrases like "Based on the provided context", enforces confident engineering tone, and bans legacy ASCII box diagrams (`+----`) that break React Markdown rendering.
- **Rationale Inferred:** Guarantees uniform, professional, exportable architecture documentation that renders cleanly on the frontend.
- **Status:** IMPLEMENTED & VERIFIED.
- **File Evidence:** `backend/services/llm_service.py` (lines 105–224).

---

### Uncertainties / UNKNOWN Decisions

- **Original Target Cloud Host:** UNKNOWN. Mentions exist in git commit messages of "Render" (`b8a213e Lazy load SentenceTransformer for Render startup`), but `runtime.txt` and `Dockerfile` are configured generically.
- **Reason for duplicate HLD/LLD/PRD in `docs/` and root:** UNKNOWN. A commit `9a26829` indicates they were moved to root, but untracked duplicates remained in `docs/`.
- **Target of Unused UI Components (`HeroShader.tsx`, `SvgFollowScroll.jsx`):** UNKNOWN. Likely exploratory visual components created during landing page design iteration that were replaced by `SplineRobot.jsx`.
