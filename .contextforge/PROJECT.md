# ContextForge — Project Definition

## Project Purpose
ContextForge is an AI-powered **Codebase Memory Engine** and developer intelligence platform. It ingests software repositories (local or remote via GitHub), parses and chunks source files, generates dense vector representations using local embedding models, stores them in a vector database with repository-level isolation, and enables semantic search, retrieval-augmented Q&A, and whole-repository architectural analysis through an LLM gateway (OpenRouter).

## Product Concept
Traditional code search tools (such as `grep`, `ripgrep`, or standard IDE text searches) depend on exact string matches or regex patterns. They fail when an engineer doesn't know exact variable or function names (e.g., searching for "user login" when the code implements `session_handler.py`). Furthermore, large language models (LLMs) cannot natively ingest massive private codebases due to context window limits, cost, and hallucination risks.

ContextForge solves this by providing:
1. **Semantic Understanding:** Mathematical indexing of code concepts rather than pure keywords.
2. **Context-Grounded Q&A (RAG):** Natural-language questions answered strictly using retrieved source code chunks, with direct citations to source files.
3. **Repository Architecture Synthesis:** Whole-repository ingestion within a token budget to generate executive summaries, architecture reports, API route inventories, dependency relationships, dead code scans, security assessments, and Markdown documentation.
4. **Repository Isolation:** Multi-repo support in a single vector collection using metadata filtering.

## Key Features
- **One-Click Repository Indexing:** Takes a public GitHub URL, performs a shallow clone (`--depth 1`), scans source files with size and extension filters, splits text into overlapping windows, computes embeddings, and persists vectors to ChromaDB.
- **Semantic Code Search:** Searches code meaning via local sentence embeddings (`all-MiniLM-L6-v2`) and ChromaDB vector distance queries.
- **Interactive AI Chat:** Real-time conversational interface featuring slash commands (`/architecture`, `/docs`, `/explain`, `/trace`, `/dependencies`, `/deadcode`, `/sequence`, `/security`), animated loading skeletons, Markdown formatting with tables and code blocks, source citations, and localStorage chat persistence.
- **Architectural Reports (`/explain`):** Automated extraction of project statistics (LOC, file count, directory count, language distribution, top-level directories, API routes, services, schemas, tech stack from `package.json`/`requirements.txt`), followed by a Staff-Engineer-grade Markdown architecture report.
- **Automated README Generation (`/generate-readme`):** One-click production-ready GitHub `README.md` generator.
- **Workspace Dashboard:** Visual status of indexed repositories, chunk counts, workspace health, and step-by-step indexing progress simulation.
- **Landing Page Experience:** Modern dark-theme landing page with 3D Spline hero graphic, animated pipeline diagrams, interactive mock demo, and workflow breakdown.

## Target Audience
- **Software Engineers & Tech Leads:** Onboarding to unfamiliar repositories or tracing complex microservice/API workflows.
- **Architects & Engineering Managers:** Auditing architecture, dependencies, technical debt, and documentation.
- **Security & Compliance Reviewers:** Scanning codebase entry points, authentication handlers, and dependency trees.
- **On-Call & DevOps Engineers:** Quickly locating error-handling routines, database connections, and configurations.

## Technology Stack
### Frontend
- **Framework:** React 19.2.7
- **Build Tool:** Vite 8.1.0 with Rollup manual chunking
- **Styling:** TailwindCSS v4 (`@tailwindcss/vite` 4.3.2) + Custom CSS Design Tokens (`tokens.css`)
- **Animation:** Framer Motion 12.42.2
- **Routing:** React Router v7 (`react-router-dom` 7.18.1)
- **Icons:** Lucide React 1.23.0
- **Markdown Rendering:** React Markdown 10.1.0 + Remark GFM 4.0.1
- **3D Graphics:** `@splinetool/react-spline` 4.1.0 & `@splinetool/runtime` 1.12.98
- **Shaders:** `@paper-design/shaders-react` 0.0.77 (experimental, partially unreferenced)

### Backend
- **Framework:** FastAPI 0.138.1
- **ASGI Server:** Uvicorn 0.49.0 (with standard extras)
- **Data Validation:** Pydantic 2.13.4
- **Git Operations:** GitPython 3.1.50
- **Vector Database:** ChromaDB 1.5.9 (PersistentClient)
- **Embeddings:** Sentence Transformers 5.1.0 (local `all-MiniLM-L6-v2`, 384-dimensional)
- **Deep Learning Framework:** PyTorch (CPU-only build `2.12.1` in environment/container)
- **LLM Gateway:** OpenAI Python SDK 2.48.0 targeting OpenRouter (`https://openrouter.ai/api/v1`)
- **Configuration & Environment:** `python-dotenv` 1.2.2 + custom `config/settings.py`

### Infrastructure & Deployment
- **Containerization:** Docker multi-stage builds (Python 3.11-slim backend, Node 20-alpine builder + Nginx alpine frontend)
- **Orchestration:** Docker Compose (v2 specification)
- **Reverse Proxy / Static Server:** Nginx Alpine with gzip compression and SPA fallback routing
- **Persistent Volumes:** Named volumes for ChromaDB (`chroma_data`) and cloned repositories (`repos_data`)
