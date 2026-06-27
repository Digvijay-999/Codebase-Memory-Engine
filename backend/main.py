from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from services.repo_service import clone_repository
from services.file_service import scan_repository
from services.content_service import read_repository

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/scan/{repo_name}")
def scan_repo(repo_name: str):

    repo_path = f"repos/{repo_name}"

    files = scan_repository(repo_path)

    return {
        "repository": repo_name,
        "total_files": len(files),
        "files": files,
    }


@app.get("/content/{repo_name}")
def get_content(repo_name: str):

    repo_path = f"repos/{repo_name}"

    files = scan_repository(repo_path)

    docs = read_repository(repo_path, files)

    return {
        "repository": repo_name,
        "documents": docs
    }


class RepoRequest(BaseModel):
    repo_url: str


@app.post("/clone")
def clone_repo(request: RepoRequest):
    return clone_repository(request.repo_url)
