import os

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
}

IGNORED_DIRS = {
    ".git",
    "node_modules",
    "__pycache__",
    "venv",
    ".venv",
    "dist",
    "build",
}


def scan_repository(repo_path: str):
    files = []

    for root, dirs, filenames in os.walk(repo_path):

        # Skip unwanted directories
        dirs[:] = [d for d in dirs if d not in IGNORED_DIRS]

        for filename in filenames:

            extension = os.path.splitext(filename)[1]

            if extension in SUPPORTED_EXTENSIONS:

                full_path = os.path.join(root, filename)

                relative_path = os.path.relpath(
                    full_path,
                    repo_path
                )

                files.append(relative_path)

    return files