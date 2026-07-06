import { Folder, FolderOpen, FileJson, FileCode, ChevronRight, ChevronDown } from "lucide-react"
import { useState, useEffect } from "react"

const mockFiles = [
  { name: "src", type: "folder", open: true, path: "src", children: [
    { name: "api", type: "folder", open: true, path: "src/api", children: [
      { name: "routes.ts", type: "file", path: "src/api/routes.ts" }
    ] },
    { name: "components", type: "folder", open: false, path: "src/components", children: [
      { name: "chat.tsx", type: "file", path: "src/components/chat.tsx" },
      { name: "layout.tsx", type: "file", path: "src/components/layout.tsx" }
    ]},
    { name: "core", type: "folder", open: true, path: "src/core", children: [
      { name: "auth.ts", type: "file", path: "src/core/auth.ts" }
    ] },
    { name: "utils.ts", type: "file", path: "src/utils.ts" }
  ]},
  { name: "package.json", type: "file", path: "package.json" },
  { name: "tsconfig.json", type: "file", path: "tsconfig.json" },
  { name: "README.md", type: "file", path: "README.md" }
]

function FileNode({ node, depth = 0, highlightedFiles = [] }) {
  const [isOpen, setIsOpen] = useState(node.open)
  const isHighlighted = highlightedFiles.includes(node.path)

  useEffect(() => {
    // Automatically open parent folders if a child is highlighted
    if (node.children?.some(child => highlightedFiles.includes(child.path))) {
      setIsOpen(true)
    }
  }, [highlightedFiles, node.children])

  if (node.type === "file") {
    const isMd = node.name.endsWith(".md")
    const isJson = node.name.endsWith(".json")
    const icon = isMd ? (
      <FileCode size={14} className={isHighlighted ? "text-accent" : "text-[#797f80]"} />
    ) : isJson ? (
      <FileJson size={14} className={isHighlighted ? "text-accent" : "text-[#797f80]"} />
    ) : (
      <FileCode size={14} className={isHighlighted ? "text-accent" : "text-[#797f80]"} />
    )

    return (
      <div 
        className={`flex items-center gap-2.5 py-1.5 px-3 rounded-md cursor-pointer text-xs transition-all duration-300 ${
          isHighlighted 
            ? "bg-accent/10 border border-accent/15 text-accent shadow-[0_0_12px_rgba(225,221,213,0.1)] font-medium animate-pulse" 
            : "hover:bg-white/5 border border-transparent text-[#797f80]"
        }`}
        style={{ paddingLeft: `${depth * 14 + 10}px` }}
      >
        {icon}
        <span className="truncate">{node.name}</span>
      </div>
    )
  }

  return (
    <div>
      <div 
        className="flex items-center gap-2 py-1.5 px-3 hover:bg-white/5 border border-transparent rounded-md cursor-pointer text-xs text-[#d9dbd7] transition-all duration-300"
        style={{ paddingLeft: `${depth * 14 + 6}px` }}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <ChevronDown size={12} className="text-[#797f80]" /> : <ChevronRight size={12} className="text-[#797f80]" />}
        {isOpen ? <FolderOpen size={14} className="text-accent" /> : <Folder size={14} className="text-accent/70" />}
        <span className="truncate">{node.name}</span>
      </div>
      {isOpen && node.children?.map((child, i) => (
        <FileNode key={i} node={child} depth={depth + 1} highlightedFiles={highlightedFiles} />
      ))}
    </div>
  )
}

export function RepoTree({ highlightedFiles }) {
  return (
    <div className="w-64 border-r border-white/5 bg-[#080b10] h-full flex flex-col hidden lg:flex">
      <div className="p-5 border-b border-white/5">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-[#797f80]">Workspace</div>
        <div className="text-sm font-medium mt-1 truncate text-[#d9dbd7]">ContextForge / Core</div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {mockFiles.map((node, i) => (
          <FileNode key={i} node={node} highlightedFiles={highlightedFiles} />
        ))}
      </div>
    </div>
  )
}
