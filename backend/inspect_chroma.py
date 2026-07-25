import chromadb

client = chromadb.PersistentClient(path="./chroma_db")
collection = client.get_or_create_collection(name="codebase")

print("Total documents in collection:", collection.count())
results = collection.get(include=["metadatas", "documents"])
if results["metadatas"]:
    print("Sample metadata:", results["metadatas"][:5])
    repo_names = set([m["repo_name"] for m in results["metadatas"] if "repo_name" in m])
    print("Unique repo_names in DB:", repo_names)
    
    flask_readme = [m for m, d in zip(results["metadatas"], results["documents"]) if m.get("repo_name") == "flask" and "README" in m.get("file", "")]
    print(f"Flask README chunks: {len(flask_readme)}")
    
else:
    print("No data in collection.")
