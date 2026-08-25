import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { CarFormData, CarFormField } from '../types/carForm.types'

interface CarWizardState {
  currentStep: number
  formData: CarFormData
  isDraft: boolean

  // Actions
  setStep: (step: number) => void
  nextStep: () => void
  prevStep: () => void
  updateField: <K extends keyof CarFormData>(field: K, value: CarFormData[K]) => void
  resetForm: () => void
  setEditMode: (listingId: string, initialData: Partial<CarFormData>) => void
}

const initialFormData: CarFormData = {
  title: '',
  description: '',
  listingType: '',
  condition: '',

  year: '',
  price: '',
  mileage: '',
  fuelType: '',
  transmission: '',
  bodyType: '',
  exteriorColor: '',
  interior: '',
  engineSize: '',
  horsepower: '',
  doors: '',
  seats: '',
  driveType: '',
  features: [],
  currency: 'OMR',
  isPriceNegotiable: false,

  // Rental fields
  dailyPrice: '',
  monthlyPrice: '',
  withDriver: false,
  depositAmount: '',
  minRentalDays: '',
  kmLimitPerDay: '',
  cancellationPolicy: '',
  deliveryAvailable: false,
  insuranceIncluded: false,

  // Location
  governorateId: null,
  wilayaId: null,
  latitude: null,
  longitude: null,

  // Master Data
  brandId: '',
  carModelId: '',
  carTrimId: '',

  images: [],
  existingImages: [],
  removedImageIds: [],
}

export const useCarWizardStore = create<CarWizardState>()(
  persist(
    (set, get) => ({
      currentStep: 1,
      formData: { ...initialFormData },
      isDraft: false,

      setStep: (step) => set({ currentStep: step }),

      nextStep: () => {
        const { currentStep } = get()
        if (currentStep < 5) {
          set({ currentStep: currentStep + 1, isDraft: true })
        }
      },

      prevStep: () => {
        const { currentStep } = get()
        if (currentStep > 1) {
          set({ currentStep: currentStep - 1 })
        }
      },

      updateField: (field, value) => {
        set((state) => ({
          formData: {
            ...state.formData,
            [field]: value,
          },
          isDraft: true,
        }))
      },

      resetForm: () => {
        set({
          currentStep: 1,
          formData: { ...initialFormData },
          isDraft: false,
        })
      },

      setEditMode: (listingId, initialData) => {
        set({
          currentStep: 1,
          isDraft: false,
          formData: {
            ...initialFormData,
            ...initialData,
            editMode: true,
            editListingId: listingId,
          },
        })
      },
    }),
    {
      name: 'car-wizard-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => {
        // Prevent edit data from overwriting user's local drafts and from persisting old edits
        if (state.formData.editMode) {
          return {}
        }
        return {
          formData: state.formData,
          currentStep: state.currentStep,
          isDraft: state.isDraft,
        }
      },
    }
  )
)
