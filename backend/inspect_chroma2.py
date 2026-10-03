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

results = collection.get(include=["metadatas", "documents"])
flask_readme_chunks = [(m, d) for m, d in zip(results["metadatas"], results["documents"]) if m.get("repo_name") == "flask" and m.get("file") == "README.md"]

print(f"Total Flask README.md chunks: {len(flask_readme_chunks)}")
for i, (m, d) in enumerate(flask_readme_chunks):
    print(f"\n--- Chunk {i} ---")
    print(d[:200])
