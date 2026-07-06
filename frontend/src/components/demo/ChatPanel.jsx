import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bot, User, Sparkles, Send, Copy, Check, FileCode2 } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"

// Custom ultra-clean dark theme for syntax highlighting matching the design system
const customCodeTheme = {
  'code[class*="language-"]': {
    color: "#d9dbd7",
    background: "none",
    fontFamily: "JetBrains Mono, Fira Code, Courier New, monospace",
    direction: "ltr",
    textAlign: "left",
    whiteSpace: "pre",
    wordSpacing: "normal",
    wordBreak: "normal",
    lineHeight: "1.5",
    MozTabSize: "4",
    OTabSize: "4",
    tabSize: "4",
    WebkitHyphens: "none",
    MozHyphens: "none",
    msHyphens: "none",
    hyphens: "none",
  },
  'pre[class*="language-"]': {
    color: "#d9dbd7",
    background: "#080b10",
    fontFamily: "JetBrains Mono, Fira Code, Courier New, monospace",
    direction: "ltr",
    textAlign: "left",
    whiteSpace: "pre",
    wordSpacing: "normal",
    wordBreak: "normal",
    lineHeight: "1.5",
    MozTabSize: "4",
    OTabSize: "4",
    tabSize: "4",
    WebkitHyphens: "none",
    MozHyphens: "none",
    msHyphens: "none",
    hyphens: "none",
    padding: "1rem",
    margin: "0.5em 0",
    overflow: "auto",
    borderRadius: "0.5rem",
    border: "1px solid rgba(255, 255, 255, 0.05)"
  },
  keyword: { color: "#e1ddd5", fontWeight: "bold" },
  string: { color: "#797f80" },
  comment: { color: "rgba(121, 127, 128, 0.6)", fontStyle: "italic" },
  function: { color: "#ffffff" },
  number: { color: "#e1ddd5" },
  operator: { color: "#797f80" },
  class: { color: "#e1ddd5" }
}

const initialPrompts = [
  { text: "Where is authentication handled?", key: "auth" },
  { text: "Explain the project architecture", key: "arch" }
]

const responses = {
  auth: {
    text: "Authentication is primarily handled in `src/core/auth.ts` via JSON Web Tokens (JWT). The token validation middleware protects incoming routes.\n\nHere is the implementation of token verification:\n\n```typescript\n// src/core/auth.ts\nimport jwt from \"jsonwebtoken\";\n\nexport function verifyToken(token: string): any {\n  try {\n    return jwt.verify(token, process.env.JWT_SECRET || \"default-key\");\n  } catch (error) {\n    throw new Error(\"Session expired or token invalid\");\n  }\n}\n```\n\nThe corresponding validation middleware is registered globally in the API routers defined in `src/api/routes.ts`.",
    sources: [
      { file: "src/core/auth.ts", lines: "L12-L24", match: "98% relevance" },
      { file: "src/api/routes.ts", lines: "L45-L62", match: "82% relevance" }
    ]
  },
  arch: {
    text: "The application follows a clean layered architecture:\n\n1. **API Layer (`src/api`)**: Defines Fast API routes and HTTP contract controllers.\n2. **Core Services (`src/core`)**: Handles business logic including semantic indexing and ChromaDB orchestration.\n3. **Utility Layer (`src/utils`)**: Provides file tree parsers and formatting tools.\n\nHere is how the main system registers controllers:\n\n```typescript\n// src/api/routes.ts\nimport { Router } from \"express\";\nimport { authMiddleware } from \"../core/auth\";\n\nexport const apiRouter = Router();\napiRouter.post(\"/ask\", authMiddleware, handleAskQuery);\napiRouter.post(\"/clone\", authMiddleware, handleCloneRepository);\n```",
    sources: [
      { file: "src/api/routes.ts", lines: "L1-L15", match: "95% relevance" },
      { file: "src/core/auth.ts", lines: "L2-L10", match: "75% relevance" }
    ]
  }
}

export function ChatPanel({ onHighlightFiles }) {
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState(null)
  const [inputVal, setInputVal] = useState("")

  const handlePromptClick = (prompt) => {
    if (isLoading) return
    
    // 1. Add User message
    const userMsg = { role: "user", content: prompt.text }
    setMessages([userMsg])
    setIsLoading(true)
    
    // Simulate thinking delay
    setTimeout(() => {
      // 2. Add Assistant response
      const responseData = responses[prompt.key]
      const assistantMsg = { 
        role: "assistant", 
        content: responseData.text,
        sources: responseData.sources
      }
      setMessages(prev => [...prev, assistantMsg])
      setIsLoading(false)
      
      // Update highlights in the file tree
      if (onHighlightFiles) {
        onHighlightFiles(responseData.sources.map(s => s.file))
      }
    }, 1800)
  }

  const handleCopyCode = (codeText, idx) => {
    navigator.clipboard.writeText(codeText)
    setCopiedIndex(idx)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#080b10] border-r border-white/5 relative">
      
      {/* Messages / Prompts container */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 flex flex-col justify-end">
        <AnimatePresence>
          {messages.length === 0 ? (
            // Suggested Prompts (Empty state)
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col justify-center items-center max-w-lg mx-auto text-center gap-8"
            >
              <div className="w-12 h-12 rounded-full bg-accent/5 border border-accent/15 flex items-center justify-center text-accent">
                <Sparkles size={20} className="animate-pulse" />
              </div>
              <div>
                <h4 className="text-base font-medium text-foreground mb-2">Interact with the codebase</h4>
                <p className="text-xs text-[#797f80] font-light leading-relaxed">
                  Select a suggested query below to simulate a live search and generation flow on the ContextForge engine.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3 w-full">
                {initialPrompts.map((prompt) => (
                  <button
                    key={prompt.key}
                    onClick={() => handlePromptClick(prompt)}
                    className="text-xs text-left px-5 py-3 rounded-lg border border-white/5 bg-[#1b232a]/40 text-[#d9dbd7]/85 hover:border-[#3e484e] hover:bg-[#1b232a] hover:text-foreground transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.2)]"
                  >
                    {prompt.text}
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            // Active Chat Conversation
            <div className="space-y-8">
              {messages.map((msg, idx) => {
                const isUser = msg.role === "user"
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className={`flex gap-5 max-w-3xl ${isUser ? "ml-auto flex-row-reverse" : ""}`}
                  >
                    {/* Icon */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${
                      isUser 
                        ? "bg-[#1b232a] border-white/10 text-[#d9dbd7]" 
                        : "bg-accent/10 border-accent/20 text-accent"
                    }`}>
                      {isUser ? <User size={14} /> : <Bot size={14} />}
                    </div>

                    {/* Chat Bubble Content */}
                    <div className="flex-1 space-y-4">
                      <div className={`text-sm leading-relaxed ${isUser ? "text-foreground font-medium" : "text-[#d9dbd7]/90 font-light"}`}>
                        <ReactMarkdown
                          components={{
                            code({ node, inline, className, children, ...props }) {
                              const match = /language-(\w+)/.exec(className || "")
                              return !inline && match ? (
                                <div className="relative mt-3 rounded-lg overflow-hidden group">
                                  <div className="absolute right-3 top-3 z-20">
                                    <button
                                      onClick={() => handleCopyCode(String(children).replace(/\n$/, ""), idx)}
                                      className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors border border-white/5"
                                    >
                                      {copiedIndex === idx ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                                    </button>
                                  </div>
                                  <SyntaxHighlighter
                                    style={customCodeTheme}
                                    language={match[1]}
                                    PreTag="div"
                                    {...props}
                                  >
                                    {String(children).replace(/\n$/, "")}
                                  </SyntaxHighlighter>
                                </div>
                              ) : (
                                <code className="bg-[#1b232a] px-1.5 py-0.5 rounded text-accent font-mono text-xs" {...props}>
                                  {children}
                                </code>
                              )
                            }
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>

                      {/* Source Citations with slide-in animation */}
                      {!isUser && msg.sources && (
                        <div className="pt-3 border-t border-white/5 space-y-2">
                          <span className="text-[10px] uppercase tracking-wider text-[#797f80] font-semibold flex items-center gap-1.5">
                            <FileCode2 size={10} /> Sources Used
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {msg.sources.map((src, sIdx) => (
                              <motion.div
                                key={sIdx}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: sIdx * 0.15 + 0.3 }}
                                className="flex items-center gap-2 px-2.5 py-1 rounded bg-[#1b232a] border border-white/5 text-[11px] text-[#797f80] hover:border-accent/20 cursor-pointer"
                              >
                                <span className="text-[#d9dbd7] font-medium">{src.file}</span>
                                <span className="text-[9px] bg-[#080b10] px-1 py-0.5 rounded text-accent/60">{src.match}</span>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </AnimatePresence>

        {/* Loading Indicator */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex gap-5 max-w-3xl"
            >
              <div className="w-8 h-8 rounded-lg bg-accent/5 border border-accent/15 flex items-center justify-center text-accent">
                <Sparkles size={14} className="animate-spin" />
              </div>
              <div className="flex gap-1 items-center bg-[#1b232a]/30 px-4 py-2.5 rounded-full border border-white/5">
                <span className="text-xs text-[#797f80]">Thinking</span>
                <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1 }} className="text-xs text-accent">.</motion.span>
                <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="text-xs text-accent">.</motion.span>
                <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="text-xs text-accent">.</motion.span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input controls (Design System compliance) */}
      <div className="p-5 border-t border-white/5 bg-[#080b10]/95 backdrop-blur-md">
        <div className="max-w-3xl mx-auto relative flex items-center">
          <input 
            type="text" 
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Ask about your codebase..." 
            className="w-full bg-[#1b232a] border border-[#3e484e]/30 rounded-full py-3.5 pl-6 pr-14 text-xs text-[#d9dbd7] focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/15 transition-all placeholder:text-[#797f80]/60"
            disabled
          />
          <button 
            className="absolute right-2 w-9 h-9 flex items-center justify-center rounded-full bg-[#e1ddd5] text-[#080b10] hover:bg-[#d4d0c8] transition-colors"
            disabled
          >
            <Send size={14} />
          </button>
        </div>
        <div className="text-center mt-3 text-[10px] text-[#797f80]/40 font-light tracking-wide">
          ContextForge AI analyzes codebase AST indices. Generative responses are verified against vector sources.
        </div>
      </div>
    </div>
  )
}
