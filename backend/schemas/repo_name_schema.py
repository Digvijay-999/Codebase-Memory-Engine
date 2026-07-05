from pydantic import BaseModel

class RepoNameRequest(BaseModel):
    repo_name: str