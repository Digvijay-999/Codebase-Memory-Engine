"""Test setup: throwaway REPOS_DIR and CHROMA_DB_PATH, a fake embedding model and a stubbed LLM: no network, no model file."""
import os
import tempfile
import zlib

import numpy as np
import pytest

_TMP = tempfile.mkdtemp(prefix="contextforge-tests-")
# Set before the app is imported: config.settings reads these once (load_dotenv never overrides them).
os.environ.update(
    REPOS_DIR=os.path.join(_TMP, "repos"),
    CHROMA_DB_PATH=os.path.join(_TMP, "chroma"),
    OPENROUTER_API_KEY="test-key-never-sent",
    ANONYMIZED_TELEMETRY="False",
    ENABLE_DEBUG_ENDPOINTS="true",  # tests drive the pipeline through /store, /content and /clone
)
os.makedirs(os.environ["REPOS_DIR"])

from fastapi.testclient import TestClient  # noqa: E402
import main  # noqa: E402
import services.embedding_service as embedding_service  # noqa: E402
import services.llm_service as llm_service  # noqa: E402
import services.rate_limit as rate_limit  # noqa: E402

REPOS_DIR = os.environ["REPOS_DIR"]


class FakeEmbeddingModel:
    """Deterministic 384-d bag-of-words vectors, so texts sharing words are close. Same interface as the ONNX model."""

    def encode(self, texts, batch_size=None, show_progress_bar=False):
        single = isinstance(texts, str)
        rows = [texts] if single else texts
        out = np.zeros((len(rows), 384), dtype=np.float32)
        for i, text in enumerate(rows):
            for word in text.lower().split():
                out[i, zlib.crc32(word.encode()) % 384] += 1
        out /= np.maximum(np.linalg.norm(out, axis=1, keepdims=True), 1e-12)
        return out[0] if single else out


embedding_service._model = FakeEmbeddingModel()


def write(path, text):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)


@pytest.fixture(scope="session")
def client():
    return TestClient(main.app)  # not used as a context manager, so the ONNX warmup in lifespan never runs


@pytest.fixture(scope="session")
def demo_repo():
    path = os.path.join(REPOS_DIR, "demo")
    write(os.path.join(path, "README.md"), "# Demo\nA tiny Flask app used by the tests.\n")
    write(os.path.join(path, "app.py"), "def create_app():\n    app = Flask(__name__)\n    app.register_blueprint(api)\n    return app\n")
    write(os.path.join(path, "api", "routes.py"), "api = Blueprint('api', __name__)\n\n@api.route('/ping')\ndef ping():\n    return 'pong'\n")
    return "demo"


@pytest.fixture(scope="session")
def indexed_demo(client, demo_repo):
    assert client.post(f"/store/{demo_repo}").json()["stored_chunks"] == 3
    return demo_repo


@pytest.fixture(autouse=True)
def fresh_rate_limits():
    rate_limit._hits.clear()
    llm_service._daily_usage.update(day=None, calls=0)


@pytest.fixture(autouse=True)
def llm(monkeypatch):
    """Every test gets a stubbed OpenRouter call; the list holds the prompts it received."""
    prompts = []

    async def fake_call(prompt, timeout, whole_repo=False):
        prompts.append(prompt)
        return "stub answer (whole-repo)" if whole_repo else "stub answer (rag)"

    monkeypatch.setattr(llm_service, "_call_openrouter", fake_call)
    return prompts
