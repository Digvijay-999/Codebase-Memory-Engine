# Code Walkthrough

This chapter walks through exactly what happens during core user actions, step-by-step, just like stepping through a debugger.

## Scenario 1: Indexing a Repository
**User Action:** The user pastes `https://github.com/example/repo` into the Dashboard and clicks "Launch Workspace".

1. **Frontend (`Dashboard.jsx`)**
   - Validates the input string is not empty.
   - Calls `api.indexRepository(repoUrl)`.
   - Sets local `loading` state to `true` (shows the terminal-style loading animation).
2. **Backend (`repo_router.py`)**
   - `POST /index` receives the request.
   - Calls `repo_service.clone_repository(repoUrl)`.
3. **Cloning (`repo_service.py`)**
   - Extracts the repository name (`repo`).
   - Checks if `backend/repos/repo` exists.
   - If missing, executes `git clone https://github.com/example/repo backend/repos/repo`.
4. **Scanning (`content_service.py`)**
   - Calls `scan_repository("repo")`.
   - Traverses the directory. Skips `.gitignore`, `node_modules`, `venv`, and binary files.
   - Reads the raw text of valid files.
5. **Chunking (`content_service.py`)**
   - Passes the text of each file to `chunk_document(text)`.
   - Splits text into blocks of 500 characters with 50 characters of overlap.
6. **Vectorization (`embedding_service.py`)**
   - Calls `store_embeddings(repo_name, chunks, metadata)`.
   - The SentenceTransformer generates a vector array for each chunk.
   - ChromaDB `collection.add()` is called, storing the IDs, embeddings, metadata, and raw text.
7. **Resolution**
   - FastAPI returns `200 OK`.
   - Frontend sets `localStorage.setItem('repo_name', 'repo')`.
   - React Router redirects the user to `/chat`.

---

## Scenario 2: Asking a Chat Question
**User Action:** The user types "How does the database connect?" and hits Enter.

1. **Frontend (`AnimatedAiChat.tsx`)**
   - The prompt is appended to the `messages` array as a "user" message.
   - UI shows the "Thinking..." animated placeholder.
   - Calls `api.askQuestion("How does the database connect?", "repo")`.
2. **Backend (`repo_router.py`)**
   - `POST /ask` intercepts.
   - Calls `embedding_service.search_chunks("repo", "How does the database connect?")`.
3. **Retrieval (`embedding_service.py`)**
   - Encodes the query into a query vector.
   - Queries ChromaDB: `where={"repo_name": "repo"}`.
   - Returns the top 5 raw text chunks and their metadata.
4. **Generation (`llm_service.py`)**
   - Combines the 5 chunks into a massive context string.
   - Appends the original question.
   - Sends the JSON payload to OpenRouter.
5. **Resolution**
   - LLM responds with markdown text.
   - FastAPI parses the file paths from the metadata to build the `sources` array.
   - Frontend removes "Thinking...", appends the assistant's message, and `ReactMarkdown` renders the text.

---

## Scenario 3: Exporting Markdown
**User Action:** On the Documentation page, the user clicks "Export Markdown".

1. **Frontend (`Docs.jsx`)**
   - The user clicks the button.
   - `handleExport()` is triggered.
   - The function checks if the `report` state is valid (not empty, not an error).
   - Generates a `Blob` object: `new Blob([report], { type: 'text/markdown;charset=utf-8' })`.
   - Creates a temporary `URL.createObjectURL()`.
   - Creates a hidden `<a>` tag, sets `download="repo-architecture-report.md"`.
   - Simulates a `.click()`.
   - Immediately revokes the object URL and removes the anchor tag to prevent memory leaks.
   - *Note: This requires exactly ZERO network calls. It uses the state already present in the browser.*
