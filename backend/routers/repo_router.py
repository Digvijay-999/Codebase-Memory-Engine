import os

from fastapi import APIRouter, HTTPException


from schemas.repo_schema import RepoRequest

from services.repo_service import clone_repository
from services.file_service import scan_repository
from services.content_service import read_repository
from services.chunk_service import chunk_documents
from schemas.embedding_schema import EmbeddingRequest
from services.embedding_service import create_embedding
from services.embedding_service import store_chunks
from schemas.search_schema import SearchRequest
from services.embedding_service import search_chunks
from services.llm_service import ask_llm
from schemas.ask_schema import AskRequest
from schemas.repo_name_schema import RepoNameRequest
from services.llm_service import explain_repository
from services.content_service import get_repository_context
from services.llm_service import generate_readme

router = APIRouter()


@router.post("/clone")
def clone_repo(request: RepoRequest):
    return clone_repository(request.repo_url)


@router.get("/repos")
def list_repos():
    repos_path = "repos"
    if not os.path.exists(repos_path):
        return {"repositories": []}
    
    repos = []
    for item in os.listdir(repos_path):
        if os.path.isdir(os.path.join(repos_path, item)):
            repos.append(item)
            
    return {"repositories": repos}


@router.get("/scan/{repo_name}")
def scan_repo(repo_name: str):

    repo_path = f"repos/{repo_name}"

    if not os.path.exists(repo_path):
        raise HTTPException(
            status_code=404,
            detail="Repository not found."
        )

    files = scan_repository(repo_path)

    return {
        "repository": repo_name,
        "total_files": len(files),
        "files": files,
    }


@router.get("/content/{repo_name}")
def get_content(repo_name: str):

    repo_path = f"repos/{repo_name}"

    if not os.path.exists(repo_path):
        raise HTTPException(
            status_code=404,
            detail="Repository not found."
        )

    files = scan_repository(repo_path)

    docs = read_repository(repo_path, files)

    return {
        "repository": repo_name,
        "documents": docs,
    }


@router.get("/chunks/{repo_name}")
def get_chunks(repo_name: str):

    repo_path = f"repos/{repo_name}"

    if not os.path.exists(repo_path):
        raise HTTPException(
            status_code=404,
            detail="Repository not found."
        )

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

    repo_path = f"repos/{repo_name}"

    if not os.path.exists(repo_path):
        raise HTTPException(
            status_code=404,
            detail="Repository not found."
        )

    files = scan_repository(repo_path)

    docs = read_repository(repo_path, files)

    chunks = chunk_documents(docs)

    total = store_chunks(chunks, repo_name)

    return {
    "success": True,
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

    context = "\n\n".join(results["documents"])
    
    repo_path = f"repos/{repo_name_clean}"
    readme_path = os.path.join(repo_path, "README.md")
    if os.path.exists(readme_path):
        with open(readme_path, "r", encoding="utf-8") as f:
            context = f"--- README.md ---\n{f.read()[:2000]}\n\n--- Search Results ---\n{context}"

    answer = ask_llm(
        request.question,
        context
    )

    sources = []
    if os.path.exists(readme_path):
        sources.append("README.md")

    for metadata in results["metadatas"]:
        file = metadata["file"]

        if file not in sources:
            sources.append(file)

    return {
        "success": True,
        "answer": answer,
        "sources": sources
    }


@router.post("/explain")
def explain(request: RepoNameRequest):

    repo_path = f"repos/{request.repo_name}"

    if not os.path.exists(repo_path):
        raise HTTPException(
            status_code=404,
            detail="Repository not found."
        )

    files = scan_repository(repo_path)
    docs = read_repository(repo_path, files)
    total_files = len(files)
    normalized_files = [f.replace('\\', '/') for f in files]
    directories = len(set([os.path.dirname(f) for f in normalized_files if os.path.dirname(f)]))
    
    extensions = [os.path.splitext(f)[1] for f in normalized_files]
    from collections import Counter
    lang_counts = Counter(extensions)
    languages = ", ".join([f"{ext} ({count})" for ext, count in lang_counts.most_common(5) if ext])
    
    approximate_loc = sum([len(doc["content"].splitlines()) for doc in docs])
    
    top_level_folders = list(set([f.split('/')[0] for f in normalized_files if '/' in f]))
    
    api_endpoints = []
    for doc in docs:
        if "router" in doc["file"] or "main" in doc["file"]:
            for line in doc["content"].splitlines():
                if "@router" in line or "@app" in line:
                    api_endpoints.append(line.strip())

    services = [f for f in normalized_files if 'service' in f.lower()]
    schemas = [f for f in normalized_files if 'schema' in f.lower()]

    tech_stack = []
    for doc in docs:
        if "requirements.txt" in doc["file"]:
            tech_stack.extend([line.strip() for line in doc["content"].splitlines() if line.strip() and not line.startswith('#')])
        elif "package.json" in doc["file"]:
            import json
            try:
                pkg = json.loads(doc["content"])
                tech_stack.extend(list(pkg.get("dependencies", {}).keys()))
            except:
                pass

    data_flow = "Client Requests -> FastAPI Routers -> Python Services -> LLM / ChromaDB Storage"
    rag_pipeline = "Repository Scanning -> Document Chunking -> Embeddings -> ChromaDB Storage -> Semantic Search"
    
    important_files = [f for f in normalized_files if f.split('/')[-1] in ["main.py", "app.py", "package.json", "requirements.txt", "README.md"]]

    structured_metadata = {
        "repository_name": request.repo_name,
        "statistics": {
            "total_files": total_files,
            "directories": directories,
            "languages": languages,
            "estimated_loc": approximate_loc
        },
        "technology_stack": tech_stack,
        "top_level_directory_tree": top_level_folders,
        "api_endpoints": api_endpoints,
        "services": services,
        "schemas": schemas,
        "data_flow": data_flow,
        "rag_pipeline": rag_pipeline,
        "important_files": important_files
    }

    import json
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

    repo_path = f"repos/{request.repo_name}"

    if not os.path.exists(repo_path):
        raise HTTPException(
            status_code=404,
            detail="Repository not found."
        )

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

    repo_name = os.path.basename(clone["path"])

    scan_repository(f"repos/{repo_name}")

    files = scan_repository(f"repos/{repo_name}")
    docs = read_repository(f"repos/{repo_name}", files)
    chunks = chunk_documents(docs)
    total = store_chunks(chunks, repo_name)

    return {
        "success": True,
        "repo_name": repo_name,
        "stored_chunks": total
    }