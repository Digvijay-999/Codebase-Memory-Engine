import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges tailwind classes intelligently.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
