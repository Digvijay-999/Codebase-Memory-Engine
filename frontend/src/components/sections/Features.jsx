import { motion } from "framer-motion"
import { MessageSquareCode, Network, FileText, Zap, Shield, Sparkles } from "lucide-react"
import { Card } from "../ui/Card"

const features = [
  {
    title: "AI Architecture Chat",
    description: "Ask natural language questions about your architecture. ContextForge answers with deep, source-aware insights.",
    icon: <MessageSquareCode className="w-8 h-8 text-accent" />,
    className: "md:col-span-2 md:row-span-2 min-h-[360px]",
  },
  {
    title: "Semantic Search",
    description: "Find exactly what you need based on meaning, not just keywords.",
    icon: <Network className="w-6 h-6 text-accent/80" />,
    className: "md:col-span-1 min-h-[170px]",
  },
  {
    title: "README Generation",
    description: "Generate professional, comprehensive documentation automatically.",
    icon: <FileText className="w-6 h-6 text-accent/80" />,
    className: "md:col-span-1 min-h-[170px]",
  },
  {
    title: "Lightning Fast",
    description: "Built on ChromaDB for millisecond retrieval times.",
    icon: <Zap className="w-6 h-6 text-accent/80" />,
    className: "md:col-span-1 min-h-[170px]",
  },
  {
    title: "Private & Secure",
    description: "Your code stays private. Connect securely to GitHub.",
    icon: <Shield className="w-6 h-6 text-accent/80" />,
    className: "md:col-span-1 min-h-[170px]",
  }
]

export function Features() {
  return (
    <section id="features" className="py-32 bg-[#080b10] relative">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-6">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/5 border border-accent/10 text-accent text-xs font-semibold uppercase tracking-wider mb-6"
            >
              <Sparkles size={12} />
              <span>Capabilities</span>
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="text-3xl md:text-5xl font-bold tracking-tight text-foreground leading-[1.15]"
            >
              Everything you need to master your codebase.
            </motion.h2>
          </div>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              className={`p-8 md:p-10 flex flex-col justify-between group cursor-pointer border border-white/5 bg-[#1b232a] ${feature.className}`}
            >
              {/* Subtle metallic linear glow hover */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
              
              <div className="flex flex-col h-full justify-between gap-6 relative z-10">
                <motion.div 
                  className="w-12 h-12 rounded-lg bg-[#3e484e]/20 border border-white/5 flex items-center justify-center relative overflow-hidden"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div 
                    className="relative z-10"
                    whileHover={{ rotate: 8, scale: 1.1 }}
                  >
                    {feature.icon}
                  </motion.div>
                </motion.div>

                <div>
                  <h3 className="text-xl font-semibold mb-3 text-foreground group-hover:text-accent transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-[#797f80] leading-relaxed font-light">
                    {feature.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
