from pydantic import BaseModel

class AskRequest(BaseModel):
    question: str
    repo_name: str