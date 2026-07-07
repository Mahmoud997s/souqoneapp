import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface ArchiveState {
  archivedIds: string[]
  toggleArchive: (id: string) => void
  isArchived: (id: string) => boolean
}

export const useArchiveStore = create<ArchiveState>()(
  persist(
    (set, get) => ({
      archivedIds: [],
      toggleArchive: (id) => set((state) => ({
        archivedIds: state.archivedIds.includes(id)
          ? state.archivedIds.filter(x => x !== id)
          : [...state.archivedIds, id]
      })),
      isArchived: (id) => get().archivedIds.includes(id),
    }),
    {
      name: 'archive-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
