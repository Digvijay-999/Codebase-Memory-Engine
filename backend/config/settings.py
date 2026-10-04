import os
from pathlib import Path
from dotenv import load_dotenv

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent

# Explicitly load backend/.env before reading environment variables
env_path = BASE_DIR / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

REPOS_DIR = os.getenv("REPOS_DIR", str(BASE_DIR / "repos"))
CHROMA_DB_PATH = os.getenv("CHROMA_DB_PATH", str(BASE_DIR / "chroma_db"))

# Models & Search
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
MODEL_DIR = Path(os.getenv("MODEL_DIR", str(BASE_DIR / "models" / "all-MiniLM-L6-v2")))
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

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
raw_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000"
).split(",")

ALLOWED_ORIGINS = [origin.strip() for origin in raw_origins if origin.strip()]
if FRONTEND_URL and FRONTEND_URL.strip() and FRONTEND_URL.strip() not in ALLOWED_ORIGINS:
    ALLOWED_ORIGINS.append(FRONTEND_URL.strip())