import chromadb

client = chromadb.PersistentClient(path="./chroma_db")
collection = client.get_or_create_collection(name="codebase")

results = collection.get(include=["metadatas", "documents"])
flask_readme_chunks = [(m, d) for m, d in zip(results["metadatas"], results["documents"]) if m.get("repo_name") == "flask" and m.get("file") == "README.md"]

print(f"Total Flask README.md chunks: {len(flask_readme_chunks)}")
for i, (m, d) in enumerate(flask_readme_chunks):
    print(f"\n--- Chunk {i} ---")
    print(d[:200])
