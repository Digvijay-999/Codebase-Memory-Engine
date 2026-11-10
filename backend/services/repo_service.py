import os
import shutil
import logging
from pathlib import Path
from git import Repo
from git.exc import GitCommandError
from fastapi import HTTPException
from config.settings import REPOS_DIR

logger = logging.getLogger(__name__)


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
        logger.warning("Clone failed for %s: %s", clean_url, e)
        shutil.rmtree(destination, ignore_errors=True)  # a partial folder would be reused later without re-cloning
        raise HTTPException(status_code=400, detail="Couldn't clone this repository. Check that it's a public GitHub URL and try again.")
    except Exception as e:
        logger.error("Clone failed for %s: %r", clean_url, e)
        shutil.rmtree(destination, ignore_errors=True)
        raise HTTPException(status_code=500, detail="Failed to clone repository.")

    return {
        "message": "Repository cloned successfully",
        "path": destination,
        "repo_name": repo_name
    }
