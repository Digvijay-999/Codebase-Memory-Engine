# Interview Guide

This guide provides 50+ practical interview questions based entirely on ContextForge. Use this to prepare for technical interviews, focusing on your architectural decisions, problem-solving, and understanding of the tech stack.

## Architecture & System Design

**1. Walk me through ContextForge.**
*Ideal Answer:* ContextForge is an AI-powered codebase memory engine. It consists of a React/Vite frontend and a FastAPI backend. Users provide a GitHub URL, which the backend clones, chunks, and vectorizes using Sentence Transformers, storing the embeddings in ChromaDB. When a user asks a question, we use Semantic Search to retrieve the relevant code chunks and feed them into a Large Language Model via OpenRouter to generate an accurate, context-aware answer.
*Follow-up:* Why didn't you just use OpenAI's embedding API?

**2. Why did you choose FastAPI over Express.js or Django?**
*Ideal Answer:* I chose FastAPI because Python has the best ecosystem for AI and machine learning (HuggingFace, ChromaDB, LangChain). FastAPI specifically provides high performance through asynchronous I/O (`async`/`await`), which is critical because our application spends a lot of time waiting for I/O bound tasks like reading files and waiting for LLM API responses.
*Follow-up:* How does asynchronous I/O work in Python?

**3. Explain the RAG pipeline.**
*Ideal Answer:* RAG stands for Retrieval-Augmented Generation. First, we chunk our source code and convert it to vector embeddings stored in a database. When a user queries the system, we convert their query to a vector, do a similarity search to *retrieve* the most relevant code chunks, *augment* the system prompt with those chunks, and ask the LLM to *generate* an answer based exclusively on that prompt.
*Follow-up:* What happens if the retrieved chunks don't contain the answer?

**4. How do you prevent repository contamination? (Multi-tenancy)**
*Ideal Answer:* We use a single unified ChromaDB collection for all repositories. During the ingestion phase, every vector is tagged with a metadata dictionary containing `{"repo_name": target_repo}`. During semantic search, we apply a hard `where` clause to filter out any vectors that don't match the active repository. This ensures zero data leakage while maintaining the performance of a single collection.
*Follow-up:* Why didn't you just create a new Chroma collection for every repository?

**5. Why use a Vector Database instead of SQL?**
*Ideal Answer:* SQL requires exact keyword matches (`LIKE '%auth%'`). If a user asks about "login", SQL will miss files named `session_handler.py`. Vector databases store the mathematical semantic *meaning* of the code. "Login" and "session handler" are close together in vector space, allowing us to find relevant code based on intent, not just string matching.

**6. Why did you use OpenRouter instead of connecting directly to OpenAI?**
*Ideal Answer:* OpenRouter acts as a unified API gateway. It prevents vendor lock-in. By simply changing a model string (e.g., from `openai/gpt-4o` to `anthropic/claude-3`), we can seamlessly switch between providers based on performance, cost, or feature needs without rewriting any of our API integration logic.

## Frontend & React

**7. Why React?**
*Ideal Answer:* React provides a robust component-based architecture which is perfect for building complex interactive UIs like our chat interface and animated command palettes. I paired it with Vite instead of Create React App for significantly faster hot module replacement (HMR) and optimized production builds.

**8. How do you manage state in the frontend?**
*Ideal Answer:* I deliberately kept state management minimal. Local component state (`useState`) handles UI interactions like loaders and chat histories. For global state (specifically, which repository the user is actively viewing), I used `localStorage`. This removes the overhead of Redux or Zustand for a single piece of global context.

**9. How does the "Export Markdown" feature work without hitting the backend?**
*Ideal Answer:* We already fetch the markdown report via API and store it in React state to render the page. To export, I create a `Blob` of type `text/markdown`, generate a temporary Object URL, attach it to a hidden anchor (`<a>`) tag, simulate a click, and then revoke the URL to prevent memory leaks. It requires zero additional API calls.

**10. How do you handle markdown rendering securely?**
*Ideal Answer:* I use `ReactMarkdown`. It parses the markdown string and safely converts it to React elements rather than dangerously setting inner HTML, mitigating XSS risks. I also pass custom component mappings to style tables, headings, and code blocks using Tailwind.

## Backend & Python

**11. How does the chunking algorithm work?**
*Ideal Answer:* I read the raw file content and split it into blocks of a fixed size (e.g., 500 characters) but include an overlap (e.g., 50 characters). The overlap is crucial because it ensures that a function split across the boundary of two chunks doesn't lose its context.

**12. Why bypass RAG for the "Analyze Architecture" feature?**
*Ideal Answer:* RAG is designed to find specific needles in a haystack. But to generate an architecture report or find dead code, the LLM needs to see the *entire* haystack. For those specific features, we bypass the vector search entirely, concatenate the parsed repository into one massive string, and feed it directly to a long-context LLM.

**13. How do you handle API timeouts?**
*Ideal Answer:* LLMs can take a long time to respond. In FastAPI, the routes are asynchronous, so they don't block the server. I also wrap the external `httpx` calls to OpenRouter in explicit timeouts (e.g., 120 seconds). If it times out, we catch the exception and return a clean HTTP error to the frontend rather than crashing the backend.

## Rapid-Fire Questions

14. How are `.env` files handled?
15. What happens if a user submits an empty GitHub URL?
16. How do you ignore `.git` and `node_modules` during scanning?
17. How is the "Thinking" placeholder animated in React?
18. What CSS framework is used and why? (Tailwind)
19. How do you format code blocks in the chat?
20. Why use local sentence transformers instead of an API for embeddings?
21. What happens if ChromaDB is offline?
22. How are React Router params used?
23. Explain `useEffect` in the context of the Documentation page.
24. How do you handle CORS between React and FastAPI?
25. How do you test this application locally?
26. What happens if you index a repository that is too large?
27. How does the sidebar highlight the active page?
28. Explain the difference between `askQuestion` and `analyzeRepo` endpoints.
29. How is the landing page 3D effect implemented?
30. What is Pydantic and how is it used here?
31. How does `GitPython` or the `git clone` command work in the backend?
32. What happens if a repo is already cloned? Do you overwrite it?
33. Explain how cosine similarity works conceptually.
34. Why is overlapping chunks important?
35. What is the difference between a system prompt and a user prompt?
36. How do you prevent hallucination in the LLM?
37. What happens if the context exceeds the LLM token limit?
38. How is the chat history maintained?
39. How do you clean up temp files?
40. Why Vite over Webpack?
41. How do you deploy a FastAPI app? (Uvicorn / Gunicorn)
42. How do you deploy a Vite app? (Static file hosting)
43. What is framer-motion used for?
44. How do you prevent XSS in the chat input?
45. Why return source files alongside the chat answer?
46. How do you handle network disconnections during cloning?
47. What does the `.gitignore` look like for this project?
48. How do you structure FastAPI projects for scalability?
49. What is a Blob in javascript?
50. How would you explain this project to a non-technical recruiter?
