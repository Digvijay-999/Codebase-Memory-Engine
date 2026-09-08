import os
import sys

# Ensure backend directory is in sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

os.chdir(backend_dir)

from services.file_service import scan_repository
from services.content_service import read_repository
from services.chunk_service import chunk_documents
from services.embedding_service import store_chunks, search_chunks, collection

def main():
    repo_name = "codebase-memory-engine"
    repo_path = f"repos/{repo_name}"

    print(f"=== Starting Indexing for '{repo_name}' ===")
    print(f"Target path: {os.path.abspath(repo_path)}")

    # 1. Scan files
    files = scan_repository(repo_path)
    print(f"\n[1/4] Found {len(files)} files to index:")
    for f in sorted(files):
        print(f"  - {f}")

    # 2. Read documents
    docs = read_repository(repo_path, files)
    print(f"\n[2/4] Successfully read {len(docs)} documents.")

    # 3. Chunk documents
    chunks = chunk_documents(docs, chunk_size=800, overlap=100)
    print(f"\n[3/4] Generated {len(chunks)} chunks from documents.")

    # 4. Store in ChromaDB
    print("\n[4/4] Generating embeddings and storing in ChromaDB...")
    total_stored = store_chunks(chunks, repo_name)
    print(f"Successfully stored {total_stored} chunks in ChromaDB collection '{collection.name}'!")

    # Verify collection count
    total_docs = collection.count()
    print(f"Total documents in ChromaDB collection: {total_docs}")

    # Run verification searches
    test_queries = [
        "How are embeddings stored in ChromaDB?",
        "FastAPI router endpoints for repository analysis",
        "React frontend components and state management",
        "What are the supported file extensions for scanning?"
    ]

    print("\n=== Verifying Semantic Search Queries ===")
    for query in test_queries:
        print(f"\nQuery: '{query}'")
        results = search_chunks(query, repo_name, n_results=2)
        for i, (doc, meta) in enumerate(zip(results["documents"], results["metadatas"]), 1):
            print(f"  Result {i} [{meta.get('file')}]:")
            snippet = doc.strip().replace("\n", " ")[:120]
            print(f"    {snippet}...")

    print("\n=== Indexing Completed Successfully ===")

if __name__ == "__main__":
    main()
