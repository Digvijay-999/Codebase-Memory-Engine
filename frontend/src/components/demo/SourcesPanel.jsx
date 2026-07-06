import { FileCode2, Link2 } from "lucide-react"

const mockSources = [
  { file: "src/core/auth.ts", lines: "L12-L24", relevance: "98%" },
  { file: "src/api/routes.ts", lines: "L45-L62", relevance: "82%" },
  { file: "package.json", lines: "L1-L10", relevance: "15%" }
]

export function SourcesPanel({ highlightedFiles = [] }) {
  return (
    <div className="w-72 border-l border-white/5 bg-[#080b10] h-full flex flex-col hidden xl:flex">
      <div className="p-5 border-b border-white/5 flex items-center justify-between">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-[#797f80] flex items-center gap-2">
          <Link2 size={12} className="text-accent" />
          Sources Index
        </div>
        <div className="text-[10px] bg-accent/10 border border-accent/15 text-accent px-2.5 py-0.5 rounded-full font-medium">
          3 References
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {mockSources.map((src, i) => {
          const isActive = highlightedFiles.includes(src.file)
          return (
            <div 
              key={i} 
              className={`p-4 rounded-lg border transition-all duration-300 group cursor-pointer ${
                isActive 
                  ? "bg-accent/5 border-accent/25 shadow-[0_0_12px_rgba(225,221,213,0.06)]" 
                  : "bg-[#1b232a]/30 border-white/5 hover:border-[#3e484e] hover:bg-[#1b232a]"
              }`}
            >
              <div className="flex items-start justify-between mb-2.5">
                <div className={`flex items-center gap-2.5 text-xs transition-colors ${
                  isActive ? "text-accent font-medium" : "text-[#d9dbd7] group-hover:text-accent"
                }`}>
                  <FileCode2 size={13} className={isActive ? "text-accent" : "text-[#797f80] group-hover:text-accent"} />
                  <span className="truncate max-w-[170px]">{src.file}</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#797f80] font-light">
                <span>{src.lines}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded ${
                  isActive ? "bg-accent/10 text-accent font-medium" : "bg-[#080b10]"
                }`}>
                  {src.relevance} match
                </span>
              </div>
            </div>
          )
        })}
        
        <div className="mt-8 p-6 rounded-lg border border-dashed border-white/5 bg-transparent flex flex-col items-center justify-center text-center gap-3 opacity-30 hover:opacity-50 transition-opacity">
          <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-[#797f80]">
            <Link2 size={13} />
          </div>
          <span className="text-[11px] text-[#797f80] max-w-[180px] leading-relaxed font-light">
            Indexing active. ContextForge indices sync automatically with remote commits.
          </span>
        </div>
      </div>
    </div>
  )
}
