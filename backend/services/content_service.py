import os


def read_repository(repo_path: str, files: list):
    documents = []

    for file in files:
        full_path = os.path.join(repo_path, file)

        try:
            with open(full_path, "r", encoding="utf-8") as f:
                content = f.read()

            documents.append({
                "file": file,
                "content": content
            })

        except Exception:
            continue

    return documents


IMPORTANT_FILES = {
    "README.md",
    "package.json",
    "requirements.txt",
    "pyproject.toml",
    "main.py",
    "app.py",
    "index.js",
    "index.ts",
}


def get_repository_context(documents):
    context = []

    # Add important files first
    for doc in documents:
        filename = doc["file"].split("/")[-1]

        if filename in IMPORTANT_FILES:
            context.append(doc["content"])

    # Add a few additional files for context
    for doc in documents[:10]:
        context.append(doc["content"])

    return "\n\n".join(context)
