from git import Repo
import os

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

    Repo.clone_from(repo_url, destination)

    return {
        "message": "Repository cloned successfully",
        "path": destination
    }
