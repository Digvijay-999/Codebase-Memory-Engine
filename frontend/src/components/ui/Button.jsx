import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { motion, useMotionValue, useSpring } from "framer-motion"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#e1ddd5] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[#e1ddd5] text-[#080b10] hover:bg-[#d4d0c8] shadow-[0_4px_20px_rgba(225,221,213,0.1)] rounded-full",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 rounded-full",
        outline: "border border-[#3e484e] bg-transparent text-[#d9dbd7] hover:bg-[#1b232a] hover:border-[#e1ddd5]/30 rounded-full",
        secondary: "bg-[#1b232a] text-[#d9dbd7] border border-white/5 hover:bg-[#3e484e] hover:border-white/10 rounded-full",
        ghost: "hover:bg-white/5 text-[#797f80] hover:text-[#d9dbd7] rounded-full",
        link: "text-[#e1ddd5] underline-offset-4 hover:underline",
        neon: "bg-[#e1ddd5] text-[#080b10] border border-[#e1ddd5]/20 shadow-[0_0_20px_rgba(225,221,213,0.15)] hover:shadow-[0_0_30px_rgba(225,221,213,0.3)] hover:bg-[#d4d0c8] rounded-full font-medium tracking-wide",
      },
      size: {
        default: "h-10 px-5 text-sm",
        sm: "h-8 px-3.5 text-xs",
        lg: "h-11 px-7 text-sm tracking-wide",
        xl: "h-12 px-9 text-base tracking-wide font-medium",
        icon: "h-10 w-10 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, magnetic = false, ...props }, ref) => {
  const Comp = asChild ? Slot : motion.button
  const internalRef = React.useRef(null)
  
  // Spring setups for Magnetic Effect
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  
  const springOptions = { damping: 15, stiffness: 150, mass: 0.1 }
  const x = useSpring(mouseX, springOptions)
  const y = useSpring(mouseY, springOptions)

  const handleMouseMove = (e) => {
    if (!magnetic || !internalRef.current) return
    const { clientX, clientY } = e
    const { left, top, width, height } = internalRef.current.getBoundingClientRect()
    const relativeX = clientX - (left + width / 2)
    const relativeY = clientY - (top + height / 2)
    // Subtle 35% magnetic pull
    mouseX.set(relativeX * 0.35)
    mouseY.set(relativeY * 0.35)
  }

  const handleMouseLeave = () => {
    if (!magnetic) return
    mouseX.set(0)
    mouseY.set(0)
  }

  // Combined refs
  const combinedRef = (node) => {
    internalRef.current = node
    if (typeof ref === "function") ref(node)
    else if (ref) ref.current = node
  }

  if (asChild) {
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={combinedRef}
        {...props}
      />
    )
  }

  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={combinedRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={magnetic ? { x, y } : undefined}
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.96 }}
      {...props}
    />
  )
})
Button.displayName = "Button"

export { Button, buttonVariants }
