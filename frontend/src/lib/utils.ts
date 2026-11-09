import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Orders ISO dates and timestamps ("2026-11-02", "2026-11-02T08:00:00Z"), for sort(). Plain
 * character order is time order for them; localeCompare's first call set up a collator, which
 * cost a phone ~100ms on the home page for nothing.
 */
export const compareIso = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)
