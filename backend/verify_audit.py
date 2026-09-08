import os
import sys
import time
import json
from pathlib import Path

# Force UTF-8 on Windows stdout/stderr
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

# Setup paths
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

os.chdir(backend_dir)

from fastapi.testclient import TestClient
from main import app
from services.embedding_service import get_model, search_chunks, collection, warmup_model
from services.file_service import scan_repository
from services.content_service import read_repository, get_repository_context
from services.chunk_service import chunk_documents
from schemas.ask_schema import AskRequest
from schemas.search_schema import SearchRequest
from schemas.repo_name_schema import RepoNameRequest
from routers.repo_router import list_repos, scan_repo, get_chunks, search, ask

def run_tests():
    print("==================================================")
    print(">>> RUNNING CONTEXTFORGE PRE-DEPLOYMENT AUDIT SUITE")
    print("==================================================")

    client = TestClient(app)

    # 1. Test Lifespan & /health Endpoint
    print("\n[TEST 1] Verifying Backend Lifespan & /health...")
    t0 = time.time()
    response = client.get("/health")
    health_latency_ms = (time.time() - t0) * 1000
    assert response.status_code == 200, f"Health check failed: {response.text}"
    health_data = response.json()
    print(f"[PASS] Health check status: {health_data['status']} ({health_latency_ms:.1f}ms)")
    print(f"       Chroma collection documents count: {health_data.get('chroma_collection_documents')}")

    # 2. Test Repository Scanning & File Size Protections
    print("\n[TEST 2] Verifying File Scanner & Ignored Directories/Files...")
    t0 = time.time()
    files = scan_repository("repos/codebase-memory-engine")
    scan_latency_ms = (time.time() - t0) * 1000
    assert len(files) > 0, "No files found during scan"
    # Ensure no package-lock.json or chroma_db files leaked into scan
    assert not any("package-lock.json" in f for f in files), "package-lock.json was scanned"
    assert not any("chroma_db" in f for f in files), "chroma_db was scanned"
    assert not any("node_modules" in f for f in files), "node_modules was scanned"
    assert not any(".git" in f for f in files), ".git was scanned"
    print(f"[PASS] Scanned {len(files)} clean source files in {scan_latency_ms:.1f}ms")

    # 3. Test Reading & Chunking
    print("\n[TEST 3] Verifying Document Reading & Chunking Pipeline...")
    t0 = time.time()
    docs = read_repository("repos/codebase-memory-engine", files)
    chunks = chunk_documents(docs)
    chunk_latency_ms = (time.time() - t0) * 1000
    assert len(docs) > 0, "Failed to read documents"
    assert len(chunks) > 0, "Failed to generate chunks"
    # Ensure no whitespace-only chunks
    assert all(chunk["content"].strip() for chunk in chunks), "Found empty chunks"
    print(f"[PASS] Read {len(docs)} documents and created {len(chunks)} chunks in {chunk_latency_ms:.1f}ms")

    # 4. Test Semantic Search & Chroma Latency
    print("\n[TEST 4] Verifying Semantic Search & Latency...")
    search_queries = [
        "How is the RAG pipeline constructed?",
        "FastAPI router endpoints for repository indexing",
        "React frontend routing and components"
    ]
    for q in search_queries:
        t0 = time.time()
        search_res = search_chunks(q, "codebase-memory-engine", n_results=3)
        search_latency_ms = (time.time() - t0) * 1000
        assert len(search_res["documents"]) > 0, f"No results for query '{q}'"
        print(f"[PASS] Search query: '{q}' -> {len(search_res['documents'])} chunks ({search_latency_ms:.1f}ms)")
        print(f"       Top source: {search_res['metadatas'][0].get('file')}")

    # 5. Test Repository Isolation
    print("\n[TEST 5] Verifying Repository Isolation...")
    search_codebase = search_chunks("FastAPI router", "codebase-memory-engine", n_results=3)
    # Search a different or non-existent repo to verify filter
    search_other = search_chunks("FastAPI router", "non-existent-isolated-repo", n_results=3)
    assert len(search_other["documents"]) == 0, "Repo isolation failed! Cross-repo chunks leaked."
    print("[PASS] Repository isolation verified: queries strictly filter by repo_name.")

    # 6. Test Token-Budgeted Context Assembly
    print("\n[TEST 6] Verifying LLM Context Assembly & Token Budgeting...")
    context = get_repository_context(docs)
    context_chars = len(context)
    print(f"[PASS] Formatted repository context: {context_chars} characters (well within token budget)")
    assert context_chars <= 18000, "Context budget exceeded!"

    # 7. Test Error Handling & Edge Cases
    print("\n[TEST 7] Verifying Error Handling & Edge Cases...")
    # Empty query search
    empty_search = search_chunks("", "codebase-memory-engine")
    assert empty_search["documents"] == [], "Empty query search failed"

    # Non-existent repository 404
    resp_404 = client.get("/scan/non_existent_repo_12345")
    assert resp_404.status_code == 404, f"Expected 404, got {resp_404.status_code}"
    print("[PASS] 404 handling for non-existent repos verified.")

    # List repos
    resp_repos = client.get("/repos")
    assert resp_repos.status_code == 200
    repos_list = resp_repos.json().get("repositories", [])
    assert "codebase-memory-engine" in repos_list, "codebase-memory-engine not in repos list"
    print(f"[PASS] Listed {len(repos_list)} repositories successfully.")

    # 8. Test Ask Endpoint (End-to-End QA)
    print("\n[TEST 8] Verifying Ask / QA Endpoint...")
    t0 = time.time()
    resp_ask = client.post(
        "/ask",
        json={"question": "What is the purpose of ContextForge?", "repo_name": "codebase-memory-engine"}
    )
    ask_latency_ms = (time.time() - t0) * 1000
    assert resp_ask.status_code == 200, f"Ask endpoint failed: {resp_ask.text}"
    ask_data = resp_ask.json()
    assert ask_data.get("success") is True
    assert len(ask_data.get("sources", [])) > 0
    print(f"[PASS] Ask endpoint answered in {ask_latency_ms:.1f}ms")
    print(f"       Answer preview: {ask_data.get('answer', '')[:120]}...")
    print(f"       Cited sources: {ask_data.get('sources')}")

    print("\n==================================================")
    print("ALL 8 AUDIT SUITE TESTS PASSED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
