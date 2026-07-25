from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from routers.repo_router import router
from services.llm_service import OpenRouterRetryException, OpenRouterConfigException

app = FastAPI()

@app.exception_handler(OpenRouterRetryException)
async def openrouter_retry_exception_handler(request: Request, exc: OpenRouterRetryException):
    return JSONResponse(
        status_code=503,
        content={"success": False, "error": str(exc)}
    )

@app.exception_handler(OpenRouterConfigException)
async def openrouter_config_exception_handler(request: Request, exc: OpenRouterConfigException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "error": exc.message}
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)