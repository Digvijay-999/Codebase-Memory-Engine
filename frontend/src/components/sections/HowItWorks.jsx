import { useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { GitBranch, Download, FolderGit2, Blocks, Database, HardDrive, Bot, CheckCircle2, Sparkles } from "lucide-react"

const steps = [
  { id: 1, name: "GitHub Connect", icon: <GitBranch size={20} />, description: "Authorise and link your public or private repositories in one click." },
  { id: 2, name: "Secure Clone", icon: <Download size={20} />, description: "ContextForge securely mirrors your codebase into a temporary, isolated workspace." },
  { id: 3, name: "AST Scan", icon: <FolderGit2 size={20} />, description: "Run abstract syntax tree parsing to map relationships, imports, and exports." },
  { id: 4, name: "Semantic Chunking", icon: <Blocks size={20} />, description: "Deconstruct files into logical semantic tokens rather than arbitrary line counts." },
  { id: 5, name: "Vector Embeddings", icon: <Database size={20} />, description: "Pass code blocks through specialized model pipelines to generate spatial vectors." },
  { id: 6, name: "ChromaDB Storage", icon: <HardDrive size={20} />, description: "Index embeddings inside high-speed local databases for millisecond lookup times." },
  { id: 7, name: "Gemini Integration", icon: <Bot size={20} />, description: "Route relevant chunks to the Gemini models to construct architectural reasoning." },
  { id: 8, name: "Context Ready", icon: <CheckCircle2 size={20} />, description: "The workspace is active. Launch your session to query and chat with your code." }
]

export function HowItWorks() {
  const containerRef = useRef(null)
  
  // Track scroll position of pipeline container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"]
  })

  // Smooth drawing height of connection laser
  const laserHeight = useTransform(scrollYProgress, [0.05, 0.92], ["0%", "100%"])

  return (
    <section id="how-it-works" ref={containerRef} className="py-32 bg-[#080b10] relative">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-28">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/5 border border-accent/10 text-accent text-xs font-semibold uppercase tracking-wider mb-6"
          >
            <Sparkles size={12} />
            <span>Process</span>
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-3xl md:text-5xl font-bold tracking-tight text-foreground leading-[1.15] mb-6"
          >
            The Context Engine Pipeline
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-base md:text-lg text-[#797f80] font-light max-w-2xl mx-auto"
          >
            A secure Retrieval-Augmented Generation (RAG) architecture engineered for enterprise codebase ingestion.
          </motion.p>
        </div>

        {/* Pipeline Diagram */}
        <div className="relative max-w-4xl mx-auto pl-12 md:pl-0">
          
          {/* Background Connector Rail */}
          <div className="absolute left-[28px] md:left-1/2 top-0 bottom-0 w-px bg-white/5 md:-translate-x-1/2" />
          
          {/* Animated Laser Connector Path */}
          <div className="absolute left-[28px] md:left-1/2 top-0 bottom-0 w-px md:-translate-x-1/2">
            <motion.div 
              className="absolute top-0 w-full bg-accent shadow-[0_0_8px_#e1ddd5] origin-top"
              style={{ height: laserHeight }}
            />
          </div>

          {/* Sequential Stages */}
          <div className="space-y-16 relative z-10">
            {steps.map((step, index) => {
              const isEven = index % 2 === 0
              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                  className={`flex flex-col md:flex-row items-start md:items-center gap-8 md:gap-16 ${
                    isEven ? "md:flex-row-reverse text-left md:text-right" : "text-left"
                  }`}
                >
                  {/* Step Description Card */}
                  <div className={`flex-1 w-full relative group ${isEven ? "md:pr-8" : "md:pl-8"}`}>
                    <div className="p-6 rounded-xl border border-white/5 bg-[#1b232a]/40 hover:border-[#3e484e]/30 transition-all duration-300">
                      <div className="text-accent/40 font-semibold text-xs tracking-wider uppercase mb-1">
                        Stage 0{step.id}
                      </div>
                      <h3 className="text-lg font-semibold mb-2 text-foreground group-hover:text-accent transition-colors duration-300">
                        {step.name}
                      </h3>
                      <p className="text-sm text-[#797f80] leading-relaxed font-light">
                        {step.description}
                      </p>
                    </div>
                  </div>
                  
                  {/* Step Node Marker */}
                  <div className="relative flex-shrink-0 w-14 h-14 rounded-full bg-[#080b10] border border-white/10 flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.8)] z-10 group cursor-pointer transition-colors duration-500 hover:border-accent/40">
                    {/* Ring Pulse Interaction */}
                    <div className="absolute inset-0 rounded-full bg-accent/5 opacity-0 group-hover:opacity-100 group-hover:scale-125 transition-all duration-500 blur-sm pointer-events-none" />
                    
                    <div className="text-accent group-hover:scale-110 transition-transform duration-300">
                      {step.icon}
                    </div>
                  </div>
                  
                  {/* Spacer for structure symmetry */}
                  <div className="flex-1 hidden md:block" />
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
