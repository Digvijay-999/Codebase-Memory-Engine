# ChromaDB & Vector Storage

ContextForge uses ChromaDB as its vector database. Vector databases are fundamentally different from traditional SQL or NoSQL databases.

## Why a Vector Database?
Traditional databases (like PostgreSQL) are optimized for exact keyword matches (`WHERE text LIKE '%auth%'`). 
If a user searches for "user login", a traditional DB will miss a file named `session_manager.py` because the exact string doesn't match. 

A vector database stores mathematical representations of meaning (embeddings). When you query a vector DB, it calculates the "distance" between your query and all stored items. "User login" and `session_manager.py` have similar meanings, so their vectors are close together in dimensional space, allowing the database to return highly relevant results regardless of exact wording.

## Implementation Details

### Collections
In ChromaDB, a "Collection" is similar to a Table in SQL. 
ContextForge uses a **single, unified collection** to store all chunks across all repositories.

### Repository Isolation via Metadata
If all repositories share one collection, how do we prevent code from Repo A showing up when a user is querying Repo B?

When storing a chunk, ContextForge attaches a metadata dictionary:
```python
metadata = {
    "repo_name": "contextforge",
    "filepath": "backend/main.py"
}
```

During Semantic Search, we apply a hard `where` filter:
```python
results = collection.query(
    query_embeddings=[query_vector],
    n_results=5,
    where={"repo_name": target_repo}
)
```
**Why not create a new collection for every repository?**
Creating dynamic collections on the fly adds significant overhead, makes schema management difficult, and degrades performance. A single collection with metadata filtering is the industry-standard best practice for multi-tenant vector isolation.

### The Embedding Model
By default, ChromaDB can use its own embedding models. However, ContextForge explicitly uses `SentenceTransformer('all-MiniLM-L6-v2')`. 
*Why?* It is a small, incredibly fast model that runs locally on the CPU. It prevents us from having to send massive amounts of proprietary source code to a third-party embedding API (like OpenAI's `text-embedding-ada-002`), reducing costs to zero and significantly speeding up the ingestion phase.
