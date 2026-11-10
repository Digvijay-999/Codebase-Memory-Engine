from pathlib import Path
import os
import re
from dotenv import load_dotenv
import openai
from fastapi import HTTPException

env_path = Path(__file__).resolve().parent.parent / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

import time
import logging
import anyio
import httpx
from typing import Optional, Dict, Any
from config.settings import LLM_TOTAL_TIMEOUT_S, OPENROUTER_MODEL, OPENROUTER_FALLBACK_MODELS

logger = logging.getLogger(__name__)

_client: Optional[openai.AsyncOpenAI] = None
_client_api_key: Optional[str] = None
_last_llm_metrics: Dict[str, Any] = {"elapsed_s": 0.0, "prompt_chars": 0, "output_chars": 0}

class OpenRouterRetryException(Exception):
    pass

class OpenRouterTimeoutException(OpenRouterRetryException):
    pass

class OpenRouterRateLimitException(OpenRouterRetryException):
    pass

class OpenRouterConfigException(Exception):
    def __init__(self, message: str, status_code: int):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)

def get_last_llm_metrics() -> Dict[str, Any]:
    return dict(_last_llm_metrics)

async def close_openai_client() -> None:
    global _client, _client_api_key
    if _client is not None:
        try:
            await _client.close()
        except Exception as e:
            logger.warning(f"Error closing persistent OpenAI client: {e}")
        finally:
            _client = None
            _client_api_key = None

def get_openai_client() -> openai.AsyncOpenAI:
    global _client, _client_api_key
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise OpenRouterConfigException("OPENROUTER_API_KEY is missing. Please configure it in your environment.", 401)

    if _client is None or _client_api_key != api_key:
        http_client = httpx.AsyncClient(
            timeout=httpx.Timeout(connect=10.0, read=95.0, write=10.0, pool=10.0),
            limits=httpx.Limits(max_keepalive_connections=10, max_connections=20, keepalive_expiry=60.0),
        )
        _client = openai.AsyncOpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=api_key,
            http_client=http_client,
            max_retries=0,
        )
        _client_api_key = api_key
    return _client

def call_openrouter_with_backoff(prompt: str, timeout: float = 60.0) -> str:
    # One total deadline over every attempt, backoff sleep and OpenRouter fallback. Endpoints are sync and run in
    # AnyIO worker threads, so the call runs on the app's event loop; hitting the deadline cancels it and closes the
    # upstream connection. LLM_TOTAL_TIMEOUT_S can only shorten the per-endpoint caps (60s ask, 85s whole-repo).
    deadline = min(timeout, LLM_TOTAL_TIMEOUT_S)
    start_time = time.perf_counter()

    async def _with_deadline() -> str:
        with anyio.fail_after(deadline):
            return await _call_openrouter(prompt, timeout)

    try:
        return anyio.from_thread.run(_with_deadline)
    except TimeoutError:
        logger.error(f"[PERF] OpenRouter total deadline hit after {time.perf_counter() - start_time:.2f}s (deadline={deadline:.0f}s); upstream request cancelled")
        raise OpenRouterTimeoutException(f"The AI model didn't finish within {deadline:.0f}s, so the request was stopped. Please try again.")


async def _call_openrouter(prompt: str, timeout: float) -> str:
    global _last_llm_metrics
    client = get_openai_client()
    model_name = os.getenv("OPENROUTER_MODEL", OPENROUTER_MODEL)
    # Optional OpenRouter fallback list (tried in order if the primary errors); keep it to :free ids to stay unbilled.
    fallbacks = [m.strip() for m in os.getenv("OPENROUTER_FALLBACK_MODELS", OPENROUTER_FALLBACK_MODELS).split(",") if m.strip()]
    extra = {"extra_body": {"models": [model_name, *fallbacks]}} if fallbacks else {}
    max_retries = 1
    backoff_times = [2.0]

    start_time = time.perf_counter()
    for attempt in range(max_retries + 1):
        try:
            response = await client.chat.completions.create(
                model=model_name,
                messages=[{"role": "user", "content": prompt}],
                timeout=timeout,
                **extra
            )
            elapsed = time.perf_counter() - start_time
            content = response.choices[0].message.content or ""
            _last_llm_metrics = {
                "elapsed_s": elapsed,
                "prompt_chars": len(prompt),
                "output_chars": len(content),
                "model": model_name
            }
            logger.info(f"[PERF] OpenRouter completed: model={getattr(response, 'model', None) or model_name} prompt_chars={len(prompt)} output_chars={len(content)} elapsed={elapsed:.2f}s")
            return content
        except openai.APITimeoutError as e:
            elapsed = time.perf_counter() - start_time
            logger.error(f"[PERF] OpenRouter API timeout after {elapsed:.2f}s (timeout={timeout}s): {e}")
            raise OpenRouterTimeoutException(f"The AI model request timed out after {timeout:.0f}s waiting for OpenRouter. Please try again.")
        except openai.RateLimitError as e:
            elapsed = time.perf_counter() - start_time
            if attempt < max_retries and elapsed < 15.0:
                sleep_time = backoff_times[attempt]
                logger.warning(f"OpenRouter transient rate limit: {str(e)}. Retrying in {sleep_time}s... (Attempt {attempt + 1}/{max_retries})")
                await anyio.sleep(sleep_time)
            else:
                logger.error("OpenRouter API error (RateLimitError): Max retries exceeded.")
                raise OpenRouterRateLimitException("The AI model is currently busy or rate-limited. Please try again in a few moments.")
        except openai.InternalServerError as e:
            elapsed = time.perf_counter() - start_time
            if attempt < max_retries and elapsed < 15.0:
                sleep_time = backoff_times[attempt]
                logger.warning(f"OpenRouter transient 5xx: {str(e)}. Retrying in {sleep_time}s... (Attempt {attempt + 1}/{max_retries})")
                await anyio.sleep(sleep_time)
            else:
                logger.error("OpenRouter API error (InternalServerError): Max retries exceeded.")
                raise OpenRouterRetryException("The AI model provider is currently experiencing issues. Please try again.")
        except openai.APIConnectionError as e:
            elapsed = time.perf_counter() - start_time
            if attempt < max_retries and elapsed < 15.0:
                logger.warning(f"OpenRouter connection error: {e}. Retrying in 1s...")
                await anyio.sleep(1.0)
            else:
                raise OpenRouterRetryException("Unable to connect to OpenRouter. Please check network connectivity.")
        except openai.AuthenticationError:
            raise OpenRouterConfigException("OpenRouter API Key is missing or invalid.", 401)
        except openai.NotFoundError:
            raise OpenRouterConfigException(f"The specified OpenRouter model '{model_name}' is unavailable.", 404)
        except Exception as e:
            raise OpenRouterConfigException(f"An unexpected error occurred: {str(e)}", 500)

def ask_llm(question: str, context: str):

    prompt = f"""
You are an expert software engineer.

Answer ONLY using the provided repository context.

If the answer is not in the context, say:
"I couldn't find that in the repository."

Repository Context:

{context}

Question:

{question}
"""

    return call_openrouter_with_backoff(prompt, timeout=60.0)


def analyze_repository(prompt: str, context: str):
    full_prompt = f"""
You are an expert software engineer performing a comprehensive repository analysis.

Repository Context:
{context}

Task:
{prompt}

Answer ONLY using the provided repository context. Do not invent findings.
If evidence is insufficient even after reading the repository, clearly explain why.
"""
    return call_openrouter_with_backoff(full_prompt, timeout=85.0)


def explain_repository(context: str, metadata_json: str = None):
    
    prompt = f"""
You are a senior Staff Software Engineer writing engineering documentation.

Write a professional Architecture Report.

Never mention AI.

Never say "Based on the provided context."

Never say "According to the repository."

Write confidently.

Use engineering terminology.

Structure the report exactly as follows.

# Executive Summary

# Repository Overview

# Repository Statistics

# Technology Stack

# Directory Structure

# System Architecture

# Core Components

# API Layer

# Business Logic

# Storage Layer

# AI Pipeline

# Request Lifecycle

# Data Flow

# Important Files

# Design Patterns

# Strengths

# Risks

# Technical Debt

# Recommendations

# Conclusion

Rules

1. Use proper Markdown headings.

2. Use Markdown tables.

3. Use numbered lists.

4. For architecture flows use fenced code blocks:

```text
Client
   │
   ▼
FastAPI
   ▼
Repository Service
   ▼
Chunk Service
   ▼
Embedding Service
   ▼
ChromaDB
   ▼
Gemini
```

- Explain WHY components exist.

- Explain HOW components interact.

- Mention important implementation decisions.

- Mention architectural trade-offs.

- Mention scalability considerations.

- Mention maintainability.

Do not hallucinate.

Do not invent technologies.

Everything must come from the repository metadata or supplied context.

Never output diagrams made from
+----
|----
-----

Those do not render correctly in React Markdown.

Prefer readable flow descriptions over ASCII art.

Return only Markdown.

Repository Metadata (JSON):
{metadata_json}

Repository Context:
{context}
"""

    return call_openrouter_with_backoff(prompt, timeout=85.0)


def _normalize_readme_output(content: str, repo_url: str = "") -> str:
    if not content:
        return ""

    text = content.strip()

    # Strip only accidental outer code fences wrapping the entire output
    lines = text.splitlines()
    if len(lines) >= 2:
        first_line = lines[0].strip()
        last_line = lines[-1].strip()
        if first_line in ("```markdown", "```md", "```") and last_line == "```":
            text = "\n".join(lines[1:-1]).strip()

    # Clean any localhost URLs pointing to files
    if repo_url:
        clean_repo_url = repo_url.rstrip("/")
        text = re.sub(
            r"https?://(?:localhost|127\.0\.0\.1)(?::\d+)?/([A-Za-z0-9_\-\./]+)",
            lambda m: f"{clean_repo_url}/blob/HEAD/{m.group(1)}",
            text
        )
    else:
        text = re.sub(
            r"https?://(?:localhost|127\.0\.0\.1)(?::\d+)?/([A-Za-z0-9_\-\./]+)",
            r"\1",
            text
        )

    return text


def generate_readme(context: str, repo_name: str = "", repo_url: str = ""):
    repo_info = ""
    if repo_name:
        repo_info += f"\nRepository Name: {repo_name}"
    if repo_url:
        repo_info += f"\nRepository Source URL: {repo_url}"

    url_instruction = (
        f"For links to files in the repository (e.g. LICENSE or documentation), use the source repository URL ({repo_url}/blob/HEAD/<file>) or clean repository-relative paths (e.g. LICENSE.txt). NEVER generate localhost URLs (e.g. http://localhost:5173 or http://localhost:8000)."
        if repo_url
        else "For links to files in the repository, use clean relative paths (e.g. LICENSE.txt). NEVER generate localhost URLs."
    )

    prompt = f"""You are an expert software engineer.

Generate a professional GitHub README.md for this repository.{repo_info}

CRITICAL INSTRUCTIONS:
- Return the Markdown content directly.
- NEVER wrap the entire README in an outer code fence (do not start with ```markdown or ```).
- Legitimate code blocks inside sections (e.g. installation/usage commands) MUST still use normal fenced code blocks with appropriate language tags.
- Use standard Markdown images (![Alt](url)) instead of raw HTML <div>/<img> tags where possible.
- {url_instruction}

Include:

# {repo_name if repo_name else 'Project Name'}

## Overview

## Features

## Tech Stack

## Installation

## Usage

## Folder Structure

## Contributing

## License

Repository Context:

{context}
"""

    raw_readme = call_openrouter_with_backoff(prompt, timeout=85.0)
    return _normalize_readme_output(raw_readme, repo_url=repo_url)
