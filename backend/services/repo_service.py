import os
from pathlib import Path
from git import Repo
from git.exc import GitCommandError
from fastapi import HTTPException
from config.settings import REPOS_DIR


def clone_repository(repo_url: str):
    if not repo_url or not repo_url.strip():
        raise HTTPException(status_code=400, detail="Repository URL is required.")

    clean_url = repo_url.strip()
    repo_name = clean_url.split("/")[-1]

    if repo_name.endswith(".git"):
        repo_name = repo_name[:-4]

    os.makedirs(REPOS_DIR, exist_ok=True)
    destination = os.path.join(REPOS_DIR, repo_name)

    if os.path.exists(destination):
        return {
            "message": "Repository already exists",
            "path": destination,
            "repo_name": repo_name
        }

    try:
        Repo.clone_from(clean_url, destination, depth=1) # Shallow clone for speed and memory efficiency
    except GitCommandError as e:
        raise HTTPException(status_code=400, detail=f"Invalid GitHub repository URL or repository could not be cloned: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clone repository: {str(e)}")

    return {
        "message": "Repository cloned successfully",
        "path": destination,
        "repo_name": repo_name
    }
