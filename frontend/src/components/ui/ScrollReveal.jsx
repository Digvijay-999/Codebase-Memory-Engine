import React from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { fadeUpVariant, staggerContainer } from '../../lib/animations';

export function ScrollReveal({ children, className, stagger = false, once = true, aboveFold = false }) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  const Component = motion.div;
  const variants = stagger ? staggerContainer : fadeUpVariant;
  
  if (aboveFold) {
    return (
      <Component
        variants={variants}
        initial="hidden"
        animate="visible"
        className={className}
      >
        {children}
      </Component>
    );
  }

  return (
    <Component
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-10%" }}
      className={className}
    >
      {children}
    </Component>
  );
}

// Helper for stagger children
export function ScrollRevealChild({ children, className, variant = fadeUpVariant }) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div variants={variant} className={className}>
      {children}
    </motion.div>
  );
}
