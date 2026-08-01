import { create } from 'zustand'

interface EquipmentPostState {
  title: string
  description: string

  equipmentType: string
  listingType: string

  make: string
  model: string
  year: string
  condition: string
  capacity: string
  power: string
  weight: string
  hoursUsed: string

  price: string
  dailyPrice: string
  monthlyPrice: string
  isPriceNegotiable: boolean

  budgetMin: string
  budgetMax: string
  rentalDuration: string
  quantity: string

  governorate: string
  city: string
  latitude: number | null
  longitude: number | null

  images: any[]
  existingImages?: any[]
  removedImageIds?: string[]

  editMode: boolean
  editListingId?: string

  errors: Record<string, string>

  currentStep: number

  set: (data: Partial<EquipmentPostState>) => void
  setErrors: (errors: Record<string, string>) => void
  clearErrors: () => void
  nextStep: () => void
  prevStep: () => void
  reset: () => void
}

const initialState = {
  currentStep: 1,
  errors: {},
  title: '',
  description: '',

  equipmentType: '',
  listingType: '',

  make: '',
  model: '',
  year: '',
  condition: 'USED',
  capacity: '',
  power: '',
  weight: '',
  hoursUsed: '',

  price: '',
  dailyPrice: '',
  monthlyPrice: '',
  isPriceNegotiable: false,

  budgetMin: '',
  budgetMax: '',
  rentalDuration: '',
  quantity: '',

  governorate: '',
  city: '',
  latitude: null,
  longitude: null,

  images: [],
  existingImages: [],
  removedImageIds: [],

  editMode: false,
  editListingId: undefined,
}

export const useEquipmentStore = create<EquipmentPostState>((set) => ({
  ...initialState,
  set: (data) => set((state) => ({ ...state, ...data })),
  setErrors: (errors) => set({ errors }),
  clearErrors: () => set({ errors: {} }),
  nextStep: () => set((state) => ({ currentStep: Math.min(state.currentStep + 1, 5) })),
  prevStep: () => set((state) => ({ currentStep: Math.max(state.currentStep - 1, 1) })),
  reset: () => set(initialState),
}))
