import os
import json
from collections import Counter
from fastapi import APIRouter, HTTPException

from schemas.repo_schema import RepoRequest
from schemas.embedding_schema import EmbeddingRequest
from schemas.search_schema import SearchRequest
from schemas.ask_schema import AskRequest
from schemas.repo_name_schema import RepoNameRequest

from services.repo_service import clone_repository
from services.file_service import scan_repository
from services.content_service import read_repository, get_repository_context
from services.chunk_service import chunk_documents
from services.embedding_service import create_embedding, store_chunks, search_chunks
from services.llm_service import ask_llm, analyze_repository, explain_repository, generate_readme
from config.settings import REPOS_DIR

router = APIRouter()


def _get_repo_path(repo_name: str) -> str:
    safe_name = os.path.basename(repo_name)
    repo_path = os.path.join(REPOS_DIR, safe_name)
    if not os.path.exists(repo_path):
        raise HTTPException(
            status_code=404,
            detail=f"Repository '{repo_name}' not found."
        )
    return repo_path


@router.post("/clone")
def clone_repo(request: RepoRequest):
    return clone_repository(request.repo_url)


@router.get("/repos")
def list_repos():
    if not os.path.exists(REPOS_DIR):
        return {"repositories": []}
    
    repos = []
    try:
        for item in os.listdir(REPOS_DIR):
            if os.path.isdir(os.path.join(REPOS_DIR, item)):
                repos.append(item)
    except Exception:
        pass
            
    return {"repositories": sorted(repos)}


@router.get("/scan/{repo_name}")
def scan_repo(repo_name: str):
    repo_path = _get_repo_path(repo_name)
    files = scan_repository(repo_path)

    return {
        "repository": repo_name,
        "total_files": len(files),
        "files": files,
    }


@router.get("/content/{repo_name}")
def get_content(repo_name: str):
    repo_path = _get_repo_path(repo_name)
    files = scan_repository(repo_path)
    docs = read_repository(repo_path, files)

    return {
        "repository": repo_name,
        "total_documents": len(docs),
        "documents": docs,
    }


@router.get("/chunks/{repo_name}")
def get_chunks(repo_name: str):
    repo_path = _get_repo_path(repo_name)
    files = scan_repository(repo_path)
    docs = read_repository(repo_path, files)
    chunks = chunk_documents(docs)

    return {
        "repository": repo_name,
        "chunks": len(chunks),
        "data": chunks[:5]
    }


@router.post("/embed")
def embed_text(request: EmbeddingRequest):
    embedding = create_embedding(request.text)

    return {
        "dimensions": len(embedding),
        "embedding": embedding[:10]
    }


@router.post("/store/{repo_name}")
def store_repo(repo_name: str):
    repo_path = _get_repo_path(repo_name)
    files = scan_repository(repo_path)
    docs = read_repository(repo_path, files)
    chunks = chunk_documents(docs)
    total = store_chunks(chunks, repo_name)

    return {
        "success": True,
        "repo_name": repo_name,
        "stored_chunks": total
    }


@router.post("/search")
def search(request: SearchRequest):
    results = search_chunks(request.query, request.repo_name)

    return {
        "success": True,
        "results": results
    }


@router.post("/ask")
def ask(request: AskRequest):
    repo_name_clean = request.repo_name
    results = search_chunks(request.question, repo_name_clean)

    # Combine chunk search results
    context_chunks = results.get("documents", [])
    context = "\n\n".join(context_chunks)
    
    safe_name = os.path.basename(repo_name_clean)
    repo_path = os.path.join(REPOS_DIR, safe_name)
    readme_path = os.path.join(repo_path, "README.md")
    
    sources = []
    if os.path.exists(readme_path):
        try:
            with open(readme_path, "r", encoding="utf-8", errors="ignore") as f:
                readme_preview = f.read()[:2000]
                context = f"--- README.md ---\n{readme_preview}\n\n--- Search Results ---\n{context}"
                sources.append("README.md")
        except Exception:
            pass

    for metadata in results.get("metadatas", []):
        file = metadata.get("file")
        if file and file not in sources:
            sources.append(file)

    answer = ask_llm(
        request.question,
        context
    )

    return {
        "success": True,
        "answer": answer,
        "sources": sources
    }


@router.post("/analyze")
def analyze_repo(request: AskRequest):
    repo_path = _get_repo_path(request.repo_name)

    files = scan_repository(repo_path)
    docs = read_repository(repo_path, files)
    context = get_repository_context(docs)

    answer = analyze_repository(request.question, context)

    return {
        "success": True,
        "answer": answer,
        "sources": []
    }


@router.post("/explain")
def explain(request: RepoNameRequest):
    repo_path = _get_repo_path(request.repo_name)

    files = scan_repository(repo_path)
    docs = read_repository(repo_path, files)
    total_files = len(files)
    normalized_files = [f.replace('\\', '/') for f in files]
    directories = len(set([os.path.dirname(f) for f in normalized_files if os.path.dirname(f)]))
    
    extensions = [os.path.splitext(f)[1] for f in normalized_files]
    lang_counts = Counter(extensions)
    languages = ", ".join([f"{ext} ({count})" for ext, count in lang_counts.most_common(5) if ext])
    
    approximate_loc = sum([len(doc["content"].splitlines()) for doc in docs])
    top_level_folders = sorted(list(set([f.split('/')[0] for f in normalized_files if '/' in f])))
    
    api_endpoints = []
    for doc in docs:
        doc_file = doc["file"].lower()
        if "router" in doc_file or "main" in doc_file or "app" in doc_file:
            for line in doc["content"].splitlines():
                line_str = line.strip()
                if line_str.startswith("@router") or line_str.startswith("@app"):
                    api_endpoints.append(line_str)

    services = [f for f in normalized_files if 'service' in f.lower()]
    schemas = [f for f in normalized_files if 'schema' in f.lower()]

    tech_stack = []
    for doc in docs:
        if "requirements.txt" in doc["file"]:
            tech_stack.extend([line.strip() for line in doc["content"].splitlines() if line.strip() and not line.startswith('#')])
        elif "package.json" in doc["file"]:
            try:
                pkg = json.loads(doc["content"])
                tech_stack.extend(list(pkg.get("dependencies", {}).keys()))
            except Exception:
                pass

    data_flow = "Client Requests -> FastAPI Routers -> Python Services -> LLM / ChromaDB Storage"
    rag_pipeline = "Repository Scanning -> Document Chunking -> Embeddings -> ChromaDB Storage -> Semantic Search"
    
    important_files = [f for f in normalized_files if f.split('/')[-1] in ["main.py", "app.py", "package.json", "requirements.txt", "README.md", "Dockerfile"]]

    structured_metadata = {
        "repository_name": request.repo_name,
        "statistics": {
            "total_files": total_files,
            "directories": directories,
            "languages": languages,
            "estimated_loc": approximate_loc
        },
        "technology_stack": tech_stack[:20],
        "top_level_directory_tree": top_level_folders,
        "api_endpoints": api_endpoints[:25],
        "services": services[:20],
        "schemas": schemas[:20],
        "data_flow": data_flow,
        "rag_pipeline": rag_pipeline,
        "important_files": important_files
    }

    metadata_json = json.dumps(structured_metadata, indent=2)
    context = get_repository_context(docs)
    explanation = explain_repository(context, metadata_json)

    return {
        "success": True,
        "repository": request.repo_name,
        "explanation": explanation
    }


@router.post("/generate-readme")
def generate_repo_readme(request: RepoNameRequest):
    repo_path = _get_repo_path(request.repo_name)

    files = scan_repository(repo_path)
    docs = read_repository(repo_path, files)
    context = get_repository_context(docs)

    readme = generate_readme(context)

    return {
        "success": True,
        "readme": readme
    }


@router.post("/index")
def index_repository(request: RepoRequest):
    clone = clone_repository(request.repo_url)
    repo_name = clone.get("repo_name") or os.path.basename(clone["path"])
    repo_path = os.path.join(REPOS_DIR, repo_name)

    # Perform single scan, read, chunk, and store
    files = scan_repository(repo_path)
    docs = read_repository(repo_path, files)
    chunks = chunk_documents(docs)
    total = store_chunks(chunks, repo_name)

    return {
        "success": True,
        "repo_name": repo_name,
        "total_files": len(files),
        "stored_chunks": total
    }