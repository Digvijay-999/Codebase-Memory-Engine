import React from 'react';
import { Button } from './Button';

export function NeonButton({ children, className = '', ...props }) {
  return (
    <div className={`relative group inline-block ${className}`}>
      <div className="absolute inset-0 bg-accent/20 blur-xl rounded-full group-hover:bg-accent/40 transition-colors duration-300" />
      <Button variant="primary" size="lg" className="relative w-full" {...props}>
        {children}
      </Button>
    </div>
  );
}
