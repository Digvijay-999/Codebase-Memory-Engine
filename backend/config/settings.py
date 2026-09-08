import os
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
REPOS_DIR = os.getenv("REPOS_DIR", str(BASE_DIR / "repos"))
CHROMA_DB_PATH = os.getenv("CHROMA_DB_PATH", str(BASE_DIR / "chroma_db"))

# Models & Search
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "nvidia/nemotron-3-super-120b-a12b:free")
TOP_K_RESULTS = int(os.getenv("TOP_K_RESULTS", "5"))

# Indexing & File limits
MAX_FILE_SIZE_BYTES = int(os.getenv("MAX_FILE_SIZE_BYTES", str(500 * 1024))) # 500 KB limit
CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", "800"))
CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", "100"))
EMBEDDING_BATCH_SIZE = int(os.getenv("EMBEDDING_BATCH_SIZE", "64"))
CHROMA_BATCH_SIZE = int(os.getenv("CHROMA_BATCH_SIZE", "500"))

# Server & CORS
PORT = int(os.getenv("PORT", "8000"))
HOST = os.getenv("HOST", "0.0.0.0")
ALLOWED_ORIGINS = [
    origin.strip() 
    for origin in os.getenv(
        "ALLOWED_ORIGINS", 
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000,*"
    ).split(",") 
    if origin.strip()
]