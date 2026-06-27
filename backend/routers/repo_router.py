from fastapi import APIRouter

from schemas.repo_schema import RepoRequest

from services.repo_service import clone_repository
from services.file_service import scan_repository
from services.content_service import read_repository

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
