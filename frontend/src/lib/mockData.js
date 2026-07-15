// Realistic mock data for the ContextForge frontend

export const MOCK_REPOSITORIES = [
  {
    id: "repo-1",
    name: "vercel/next.js",
    status: "indexed",
    lastUpdated: "10 mins ago",
    fileCount: 4210,
    language: "TypeScript"
  },
  {
    id: "repo-2",
    name: "facebook/react",
    status: "indexed",
    lastUpdated: "2 hours ago",
    fileCount: 3105,
    language: "JavaScript"
  },
  {
    id: "repo-3",
    name: "contextforge/core-engine",
    status: "indexing",
    lastUpdated: "Just now",
    fileCount: 154,
    language: "Python"
  }
];

export const MOCK_FILE_TREE = [
  {
    id: "src",
    name: "src",
    type: "folder",
    children: [
      {
        id: "src/components",
        name: "components",
        type: "folder",
        children: [
          { id: "src/components/App.tsx", name: "App.tsx", type: "file" },
          { id: "src/components/Header.tsx", name: "Header.tsx", type: "file" }
        ]
      },
      {
        id: "src/services",
        name: "services",
        type: "folder",
        children: [
          { id: "src/services/api.ts", name: "api.ts", type: "file" },
          { id: "src/services/vectorDb.ts", name: "vectorDb.ts", type: "file" }
        ]
      },
      { id: "src/index.ts", name: "index.ts", type: "file" }
    ]
  },
  { id: "package.json", name: "package.json", type: "file" },
  { id: "README.md", name: "README.md", type: "file" }
];

export const MOCK_CHAT_EXCHANGE = [
  {
    id: "msg-1",
    role: "user",
    content: "Where is the embedding generation pipeline configured, and how does it handle large files?"
  },
  {
    id: "msg-2",
    role: "assistant",
    content: "The embedding generation pipeline is configured in `src/services/vectorDb.ts`. \n\nFor large files, the system uses a semantic chunking strategy that splits documents by AST boundaries (functions, classes) rather than raw token limits. This ensures that context isn't lost mid-function. \n\n```typescript\n// src/services/vectorDb.ts\nexport class VectorService {\n  async chunkAndEmbed(file: ParsedFile) {\n    const chunks = semanticSplitter(file.content, { \n      maxTokens: 512, \n      overlap: 50 \n    });\n    \n    return await embeddingModel.embedBatch(chunks);\n  }\n}\n```",
    citations: [
      { fileId: "src/services/vectorDb.ts", lineStart: 12, lineEnd: 45, text: "VectorDb configuration and chunking strategy" },
      { fileId: "src/services/api.ts", lineStart: 88, lineEnd: 104, text: "API endpoint for ingestion" }
    ]
  }
];

export const MOCK_ARCHITECTURE_REPORT = `
# Architecture Analysis: ContextForge Core

## Overview
ContextForge operates on a serverless microservice architecture utilizing FastAPI for backend services, ChromaDB for vector storage, and a React SPA for the frontend.

## Data Flow
1. **Ingestion**: Webhooks from GitHub trigger the \`/clone\` endpoint.
2. **Processing**: The AST parser extracts semantic blocks.
3. **Storage**: OpenAI \`text-embedding-3-small\` generates embeddings which are stored in ChromaDB.
4. **Retrieval**: User queries are vectorized and semantically matched against ChromaDB before being injected into the Gemini context window.

## Identified Risks
- **Rate Limiting**: The current embedding batch size may trigger API limits on repositories > 10,000 files.
- **State Management**: The chat context relies heavily on client-side state, which may degrade performance for very long sessions.
`;
