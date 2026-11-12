# ContextForge

**Live demo:** https://contextforge-dig.indiasouthcentral.cloudapp.azure.com

ContextForge is an AI codebase memory engine. It indexes a Git repository so you can explore its code with repository-scoped semantic search, ask questions about implementation details, and generate architecture notes or a README.

## What it does

- Clones and indexes repositories as code chunks with file and repository metadata.
- Retrieves relevant code with semantic search and uses it as context for AI chat and explanations.
- Generates architecture and README documentation.
- Keeps each repository's indexed chunks isolated in ChromaDB.

## Stack

- **Frontend:** React, Vite, Tailwind CSS
- **API:** FastAPI
- **Embeddings:** all-MiniLM-L6-v2 with Tokenizers and ONNX Runtime on CPU
- **Vector storage:** ChromaDB
- **LLM requests:** OpenRouter

## Run with Docker Compose

Prerequisites: Docker with the Compose plugin and Git.

```bash
git clone https://github.com/Digvijay-999/Codebase-Memory-Engine.git
cd Codebase-Memory-Engine
```

For chat and AI-generated documentation, add an OpenRouter API key to a root `.env` file:

```env
OPENROUTER_API_KEY=your_openrouter_api_key
```

Build and start the app:

```bash
docker compose up --build
```

Open the frontend at [http://localhost:3000](http://localhost:3000). The API is available at [http://localhost:8000](http://localhost:8000), with its health endpoint at `/health`.

The backend image downloads the all-MiniLM-L6-v2 ONNX model during its build. Docker Compose stores the ChromaDB index and cloned repositories in named volumes so they persist across container restarts.

To stop the app, run `docker compose down`. To also delete the stored index and cloned repositories, use `docker compose down -v`.

## Deployment

[DEPLOY.md](DEPLOY.md) covers production on one Docker host. Caddy serves HTTPS with automatic Let's Encrypt certificates and HSTS in front of nginx and the API. The guide includes firewall setup, backups and restores, and building images on your own machine for a 1 GB VM. The live demo runs on a 1 GB Azure VM.

## Local development

Use Python 3.10+ and Node.js 18+.

```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
source venv/bin/activate
pip install -r requirements.txt
```

Set `OPENROUTER_API_KEY` in `backend/.env` if you want to use chat and AI documentation. The backend also needs the ONNX model and tokenizer files under `backend/models/all-MiniLM-L6-v2` (the Docker build fetches the model file automatically).

Start the API from `backend/`:

```bash
uvicorn main:app --reload
```

In another terminal, start the frontend:

```bash
cd frontend
npm install
npm run dev
```

## Current limitations

ContextForge is an evolving project. It does not currently include user authentication or built-in rate limiting, and its indexing and API workload is designed for a single application instance.