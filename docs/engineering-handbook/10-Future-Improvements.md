# Future Improvements

ContextForge is a functional MVP (Minimum Viable Product). To scale it to a production SaaS application, several architectural improvements would be required. Be prepared to discuss these in interviews to demonstrate forward-thinking.

## 1. Authentication & Multi-Tenancy
**Current State:** Single-tenant. Anyone hitting the backend can access any indexed repository.
**Future State:** Implement OAuth (GitHub/Google) via JWT tokens. The `repo_name` metadata in ChromaDB would be expanded to include a `user_id` or `org_id` to enforce strict row-level security, ensuring users can only query their own private repositories.

## 2. Background Workers (Celery / Redis)
**Current State:** Indexing a repository is a synchronous HTTP request. If the repository takes 3 minutes to clone and chunk, the HTTP connection must stay open for 3 minutes.
**Future State:** Implement a task queue using Redis and Celery (or FastAPI BackgroundTasks for a lighter approach). The `/index` endpoint would immediately return a `task_id`. The frontend would then poll a `/status` endpoint (or connect via WebSockets) to display a real-time progress bar (Cloning -> Chunking -> Embedding).

## 3. Cloud Vector Database
**Current State:** ChromaDB runs locally in the backend file system.
**Future State:** Migrate to a managed cloud vector database like Pinecone, Weaviate Cloud, or ChromaDB Cloud. This allows the FastAPI backend to be deployed statelessly (e.g., on AWS Lambda or Google Cloud Run) and scale horizontally without worrying about local disk state.

## 4. Streaming LLM Responses
**Current State:** The frontend waits for the entire LLM response to generate before rendering the message.
**Future State:** Utilize Server-Sent Events (SSE) or WebSockets to stream the response token-by-token from OpenRouter through FastAPI to the React frontend. This massively improves perceived latency for the user.

## 5. Incremental Indexing
**Current State:** To update a repository, the system has to re-scan and re-embed the entire codebase.
**Future State:** Implement webhook listeners for GitHub. When a PR is merged, the webhook notifies ContextForge of exactly which files changed. The backend deletes only those specific chunks from ChromaDB and re-embeds only the modified files.

## 6. Rate Limiting & Cost Controls
**Current State:** Unlimited access to OpenRouter endpoints.
**Future State:** Implement FastAPI-Limiter (backed by Redis) to restrict users to X queries per minute. Introduce a token tracking system to monitor how much each user is costing in OpenRouter API calls.

## 7. Advanced Chunking Strategies
**Current State:** Fixed-size text chunking (500 characters).
**Future State:** Implement Abstract Syntax Tree (AST) parsing (e.g., using Tree-sitter). Instead of cutting text arbitrarily at 500 characters, AST parsing cuts code exactly at function or class boundaries, resulting in much higher quality semantic embeddings.

## 8. Dockerization
**Current State:** Manual installation via `pip` and `npm`.
**Future State:** Write a `docker-compose.yml` that spins up the Frontend, Backend, and a Redis instance simultaneously. This guarantees environment consistency across different developer machines and CI/CD pipelines.
