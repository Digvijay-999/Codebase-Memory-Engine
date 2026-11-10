import os
import logging
import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from routers.repo_router import router
from services.llm_service import (
    OpenRouterRetryException,
    OpenRouterTimeoutException,
    OpenRouterRateLimitException,
    OpenRouterConfigException,
    close_openai_client
)
from services.embedding_service import warmup_model, collection
from config.settings import ALLOWED_ORIGINS, HOST, PORT

# Root handler stays at WARNING (quiet third-party libs); only our packages log INFO ([PERF] lines).
# Uvicorn's loggers don't propagate to root, so its lines are not duplicated.
logging.basicConfig(format="%(levelname)s:     %(name)s - %(message)s")
for _name in ("routers", "services"):
    logging.getLogger(_name).setLevel(logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Pre-warm ML model and ChromaDB client
    try:
        warmup_model()
    except Exception as e:
        print(f"Warning during model warmup: {e}")
    yield
    # Shutdown logic: cleanly close persistent HTTP connection pool
    try:
        await close_openai_client()
    except Exception as e:
        print(f"Warning during client shutdown: {e}")


app = FastAPI(
    title="ContextForge API",
    description="AI-powered Codebase Memory Engine",
    version="1.0.0",
    lifespan=lifespan
)


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "ContextForge Backend",
        "chroma_collection_documents": collection.count(),
    }


@app.exception_handler(OpenRouterTimeoutException)
async def openrouter_timeout_exception_handler(request: Request, exc: OpenRouterTimeoutException):
    return JSONResponse(
        status_code=504,
        content={"success": False, "error": str(exc), "detail": str(exc)}
    )


@app.exception_handler(OpenRouterRateLimitException)
async def openrouter_ratelimit_exception_handler(request: Request, exc: OpenRouterRateLimitException):
    return JSONResponse(
        status_code=429,
        content={"success": False, "error": str(exc), "detail": str(exc)}
    )


@app.exception_handler(OpenRouterRetryException)
async def openrouter_retry_exception_handler(request: Request, exc: OpenRouterRetryException):
    return JSONResponse(
        status_code=503,
        content={"success": False, "error": str(exc), "detail": str(exc)}
    )


@app.exception_handler(OpenRouterConfigException)
async def openrouter_config_exception_handler(request: Request, exc: OpenRouterConfigException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "error": exc.message, "detail": exc.message}
    )


# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS if "*" not in ALLOWED_ORIGINS else ["*"],
    allow_credentials=True if "*" not in ALLOWED_ORIGINS else False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

if __name__ == "__main__":
    uvicorn.run("main:app", host=HOST, port=PORT, reload=False)