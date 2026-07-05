from fastapi import APIRouter

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

router = APIRouter()


@router.post("/clone")
def clone_repo(request: RepoRequest):
    return clone_repository(request.repo_url)


@router.get("/scan/{repo_name}")
def scan_repo(repo_name: str):

    repo_path = f"repos/{repo_name}"

    files = scan_repository(repo_path)

    return {
        "repository": repo_name,
        "total_files": len(files),
        "files": files,
    }


@router.get("/content/{repo_name}")
def get_content(repo_name: str):

    repo_path = f"repos/{repo_name}"

    files = scan_repository(repo_path)

    docs = read_repository(repo_path, files)

    return {
        "repository": repo_name,
        "documents": docs,
    }


@router.get("/chunks/{repo_name}")
def get_chunks(repo_name: str):

    repo_path = f"repos/{repo_name}"

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

    files = scan_repository(repo_path)

    docs = read_repository(repo_path, files)

    chunks = chunk_documents(docs)

    total = store_chunks(chunks)

    return {
        "stored_chunks": total
    }


@router.post("/search")
def search(request: SearchRequest):

    results = search_chunks(request.query)

    return results


@router.post("/ask")
def ask(request: AskRequest):

    results = search_chunks(request.question)

    context = "\n\n".join(results["documents"])

    answer = ask_llm(
        request.question,
        context
    )

    sources = []

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

    files = scan_repository(repo_path)

    docs = read_repository(repo_path, files)

    chunks = chunk_documents(docs)

    context = "\n\n".join(
        chunk["content"]
        for chunk in chunks[:15]
    )

    explanation = explain_repository(context)

    return {
        "success": True,
        "repository": request.repo_name,
        "explanation": explanation
    }
