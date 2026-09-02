import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ServiceImageItem {
  uri: string;
  isPrimary?: boolean;
}

export interface ServiceExistingImage {
  id: string;
  url: string;
  isPrimary?: boolean;
}

export interface ServiceFormData {
  // Step 1
  serviceType: string | null;
  providerType: string | null;
  providerName: string;

  // Step 2
  images: ServiceImageItem[];
  existingImages: ServiceExistingImage[];
  removedImageIds: string[];

  // Step 3
  title: string;
  description: string;
  specializations: string[];
  isHomeService: boolean;

  // Step 4
  workingDays: string[];
  workingHoursOpen: string | null;
  workingHoursClose: string | null;

  // Step 5
  priceFrom: number | null;
  priceTo: number | null;
  currency: string;
  governorateId: number | null;
  wilayaId: number | null;
  governorateNameAr: string;
  wilayaNameAr: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  contactPhone: string;
  whatsapp: string;
  website: string;

  // Wizard
  editMode: boolean;
  editListingId: string | null;
}

export const defaultServiceFormData: ServiceFormData = {
  // Step 1
  serviceType: null,
  providerType: null,
  providerName: '',

  // Step 2
  images: [],
  existingImages: [],
  removedImageIds: [],

  // Step 3
  title: '',
  description: '',
  specializations: [],
  isHomeService: false,

  // Step 4
  workingDays: [],
  workingHoursOpen: null,
  workingHoursClose: null,

  // Step 5
  priceFrom: null,
  priceTo: null,
  currency: 'OMR',
  governorateId: null,
  wilayaId: null,
  governorateNameAr: '',
  wilayaNameAr: '',
  address: '',
  latitude: null,
  longitude: null,
  contactPhone: '',
  whatsapp: '',
  website: '',

  // Wizard
  editMode: false,
  editListingId: null,
};

export type PersistedServiceFormData = Omit<ServiceFormData, 'editMode' | 'editListingId'>;

export interface ServiceWizardPersistedState {
  formData: PersistedServiceFormData;
  currentStep: number;
}

export interface ServiceWizardState {
  formData: ServiceFormData;
  currentStep: number;

  setField: <K extends keyof ServiceFormData>(field: K, value: ServiceFormData[K]) => void;
  setFields: (fields: Partial<ServiceFormData>) => void;

  setEditMode: (id: string, data: Partial<ServiceFormData>) => void;
  reset: () => void;

  setLocation: (
    governorateId: number,
    wilayaId: number,
    governorateNameAr: string,
    wilayaNameAr: string
  ) => void;

  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
}

export function mergeServiceWizardState(
  persistedState: unknown,
  currentState: ServiceWizardState
): ServiceWizardState {
  const typedPersistedState = persistedState as ServiceWizardPersistedState | undefined;
  return {
    ...currentState,
    ...typedPersistedState,
    formData: {
      ...defaultServiceFormData,
      ...(typedPersistedState?.formData || {}),
    },
  };
}

export const useServiceWizardStore = create<ServiceWizardState>()(
  persist(
    (set) => ({
      formData: defaultServiceFormData,
      currentStep: 1,

      setField: (field, value) =>
        set((state) => ({
          formData: {
            ...state.formData,
            [field]: value,
          },
        })),

      setFields: (fields) =>
        set((state) => ({
          formData: {
            ...state.formData,
            ...fields,
          },
        })),

      setEditMode: (id, data) =>
        set(() => ({
          formData: {
            ...defaultServiceFormData,
            ...data,
            editMode: true,
            editListingId: id,
          },
        })),

      reset: () =>
        set({
          formData: defaultServiceFormData,
          currentStep: 1,
        }),

      setLocation: (governorateId, wilayaId, governorateNameAr, wilayaNameAr) =>
        set((state) => ({
          formData: {
            ...state.formData,
            governorateId,
            wilayaId,
            governorateNameAr,
            wilayaNameAr,
          },
        })),

      nextStep: () => set((state) => ({ currentStep: state.currentStep + 1 })),
      prevStep: () => set((state) => ({ currentStep: Math.max(1, state.currentStep - 1) })),
      goToStep: (step) => set({ currentStep: step }),
    }),
    {
      name: 'service-wizard-draft',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state): ServiceWizardPersistedState => {
        const { editMode, editListingId, ...draftableData } = state.formData;
        return {
          formData: draftableData,
          currentStep: state.currentStep,
        };
      },
      merge: mergeServiceWizardState,
    }
  )
);
