"""Self-check (no network, no LLM quota): the total LLM deadline returns a 504 on time and cancels the
in-flight upstream call. Run from backend/: python test_llm_deadline.py"""
import time

import anyio
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.testclient import TestClient

import services.llm_service as llm

cancelled = []


async def slow_upstream(prompt, timeout, *_):
    try:
        await anyio.sleep(30)  # stands in for a slow OpenRouter call
    finally:
        cancelled.append(True)  # runs when the deadline cancels the call


llm._call_openrouter = slow_upstream
llm.LLM_TOTAL_TIMEOUT_S = 1.0

app = FastAPI()


@app.exception_handler(llm.OpenRouterTimeoutException)  # same mapping as main.py
async def timeout_handler(request: Request, exc: llm.OpenRouterTimeoutException):
    return JSONResponse(status_code=504, content={"success": False, "error": str(exc), "detail": str(exc)})


@app.get("/slow")
def slow():  # sync like the real endpoints, so it runs in an AnyIO worker thread
    return {"answer": llm.call_openrouter_with_backoff("prompt", timeout=85.0)}


start = time.perf_counter()
res = TestClient(app).get("/slow")
elapsed = time.perf_counter() - start
assert res.status_code == 504, res.text
assert "within 1s" in res.json()["detail"], res.text
assert elapsed < 3.0, f"deadline not enforced: {elapsed:.2f}s"
assert cancelled, "upstream call was not cancelled"
print(f"OK 504 after {elapsed:.2f}s, upstream cancelled: {res.json()['detail']}")
