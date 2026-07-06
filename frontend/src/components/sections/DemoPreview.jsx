import { useState } from "react"
import { motion } from "framer-motion"
import { RepoTree } from "../demo/RepoTree"
import { ChatPanel } from "../demo/ChatPanel"
import { SourcesPanel } from "../demo/SourcesPanel"
import { Sparkles, Terminal } from "lucide-react"

export function DemoPreview() {
  const [highlightedFiles, setHighlightedFiles] = useState([])
  return (
    <section id="demo" className="py-24 bg-background relative overflow-hidden">
      {/* Background ambient light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[500px] bg-accent/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium mb-6"
          >
            <Terminal size={14} />
            <span>Interactive Demo</span>
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-5xl font-bold tracking-tight mb-6"
          >
            Experience the workspace.
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-muted-foreground"
          >
            This is exactly how ContextForge looks and feels. A premium environment designed for focus and deep work.
          </motion.p>
        </div>

        {/* Dashboard Mockup Window */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="rounded-2xl border border-white/10 shadow-2xl overflow-hidden bg-background max-w-5xl mx-auto flex flex-col h-[700px] relative"
        >
          {/* Mockup Header (Mac-like dots) */}
          <div className="h-12 border-b border-white/10 bg-background-secondary/30 flex items-center px-4 shrink-0">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-destructive/50" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
              <div className="w-3 h-3 rounded-full bg-green-500/50" />
            </div>
            <div className="mx-auto flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles size={12} className="text-accent" />
              ContextForge Dashboard — Read-only Demo
            </div>
          </div>
          
          {/* Dashboard Layout */}
          <div className="flex-1 flex overflow-hidden">
            <RepoTree highlightedFiles={highlightedFiles} />
            <ChatPanel onHighlightFiles={setHighlightedFiles} />
            <SourcesPanel highlightedFiles={highlightedFiles} />
          </div>
        </motion.div>
      </div>
    </section>
  )
}
