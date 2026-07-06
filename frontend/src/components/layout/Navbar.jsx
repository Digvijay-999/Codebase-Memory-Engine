import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, Terminal } from "lucide-react"
import { Button } from "../ui/Button"

const navItems = [
  { name: "How it Works", href: "#how-it-works" },
  { name: "Features", href: "#features" },
  { name: "Technology", href: "#tech" },
  { name: "Demo", href: "#demo" }
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [activeTab, setActiveTab] = useState(null)
  const [hoveredTab, setHoveredTab] = useState(null)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 transition-all duration-500 ${
        scrolled ? "pt-2" : "pt-6"
      }`}
    >
      <nav
        className={`flex items-center justify-between px-6 py-2.5 rounded-full border transition-all duration-500 ${
          scrolled 
            ? "bg-[#1b232a]/80 backdrop-blur-2xl border-white/5 w-[90%] max-w-5xl shadow-[0_12px_40px_rgba(0,0,0,0.6)]" 
            : "bg-[#1b232a]/30 backdrop-blur-md border-white/5 w-full max-w-6xl"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 group cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-background transition-all duration-300">
            <Terminal size={14} className="group-hover:rotate-6 transition-transform" />
          </div>
          <span className="font-semibold text-base tracking-tight text-foreground group-hover:text-accent transition-colors">
            ContextForge
          </span>
        </div>

        {/* Tubelight Navigation Menu */}
        <div className="hidden md:flex items-center gap-1.5 bg-[#080b10]/40 border border-white/5 px-2 py-1 rounded-full relative">
          {navItems.map((item) => {
            const isHovered = hoveredTab === item.name
            const isActive = activeTab === item.name
            return (
              <a
                key={item.name}
                href={item.href}
                className={`relative px-4 py-1.5 text-xs font-medium tracking-wide transition-all duration-300 rounded-full ${
                  isActive || isHovered ? "text-foreground" : "text-[#797f80]"
                }`}
                onMouseEnter={() => setHoveredTab(item.name)}
                onMouseLeave={() => setHoveredTab(null)}
                onClick={() => setActiveTab(item.name)}
              >
                {/* Sliding indicator background */}
                <AnimatePresence>
                  {isHovered && (
                    <motion.div
                      layoutId="nav-pill"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 350, damping: 25 }}
                      className="absolute inset-0 bg-[#3e484e]/30 rounded-full z-0"
                    />
                  )}
                </AnimatePresence>

                {/* Tubelight Glowing Strip */}
                {isActive && (
                  <motion.div
                    layoutId="nav-tubelight"
                    className="absolute -bottom-1 left-3 right-3 h-[2px] bg-accent shadow-[0_0_8px_#e1ddd5] z-10"
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  />
                )}
                
                <span className="relative z-10">{item.name}</span>
              </a>
            )
          })}
        </div>

        {/* CTAs */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="hidden sm:inline-flex text-xs font-medium">
            Sign In
          </Button>
          <Button variant="neon" className="rounded-full gap-2 text-xs font-medium">
            Launch Workspace <Sparkles size={12} />
          </Button>
        </div>
      </nav>
    </motion.header>
  )
}
