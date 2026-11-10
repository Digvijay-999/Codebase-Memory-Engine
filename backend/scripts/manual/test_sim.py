import os
import sys
sys.path.append(os.path.abspath('.'))
from sentence_transformers import SentenceTransformer, util

model = SentenceTransformer("all-MiniLM-L6-v2")

query = "What is this repository about?"
query_emb = model.encode(query)

chunk1 = """ing

See our [detailed contributing documentation][contrib] for many ways to
contribute, including reporting issues, requesting features, asking or answering
questions, and making PRs.

[contrib]: htt"""

chunk2 = """<div align="center"><img src="https://raw.githubusercontent.com/pallets/flask/refs/heads/stable/docs/_static/flask-name.svg" alt="" height="150"></div>

# Flask

Flask is a lightweight [WSGI] web appl"""

chunk2_with_file = "File: README.md\n\n" + chunk2

chunk1_emb = model.encode(chunk1)
chunk2_emb = model.encode(chunk2)
chunk2_file_emb = model.encode(chunk2_with_file)

print("Chunk 1 (Contributing):", util.cos_sim(query_emb, chunk1_emb).item())
print("Chunk 2 (Intro):", util.cos_sim(query_emb, chunk2_emb).item())
print("Chunk 2 with File Name:", util.cos_sim(query_emb, chunk2_file_emb).item())
