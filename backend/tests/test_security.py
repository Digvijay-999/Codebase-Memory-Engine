import os
import subprocess
from datetime import date, timedelta

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

import main
import routers.repo_router as repo_router
import services.embedding_service as embedding_service
import services.llm_service as llm_service
import services.repo_service as repo_service
from config.settings import CLONE_TIMEOUT_S, INDEX_RATE_LIMIT, LLM_RATE_LIMIT, REPOS_DIR, SEARCH_RATE_LIMIT
from services.file_service import scan_repository

SECRET = "FAKE_SECRET_should_never_be_read"


def write(path, text):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)


def no_temp_folders():
    return [d for d in os.listdir(REPOS_DIR) if d.startswith(repo_service.TMP_PREFIX)] == []


@pytest.fixture
def no_git(monkeypatch):
    def fail(*args, **kwargs):
        raise AssertionError("git must not run")
    monkeypatch.setattr(repo_service.subprocess, "run", fail)


@pytest.fixture
def fake_git(monkeypatch):
    """Stands in for `git clone`: records the call and writes one file into the destination."""
    calls = []

    def run(cmd, **kwargs):
        calls.append((cmd, kwargs))
        write(os.path.join(cmd[-1], "main.py"), "print('hi')\n")
        return subprocess.CompletedProcess(cmd, 0, "", "")
    monkeypatch.setattr(repo_service.subprocess, "run", run)
    return calls


# --- GitHub URL allowlist ---

@pytest.mark.parametrize("url", [
    "https://127.0.0.1:1/nope.git",
    "https://10.0.0.5/octocat/Hello-World",
    "http://github.com/octocat/Hello-World",
    "https://gitlab.com/octocat/Hello-World",
    "https://github.com.evil.example/octocat/Hello-World",
    "https://evil.example/github.com/octocat/Hello-World",
    "https://github.com:443/octocat/Hello-World",
    "https://user:pass@github.com/octocat/Hello-World",
    "https://token@github.com/octocat/Hello-World",
    "file:///etc/passwd",
    "ssh://git@github.com/octocat/Hello-World.git",
    "git@github.com:octocat/Hello-World.git",
    "https://github.com/octocat/Hello-World/tree/main",
    "https://github.com/octocat/Hello-World?ref=x",
    "https://github.com/octocat/..",
    "https://github.com/octocat",
    "",
])
def test_url_allowlist_rejects_before_git_runs(client, no_git, url):
    r = client.post("/index", json={"repo_url": url})
    assert r.status_code == 400


@pytest.mark.parametrize("url, name", [
    ("https://github.com/octocat/Allowed-One", "Allowed-One"),
    ("https://github.com/octocat/Allowed-Two.git", "Allowed-Two"),
    ("https://github.com/octo-cat/allowed.three/", "allowed.three"),
])
def test_url_allowlist_accepts_github_and_clones_shallow(client, fake_git, url, name):
    r = client.post("/clone", json={"repo_url": url})
    assert r.status_code == 200 and r.json()["repo_name"] == name
    (cmd, kwargs), = fake_git
    assert cmd[:7] == ["git", "clone", "--depth", "1", "--no-recurse-submodules", "--", url]
    assert os.path.dirname(cmd[7]) == REPOS_DIR and os.path.basename(cmd[7]).startswith(repo_service.TMP_PREFIX + name)
    assert kwargs["timeout"] == CLONE_TIMEOUT_S and kwargs["env"]["GIT_TERMINAL_PROMPT"] == "0"
    assert os.path.isfile(os.path.join(REPOS_DIR, name, "main.py")) and no_temp_folders()  # renamed into place


def test_second_clone_of_same_repo_gets_409_and_first_clone_survives(client, monkeypatch):
    url, dest = "https://github.com/octocat/raced", os.path.join(REPOS_DIR, "raced")
    seen = {}

    def run(cmd, **kwargs):
        write(os.path.join(cmd[-1], "main.py"), "print('first')\n")
        seen["visible_mid_clone"] = os.path.exists(dest)
        with pytest.raises(HTTPException) as second:  # a second request arrives while the first is cloning
            repo_service.clone_repository(url)
        seen["second"] = second.value.status_code
        return subprocess.CompletedProcess(cmd, 0, "", "")
    monkeypatch.setattr(repo_service.subprocess, "run", run)
    assert client.post("/clone", json={"repo_url": url}).status_code == 200
    assert seen == {"visible_mid_clone": False, "second": 409}
    assert os.path.isfile(os.path.join(dest, "main.py")) and no_temp_folders()
    assert client.post("/clone", json={"repo_url": url}).json()["message"] == "Repository already exists"


# --- Clone limits: the clone is deleted and a readable 4xx returned ---

@pytest.mark.parametrize("limit", ["MAX_FILES", "MAX_REPO_MB"])
def test_too_large_repo_is_deleted(client, fake_git, monkeypatch, limit):
    monkeypatch.setattr(repo_service, limit, 0)
    r = client.post("/clone", json={"repo_url": "https://github.com/octocat/too-large"})
    assert r.status_code == 413 and "too large" in r.json()["detail"]
    assert not os.path.exists(os.path.join(REPOS_DIR, "too-large")) and no_temp_folders()


def test_clone_timeout_is_deleted(client, monkeypatch):
    def slow(cmd, **kwargs):
        write(os.path.join(cmd[-1], "partial.py"), "x = 1\n")
        raise subprocess.TimeoutExpired(cmd, kwargs["timeout"])
    monkeypatch.setattr(repo_service.subprocess, "run", slow)
    r = client.post("/clone", json={"repo_url": "https://github.com/octocat/too-slow"})
    assert r.status_code == 413 and "took longer" in r.json()["detail"]
    assert not os.path.exists(os.path.join(REPOS_DIR, "too-slow")) and no_temp_folders()


def test_repo_count_limit(client, no_git, demo_repo, monkeypatch):
    monkeypatch.setattr(repo_service, "MAX_REPOS", len(os.listdir(REPOS_DIR)))
    r = client.post("/clone", json={"repo_url": "https://github.com/octocat/one-too-many"})
    assert r.status_code == 409 and "limit" in r.json()["detail"]


# --- Debug routes ---

@pytest.mark.parametrize("method, path, body", [
    ("post", "/clone", {"repo_url": "https://github.com/octocat/Hello-World"}),
    ("get", "/content/demo", None),
    ("get", "/chunks/demo", None),
    ("post", "/embed", {"text": "hello"}),
    ("post", "/store/demo", None),
])
def test_debug_routes_are_404_when_disabled(client, no_git, demo_repo, monkeypatch, method, path, body):
    monkeypatch.setattr(repo_router, "ENABLE_DEBUG_ENDPOINTS", False)
    r = client.request(method, path, json=body)
    assert r.status_code == 404 and r.json() == {"detail": "Not Found"}


# --- Repo names can't escape REPOS_DIR ---

@pytest.mark.parametrize("name", [".", ".."])
def test_dot_repo_names_are_404(client, llm, name):
    assert client.get(f"/scan/{name.replace('.', '%2E')}").status_code == 404
    assert client.get(f"/scan/{name.replace('.', '%2e')}").status_code == 404
    for path in ("/explain", "/generate-readme"):
        assert client.post(path, json={"repo_name": name}).status_code == 404
    assert client.post("/analyze", json={"question": "list files", "repo_name": name}).status_code == 404
    assert llm == []


def test_absolute_and_symlinked_repo_paths_are_404(client, llm, tmp_path):
    for name in ("/etc", "/etc/passwd", os.path.abspath(REPOS_DIR)):
        assert client.post("/explain", json={"repo_name": name}).status_code == 404
    assert client.get("/scan/%2Fetc").status_code == 404
    try:
        os.symlink(tmp_path, os.path.join(REPOS_DIR, "linked-repo"), target_is_directory=True)
    except OSError as e:
        pytest.skip(f"cannot create symlinks here: {e}")
    write(str(tmp_path / "outside.py"), f"X = '{SECRET}'\n")
    assert client.get("/scan/linked-repo").status_code == 404
    assert llm == []


# --- Symlinks ---

@pytest.fixture(scope="module")
def linky_repo(tmp_path_factory):
    outside = tmp_path_factory.mktemp("outside")
    (outside / "secret.py").write_text(f"TOKEN = '{SECRET}'\n")
    (outside / "notes.md").write_text(f"# {SECRET}\n")
    repo = os.path.join(REPOS_DIR, "linky")
    write(os.path.join(repo, "ok.py"), "def ok():\n    return 'safe content'\n")
    try:
        os.symlink(outside / "secret.py", os.path.join(repo, "leak.py"))
        os.symlink(outside / "notes.md", os.path.join(repo, "README.md"))
        os.symlink(outside, os.path.join(repo, "linkdir"), target_is_directory=True)
        os.symlink(os.path.join(repo, "ok.py"), os.path.join(repo, "inside_link.py"))
    except OSError as e:  # e.g. Windows without symlink privilege; CI (Linux) always runs these
        pytest.skip(f"cannot create symlinks here: {e}")
    return "linky"


def test_scanner_skips_symlinks(linky_repo):
    assert scan_repository(os.path.join(REPOS_DIR, linky_repo)) == ["ok.py"]


def test_symlink_targets_never_read_chunked_stored_or_prompted(client, linky_repo, llm):
    assert SECRET not in client.get(f"/content/{linky_repo}").text
    assert SECRET not in client.get(f"/chunks/{linky_repo}").text
    assert client.post(f"/store/{linky_repo}").json()["stored_chunks"] == 1
    stored = embedding_service.collection.get(where={"repo_name": linky_repo})
    assert [m["file"] for m in stored["metadatas"]] == ["ok.py"] and SECRET not in str(stored["documents"])
    r = client.post("/ask", json={"question": "what does ok return?", "repo_name": linky_repo})
    assert r.status_code == 200 and r.json()["sources"] == ["ok.py"]
    assert SECRET not in llm[-1]  # the symlinked README.md is not read into the prompt either


# --- Rate limiting ---

def test_llm_rate_limit_is_429_with_retry_after(client, demo_repo, llm):
    unknown = {"question": "q", "repo_name": "no-such-repo"}  # 404s before any LLM call
    assert [client.post("/ask", json=unknown).status_code for _ in range(LLM_RATE_LIMIT)] == [404] * LLM_RATE_LIMIT
    r = client.post("/explain", json={"repo_name": demo_repo})
    assert r.status_code == 429 and int(r.headers["Retry-After"]) >= 1
    assert "Too many requests" in r.json()["detail"]
    assert llm == []
    assert client.post("/index", json={"repo_url": "not a url"}).status_code == 400  # separate bucket


def test_index_rate_limit_covers_index_clone_and_store(client, no_git, demo_repo):
    for _ in range(INDEX_RATE_LIMIT):
        assert client.post("/index", json={"repo_url": "not a url"}).status_code == 400
    for r in (client.post("/clone", json={"repo_url": "not a url"}), client.post(f"/store/{demo_repo}")):
        assert r.status_code == 429 and "Retry-After" in r.headers


def test_search_rate_limit_is_429(client):
    body = {"query": "q", "repo_name": "no-such-repo"}
    assert {client.post("/search", json=body).status_code for _ in range(SEARCH_RATE_LIMIT)} == {404}
    r = client.post("/search", json=body)
    assert r.status_code == 429 and "Retry-After" in r.headers


def test_daily_llm_cap_is_global_and_resets_at_utc_midnight(client, indexed_demo, llm, monkeypatch):
    monkeypatch.setattr(llm_service, "LLM_DAILY_LIMIT", 2)
    alice, bob = TestClient(main.app, client=("203.0.113.10", 1)), TestClient(main.app, client=("203.0.113.11", 1))
    assert alice.post("/ask", json={"question": "blueprint?", "repo_name": indexed_demo}).status_code == 200
    assert bob.post("/explain", json={"repo_name": indexed_demo}).status_code == 200
    r = alice.post("/analyze", json={"question": "dead code?", "repo_name": indexed_demo})
    assert r.status_code == 429 and r.json()["detail"].startswith("Demo limit reached for today")
    assert len(llm) == 2  # the third request never reached the LLM
    llm_service._daily_usage["day"] = date.today() - timedelta(days=2)  # a new UTC day
    assert bob.post("/ask", json={"question": "blueprint?", "repo_name": indexed_demo}).status_code == 200


def test_rate_limit_is_per_client_ip(no_git):
    first, second = TestClient(main.app, client=("203.0.113.1", 1)), TestClient(main.app, client=("203.0.113.2", 1))
    for _ in range(INDEX_RATE_LIMIT):
        first.post("/index", json={"repo_url": "not a url"})
    assert first.post("/index", json={"repo_url": "not a url"}).status_code == 429
    assert second.post("/index", json={"repo_url": "not a url"}).status_code == 400
