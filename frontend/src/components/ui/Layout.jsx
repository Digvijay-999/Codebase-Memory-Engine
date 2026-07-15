import React from 'react';
import { cn } from '../../lib/utils';

export function Container({ className, children, ...props }) {
  return (
    <div className={cn("max-w-[1280px] mx-auto px-6 w-full", className)} {...props}>
      {children}
    </div>
  );
}

export function Section({ className, children, ...props }) {
  return (
    <section className={cn("py-12 md:py-24 lg:py-32", className)} {...props}>
      {children}
    </section>
  );
}
