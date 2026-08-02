# ContextForge

ContextForge is a robust full-stack application that provides an AI-powered Codebase Memory Engine. It allows users to clone repositories, index their codebase into a vector database, and interact with the code through semantic search, architectural analysis, and AI chat.

## Features
- **Semantic Code Search:** Index and search through codebase using ChromaDB and Sentence Transformers.
- **AI Chat:** Chat with the codebase, ask for explanations, or trace API flows.
- **Architectural Analysis:** Generate comprehensive architecture reports for repositories.
- **Documentation Generation:** Automatically generate documentation and export as Markdown.
- **Repository Isolation:** Handle multiple repositories seamlessly with distinct context isolation.

## Tech Stack
### Frontend
- React (Vite)
- TailwindCSS
- Framer Motion

### Backend
- FastAPI
- ChromaDB
- Sentence Transformers
- OpenRouter

## Prerequisites
- Node.js (v18+)
- Python (3.10+)
- Git

## Installation & Setup

### 1. Clone the repository
```bash
git clone <repository-url>
cd contextforge
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Environment Variables
Create a `.env` file in the `backend/` directory with the following variables:
```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

*(Optional)* Create a `.env` file in the `frontend/` directory to override the API base URL:
```env
VITE_API_URL=http://127.0.0.1:8000
```

### 4. Frontend Setup
```bash
cd frontend
npm install
```

## Running the Application

### Development Mode

**Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload
```

**Frontend:**
```bash
cd frontend
npm run dev
```

### Production Build

**Frontend:**
```bash
cd frontend
npm run build
```
Serve the `dist/` directory using your preferred static web server (e.g., Nginx, Caddy).

**Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000
```

## Known MVP Limitations
- **Authentication:** Currently there is no user authentication or multi-tenant isolation.
- **Rate Limiting:** No built-in rate limiting for API endpoints.
- **Concurrency:** Handling massive concurrent cloning operations is currently limited by the single instance performance.
- **File Limits:** Excludes extremely large or binary files from indexing by default.