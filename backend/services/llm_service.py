import os
from dotenv import load_dotenv
import openai
from fastapi import HTTPException

load_dotenv()

client = openai.OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
)

OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "google/gemini-2.5-flash:free")

import time
import logging

logger = logging.getLogger(__name__)

class OpenRouterRetryException(Exception):
    pass

class OpenRouterConfigException(Exception):
    def __init__(self, message: str, status_code: int):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)

def call_openrouter_with_backoff(prompt: str, timeout: float = 60.0):
    max_retries = 3
    backoff_times = [1, 2, 4]
    
    for attempt in range(max_retries + 1):
        try:
            response = client.chat.completions.create(
                model=OPENROUTER_MODEL,
                messages=[{"role": "user", "content": prompt}],
                timeout=timeout
            )
            return response.choices[0].message.content
        except (openai.RateLimitError, openai.APITimeoutError, openai.APIConnectionError, openai.InternalServerError) as e:
            if attempt < max_retries:
                sleep_time = backoff_times[attempt]
                logger.warning(f"OpenRouter API error ({type(e).__name__}): {str(e)}. Retrying in {sleep_time} seconds... (Attempt {attempt + 1}/{max_retries})")
                time.sleep(sleep_time)
            else:
                logger.error(f"OpenRouter API error ({type(e).__name__}): Max retries exceeded.")
                raise OpenRouterRetryException("The AI model is currently busy. Please try again in a few moments.")
        except openai.AuthenticationError:
            raise OpenRouterConfigException("OpenRouter API Key is missing or invalid.", 401)
        except openai.NotFoundError:
            raise OpenRouterConfigException("The specified OpenRouter model is unavailable.", 404)
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
    return call_openrouter_with_backoff(full_prompt, timeout=120.0)


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

    return call_openrouter_with_backoff(prompt, timeout=120.0)


def generate_readme(context: str):

    prompt = f"""
You are an expert software engineer.

Generate a professional GitHub README.md for this repository.

Include:

# Project Name

## Overview

## Features

## Tech Stack

## Installation

## Usage

## Folder Structure

## Contributing

Repository Context:

{context}
"""

    return call_openrouter_with_backoff(prompt, timeout=120.0)
