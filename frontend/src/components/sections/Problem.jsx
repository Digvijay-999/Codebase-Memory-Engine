import { motion } from "framer-motion"
import { FileCode2, SearchX, GitBranch } from "lucide-react"
import { Card, CardContent } from "../ui/Card"

const painPoints = [
  {
    icon: <SearchX className="text-accent/80 w-5 h-5" />,
    title: "Lost in the files",
    description: "Spending hours searching through undocumented folders just to find where a single feature is implemented."
  },
  {
    icon: <FileCode2 className="text-accent/80 w-5 h-5" />,
    title: "Missing context",
    description: "Standard search finds exact matches, but misses the semantic connections between distant components."
  },
  {
    icon: <GitBranch className="text-accent/80 w-5 h-5" />,
    title: "Onboarding friction",
    description: "New developers take weeks to become productive because the architectural knowledge only exists in senior developers' heads."
  }
]

export function Problem() {
  return (
    <section id="problem" className="py-32 relative bg-[#080b10] border-t border-white/5">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* Title & Description */}
        <div className="text-center max-w-3xl mx-auto mb-24">
          <motion.h2 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.8 }}
            className="text-3xl md:text-5xl font-bold tracking-tight text-foreground leading-[1.15] mb-6"
          >
            Navigating unfamiliar code is broken.
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, ease: [0.16, 1, 0.3, 1], duration: 0.8 }}
            className="text-base md:text-lg text-[#797f80] font-light max-w-2xl mx-auto leading-relaxed"
          >
            Modern applications are complex webs of dependencies. Traditional tools treat code as raw text, not as a connected architecture.
          </motion.p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {painPoints.map((point, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 * index, ease: [0.16, 1, 0.3, 1], duration: 0.8 }}
            >
              <Card className="h-full border border-white/5 bg-[#1b232a] hover:border-[#3e484e] transition-all duration-300">
                <CardContent className="p-8 md:p-10">
                  <div className="w-10 h-10 rounded-lg bg-[#3e484e]/20 border border-white/5 flex items-center justify-center mb-6">
                    {point.icon}
                  </div>
                  <h3 className="text-lg font-semibold mb-3 text-foreground">{point.title}</h3>
                  <p className="text-sm text-[#797f80] leading-relaxed font-light">
                    {point.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
