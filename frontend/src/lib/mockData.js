// Realistic mock data for the ContextForge frontend


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
