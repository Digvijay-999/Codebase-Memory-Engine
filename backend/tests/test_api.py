import pytest

import services.llm_service as llm_service

FILES = {"README.md", "app.py", "api/routes.py"}


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "healthy"


def test_repos_lists_cloned_repos(client, demo_repo):
    assert demo_repo in client.get("/repos").json()["repositories"]


def test_scan(client, demo_repo):
    body = client.get(f"/scan/{demo_repo}").json()
    assert {f.replace("\\", "/") for f in body["files"]} == FILES
    assert body["total_files"] == 3


def test_search_returns_only_this_repos_chunks(client, indexed_demo):
    r = client.post("/search", json={"query": "register blueprint", "repo_name": indexed_demo})
    assert r.status_code == 200
    metadatas = r.json()["results"]["metadatas"]
    assert metadatas and {m["repo_name"] for m in metadatas} == {indexed_demo}
    assert {m["file"] for m in metadatas} <= FILES


@pytest.mark.parametrize("method, path, body", [
    ("get", "/scan/no-such-repo", None),
    ("get", "/content/no-such-repo", None),
    ("post", "/search", {"query": "x", "repo_name": "no-such-repo"}),
    ("post", "/ask", {"question": "x", "repo_name": "no-such-repo"}),
    ("post", "/explain", {"repo_name": "no-such-repo"}),
    ("post", "/generate-readme", {"repo_name": "no-such-repo"}),
])
def test_unknown_repo_is_404(client, llm, method, path, body):
    r = client.request(method, path, json=body)
    assert r.status_code == 404
    assert "no-such-repo" in r.json()["detail"]
    assert llm == []  # never reached the LLM


@pytest.mark.parametrize("path, body", [
    ("/ask", {"question": "   ", "repo_name": "demo"}),
    ("/ask", {"question": "x" * 4001, "repo_name": "demo"}),
    ("/ask", {"repo_name": "demo"}),
    ("/search", {"query": "", "repo_name": "demo"}),
    ("/explain", {}),
    ("/index", {}),
])
def test_validation_is_422(client, llm, path, body):
    assert client.post(path, json=body).status_code == 422
    assert llm == []


def test_ask_answers_from_retrieved_chunks(client, indexed_demo, llm):
    r = client.post("/ask", json={"question": "How is the blueprint registered?", "repo_name": indexed_demo})
    assert r.status_code == 200
    body = r.json()
    assert body["success"] is True and body["answer"] == "stub answer (rag)"
    assert "README.md" in body["sources"]
    assert "register_blueprint" in llm[-1] and "How is the blueprint registered?" in llm[-1]


@pytest.mark.parametrize("path, body, key", [
    ("/analyze", {"question": "Find dead code", "repo_name": "demo"}, "answer"),
    ("/explain", {"repo_name": "demo"}, "explanation"),
    ("/generate-readme", {"repo_name": "demo"}, "readme"),
])
def test_whole_repo_llm_endpoints(client, demo_repo, llm, path, body, key):
    r = client.post(path, json=body)
    assert r.status_code == 200
    assert r.json()[key] == "stub answer (whole-repo)"
    assert "def create_app" in llm[-1]  # the repo's files are in the prompt


def test_llm_timeout_is_504(client, indexed_demo, monkeypatch):
    async def too_slow(prompt, timeout, whole_repo=False):
        raise llm_service.OpenRouterTimeoutException("The AI model didn't finish in time.")

    monkeypatch.setattr(llm_service, "_call_openrouter", too_slow)
    r = client.post("/ask", json={"question": "anything", "repo_name": indexed_demo})
    assert r.status_code == 504
    assert r.json() == {"success": False, "error": "The AI model didn't finish in time.", "detail": "The AI model didn't finish in time."}
