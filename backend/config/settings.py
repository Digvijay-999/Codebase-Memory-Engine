import os
from pathlib import Path
from urllib.parse import urlparse
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

LOCAL_DEV_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
]


def _normalize_origin(origin: str) -> str:
    """Normalize origin by stripping whitespace, quotes, trailing slashes, and paths."""
    if not origin:
        return ""
    cleaned = origin.strip().strip("'\"").strip().rstrip("/")
    if not cleaned:
        return ""
    if "://" in cleaned:
        parsed = urlparse(cleaned)
        if parsed.scheme and parsed.netloc:
            return f"{parsed.scheme.lower()}://{parsed.netloc.lower()}"
    return cleaned


def _parse_origins(raw_value: str) -> list[str]:
    """Parse comma/newline/semicolon-separated origins and normalize each."""
    if not raw_value:
        return []
    normalized_raw = raw_value.replace("\n", ",").replace(";", ",")
    origins: list[str] = []
    for item in normalized_raw.split(","):
        normalized = _normalize_origin(item)
        if normalized and normalized not in origins:
            origins.append(normalized)
    return origins


FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
raw_allowed = os.getenv("ALLOWED_ORIGINS", "")

# Build ALLOWED_ORIGINS ensuring local development origins are always preserved
allowed_origins_list: list[str] = list(LOCAL_DEV_ORIGINS)

for origin in _parse_origins(raw_allowed):
    if origin not in allowed_origins_list:
        allowed_origins_list.append(origin)

for origin in _parse_origins(FRONTEND_URL):
    if origin not in allowed_origins_list:
        allowed_origins_list.append(origin)

ALLOWED_ORIGINS = allowed_origins_list
