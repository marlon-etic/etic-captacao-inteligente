import { create } from 'zustand'

export type Period = 'today' | 'week' | 'month' | 'custom'

interface PeriodStore {
  period: Period
  customRange: { start: Date; end: Date } | null
  setPeriod: (period: Period) => void
  setCustomRange: (range: { start: Date; end: Date } | null) => void
}

export const usePeriodStore = create<PeriodStore>((set) => ({
  period: (localStorage.getItem('periodo_ativo') as Period) || 'week',
  customRange: (() => {
    const start = localStorage.getItem('periodo_custom_start')
    const end = localStorage.getItem('periodo_custom_end')
    if (start && end) return { start: new Date(start), end: new Date(end) }
    return null
  })(),
  setPeriod: (period) => {
    localStorage.setItem('periodo_ativo', period)
    set({ period })
  },
  setCustomRange: (range) => {
    if (range) {
      localStorage.setItem('periodo_custom_start', range.start.toISOString())
      localStorage.setItem('periodo_custom_end', range.end.toISOString())
    } else {
      localStorage.removeItem('periodo_custom_start')
      localStorage.removeItem('periodo_custom_end')
    }
    set({ customRange: range })
  },
}))
