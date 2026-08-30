import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

export interface BusWizardData {
  busListingType: string
  busType: string
  make: string
  model: string
  year: string
  capacity: string
  condition: string
  transmission: string
  fuelType: string
  mileage: string
  plateNumber: string
  features: string[]
  
  price: string
  isPriceNegotiable: boolean
  dailyPrice: string
  monthlyPrice: string
  withDriver: boolean
  
  contractType: string
  contractClient: string
  contractMonthly: string
  contractDuration: string
  
  title: string
  description: string
  
  governorateId: number | null
  wilayaId: number | null
  governorateNameAr: string
  wilayaNameAr: string
  governorate: string
  city: string
  latitude: number | null
  longitude: number | null
  
  images: any[]
  existingImages: any[]
  removedImageIds: string[]
  
  contactPhone: string
  whatsapp: string
}

const DEFAULT_DATA: BusWizardData = {
  busListingType: '',
  busType: '',
  make: '',
  model: '',
  year: '',
  capacity: '',
  condition: 'USED',
  transmission: 'MANUAL',
  fuelType: 'DIESEL',
  mileage: '',
  plateNumber: '',
  features: [],
  price: '',
  isPriceNegotiable: false,
  dailyPrice: '',
  monthlyPrice: '',
  withDriver: false,
  contractType: 'COMPANY',
  contractClient: '',
  contractMonthly: '',
  contractDuration: '',
  title: '',
  description: '',
  governorateId: null,
  wilayaId: null,
  governorateNameAr: '',
  wilayaNameAr: '',
  governorate: '',
  city: '',
  latitude: null,
  longitude: null,
  images: [],
  existingImages: [],
  removedImageIds: [],
  contactPhone: '',
  whatsapp: '',
}

interface BusWizardState {
  currentStep: number
  data: BusWizardData
  errors: Record<string, string>
  editMode: boolean
  editListingId: string | null
  
  setStep: (step: number) => void
  nextStep: () => void
  prevStep: () => void
  setData: (updates: Partial<BusWizardData>) => void
  setErrors: (errs: Record<string, string>) => void
  clearError: (field: string) => void
  reset: () => void
  setLocation: (govId: number, wilId: number, govName: string, wilName: string) => void
  setEditMode: (id: string, initialData: Partial<BusWizardData>) => void
}

export const useBusWizardStore = create<BusWizardState>()(
  persist(
    (set) => ({
      currentStep: 1,
      data: DEFAULT_DATA,
      errors: {},
      editMode: false,
      editListingId: null,

      setStep: (step) => set({ currentStep: step }),
      nextStep: () => set((s) => ({ currentStep: Math.min(s.currentStep + 1, 6) })),
      prevStep: () => set((s) => ({ currentStep: Math.max(s.currentStep - 1, 1) })),
      
      setData: (updates) => set((s) => ({ data: { ...s.data, ...updates } })),
      
      setLocation: (govId, wilId, govName, wilName) => set((s) => ({
        data: {
          ...s.data,
          governorateId: govId,
          wilayaId: wilId,
          governorateNameAr: govName,
          wilayaNameAr: wilName,
        }
      })),
      
      setErrors: (errors) => set({ errors }),
      clearError: (field) => set((s) => {
        const newErrors = { ...s.errors }
        delete newErrors[field]
        return { errors: newErrors }
      }),
      
      reset: () => set({
        currentStep: 1,
        data: DEFAULT_DATA,
        errors: {},
        editMode: false,
        editListingId: null
      }),
      
      setEditMode: (id, initialData) => set({
        editMode: true,
        editListingId: id,
        data: { ...DEFAULT_DATA, ...initialData },
        currentStep: 1,
        errors: {}
      })
    }),
    {
      name: 'bus-wizard-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ 
        data: state.editMode ? DEFAULT_DATA : state.data, 
        currentStep: state.editMode ? 1 : state.currentStep 
      }),
    }
  )
)
