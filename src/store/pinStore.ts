import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface PinState {
  pinnedIds: string[]
  togglePin: (id: string) => void
  isPinned: (id: string) => boolean
  reset: () => void
}

export const usePinStore = create<PinState>()(
  persist(
    (set, get) => ({
      pinnedIds: [],
      togglePin: (id) =>
        set((state) => ({
          pinnedIds: state.pinnedIds.includes(id)
            ? state.pinnedIds.filter((x) => x !== id)
            : [id, ...state.pinnedIds],
        })),
      isPinned: (id) => get().pinnedIds.includes(id),
      reset: () => set({ pinnedIds: [] }),
    }),
    {
      name: 'pinned-chat-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
