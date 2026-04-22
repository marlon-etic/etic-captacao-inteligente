/* General utility functions (exposes cn) */
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges multiple class names into a single string
 * @param inputs - Array of class names
 * @returns Merged class names
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function convertTiposToString(tipos: string[] | string | undefined): string {
  if (!tipos) return ''
  if (Array.isArray(tipos)) {
    return tipos.filter((t) => t && t.trim()).join(',')
  }
  return String(tipos)
}

export function convertTiposToArray(tipos: string | string[] | undefined): string[] {
  if (!tipos) return []
  if (Array.isArray(tipos)) {
    return tipos
  }
  return String(tipos)
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t)
}

// Add any other utility functions here
