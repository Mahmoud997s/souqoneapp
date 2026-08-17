import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

export interface OperatorWizardFormData {
  operatorType: string
  title: string
  description: string
  experienceYears: string
  equipmentTypes: string[]
  specializations: string[]
  certifications: string[]
  dailyRate: string
  hourlyRate: string
  currency: string
  isPriceNegotiable: boolean
  governorateId?: number | null
  wilayaId?: number | null
  governorateName?: string
  wilayaName?: string
  contactPhone: string
  whatsapp: string
}

interface OperatorWizardState {
  currentStep: number
  formData: OperatorWizardFormData
  errors: Record<string, string>

  setStep: (step: number) => void
  nextStep: () => void
  prevStep: () => void
  setFormField: <K extends keyof OperatorWizardFormData>(key: K, value: OperatorWizardFormData[K]) => void
  setFormData: (data: Partial<OperatorWizardFormData>) => void
  setFieldError: (field: string, error: string) => void
  clearFieldError: (field: string) => void
  setErrors: (errors: Record<string, string>) => void
  clearErrors: () => void
  validateStep: (step: number) => boolean
  resetDraft: () => void
}

export const DEFAULT_OPERATOR_WIZARD_DATA: OperatorWizardFormData = {
  operatorType: 'OPERATOR',
  title: '',
  description: '',
  experienceYears: '',
  equipmentTypes: [],
  specializations: [],
  certifications: [],
  dailyRate: '',
  hourlyRate: '',
  currency: 'OMR',
  isPriceNegotiable: true,
  governorateId: null,
  wilayaId: null,
  governorateName: '',
  wilayaName: '',
  contactPhone: '',
  whatsapp: '',
}

export const useOperatorWizardStore = create<OperatorWizardState>()(
  persist(
    (set, get) => ({
      currentStep: 1,
      formData: DEFAULT_OPERATOR_WIZARD_DATA,
      errors: {},

      setStep: (step) => set({ currentStep: step }),
      nextStep: () => set((state) => ({ currentStep: Math.min(state.currentStep + 1, 3) })),
      prevStep: () => set((state) => ({ currentStep: Math.max(state.currentStep - 1, 1) })),

      setFormField: (key, value) => {
        set((state) => {
          const updatedErrors = { ...state.errors }
          delete updatedErrors[key as string]
          return {
            formData: { ...state.formData, [key]: value },
            errors: updatedErrors,
          }
        })
      },

      setFormData: (data) => {
        set((state) => ({
          formData: { ...state.formData, ...data },
        }))
      },

      setFieldError: (field, error) => {
        set((state) => ({
          errors: { ...state.errors, [field]: error },
        }))
      },

      clearFieldError: (field) => {
        set((state) => {
          const updated = { ...state.errors }
          delete updated[field]
          return { errors: updated }
        })
      },

      setErrors: (errors) => set({ errors }),
      clearErrors: () => set({ errors: {} }),

      validateStep: (step: number) => {
        const { formData } = get()
        const newErrors: Record<string, string> = {}

        if (step === 1) {
          if (!formData.operatorType) {
            newErrors.operatorType = 'يرجى اختيار نوع الدور أو التخصص المهني'
          }
          if (!formData.title || formData.title.trim().length < 5) {
            newErrors.title = 'عنوان الإعلان مطلوب (5 أحرف على الأقل)'
          }
          if (!formData.experienceYears || isNaN(Number(formData.experienceYears)) || Number(formData.experienceYears) < 0) {
            newErrors.experienceYears = 'سنوات الخبرة الإجمالية مطلوبة'
          }
          if (!formData.description || formData.description.trim().length < 10) {
            newErrors.description = 'يرجى كتابة نبذة تفصيلية عن خبراتك ومهامك (10 أحرف على الأقل)'
          }
        } else if (step === 2) {
          if (!formData.equipmentTypes || formData.equipmentTypes.length === 0) {
            newErrors.equipmentTypes = 'يرجى تحديد معدة واحدة على الأقل تجيد تشغيلها'
          }
          if (!formData.certifications || formData.certifications.length === 0) {
            newErrors.certifications = 'يرجى إرفاق صورة الرخصة / شهادة الكفاءة أو كتابتها نصياً'
          }
        } else if (step === 3) {
          if (!formData.dailyRate || isNaN(Number(formData.dailyRate)) || Number(formData.dailyRate) <= 0) {
            newErrors.dailyRate = 'الأجر اليومي الاسترشادي مطلوب'
          }
          if (!formData.hourlyRate || isNaN(Number(formData.hourlyRate)) || Number(formData.hourlyRate) <= 0) {
            newErrors.hourlyRate = 'الأجر بالساعة مطلوب'
          }
          if (!formData.governorateId) {
            newErrors.governorate = 'يرجى اختيار المحافظة'
          }
          if (!formData.wilayaId) {
            newErrors.city = 'يرجى اختيار الولاية'
          }
          if (!formData.contactPhone || formData.contactPhone.trim().length < 8) {
            newErrors.contactPhone = 'رقم هاتف الاتصال مطلوب ومكون من 8 أرقام على الأقل'
          }
          if (!formData.whatsapp || formData.whatsapp.trim().length < 8) {
            newErrors.whatsapp = 'رقم الواتساب للتواصل السريع مطلوب'
          }
        }

        set({ errors: newErrors })
        return Object.keys(newErrors).length === 0
      },

      resetDraft: () =>
        set({
          currentStep: 1,
          formData: DEFAULT_OPERATOR_WIZARD_DATA,
          errors: {},
        }),
    }),
    {
      name: 'souqone_operator_wizard_draft',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        currentStep: state.currentStep,
        formData: state.formData,
      }),
    }
  )
)
