import * as React from "react"
import { cn } from "@/lib/utils"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"

const Card = React.forwardRef(({ className, children, ...props }, ref) => {
  const cardRef = React.useRef(null)
  
  // Motion values for tracking mouse position
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  // Smooth springs for rotation (max 6 degrees tilt for a calm, subtle effect)
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [6, -6]), { damping: 25, stiffness: 120 })
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-6, 6]), { damping: 25, stiffness: 120 })

  const handleMouseMove = (e) => {
    if (!cardRef.current) return
    const { clientX, clientY } = e
    const { left, top, width, height } = cardRef.current.getBoundingClientRect()
    // Calculate normalized position relative to center (-0.5 to 0.5)
    const relativeX = (clientX - left) / width - 0.5
    const relativeY = (clientY - top) / height - 0.5
    x.set(relativeX)
    y.set(relativeY)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  const combinedRef = (node) => {
    cardRef.current = node
    if (typeof ref === "function") ref(node)
    else if (ref) ref.current = node
  }

  return (
    <motion.div
      ref={combinedRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ 
        rotateX, 
        rotateY, 
        transformStyle: "preserve-3d",
        perspective: 1000 
      }}
      whileHover={{ scale: 1.008 }}
      className={cn(
        "rounded-xl border border-white/5 bg-[#1b232a] text-foreground shadow-[0_8px_30px_rgba(0,0,0,0.5)] hover:border-[#3e484e]/60 transition-all duration-300 overflow-hidden relative",
        className
      )}
      {...props}
    >
      {/* Subtle sheen reflection overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.01] to-transparent pointer-events-none" />
      {children}
    </motion.div>
  )
})
Card.displayName = "Card"

const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6 relative z-10", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("font-semibold text-lg leading-none tracking-tight text-[#d9dbd7]", className)}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-xs text-[#797f80]", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0 relative z-10 text-sm text-[#797f80]", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0 relative z-10", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
