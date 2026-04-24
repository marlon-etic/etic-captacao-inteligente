import * as React from 'react'
const { useState, useEffect } = React

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

  useEffect(() => {
    const handleReset = () => {
      try {
        const stored = sessionStorage.getItem(`etic_filters_${viewId}`)
        if (stored) {
          setFilters(JSON.parse(stored))
        }
      } catch {
        // ignore
      }
    }
    window.addEventListener('filters-updated', handleReset)
    return () => window.removeEventListener('filters-updated', handleReset)
  }, [viewId])

  return [filters, setFilters] as const
}
