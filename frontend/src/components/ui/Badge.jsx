import React from 'react';
import { cn } from '../../lib/utils';

export function Badge({ children, className, ...props }) {
  return (
    <span 
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-surface-elevated px-3 py-1 text-xs font-medium uppercase tracking-wider text-text-secondary",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
