import { useState, useEffect } from 'react'

export function useViewFilters<T extends Record<string, string>>(
  viewId: string,
  defaultFilters: T,
) {
  const [filters, setFilters] = useState<T>(() => {
    try {
      const stored = sessionStorage.getItem(`etic_filters_${viewId}`)
      if (stored) return JSON.parse(stored)
    } catch {
      // ignore
    }
    return defaultFilters
  })

  useEffect(() => {
    sessionStorage.setItem(`etic_filters_${viewId}`, JSON.stringify(filters))
  }, [filters, viewId])

  return [filters, setFilters] as const
}
