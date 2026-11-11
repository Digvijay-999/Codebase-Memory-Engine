import os
import re
import shutil
import logging
import tempfile
import threading
import subprocess
from fastapi import HTTPException
from config.settings import REPOS_DIR, CLONE_TIMEOUT_S, MAX_REPO_MB, MAX_FILES, MAX_REPOS

logger = logging.getLogger(__name__)

# Public GitHub repos over HTTPS only: no other hosts or IPs, ports, credentials, file:// or ssh/git@ URLs.
GITHUB_REPO_URL = re.compile(r"https://github\.com/[A-Za-z0-9][A-Za-z0-9-]{0,38}/([A-Za-z0-9._-]{1,100}?)(?:\.git)?/?")
# Clones run in REPOS_DIR/~clone-<name>-* and are renamed into place; "~" never appears in a GitHub repo name.
# shortcut: a crash mid-clone leaves a ~clone-* folder behind (hidden from /repos); delete it by hand.
TMP_PREFIX = "~clone-"
_cloning: set = set()  # repo names being cloned right now
_cloning_lock = threading.Lock()


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

    with _cloning_lock:
        if repo_name in _cloning:
            raise HTTPException(status_code=409, detail="This repository is already being cloned. Please try again in a minute.")
        _cloning.add(repo_name)
    tmp = None
    try:
        repos = [d for d in os.listdir(REPOS_DIR) if os.path.isdir(os.path.join(REPOS_DIR, d)) and not d.startswith(TMP_PREFIX)]
        if len(repos) >= MAX_REPOS:
            raise HTTPException(status_code=409, detail=f"The repository limit ({MAX_REPOS}) is reached. Remove a repository before adding another.")

        # Clone into a temp folder on the same volume and rename it into place: a partial clone is never visible as a repo.
        tmp = tempfile.mkdtemp(prefix=f"{TMP_PREFIX}{repo_name}-", dir=REPOS_DIR)
        try:
            # Shallow, no submodules, never prompt for credentials (a private or missing repo fails at once).
            subprocess.run(
                ["git", "clone", "--depth", "1", "--no-recurse-submodules", "--", clean_url, tmp],
                check=True, capture_output=True, text=True, timeout=CLONE_TIMEOUT_S,
                env={**os.environ, "GIT_TERMINAL_PROMPT": "0"},
            )
        except subprocess.TimeoutExpired:
            raise HTTPException(status_code=413, detail=f"Cloning took longer than {CLONE_TIMEOUT_S:g}s, so it was stopped. The repository is probably too large.")
        except subprocess.CalledProcessError as e:
            logger.warning("Clone failed for %s: %s", clean_url, (e.stderr or "").strip()[-500:])
            raise HTTPException(status_code=400, detail="Couldn't clone this repository. Check that it's a public GitHub URL and try again.")

        # shortcut: size is checked after the clone, so a huge repo can fill disk for up to CLONE_TIMEOUT_S before it is
        # deleted; ask the GitHub API for the repo size first if disk space is tight.
        size_mb, files = _clone_usage(tmp)
        if size_mb > MAX_REPO_MB or files > MAX_FILES:
            raise HTTPException(status_code=413, detail=f"This repository is too large to index ({files} files, {size_mb:.1f} MB). The limits are {MAX_FILES} files and {MAX_REPO_MB:g} MB.")
        os.rename(tmp, destination)
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Clone failed for %s: %r", clean_url, e)
        raise HTTPException(status_code=500, detail="Failed to clone repository.")
    finally:
        if tmp and os.path.isdir(tmp):  # every failure path; after a successful rename tmp is gone
            shutil.rmtree(tmp, ignore_errors=True)
        with _cloning_lock:
            _cloning.discard(repo_name)

    return {
        "message": "Repository cloned successfully",
        "path": destination,
        "repo_name": repo_name
    }
