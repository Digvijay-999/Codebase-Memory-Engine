from git import Repo
from git.exc import GitCommandError
import os
from fastapi import HTTPException

REPO_DIR = "repos"


def clone_repository(repo_url: str):
    repo_name = repo_url.split("/")[-1]

    if repo_name.endswith(".git"):
        repo_name = repo_name[:-4]

    destination = os.path.join(REPO_DIR, repo_name)

    if os.path.exists(destination):
        return {
            "message": "Repository already exists",
            "path": destination
        }

    try:
        Repo.clone_from(repo_url, destination)
    except GitCommandError:
        raise HTTPException(status_code=400, detail="Invalid GitHub repository URL or repository could not be cloned.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clone repository: {str(e)}")

    return {
        "message": "Repository cloned successfully",
        "path": destination
    }
