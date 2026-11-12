# API Reference

The FastAPI backend exposes the following REST endpoints. All endpoints expect `application/json` and return `application/json`.

---

### `POST /index`
**Purpose:** Clones a GitHub repository, chunks the files, generates embeddings, and saves them to ChromaDB.
**Input:**
```json
{ "repo_url": "https://github.com/user/repo" }
```
**Output:**
```json
{ "message": "Successfully indexed user/repo" }
```
**Flow:** `repo_router.py` -> `repo_service.clone_repository()` -> `content_service.scan_repository()` -> `embedding_service.store_embeddings()`

---

### `GET /repos`
**Purpose:** Returns a list of all currently indexed repositories.
**Input:** None
**Output:**
```json
{ "repos": ["repo-A", "repo-B"] }
```
**Flow:** Lists directory names in the `backend/repos/` folder.

---

### `POST /ask`
**Purpose:** Standard semantic Q&A. Uses vector retrieval (RAG) to answer questions based on specific file chunks.
**Input:**
```json
{ 
  "question": "How does auth work?", 
  "repo_name": "repo-A" 
}
```
**Output:**
```json
{ 
  "answer": "Auth is handled via...", 
  "sources": ["backend/auth.py", "frontend/login.jsx"] 
}
```
**Flow:** Retrieves top chunks from ChromaDB for `repo_name`, constructs a system prompt, queries OpenRouter, and extracts file paths from the retrieved chunks.

---

### `POST /analyze`
**Purpose:** Whole-repository analysis for complex tools (Find Dead Code, Security Review). Does NOT use ChromaDB semantic search.
**Input:**
```json
{ 
  "question": "Find unused functions.", 
  "repo_name": "repo-A" 
}
```
**Output:**
```json
{ 
  "answer": "The following functions appear unused..." 
}
```
**Flow:** Bypasses vector search. Calls `content_service.get_repository_context()` to read the entire parsed repository, injects the massive string into the LLM prompt, and awaits the analysis.

---

### `POST /explain`
**Purpose:** Generates a comprehensive architectural overview. Similar to `/analyze`, it uses the entire repository context.
**Input:**
```json
{ "repo_name": "repo-A" }
```
**Output:**
```json
{ 
  "explanation": "# Architecture Report\n..." 
}
```

---

### `POST /generate-readme`
**Purpose:** Generates a ready-to-use `README.md` file for the repository.
**Input:**
```json
{ "repo_name": "repo-A" }
```
**Output:**
```json
{ 
  "readme": "# Project Title\n..." 
}
```

---

### `POST /search` (Internal / Debug)
**Purpose:** Raw semantic search endpoint. Returns chunks without asking an LLM to summarize them.
**Input:**
```json
{ 
  "query": "database connection", 
  "repo_name": "repo-A" 
}
```
**Output:**
```json
{ 
  "results": [
    { "text": "def connect_db():...", "metadata": {"filepath": "db.py"} }
  ] 
}
```
