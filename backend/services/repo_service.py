import os
import re
import shutil
import logging
import subprocess
from fastapi import HTTPException
from config.settings import REPOS_DIR, CLONE_TIMEOUT_S, MAX_REPO_MB, MAX_FILES, MAX_REPOS

logger = logging.getLogger(__name__)

# Public GitHub repos over HTTPS only: no other hosts or IPs, ports, credentials, file:// or ssh/git@ URLs.
GITHUB_REPO_URL = re.compile(r"https://github\.com/[A-Za-z0-9][A-Za-z0-9-]{0,38}/([A-Za-z0-9._-]{1,100}?)(?:\.git)?/?")


def _clone_usage(path: str):
    """Disk size in MB (including .git) and number of checked-out files, without following symlinks."""
    size, files = 0, 0
    for root, _dirs, names in os.walk(path):
        in_git = os.path.relpath(root, path).split(os.sep)[0] == ".git"
        for name in names:
            size += os.lstat(os.path.join(root, name)).st_size
            files += not in_git
    return size / (1024 * 1024), files


def clone_repository(repo_url: str):
    if not repo_url or not repo_url.strip():
        raise HTTPException(status_code=400, detail="Repository URL is required.")

    clean_url = repo_url.strip()
    match = GITHUB_REPO_URL.fullmatch(clean_url)
    if not match or match.group(1) in (".", ".."):
        raise HTTPException(status_code=400, detail="Only public GitHub repository URLs are supported, like https://github.com/owner/repo.")
    repo_name = match.group(1)

    os.makedirs(REPOS_DIR, exist_ok=True)
    destination = os.path.join(REPOS_DIR, repo_name)

    if os.path.exists(destination):
        return {
            "message": "Repository already exists",
            "path": destination,
            "repo_name": repo_name
        }

    if sum(os.path.isdir(os.path.join(REPOS_DIR, d)) for d in os.listdir(REPOS_DIR)) >= MAX_REPOS:
        raise HTTPException(status_code=409, detail=f"The repository limit ({MAX_REPOS}) is reached. Remove a repository before adding another.")

    try:
        # Shallow, no submodules, never prompt for credentials (a private or missing repo fails at once).
        subprocess.run(
            ["git", "clone", "--depth", "1", "--no-recurse-submodules", "--", clean_url, destination],
            check=True, capture_output=True, text=True, timeout=CLONE_TIMEOUT_S,
            env={**os.environ, "GIT_TERMINAL_PROMPT": "0"},
        )
    except subprocess.TimeoutExpired:
        shutil.rmtree(destination, ignore_errors=True)
        raise HTTPException(status_code=413, detail=f"Cloning took longer than {CLONE_TIMEOUT_S:g}s, so it was stopped. The repository is probably too large.")
    except subprocess.CalledProcessError as e:
        logger.warning("Clone failed for %s: %s", clean_url, (e.stderr or "").strip()[-500:])
        shutil.rmtree(destination, ignore_errors=True)  # a partial folder would be reused later without re-cloning
        raise HTTPException(status_code=400, detail="Couldn't clone this repository. Check that it's a public GitHub URL and try again.")
    except Exception as e:
        logger.error("Clone failed for %s: %r", clean_url, e)
        shutil.rmtree(destination, ignore_errors=True)
        raise HTTPException(status_code=500, detail="Failed to clone repository.")

    # shortcut: size is checked after the clone, so a huge repo can fill disk for up to CLONE_TIMEOUT_S before it is
    # deleted; ask the GitHub API for the repo size first if disk space is tight.
    size_mb, files = _clone_usage(destination)
    if size_mb > MAX_REPO_MB or files > MAX_FILES:
        shutil.rmtree(destination, ignore_errors=True)
        raise HTTPException(status_code=413, detail=f"This repository is too large to index ({files} files, {size_mb:.1f} MB). The limits are {MAX_FILES} files and {MAX_REPO_MB:g} MB.")

    return {
        "message": "Repository cloned successfully",
        "path": destination,
        "repo_name": repo_name
    }
