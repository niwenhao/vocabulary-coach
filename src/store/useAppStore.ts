import { create } from 'zustand'
import { SessionWord } from '../types'

interface AppState {
  activeLabels: string[]
  setActiveLabels: (labels: string[]) => void
  toggleLabel: (label: string) => void

  sessionQueue: SessionWord[]
  sessionIndex: number
  setSession: (queue: SessionWord[]) => void
  advanceSession: () => void
  requeueWord: (word: SessionWord) => void
  resetSession: () => void
}

export const useAppStore = create<AppState>((set, get) => ({
  activeLabels: [],
  setActiveLabels: (labels) => set({ activeLabels: labels }),
  toggleLabel: (label) => {
    const current = get().activeLabels
    const next = current.includes(label)
      ? current.filter((l) => l !== label)
      : [...current, label]
    set({ activeLabels: next })
  },

  sessionQueue: [],
  sessionIndex: 0,
  setSession: (queue) => set({ sessionQueue: queue, sessionIndex: 0 }),
  advanceSession: () => set((s) => ({ sessionIndex: s.sessionIndex + 1 })),
  requeueWord: (word) => set((s) => ({
    sessionQueue: [...s.sessionQueue, word],
    sessionIndex: s.sessionIndex + 1,
  })),
  resetSession: () => set({ sessionQueue: [], sessionIndex: 0 }),
}))
