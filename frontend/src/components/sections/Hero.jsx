import { motion } from "framer-motion"
import React, { Suspense } from "react"
import { Sparkles, ArrowRight } from "lucide-react"
import { Button } from "../ui/Button"

const Spline = React.lazy(() => import("@splinetool/react-spline"))

// Component Config - easily change the Spline scene URL later without modifying the layout code
const SPLINE_SCENE_URL = "https://prod.spline.design/6Wq1Q7YGyM-iab9i/scene.splinecode"

export function Hero() {
  return (
    <section className="relative min-h-[90vh] md:min-h-screen flex items-center justify-center overflow-hidden bg-[#080b10] py-20 md:py-32">
      {/* Premium Abstract AI presence placeholder Spline */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none md:pointer-events-auto">
        <Suspense fallback={<div className="absolute inset-0 bg-[#080b10]" />}>
          <Spline scene={SPLINE_SCENE_URL} />
        </Suspense>
      </div>

      {/* Cinematic radial gradient masking for soft lighting & monochrome blending */}
      <div className="absolute inset-0 z-10 bg-[radial-gradient(circle_at_center,transparent_20%,#080b10_80%)] pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#080b10] to-transparent z-10 pointer-events-none" />

      {/* Content Layout */}
      <div className="relative z-20 max-w-5xl mx-auto px-6 text-center flex flex-col items-center select-none">
        
        {/* Release Pill with subtle micro-interaction */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/5 bg-[#1b232a]/50 backdrop-blur-md text-[#d9dbd7]/90 text-xs tracking-wider uppercase font-semibold mb-10 hover:border-accent/20 hover:bg-[#1b232a]/80 transition-all duration-300 group cursor-pointer"
        >
          <Sparkles size={12} className="text-accent animate-pulse group-hover:rotate-12 transition-transform duration-300" />
          <span>Introducing ContextForge v1.0</span>
        </motion.div>

        {/* Large Bold Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="text-4xl sm:text-6xl md:text-8xl font-bold tracking-tight mb-8 leading-[1.08] text-transparent bg-gradient-to-b from-[#d9dbd7] to-[#d9dbd7]/60 bg-clip-text"
        >
          Forge understanding <br className="hidden md:block" />
          from any codebase.
        </motion.h1>

        {/* Elegant typography description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="text-base sm:text-lg md:text-xl text-[#797f80] max-w-3xl mb-12 font-light leading-relaxed tracking-wide"
        >
          The semantic intelligence layer for software architecture. Index your repositories, query structural patterns, and create developer artifacts in seconds.
        </motion.p>

        {/* Action CTAs with Magnetic Effect */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row items-center gap-5 w-full sm:w-auto"
        >
          <Button 
            size="xl" 
            variant="neon" 
            magnetic={true} 
            className="w-full sm:w-auto gap-2.5 font-semibold text-xs tracking-wider uppercase"
          >
            Launch Workspace <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button 
            size="xl" 
            variant="outline" 
            magnetic={true}
            className="w-full sm:w-auto text-xs tracking-wider uppercase font-semibold"
          >
            View Documentation
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
