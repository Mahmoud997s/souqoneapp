import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { EquipmentFormData, EquipmentFormErrors, EquipmentFormField } from '../types/equipmentForm.types'
import { validateEquipmentStep } from '../hooks/useEquipmentValidation'

interface EquipmentWizardState {
  currentStep: number
  formData: EquipmentFormData
  errors: EquipmentFormErrors

  // Actions
  setFormField: <K extends EquipmentFormField>(field: K, value: EquipmentFormData[K]) => void
  setFormData: (data: Partial<EquipmentFormData>) => void
  clearFieldError: (field: EquipmentFormField | string) => void
  validateStep: (step: number) => boolean
  nextStep: () => void
  prevStep: () => void
  goToStep: (step: number) => void
  resetDraft: () => void
  initEditMode: (listing: any) => void
}

const initialFormData: EquipmentFormData = {
  title: '',
  description: '',
  equipmentType: '',
  listingType: 'EQUIPMENT_SALE',

  // Technical Specs
  make: '',
  model: '',
  year: '',
  condition: 'USED',
  capacity: '',
  power: '',
  weight: '',
  hoursUsed: '',
  features: [],

  // Pricing
  price: '',
  dailyPrice: '',
  monthlyPrice: '',
  isPriceNegotiable: false,
  withOperator: false,
  deliveryAvailable: false,

  // Wanted Specific Fields
  budgetMin: '',
  budgetMax: '',
  rentalDuration: '',
  quantity: '1',
  siteDetails: '',

  // Location
  governorateId: null,
  wilayaId: null,
  governorate: '',
  city: '',
  latitude: null,
  longitude: null,

  // Contact
  contactPhone: '',
  whatsapp: '',

  // Media
  images: [],
  existingImages: [],
  removedImageIds: [],

  // Meta
  editMode: false,
  editListingId: undefined,
}

export const useEquipmentWizardStore = create<EquipmentWizardState>()(
  persist(
    (set, get) => ({
      currentStep: 1,
      formData: initialFormData,
      errors: {},

      setFormField: (field, value) => {
        set((state) => {
          const newErrors = { ...state.errors }
          delete newErrors[field as string]
          return {
            formData: {
              ...state.formData,
              [field]: value,
            },
            errors: newErrors,
          }
        })
      },

      setFormData: (data) => {
        set((state) => ({
          formData: {
            ...state.formData,
            ...data,
          },
        }))
      },

      clearFieldError: (field) => {
        set((state) => {
          const newErrors = { ...state.errors }
          delete newErrors[field]
          return { errors: newErrors }
        })
      },

      validateStep: (step) => {
        const { formData } = get()
        const { isValid, errors } = validateEquipmentStep(step, formData)
        set({ errors })
        return isValid
      },

      nextStep: () => {
        const { currentStep, validateStep } = get()
        if (validateStep(currentStep)) {
          set({ currentStep: Math.min(currentStep + 1, 5) })
        }
      },

      prevStep: () => {
        set((state) => ({ currentStep: Math.max(state.currentStep - 1, 1) }))
      },

      goToStep: (step) => {
        set({ currentStep: Math.max(1, Math.min(step, 5)) })
      },

      resetDraft: () => {
        set({
          currentStep: 1,
          formData: initialFormData,
          errors: {},
        })
      },

      initEditMode: (listing) => {
        const existingImgs = Array.isArray(listing.images)
          ? listing.images.map((img: any) => (typeof img === 'string' ? { url: img } : img))
          : typeof listing.images === 'string'
          ? JSON.parse(listing.images).map((url: string) => ({ url }))
          : []

        set({
          currentStep: 1,
          errors: {},
          formData: {
            editMode: true,
            editListingId: listing.id,

            title: listing.title || '',
            description: listing.description || '',
            equipmentType: listing.equipmentType || '',
            listingType: listing.listingType || 'EQUIPMENT_SALE',

            make: listing.make || '',
            model: listing.model || '',
            year: listing.year ? String(listing.year) : '',
            condition: listing.condition || 'USED',
            capacity: listing.capacity || '',
            power: listing.power || '',
            weight: listing.weight || '',
            hoursUsed: listing.hoursUsed !== undefined && listing.hoursUsed !== null ? String(listing.hoursUsed) : '',
            features: Array.isArray(listing.features) ? listing.features : [],

            price: listing.price !== undefined && listing.price !== null ? String(listing.price) : '',
            dailyPrice: listing.dailyPrice !== undefined && listing.dailyPrice !== null ? String(listing.dailyPrice) : '',
            monthlyPrice: listing.monthlyPrice !== undefined && listing.monthlyPrice !== null ? String(listing.monthlyPrice) : '',
            isPriceNegotiable: Boolean(listing.isPriceNegotiable),
            withOperator: Boolean(listing.withOperator),
            deliveryAvailable: Boolean(listing.deliveryAvailable),

            budgetMin: listing.budgetMin !== undefined && listing.budgetMin !== null ? String(listing.budgetMin) : '',
            budgetMax: listing.budgetMax !== undefined && listing.budgetMax !== null ? String(listing.budgetMax) : '',
            rentalDuration: listing.rentalDuration || '',
            quantity: listing.quantity ? String(listing.quantity) : '1',
            siteDetails: listing.siteDetails || '',

            governorateId: listing.governorateId || null,
            wilayaId: listing.wilayaId || null,
            governorate: listing.governorateRef?.nameAr || listing.governorate || '',
            city: listing.wilayaRef?.nameAr || listing.city || '',
            latitude: listing.latitude || null,
            longitude: listing.longitude || null,

            contactPhone: listing.contactPhone || '',
            whatsapp: listing.whatsapp || '',

            images: [],
            existingImages: existingImgs,
            removedImageIds: [],
          },
        })
      },
    }),
    {
      name: 'souqone_equipment_wizard_draft',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        formData: state.formData,
        currentStep: state.currentStep,
      }),
    }
  )
)
