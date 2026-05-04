import { create } from 'zustand'

export type Period = 'today' | 'week' | 'month'

interface PeriodStore {
  period: Period
  setPeriod: (period: Period) => void
}

export const usePeriodStore = create<PeriodStore>((set) => ({
  period: 'week',
  setPeriod: (period) => set({ period }),
}))
