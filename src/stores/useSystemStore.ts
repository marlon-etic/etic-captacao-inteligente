import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SystemState {
  isOnline: boolean
  setOnline: (status: boolean) => void
  isPlaygroundMode: boolean
  setPlaygroundMode: (mode: boolean) => void
}

export const useSystemStore = create<SystemState>()(
  persist(
    (set) => ({
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      setOnline: (status) => set({ isOnline: status }),
      isPlaygroundMode: false,
      setPlaygroundMode: (mode) => set({ isPlaygroundMode: mode }),
    }),
    {
      name: 'system-storage',
      partialize: (state) => ({ isPlaygroundMode: state.isPlaygroundMode }),
    },
  ),
)
