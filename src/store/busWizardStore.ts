import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

export interface BusWizardData {
  busListingType: string
  busType: string
  make: string
  model: string
  manufacturerId: string | null
  modelId: string | null
  year: string
  capacity: string
  condition: string
  transmission: string
  fuelType: string
  mileage: string
  plateNumber: string
  features: string[]
  
  price: string
  currency: string
  isPriceNegotiable: boolean
  dailyPrice: string
  monthlyPrice: string
  withDriver: boolean
  
  contractType: string
  contractClient: string
  contractMonthly: string
  contractDuration: string
  contractExpiry: string | null
  
  title: string
  description: string
  
  governorateId: number | null
  wilayaId: number | null
  governorateNameAr: string
  wilayaNameAr: string
  latitude: number | null
  longitude: number | null
  
  images: any[]
  existingImages: any[]
  removedImageIds: string[]
  
  /** Show the WhatsApp button on the listing. The number is always the owner's account phone. */
  whatsappEnabled: boolean
}

const DEFAULT_DATA: BusWizardData = {
  busListingType: '',
  busType: '',
  make: '',
  model: '',
  manufacturerId: null,
  modelId: null,
  year: '',
  capacity: '',
  condition: 'USED',
  transmission: 'MANUAL',
  fuelType: 'DIESEL',
  mileage: '',
  plateNumber: '',
  features: [],
  price: '',
  currency: 'OMR',
  isPriceNegotiable: false,
  dailyPrice: '',
  monthlyPrice: '',
  withDriver: false,
  contractType: 'COMPANY',
  contractClient: '',
  contractMonthly: '',
  contractDuration: '',
  contractExpiry: null,
  title: '',
  description: '',
  governorateId: null,
  wilayaId: null,
  governorateNameAr: '',
  wilayaNameAr: '',
  latitude: null,
  longitude: null,
  images: [],
  existingImages: [],
  removedImageIds: [],
  whatsappEnabled: false,
}

interface BusWizardState {
  currentStep: number
  data: BusWizardData
  errors: Record<string, string>
  editMode: boolean
  editListingId: string | null
  /** `version` of the listing when edit started (optimistic concurrency token for PATCH /buses/:id) */
  editVersion: number | null
  
  setStep: (step: number) => void
  nextStep: () => void
  prevStep: () => void
  setData: (updates: Partial<BusWizardData>) => void
  setErrors: (errs: Record<string, string>) => void
  clearError: (field: string) => void
  reset: () => void
  setLocation: (govId: number, wilId: number, govName: string, wilName: string) => void
  setEditMode: (id: string, initialData: Partial<BusWizardData>, version?: number | null) => void
}

export const useBusWizardStore = create<BusWizardState>()(
  persist(
    (set) => ({
      currentStep: 1,
      data: DEFAULT_DATA,
      errors: {},
      editMode: false,
      editListingId: null,
      editVersion: null,

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
        editListingId: null,
        editVersion: null,
      }),
      
      setEditMode: (id, initialData, version) => set({
        editMode: true,
        editListingId: id,
        editVersion: typeof version === 'number' && Number.isFinite(version) ? version : null,
        data: { ...DEFAULT_DATA, ...initialData },
        currentStep: 1,
        errors: {}
      })
    }),
    {
      name: 'bus-wizard-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ 
        data: state.data, 
        currentStep: state.currentStep,
        editMode: state.editMode,
        editListingId: state.editListingId,
        editVersion: state.editVersion,
      }),
    }
  )
)
