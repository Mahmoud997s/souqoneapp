import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface PostState {
  category: string
  title: string
  description: string
  price: string
  isPriceNegotiable: boolean
  governorate: string
  city: string
  governorateId?: number
  wilayaId?: number
  locationNote: string
  latitude?: number
  longitude?: number
  images: string[]
  
  // Edit mode properties
  editMode: boolean
  editListingId: string | null
  existingImages: { id: string; url: string; isPrimary?: boolean }[]
  removedImageIds: string[]

  // Dynamic fields based on category
  details: Record<string, any>

  set: (updates: Partial<Omit<PostState, 'set' | 'reset' | 'setDetail' | 'setDetails'>>) => void
  setDetail: (key: string, value: any) => void
  setDetails: (updates: Record<string, any>) => void
  reset: () => void
}

const initial: Omit<PostState, 'set' | 'reset' | 'setDetail' | 'setDetails'> = {
  category: '',
  title: '',
  description: '',
  price: '',
  isPriceNegotiable: false,
  governorate: '',
  city: '',
  locationNote: '',
  images: [],
  editMode: false,
  editListingId: null,
  existingImages: [],
  removedImageIds: [],
  details: {},
}

export const usePostStore = create<PostState>()(
  persist(
    (set) => ({
      ...initial,
      set: (updates) => set((state) => ({ ...state, ...updates })),
      setDetail: (key, value) => set((state) => ({ details: { ...state.details, [key]: value } })),
      setDetails: (updates) => set((state) => ({ details: { ...state.details, ...updates } })),
      reset: () => set(initial),
    }),
    {
      name: 'post-draft-storage', // unique name
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
