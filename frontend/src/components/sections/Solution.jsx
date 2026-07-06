import { motion } from "framer-motion"
import { BrainCircuit, Database, Zap, Sparkles, FileCode2, Network } from "lucide-react"

export function Solution() {
  return (
    <section className="py-32 bg-[#1b232a]/45 border-y border-white/5 relative overflow-hidden">
      {/* Subtle background mask */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(225,221,213,0.02)_0%,transparent_70%)] pointer-events-none" />
      
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Details Content */}
          <div className="space-y-8">
            <div>
              <motion.div
                initial={{ opacity: 0, x: -15 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/5 border border-accent/10 text-accent text-xs font-semibold uppercase tracking-wider mb-6"
              >
                <Zap size={12} />
                <span>The Solution</span>
              </motion.div>
              
              <motion.h2 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1, ease: [0.16, 1, 0.3, 1], duration: 0.8 }}
                className="text-3xl md:text-5xl font-bold tracking-tight text-foreground leading-[1.15] mb-6"
              >
                Understand architecture at the speed of thought.
              </motion.h2>
              
              <motion.p 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, ease: [0.16, 1, 0.3, 1], duration: 0.8 }}
                className="text-base md:text-lg text-[#797f80] font-light leading-relaxed"
              >
                ContextForge ingests your entire repository, builds a semantic vector database, and uses advanced RAG to answer your questions with perfect context.
              </motion.p>
            </div>
            
            {/* Features lists */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, ease: [0.16, 1, 0.3, 1], duration: 0.8 }}
              className="space-y-6"
            >
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-lg bg-[#3e484e]/20 border border-white/5 flex items-center justify-center shrink-0 mt-1">
                  <Database size={15} className="text-accent" />
                </div>
                <div>
                  <h4 className="font-medium text-sm text-[#d9dbd7] mb-1">Semantic Memory</h4>
                  <p className="text-xs text-[#797f80] font-light leading-relaxed">
                    We don't just search text; we map semantic relationships between classes and modules.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-lg bg-[#3e484e]/20 border border-white/5 flex items-center justify-center shrink-0 mt-1">
                  <BrainCircuit size={15} className="text-accent" />
                </div>
                <div>
                  <h4 className="font-medium text-sm text-[#d9dbd7] mb-1">Context-Aware AI</h4>
                  <p className="text-xs text-[#797f80] font-light leading-relaxed">
                    Every answer compiles live citations to prevent model hallucination and build confidence.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
          
          {/* Abstract Graphic representing codebase connectivity */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.35, ease: [0.16, 1, 0.3, 1], duration: 1 }}
            className="relative"
          >
            <div className="aspect-square max-w-[420px] mx-auto rounded-xl border border-white/5 bg-[#1b232a]/30 shadow-[0_24px_50px_rgba(0,0,0,0.5)] overflow-hidden relative flex items-center justify-center">
              
              {/* Glowing core background */}
              <div className="absolute w-48 h-48 bg-accent/5 rounded-full blur-3xl animate-pulse" />
              
              {/* Graphic Code Nodes Representation */}
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-full h-full max-w-[320px] max-h-[320px]" viewBox="0 0 100 100">
                  <motion.path 
                    d="M 20 20 L 50 50 M 80 20 L 50 50 M 50 80 L 50 50 M 20 80 L 50 50 M 80 80 L 50 50" 
                    stroke="rgba(225, 221, 213, 0.1)" 
                    strokeWidth="0.5"
                    strokeDasharray="1 1"
                  />
                  {/* Central Node */}
                  <circle cx="50" cy="50" r="4" fill="#e1ddd5" className="animate-ping opacity-30" />
                  <circle cx="50" cy="50" r="3" fill="#e1ddd5" />
                  
                  {/* Outer Nodes */}
                  <circle cx="20" cy="20" r="2" fill="#797f80" />
                  <circle cx="80" cy="20" r="2" fill="#797f80" />
                  <circle cx="50" cy="80" r="2.5" fill="#e1ddd5" />
                  <circle cx="20" cy="80" r="2" fill="#797f80" />
                  <circle cx="80" cy="80" r="2.5" fill="#e1ddd5" />
                </svg>
              </div>

              {/* Central icons floating in front */}
              <div className="relative z-10 flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-[#080b10] border border-white/10 flex items-center justify-center text-accent shadow-[0_8px_20px_rgba(0,0,0,0.8)]">
                  <Network size={20} />
                </div>
                <div className="text-[10px] uppercase tracking-widest text-[#797f80] font-semibold bg-[#080b10] border border-white/5 px-2.5 py-1 rounded-full">
                  Semantic Index
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
