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