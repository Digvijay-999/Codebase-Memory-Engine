# API Specification

Base URL

http://localhost:8000

---

## POST /clone

Clone a GitHub repository.

---

## POST /store/{repo_name}

Generate embeddings and store vectors.

---

## POST /ask

Ask questions about a repository.

Returns:

- AI answer
- Source files

---

## POST /explain

Generate repository overview.

---

## POST /generate-readme

Generate a professional README.

---

## Important

Frontend must use these APIs exactly.

Do not rename endpoints.