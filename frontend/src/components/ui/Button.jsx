import React from 'react';
import { cn } from '../../lib/utils';
import { MagneticButton } from './MagneticButton';

const variants = {
  primary: "bg-accent text-bg font-medium hover:bg-opacity-90 shadow-[inset_0_1px_0_rgba(255,255,255,1),inset_1px_0_0_rgba(255,255,255,1),inset_-1px_0_0_rgba(255,255,255,1),inset_0_-1px_0_rgba(255,255,255,1)]",
  secondary: "bg-transparent text-text-primary border border-border hover:bg-surface-elevated",
  ghost: "bg-transparent text-text-primary border border-text-primary hover:bg-surface-elevated hover:text-accent",
};

const sizes = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-base",
  lg: "px-12 py-4 text-lg",
};

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  className, 
  magnetic = false,
  children,
  ...props 
}) {
  const classes = cn(
    "inline-flex items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
    variants[variant],
    sizes[size],
    className
  );

  if (magnetic) {
    return (
      <MagneticButton className={classes} {...props}>
        {children}
      </MagneticButton>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
