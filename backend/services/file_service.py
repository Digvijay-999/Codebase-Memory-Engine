import os
import logging
from config.settings import MAX_FILE_SIZE_BYTES

logger = logging.getLogger(__name__)

SUPPORTED_EXTENSIONS = {
    ".py",
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".java",
    ".cpp",
    ".c",
    ".cs",
    ".go",
    ".rs",
    ".html",
    ".css",
    ".json",
    ".md",
    ".sql",
    ".toml",
    ".yaml",
    ".yml",
    ".txt",
}

IGNORED_DIRS = {
    ".git",
    "node_modules",
    "__pycache__",
    "venv",
    ".venv",
    "dist",
    "build",
    ".next",
    ".nuxt",
    ".turbo",
    ".cache",
    "repos",
    "chroma_db",
    ".gemini",
    ".agents",
    ".vscode",
    ".idea",
    ".system_generated",
    "coverage",
}

IGNORED_FILES = {
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml",
    "poetry.lock",
    "Cargo.lock",
    "composer.lock",
    "Gemfile.lock",
}

IGNORED_SUFFIXES = (
    ".min.js",
    ".min.css",
    ".bundle.js",
    ".map",
)


def scan_repository(repo_path: str):
    files = []

    if not os.path.exists(repo_path):
        return files

    for root, dirs, filenames in os.walk(repo_path):

        # Skip unwanted directories in place
        dirs[:] = [d for d in dirs if d not in IGNORED_DIRS and not d.startswith(".")]

        for filename in filenames:

            if filename in IGNORED_FILES or filename.startswith("."):
                continue

            if any(filename.endswith(suffix) for suffix in IGNORED_SUFFIXES):
                continue

            extension = os.path.splitext(filename)[1].lower()

            if extension in SUPPORTED_EXTENSIONS:

                full_path = os.path.join(root, filename)

                try:
                    # Skip oversized files to protect memory and vector database limits
                    file_size = os.path.getsize(full_path)
                    if file_size > MAX_FILE_SIZE_BYTES or file_size == 0:
                        continue
                except OSError:
                    continue

                relative_path = os.path.relpath(
                    full_path,
                    repo_path
                )

                files.append(relative_path)

    return files