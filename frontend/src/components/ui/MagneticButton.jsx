import React from 'react';
import { cn } from '../../lib/utils';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { motion, useMotionTemplate, useMotionValue, useSpring } from 'framer-motion';

export function MagneticButton({ children, className, onClick, ...props }) {
  const reducedMotion = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { damping: 15, stiffness: 150, mass: 0.1 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const handleMouseMove = (e) => {
    if (reducedMotion) return;
    const { clientX, clientY } = e;
    const { height, width, left, top } = e.currentTarget.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    x.set(middleX * 0.2);
    y.set(middleY * 0.2);
  };

  const handleMouseLeave = () => {
    if (reducedMotion) return;
    x.set(0);
    y.set(0);
  };

  return (
    <motion.button
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={cn("relative inline-flex items-center justify-center transition-opacity hover:opacity-90", className)}
      {...props}
    >
      {children}
    </motion.button>
  );
}
