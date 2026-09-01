import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type PartCategoryValue =
  | 'ENGINE' | 'BODY' | 'ELECTRICAL' | 'SUSPENSION' | 'BRAKES'
  | 'INTERIOR' | 'TIRES' | 'BATTERIES' | 'OILS' | 'ACCESSORIES' | 'OTHER'

export type PartConditionValue = 'NEW' | 'USED' | 'REFURBISHED'

export type WarrantyDurationValue =
  | 'ONE_MONTH' | 'THREE_MONTHS' | 'SIX_MONTHS' | 'ONE_YEAR' | 'TWO_YEARS'

export type QuantityRangeValue =
  | 'ONE' | 'TWO_TO_FIVE' | 'SIX_TO_TEN' | 'ELEVEN_TO_TWENTY'
  | 'TWENTY_TO_FIFTY' | 'FIFTY_TO_HUNDRED' | 'OVER_HUNDRED'

export type CompatibleVehicleType = 'CAR' | 'BUS' | 'EQUIPMENT'

export interface PartImageItem {
  uri: string
  isPrimary?: boolean
}

export interface PartExistingImage {
  id: string
  url: string
  isPrimary?: boolean
}

export interface PartFormData {
  listingType: 'SPARE_PART_SALE' | 'SPARE_PART_WANTED' | null
  partCategory: PartCategoryValue | null
  condition: PartConditionValue | null
  isOriginal: boolean | null

  images: PartImageItem[]
  existingImages: PartExistingImage[]
  removedImageIds: string[]

  title: string
  description: string
  partNumber: string
  quantity: QuantityRangeValue | null
  hasWarranty: boolean
  warrantyDuration: WarrantyDurationValue | null

  compatibleVehicleTypes: CompatibleVehicleType[]
  compatibleMakes: string[]
  compatibleModels: string[]
  yearFrom: number | null
  yearTo: number | null

  price: number | null
  isPriceNegotiable: boolean
  currency: 'OMR'
  governorateId: number | null
  wilayaId: number | null
  governorateNameAr: string
  wilayaNameAr: string
  latitude: number | null
  longitude: number | null
  contactPhone: string
  whatsapp: string

  editMode: boolean
  editListingId: string | null
  version: number
}

export const defaultPartFormData: PartFormData = {
  listingType: null,
  partCategory: 'ENGINE',
  condition: 'USED',
  isOriginal: true,

  images: [],
  existingImages: [],
  removedImageIds: [],

  title: '',
  description: '',
  partNumber: '',
  quantity: null,
  hasWarranty: false,
  warrantyDuration: null,

  compatibleVehicleTypes: [],
  compatibleMakes: [],
  compatibleModels: [],
  yearFrom: null,
  yearTo: null,

  price: null,
  isPriceNegotiable: false,
  currency: 'OMR',
  governorateId: null,
  wilayaId: null,
  governorateNameAr: '',
  wilayaNameAr: '',
  latitude: null,
  longitude: null,
  contactPhone: '',
  whatsapp: '',

  editMode: false,
  editListingId: null,
  version: 0,
}

export type PersistedPartFormData = Omit<PartFormData, 'editMode' | 'editListingId' | 'version'>;

export interface PartWizardPersistedState {
  formData: PersistedPartFormData;
  currentStep: number;
}

export interface PartWizardState {
  formData: PartFormData
  currentStep: number

  setField: <K extends keyof PartFormData>(field: K, value: PartFormData[K]) => void
  setFields: (fields: Partial<PartFormData>) => void

  setEditMode: (id: string, data: Partial<PartFormData>) => void
  reset: () => void

  setLocation: (
    governorateId: number,
    wilayaId: number,
    governorateNameAr: string,
    wilayaNameAr: string
  ) => void

  nextStep: () => void
  prevStep: () => void
  goToStep: (step: number) => void
}

export function mergePartWizardState(persistedState: unknown, currentState: PartWizardState): PartWizardState {
  const typedPersistedState = persistedState as PartWizardPersistedState | undefined;
  return {
    ...currentState,
    ...typedPersistedState,
    formData: {
      ...defaultPartFormData,
      ...(typedPersistedState?.formData || {}),
    },
  };
}

export const usePartWizardStore = create<PartWizardState>()(
  persist(
    (set, get) => ({
      formData: defaultPartFormData,
      currentStep: 1,

      setField: (field, value) => set((state) => ({
        formData: {
          ...state.formData,
          [field]: value
        }
      })),

      setFields: (fields) => set((state) => ({
        formData: {
          ...state.formData,
          ...fields
        }
      })),

      setEditMode: (id, data) => set((state) => ({
        formData: {
          ...state.formData,
          ...data,
          editMode: true,
          editListingId: id,
          version: data.version ?? state.formData.version
        }
      })),

      reset: () => set({
        formData: defaultPartFormData,
        currentStep: 1
      }),

      setLocation: (governorateId, wilayaId, governorateNameAr, wilayaNameAr) => set((state) => ({
        formData: {
          ...state.formData,
          governorateId,
          wilayaId,
          governorateNameAr,
          wilayaNameAr
        }
      })),

      nextStep: () => set((state) => ({ currentStep: state.currentStep + 1 })),
      prevStep: () => set((state) => ({ currentStep: Math.max(1, state.currentStep - 1) })),
      goToStep: (step) => set({ currentStep: step }),
    }),
    {
      name: 'part-wizard-draft',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state): PartWizardPersistedState => {
        const { editMode, editListingId, version, ...draftableData } = state.formData;
        return {
          formData: draftableData,
          currentStep: state.currentStep,
        };
      },
      merge: mergePartWizardState,
    }
  )
);
