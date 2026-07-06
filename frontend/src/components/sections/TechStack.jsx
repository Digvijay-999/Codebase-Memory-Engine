import { motion } from "framer-motion"

const stack = [
  { name: "React", type: "Frontend" },
  { name: "Vite", type: "Build Tool" },
  { name: "TailwindCSS", type: "Styling" },
  { name: "FastAPI", type: "Backend" },
  { name: "ChromaDB", type: "Vector DB" },
  { name: "Gemini", type: "AI Model" },
]

export function TechStack() {
  return (
    <section id="tech" className="py-32 bg-[#080b10] border-y border-white/5 relative">
      <div className="max-w-6xl mx-auto px-6 text-center select-none">
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-xs font-semibold text-[#797f80] uppercase tracking-widest mb-14"
        >
          Engineered using modern standards
        </motion.p>

        <div className="flex flex-wrap justify-center items-center gap-10 md:gap-20">
          {stack.map((tech, index) => (
            <motion.div
              key={tech.name}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08, ease: [0.16, 1, 0.3, 1], duration: 0.8 }}
              className="flex flex-col items-center group cursor-pointer"
            >
              <span className="text-xl md:text-2xl font-bold tracking-tight text-[#797f80]/40 group-hover:text-[#d9dbd7] transition-colors duration-300">
                {tech.name}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-[#797f80]/80 opacity-0 group-hover:opacity-100 transition-all duration-300 mt-2">
                {tech.type}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
