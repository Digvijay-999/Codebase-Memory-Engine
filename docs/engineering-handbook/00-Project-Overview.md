# Project Overview

## Problem Statement
Modern software engineering requires navigating massive, poorly documented codebases. Onboarding onto a new project or jumping back into an old one often involves hours of reading through files, trying to understand how different modules interact, or simply finding where a specific feature is implemented. Traditional search tools (like `grep` or IDE search) are exact-match or regex-based, meaning if you don't know the exact variable name or term used, you're out of luck. 

## Why ContextForge Exists
ContextForge was built to solve this problem by providing an "AI-powered Codebase Memory Engine." It ingests an entire repository, understands the semantic meaning behind the code, and allows developers to ask natural language questions about it. Instead of searching for "def authenticate_user", a developer can simply ask, "How is authentication handled in this project?" and ContextForge will locate the relevant code and explain it.

## Features
- **Intelligent Repository Indexing:** Clones a GitHub repository, scans the files, chunks the content, and generates vector embeddings.
- **Semantic Search:** Finds relevant code snippets based on the *meaning* of a query, not just exact keyword matches.
- **AI Chat Interface:** A conversational interface where users can ask questions about their codebase.
- **Whole-Repository Analysis:** Specialized tools to trace API flows, find dead code, review security, and analyze architecture by feeding entire codebase contexts to the AI.
- **Automated Documentation:** One-click generation of comprehensive architecture reports and README files, exportable to Markdown.
- **Repository Isolation:** Safely manages multiple repositories, ensuring that context from one project never leaks into queries about another.

## Tech Stack
ContextForge is a modern full-stack application leveraging the following technologies:
- **Frontend:** React (powered by Vite), styled with TailwindCSS, and animated using Framer Motion. 
- **Backend:** FastAPI (Python), providing high-performance asynchronous API endpoints.
- **Vector Database:** ChromaDB, an open-source embedding database optimized for AI workloads.
- **Embeddings:** Sentence Transformers (via HuggingFace's `all-MiniLM-L6-v2` model) for generating fast, local vector embeddings.
- **LLM Provider:** OpenRouter, serving as a unified gateway to access powerful LLMs (like OpenAI, Anthropic, or Meta models) without locking into a single vendor.

## High-Level Request Flow
Let's walk through how ContextForge works in beginner-friendly terms.

1. **Ingestion (Reading the Code):** 
   When you provide a GitHub URL, the Backend clones the code to your local machine. It reads every important file, ignoring binaries and hidden folders.
2. **Chunking (Breaking it down):** 
   Since AI models can only read a certain amount of text at once, the Backend chops the files into smaller, readable pieces called "chunks".
3. **Embedding (Translating to Math):** 
   The Backend uses a mathematical model to convert these chunks into arrays of numbers (vectors). Code that does similar things will have numbers that are mathematically closer together.
4. **Storage (Saving for Later):** 
   These vectors, along with the original code chunks, are saved in ChromaDB.
5. **Retrieval (Asking a Question):** 
   When you ask "Where is the database connection?", your question is also turned into a vector. ChromaDB finds the code chunks with the most similar vectors.
6. **Generation (The AI Answer):** 
   The retrieved code chunks are combined with your original question and sent to OpenRouter (the AI). The AI reads the provided code chunks and generates a human-readable, helpful answer, which is sent back to your screen.

> [!TIP]
> **Interview Tip:** The process described above (Steps 5 and 6) is known as **Retrieval-Augmented Generation (RAG)**. You retrieve information from a database, augment the user's prompt with that information, and generate a response.
