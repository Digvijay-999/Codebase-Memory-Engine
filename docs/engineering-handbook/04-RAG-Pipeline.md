# RAG Pipeline

Retrieval-Augmented Generation (RAG) is the core engine behind ContextForge. LLMs (like GPT-4 or Claude) have a limited "context window" (how much text they can read at once) and do not have knowledge of private or highly updated codebases. RAG solves this by *retrieving* only the relevant pieces of your codebase and *augmenting* the LLM's prompt with them.

Here is a detailed breakdown of the two phases in the RAG pipeline: Ingestion and Retrieval.

## Phase 1: Ingestion (Indexing)

When you paste a GitHub URL into the dashboard, this flow executes:

1. **Clone:**
   `repo_service.py` downloads the repository to the local disk.
   *Why?* To ensure we have access to the raw files without being rate-limited by GitHub APIs.

2. **Scan & Read Files:**
   `content_service.py` recursively reads the repository. It explicitly ignores folders like `node_modules` or `venv` to prevent polluting the index with third-party libraries.
   *Why?* Third-party libraries are usually already known by the LLM, and indexing them wastes database space and search accuracy.

3. **Chunk Documents:**
   Source code files are split into overlapping chunks (e.g., 500 characters with 50 characters of overlap).
   *Why?* If we tried to embed a 10,000-line file as a single vector, the resulting vector would be extremely "diluted" and wouldn't match specific searches. Overlapping ensures that a function split across two chunks can still be understood.

4. **Generate Embeddings:**
   `embedding_service.py` passes each chunk through `all-MiniLM-L6-v2`. This model translates the text into a fixed-length array of floats (a vector) representing the semantic meaning of the code.
   *Why?* Vectors allow us to perform mathematical similarity comparisons.

5. **Store in Chroma:**
   The vector, the raw text chunk, and metadata (like the `repo_name` and `filepath`) are saved into ChromaDB.

## Phase 2: Retrieval & Generation (Chat)

When a user asks a question like "Where is the authentication middleware?":

1. **Query Embedding:**
   The user's question is passed through the *same* `all-MiniLM-L6-v2` model to create a query vector.

2. **Semantic Search:**
   ChromaDB performs a mathematical calculation (usually Cosine Similarity) comparing the query vector against all stored vectors *filtered by the active repository name*. It returns the top 5 most similar chunks.
   *Why?* This allows the system to find the authentication code even if the word "authentication" is never explicitly used in the file (e.g., it might find a file named `login_handler.py`).

3. **Prompt Construction:**
   `llm_service.py` constructs a system prompt. It tells the LLM: 
   *"You are an expert engineer. Using ONLY the following code snippets, answer the user's question. Snippets: [Insert Top 5 Chunks Here] User Question: Where is the authentication middleware?"*

4. **OpenRouter & Response:**
   The prompt is sent to the LLM. Because the LLM now has the exact relevant pieces of source code in its prompt, it can generate an accurate, hallucination-free response, which is returned to the user.

> [!CAUTION]
> **Whole-Repository Analysis Override**
> For certain tools (like Architecture Generation or Finding Dead Code), standard RAG is mathematically inadequate because the query requires global context, not local snippets. In these specific cases, ContextForge bypasses Steps 1 & 2 of the Retrieval phase, and instead concatenates the *entire* parsed repository and feeds it directly into Step 3.
