from typing import Annotated
from pydantic import BaseModel, Field, StringConstraints


class SearchRequest(BaseModel):
    # Whitespace is stripped first, so whitespace-only text fails min_length.
    query: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=4000)]
    repo_name: str
    # Optional; the eval script asks for 10. Unset uses TOP_K_RESULTS (what /ask retrieves).
    top_k: Annotated[int, Field(ge=1, le=20)] | None = None
