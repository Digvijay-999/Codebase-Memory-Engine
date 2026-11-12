# OpenRouter Integration

ContextForge relies on OpenRouter as its LLM (Large Language Model) gateway. 

## Why OpenRouter?
Instead of hardcoding the application to OpenAI or Anthropic, OpenRouter provides a unified API endpoint that routes requests to dozens of different models based on a string identifier. This prevents vendor lock-in and allows developers to swap between models (e.g., `openai/gpt-4o-mini`, `anthropic/claude-3-haiku`, `meta-llama/llama-3-8b-instruct`) simply by changing a configuration variable.

## Configuration & Environment Variables
The integration requires a single environment variable set in `backend/.env`:
```env
OPENROUTER_API_KEY=sk-or-v1-...
```
The model is currently hardcoded in `llm_service.py` (e.g., `openai/gpt-4o-mini`), but can easily be extracted to an environment variable in the future.

## How Requests are Sent
Requests are made asynchronously using the `httpx` Python library. 
The endpoint hit is `https://openrouter.ai/api/v1/chat/completions`.

### Prompt Structure
ContextForge heavily utilizes "System Prompts" to enforce strict behavior. 
A typical payload looks like this:

```json
{
  "model": "openai/gpt-4o-mini",
  "messages": [
    {
      "role": "system",
      "content": "You are a senior software architect. Analyze the provided codebase. Answer ONLY using the provided context. If the context is insufficient, explicitly state 'Not enough information' instead of hallucinating."
    },
    {
      "role": "user",
      "content": "CONTEXT:\n[Inject Code Here]\n\nQUESTION: Where is the router defined?"
    }
  ]
}
```

## Error Handling & Timeouts
LLM generation can be slow, especially for "Category B" whole-repository analysis tasks.
- **Timeouts:** HTTPX requests to OpenRouter are wrapped in explicit timeouts (e.g., 60 seconds for chat, up to 120 seconds for full architecture analysis) to prevent the backend from hanging indefinitely.
- **Failure Modes:** If OpenRouter times out, rate limits the request, or the API key is missing, `llm_service.py` intercepts the exception and raises an `HTTPException`. The FastAPI router returns a clean JSON error, which the React frontend parses and displays in the Chat UI as a warning toast or message.

> [!WARNING]
> **Interview Tip:** Always mention that LLM calls are **I/O bound** operations. This is exactly why `async/await` and `httpx` (an async HTTP client) are used in FastAPI instead of the synchronous `requests` library. It prevents the FastAPI server from blocking the main thread while waiting 30 seconds for OpenRouter to reply.
