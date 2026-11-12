# Backend Engineering

The backend is built with FastAPI and organized into a layered architecture. It handles the heavy lifting of cloning repositories, processing files, generating vector embeddings, and orchestrating calls to the OpenRouter LLM API.

## Directory Structure
```
backend/
├── routers/        # API route definitions
├── services/       # Core business logic
├── chroma_db/      # Persistent vector storage
├── repos/          # Cloned repositories
├── main.py         # Application entry point
├── .env            # Environment configuration
└── requirements.txt
```

## Core Files Explained

### `main.py`
- **Purpose:** The entry point of the FastAPI application.
- **Responsibilities:** Bootstraps the application, configures CORS, and registers API routers.
- **Dependencies:** `fastapi`, `uvicorn`, `routers.repo_router`
- **Called by:** Run manually via `uvicorn main:app`.
- **Calls:** Includes `repo_router.py`.

---

### `routers/repo_router.py`
- **Purpose:** Defines the API endpoints accessible to the frontend.
- **Responsibilities:** Validates incoming HTTP requests (using Pydantic models), routes them to the appropriate service functions, and handles HTTP exceptions.
- **Dependencies:** `fastapi`, `pydantic`, `services.*`
- **Called by:** The React Frontend (`api.js`).
- **Calls:** `repo_service`, `llm_service`, `content_service`.
- **Common Interview Questions:**
  - *Why use Pydantic models?* (Answer: For automatic request validation and generating OpenAPI documentation).

---

### `services/repo_service.py`
- **Purpose:** Handles GitHub interactions.
- **Responsibilities:** Given a GitHub URL, it clones the repository to the local `repos/` directory. If the repository already exists, it handles the logic to pull latest changes or skip cloning.
- **Functions:**
  - `clone_repository(repo_url)`
- **Inputs:** `repo_url` (String)
- **Outputs:** The local path to the cloned repository.
- **Dependencies:** `git` (system command) or `GitPython`.
- **Called by:** `repo_router.py` (during the `/index` endpoint).

---

### `services/content_service.py`
- **Purpose:** File system parsing and chunking.
- **Responsibilities:** Walks through a local repository directory, reads file contents (ignoring binaries, `.git`, `node_modules`, etc.), and splits large files into smaller overlapping chunks. It also provides methods to read the *entire* repository as a single context string for full-repo analysis.
- **Functions:**
  - `scan_repository(repo_path)`: Returns a list of parsed files.
  - `chunk_document(content)`: Splits a string into an array of chunks.
  - `get_repository_context(docs)`: Concatenates all files into one massive string.
- **Dependencies:** `os`, `pathlib`.
- **Called by:** `repo_router.py`.

---

### `services/embedding_service.py`
- **Purpose:** Managing ChromaDB and Vector Generation.
- **Responsibilities:** Connects to the local ChromaDB instance, loads the Sentence Transformer model, and provides functions to store new chunks or query existing chunks based on similarity.
- **Functions:**
  - `store_embeddings(repo_name, chunks, metadata)`
  - `search_chunks(repo_name, query)`
- **Dependencies:** `chromadb`, `sentence_transformers`.
- **Common Interview Questions:**
  - *How do you prevent data from one repository leaking into another?* (Answer: By storing the `repo_name` in the ChromaDB metadata and applying a `where={"repo_name": repo_name}` filter during similarity search).

---

### `services/llm_service.py`
- **Purpose:** Interacting with OpenRouter and constructing prompts.
- **Responsibilities:** Takes retrieved code chunks (or full repository context) and a user's question, constructs a highly specific System Prompt, and sends it to the OpenRouter API.
- **Functions:**
  - `ask_question(query, context_chunks)`: Standard RAG implementation for Q&A.
  - `analyze_repository(query, full_context)`: Specialized pipeline that feeds the *entire* repository to the LLM for things like Dead Code Analysis or Architecture Reviews.
- **Dependencies:** `httpx` (for async HTTP requests), `os` (for `OPENROUTER_API_KEY`).
- **Called by:** `repo_router.py`.
- **Calls:** OpenRouter API (`https://openrouter.ai/api/v1/chat/completions`).

> [!NOTE]
> The separation of concerns in the backend (Routers vs. Services) is a deliberate architectural pattern designed to make unit testing easier and keep API definitions clean of heavy business logic.
