import React from 'react';
import { cn } from '../../lib/utils';

export function Card({ className, children, ...props }) {
  return (
    <div 
      className={cn(
        "rounded-[var(--radius-cards)] border border-border bg-surface p-6 transition-colors hover:bg-surface-hover shadow-none",
        className
      )} 
      {...props}
    >
      {children}
    </div>
  );
}
