import math
import time
from collections import defaultdict, deque
from fastapi import HTTPException, Request

# shortcut: in-memory and per process, so limits reset on restart and are not shared between replicas;
# move to Redis or the proxy if the backend ever runs more than one process.
_hits: dict = defaultdict(deque)  # (bucket, client IP) -> request times inside the window


def rate_limit(bucket: str, limit: int, window_s: float):
    """FastAPI dependency: at most `limit` requests per client IP in any `window_s` seconds for this bucket."""
    async def check(request: Request):  # async, so it runs on the event loop and needs no lock
        now = time.monotonic()
        if len(_hits) > 10_000:  # drop idle clients so memory stays bounded
            for key in [k for k, v in _hits.items() if not v or v[-1] <= now - window_s]:
                del _hits[key]
        hits = _hits[(bucket, request.client.host if request.client else "unknown")]
        while hits and hits[0] <= now - window_s:
            hits.popleft()
        if len(hits) >= limit:
            retry_after = max(1, math.ceil(hits[0] + window_s - now))
            raise HTTPException(
                status_code=429,
                detail=f"Too many requests. Please wait {retry_after}s and try again.",
                headers={"Retry-After": str(retry_after)},
            )
        hits.append(now)
    return check
