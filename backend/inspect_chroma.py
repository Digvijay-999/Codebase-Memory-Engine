import sys
from pathlib import Path

# Ensure backend directory is in sys.path
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

import chromadb
from config.settings import CHROMA_DB_PATH

client = chromadb.PersistentClient(path=CHROMA_DB_PATH)
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
