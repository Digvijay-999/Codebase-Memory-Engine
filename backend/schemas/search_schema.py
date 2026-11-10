from typing import Annotated
from pydantic import BaseModel, StringConstraints


class SearchRequest(BaseModel):
    # Whitespace is stripped first, so whitespace-only text fails min_length.
    query: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=4000)]
    repo_name: str
