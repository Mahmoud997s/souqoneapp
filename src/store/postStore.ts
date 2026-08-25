import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

export interface PostData {
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
  existingImages: { id: string; url: string; isPrimary?: boolean }[]
  removedImageIds: string[]
  details: Record<string, any>
}

interface PostStateBase {
  draftData: PostData
  editData: PostData
  editMode: boolean
  editListingId: string | null

  set: (updates: Partial<PostData> | { editMode?: boolean; editListingId?: string | null; category?: string }) => void
  setDetail: (key: string, value: any) => void
  setDetails: (updates: Record<string, any>) => void
  reset: (mode?: 'draft' | 'edit') => void
}

const initialData: PostData = {
  category: '',
  title: '',
  description: '',
  price: '',
  isPriceNegotiable: false,
  governorate: '',
  city: '',
  locationNote: '',
  images: [],
  existingImages: [],
  removedImageIds: [],
  details: {},
}

export const usePostStoreBase = create<PostStateBase>()(
  persist(
    (set) => ({
      draftData: { ...initialData },
      editData: { ...initialData },
      editMode: false,
      editListingId: null,

      set: (updates) =>
        set((state) => {
          // If updates contain mode switches, apply them at the root
          const rootUpdates: any = {}
          if ('editMode' in updates) rootUpdates.editMode = updates.editMode
          if ('editListingId' in updates) rootUpdates.editListingId = updates.editListingId
          
          // Apply data updates to the currently active slice
          const dataUpdates = { ...updates } as any
          delete dataUpdates.editMode
          delete dataUpdates.editListingId

          if (Object.keys(dataUpdates).length > 0) {
            const isEdit = 'editMode' in updates ? updates.editMode : state.editMode
            if (isEdit) {
              rootUpdates.editData = { ...state.editData, ...dataUpdates }
            } else {
              rootUpdates.draftData = { ...state.draftData, ...dataUpdates }
            }
          }

          return { ...state, ...rootUpdates }
        }),

      setDetail: (key, value) =>
        set((state) => {
          if (state.editMode) {
            return { editData: { ...state.editData, details: { ...state.editData.details, [key]: value } } }
          }
          return { draftData: { ...state.draftData, details: { ...state.draftData.details, [key]: value } } }
        }),

      setDetails: (updates) =>
        set((state) => {
          if (state.editMode) {
            return { editData: { ...state.editData, details: { ...state.editData.details, ...updates } } }
          }
          return { draftData: { ...state.draftData, details: { ...state.draftData.details, ...updates } } }
        }),

      reset: (mode) =>
        set((state) => {
          if (mode === 'edit') {
            return { editData: { ...initialData }, editMode: false, editListingId: null }
          }
          if (mode === 'draft') {
            return { draftData: { ...initialData } }
          }
          // Default (undefined mode): Clear EVERYTHING to prevent data leaks (e.g. on logout or generic reset)
          return { 
            draftData: { ...initialData }, 
            editData: { ...initialData }, 
            editMode: false, 
            editListingId: null 
          }
        }),
    }),
    {
      name: 'post-draft-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // ONLY persist draftData. Never persist editData, editMode, or editListingId.
        draftData: state.draftData,
      }),
    }
  )
)

// Legacy wrapper to keep all existing consumers working without changes
export interface LegacyPostState extends PostData {
  editMode: boolean
  editListingId: string | null
  set: PostStateBase['set']
  setDetail: PostStateBase['setDetail']
  setDetails: PostStateBase['setDetails']
  reset: PostStateBase['reset']
}

export const usePostStore = (): LegacyPostState => {
  const state = usePostStoreBase()
  const activeData = state.editMode ? state.editData : state.draftData

  return {
    ...activeData,
    editMode: state.editMode,
    editListingId: state.editListingId,
    set: state.set,
    setDetail: state.setDetail,
    setDetails: state.setDetails,
    reset: state.reset,
  }
}

// Add getState support for outside-React usage (e.g. clearUserData.ts)
usePostStore.getState = (): LegacyPostState => {
  const state = usePostStoreBase.getState()
  const activeData = state.editMode ? state.editData : state.draftData

  return {
    ...activeData,
    editMode: state.editMode,
    editListingId: state.editListingId,
    set: state.set,
    setDetail: state.setDetail,
    setDetails: state.setDetails,
    reset: state.reset,
  }
}
