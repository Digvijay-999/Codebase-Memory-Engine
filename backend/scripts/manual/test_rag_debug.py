import sys
import os
sys.path.append(os.path.abspath('.'))

from schemas.ask_schema import AskRequest
from routers.repo_router import ask

request1 = AskRequest(repo_name="Flask", question="What is this repository about?")
res1 = ask(request1)
print("Flask Test:")
print("Answer:", res1['answer'][:100], "...")
print("Sources:", res1['sources'])

request2 = AskRequest(repo_name="flask", question="What is this repository about?")
res2 = ask(request2)
print("\nflask Test:")
print("Answer:", res2['answer'][:100], "...")
print("Sources:", res2['sources'])
