# PRD — ContextForge: Codebase Memory Engine

## Title

ContextForge — Codebase Memory Engine

## Goal

Provide an AI-driven service to ingest code repositories, index them into a vector database, and enable semantic search, natural-language QA, and architecture/document generation to help developers understand and navigate code.

## Primary Users

- Software Developers
- Engineering Managers
- Security/Compliance Reviewers
- On-call Engineers

## User Problems / Needs

- Quickly find relevant code and explanations across large repos.
- Ask natural-language questions about code, APIs, and architecture.
- Generate architecture reports and README documentation automatically.
- Maintain isolated, per-repository contexts for multi-repo work.

## Core Features (MVP)

- Clone repositories via API (`POST /clone`).
- Scan repositories and list source files (`GET /scan/{repo_name}`).
- Read repository content and return documents (`GET /content/{repo_name}`).
- Chunking and embedding pipeline (character/token chunking → embeddings).
- Persist embeddings and metadata to ChromaDB and provide semantic search (`/store`, `/search`).
- LLM-driven QA and repository analysis via OpenRouter (`/ask`, `/analyze`, `/explain`).
- Generate README and documentation (`/generate-readme`).

## Non-functional Requirements

- Scalability: handle medium-size repos (tens of thousands LOC).
- Latency: search responses targeted under 1–2s (dependent on Chroma & model).
- Reliability: robust LLM retries/backoff and Chroma error handling.
- Security: secrets via environment variables. Currently no auth (MVP limitation).

## Constraints & Assumptions

- ChromaDB persistent client stored under `./chroma_db`.
- Local SentenceTransformer `all-MiniLM-L6-v2` used for embeddings by default.
- OpenRouter API via `OPENROUTER_API_KEY`; key required in `.env`.
- Repositories cloned to local `repos/` directory.

## Success Metrics

- 95% of queries return an answer when context exists.
- Indexing time: <5 minutes for repos <100k LOC (target).
- Top-5 retrieval relevance >80% (evaluated qualitatively).

## Risks

- LLM hallucination when context is insufficient.
- ChromaDB growth and storage management.
- No authentication or rate limiting in current codebase.

## Roadmap (90 days)

1. Add API authentication and rate limiting.
2. Implement background indexing worker and job status API.
3. Replace character chunking with token-aware chunking and improve embedding batching.
4. Add pagination for search and content endpoints.
5. Add monitoring, logging, and CI for tests.

---

(End of PRD)
