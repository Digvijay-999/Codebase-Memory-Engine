import { motion } from "framer-motion"
import { Sparkles } from "lucide-react"
import { Button } from "../ui/Button"

export function CTA() {
  return (
    <section className="py-36 bg-[#080b10] relative overflow-hidden">
      {/* Matte black soft radial spotlight */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-accent/3 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute inset-0 border-t border-white/5 pointer-events-none" />
      
      <div className="max-w-4xl mx-auto px-6 text-center relative z-10 select-none">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.8 }}
          className="text-4xl md:text-6xl font-bold tracking-tight text-foreground leading-[1.1] mb-8"
        >
          Ready to forge understanding?
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1, ease: [0.16, 1, 0.3, 1], duration: 0.8 }}
          className="text-base md:text-lg text-[#797f80] font-light max-w-xl mx-auto mb-14 leading-relaxed"
        >
          Join software engineering teams using local context to query, build, and document their architectures.
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, ease: [0.16, 1, 0.3, 1], duration: 0.8 }}
        >
          <Button 
            size="xl" 
            variant="neon" 
            magnetic={true} 
            className="gap-2.5 font-semibold text-xs tracking-wider uppercase"
          >
            Launch Workspace <Sparkles size={13} className="text-[#080b10]" />
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
