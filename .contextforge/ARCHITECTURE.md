# ContextForge — System Architecture

## Architecture Overview

ContextForge uses a decoupled client-server architecture consisting of:
1. **A Single-Page Application (SPA) Frontend** built with React 19, Vite, TailwindCSS v4, and Framer Motion.
2. **A High-Performance Asynchronous Python Backend** built with FastAPI, orchestrating Git cloning, static analysis, chunking, local sentence transformer embeddings, vector database operations in ChromaDB, and LLM communication via OpenRouter.
3. **A Dual-Layer Storage Tier** using local filesystem directories for cloned repositories and ChromaDB (DuckDB/SQLite + hnswlib vector indices) for semantic embeddings.

---

## 1. System Topology & Data Flow

```mermaid
graph TD
    %% Frontend Layer
    subgraph Client ["Frontend Client (React 19 / Vite / Nginx)"]
        Landing["Landing Page (/)"]
        Dashboard["Workspace Setup (/dashboard)"]
        Chat["AI Chat (/chat)"]
        Docs["Architecture Docs (/docs)"]
        ApiClient["API Service Layer (api.js)"]
        
        Landing --> ApiClient
        Dashboard --> ApiClient
        Chat --> ApiClient
        Docs --> ApiClient
    end

    %% Backend Layer
    subgraph Server ["FastAPI Backend (:8000)"]
        Router["API Router (repo_router.py)"]
        RepoSvc["Repository Service (repo_service.py)"]
        FileSvc["File Scanner Service (file_service.py)"]
        ContentSvc["Content Service (content_service.py)"]
        ChunkSvc["Chunk Service (chunk_service.py)"]
        EmbedSvc["Embedding Service (embedding_service.py)"]
        LLMSvc["LLM Service (llm_service.py)"]
        
        Router --> RepoSvc
        Router --> FileSvc
        Router --> ContentSvc
        Router --> ChunkSvc
        Router --> EmbedSvc
        Router --> LLMSvc
    end

    %% Storage Layer
    subgraph Storage ["Persistent Storage"]
        RepoDir[("Local Repositories (repos/)")]
        ChromaStore[("ChromaDB Vector Store (chroma_db/)")]
    end

    %% External Providers
    subgraph External ["External Services"]
        GitHub["GitHub (git clone --depth 1)"]
        OpenRouter["OpenRouter Gateway API (v1/chat/completions)"]
    end

    %% Networking
    ApiClient -- "HTTP REST (JSON)" --> Router
    RepoSvc -- "Git CLI / GitPython" --> GitHub
    RepoSvc -- "Write clone" --> RepoDir
    FileSvc -- "os.walk" --> RepoDir
    ContentSvc -- "Read files" --> RepoDir
    EmbedSvc -- "Store / Query vectors" --> ChromaStore
    LLMSvc -- "HTTPS OpenAI SDK" --> OpenRouter
```

---

## 2. Ingestion & Indexing Pipeline

When an engineer triggers repository indexing via `POST /index` or `POST /store/{repo_name}`:

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Frontend as React (Dashboard)
    participant Router as repo_router.py
    participant RepoService as repo_service.py
    participant FileService as file_service.py
    participant ContentService as content_service.py
    participant ChunkService as chunk_service.py
    participant EmbedService as embedding_service.py
    participant Chroma as ChromaDB ("codebase")

    User->>Frontend: Enter GitHub Repo URL
    Frontend->>Router: POST /index { "repo_url": "..." }
    Router->>RepoService: clone_repository(repo_url)
    RepoService->>RepoService: GitPython: clone_from(url, path, depth=1)
    Router->>FileService: scan_repository(repo_path)
    FileService->>FileService: Filter extensions, ignored dirs, max size (500KB)
    Router->>ContentService: read_repository(repo_path, files)
    ContentService->>ContentService: Read UTF-8 text into documents list
    Router->>ChunkService: chunk_documents(docs, size=800, overlap=100)
    ChunkService->>ChunkService: Sliding window character chunker
    Router->>EmbedService: store_chunks(chunks, repo_name)
    EmbedService->>EmbedService: model.encode(docs, batch_size=64)
    EmbedService->>Chroma: collection.delete(where={"repo_name": repo_name})
    EmbedService->>Chroma: collection.add(ids, embeddings, metadatas, documents) [batch 500]
    EmbedService-->>Router: Total chunks stored
    Router-->>Frontend: 200 OK { success: true, stored_chunks: N, repo_name: "..." }
    Frontend-->>User: Display Ready State & navigate to /chat
```

---

## 3. Retrieval-Augmented Generation (RAG) & Chat Pipeline

When an engineer queries the codebase via `POST /ask`:

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Frontend as React (AnimatedAIChat)
    participant Router as repo_router.py
    participant EmbedService as embedding_service.py
    participant Chroma as ChromaDB
    participant RepoFiles as Disk (README.md)
    participant LLMService as llm_service.py
    participant OpenRouter as OpenRouter API

    User->>Frontend: Submit question ("How does auth work?")
    Frontend->>Router: POST /ask { "question": "...", "repo_name": "..." }
    Router->>EmbedService: search_chunks(question, repo_name, n_results=5)
    EmbedService->>EmbedService: model.encode(question) -> 384-dim vector
    EmbedService->>Chroma: collection.query(vector, where={"repo_name": repo_name})
    Chroma-->>EmbedService: Top matching chunks & metadatas
    EmbedService-->>Router: Deduplicated documents & file sources
    Router->>RepoFiles: Check if repos/<repo_name>/README.md exists
    Note over Router: Inject up to 2000 chars of README as global primer
    Router->>LLMService: ask_llm(question, context)
    LLMService->>LLMService: Build strict System Prompt ("Answer ONLY using context...")
    LLMService->>OpenRouter: POST /chat/completions (OpenAI client, retry backoff)
    OpenRouter-->>LLMService: Model generated answer
    LLMService-->>Router: Answer string
    Router-->>Frontend: 200 OK { success: true, answer: "...", sources: ["README.md", "src/auth.py"] }
    Frontend-->>User: Render Markdown answer with syntax highlighting & sources pills
```

---

## 4. Whole-Repository Analysis Pipeline (Non-RAG Bypass)

Certain tasks (e.g., generating architecture overviews, identifying dead code, auditing security, or synthesizing a `README.md`) cannot rely on 5 localized text chunks because they require a macroscopic understanding of the codebase structure:

```mermaid
graph LR
    Req["Request (/explain, /generate-readme, /analyze)"] --> Scan["File Scanner & Document Reader"]
    Scan --> ContextBuilder["Token Budgeted Context Builder\n(content_service.get_repository_context)"]
    ContextBuilder --> StaticExtract["Static AST/Regex Extraction\n(Routes, LOC, File Types, Tech Stack)"]
    StaticExtract --> Prompt["Structured Markdown Prompt Generator"]
    Prompt --> OpenRouter["OpenRouter LLM (120s timeout)"]
    OpenRouter --> Output["Full Architecture Report / README"]
```

- **Context Budget:** Capped at 16,000 characters (~4k tokens) to prevent context explosion.
- **Priority Tiering:** Architectural and configuration files (`README.md`, `package.json`, `requirements.txt`, `main.py`, `Dockerfile`, etc.) are allotted up to 2,500 characters each; remaining source files are allotted up to 1,500 characters until the budget is filled.
- **Precomputed Metadata for `/explain`:** Before calling the LLM, the backend calculates:
  - File count, directory count, language distribution, approximate LOC.
  - Route handlers detected from `@router` / `@app` decorator signatures.
  - Dependencies parsed from `requirements.txt` or `package.json`.
  - Service and schema file listings.

---

## 5. Frontend Architecture

### Routing (`App.jsx`)
Built on React Router v7 with code-split lazy routes:
- `/` -> `Landing.jsx` (Marketing, showcase, interactive demo)
- `/dashboard` -> `Dashboard.jsx` (Workspace setup, repository indexer)
- `/chat` -> `Chat.jsx` (Full-screen chat interface)
- `/docs` -> `Docs.jsx` (Architecture report viewer & Markdown exporter)

### State Management & Persistence
- **Client Storage:** Uses browser `localStorage` for state persistence across sessions:
  - `repo_name`: Active repository identifier.
  - `stored_chunks`: Count of indexed vector chunks.
  - `repositoryIndexed`: Boolean flag for dashboard view switching.
  - `chatHistory`: Full JSON history of chat messages and source citations.
- **Component State:** React `useState`, `useTransition`, `useRef`, and custom hooks (`useReducedMotion`, `useAutoResizeTextarea`).

### Component Hierarchy
- `components/layout/`: `Navbar.jsx`, `AppSidebar.jsx`, `Footer.jsx`
- `components/sections/`: `Hero.jsx`, `Features.jsx`, `ArchitectureFlow.jsx`, `RepoDemo.jsx`, `DeveloperWorkflow.jsx`, `CTA.jsx`, `Testimonials.jsx`, `TrustedBy.jsx`
- `components/ui/`: `AnimatedAiChat.tsx` (primary chat engine), `Button.jsx`, `Card.jsx`, `ContainerScroll.jsx`, `ErrorBoundary.jsx`, `HeroShader.tsx`, `MagneticButton.jsx`, `NeonButton.jsx`, `ScrollReveal.jsx`, `SvgFollowScroll.jsx`
- `components/spline/`: `SplineRobot.jsx` (interactive 3D hero asset)
- `components/graph/`: `DependencyGraphMotif.jsx` (SVG vector background)

---

## 6. Backend API Architecture

All endpoints are hosted in `routers/repo_router.py` mounted directly on the root FastAPI application (`backend/main.py`):

| Endpoint | Method | Input Schema | Purpose | Underlying Services |
| :--- | :--- | :--- | :--- | :--- |
| `/health` | `GET` | None | Service liveness & Chroma doc count | `main.py`, `embedding_service` |
| `/clone` | `POST` | `RepoRequest` (`repo_url`) | Clone Git repository to disk | `repo_service` |
| `/repos` | `GET` | None | List cloned repository names | `os.listdir(REPOS_DIR)` |
| `/scan/{repo_name}` | `GET` | Path parameter | Scan and list included source files | `file_service` |
| `/content/{repo_name}` | `GET` | Path parameter | Read contents of included files | `file_service`, `content_service` |
| `/chunks/{repo_name}` | `GET` | Path parameter | Preview sample generated chunks | `file_service`, `content_service`, `chunk_service` |
| `/embed` | `POST` | `EmbeddingRequest` (`text`) | Test embedding generation | `embedding_service` |
| `/store/{repo_name}` | `POST` | Path parameter | Chunk and persist repo to ChromaDB | `file_service`, `content_service`, `chunk_service`, `embedding_service` |
| `/search` | `POST` | `SearchRequest` (`query`, `repo_name`) | Semantic search in ChromaDB | `embedding_service` |
| `/ask` | `POST` | `AskRequest` (`question`, `repo_name`) | RAG Q&A with source citations | `embedding_service`, `llm_service` |
| `/analyze` | `POST` | `AskRequest` (`question`, `repo_name`) | Macro codebase analysis (deadcode, security) | `content_service`, `llm_service` |
| `/explain` | `POST` | `RepoNameRequest` (`repo_name`) | Generate Architecture Report | `content_service`, `llm_service` |
| `/generate-readme` | `POST` | `RepoNameRequest` (`repo_name`) | Generate README.md file | `content_service`, `llm_service` |
| `/index` | `POST` | `RepoRequest` (`repo_url`) | Single-call Clone + Scan + Chunk + Embed + Store | `repo_service`, `file_service`, `content_service`, `chunk_service`, `embedding_service` |

---

## 7. Deployment & Container Architecture

- **Backend Container:**
  - Multi-stage build based on `python:3.11-slim`.
  - Injects CPU-only PyTorch wheel repository (`https://download.pytorch.org/whl/cpu`) to strip multi-GB CUDA/NVIDIA driver overhead.
  - Warms up and caches `all-MiniLM-L6-v2` inside `/root/.cache` during Docker build for zero-latency, offline startup.
  - Installs system packages: `git` (required by GitPython) and `curl` (used by Docker healthcheck).
- **Frontend Container:**
  - Stage 1: `node:20-alpine` runs `npm ci` and `npm run build` with `VITE_API_URL` build argument.
  - Stage 2: `nginx:alpine` hosts pre-built static bundle at port 80 with Gzip compression and SPA HTML5 fallback (`try_files $uri $uri/ /index.html`).
- **Docker Compose:**
  - Coordinates backend (:8000) and frontend (:3000 -> :80).
  - Configures container restart policies, healthcheck dependencies (`frontend` waits for `backend` healthy check), and persistent named volumes:
    - `chroma_data` -> `/app/chroma_db`
    - `repos_data` -> `/app/repos`
