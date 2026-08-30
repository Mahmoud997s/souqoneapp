import { create } from 'zustand';

export interface CarrierWizardState {
  companyName: string;
  bio: string;
  vehicleTypes: string[];
  serviceTypes: string[];
  governorateId: number | null;
  wilayaId: number | null;
  governorateNameAr: string;
  wilayaNameAr: string;
  governorate: string;
  city: string;
  baseLat?: number;
  baseLng?: number;
  contactPhone: string;
  whatsapp: string;
  errors: Record<string, string>;
  
  // Actions
  // Actions
  setLocation: (govId: number, wilId: number, govName: string, wilName: string) => void;
  setField: <K extends keyof CarrierWizardState>(field: K, value: CarrierWizardState[K]) => void;
  setErrors: (errors: Record<string, string>) => void;
  toggleArrayItem: (field: 'vehicleTypes' | 'serviceTypes', value: string) => void;
  reset: () => void;
}

const initialState = {
  companyName: '',
  bio: '',
  vehicleTypes: [],
  serviceTypes: [],
  governorateId: null,
  wilayaId: null,
  governorateNameAr: '',
  wilayaNameAr: '',
  governorate: '',
  city: '',
  baseLat: undefined,
  baseLng: undefined,
  contactPhone: '',
  whatsapp: '',
  errors: {},
};

export const useCarrierWizardStore = create<CarrierWizardState>((set) => ({
  ...initialState,

  setLocation: (govId, wilId, govName, wilName) => set((state) => ({
    ...state,
    governorateId: govId,
    wilayaId: wilId,
    governorateNameAr: govName,
    wilayaNameAr: wilName,
  })),

  setField: (field, value) => set((state) => ({ ...state, [field]: value })),
  
  setErrors: (errors) => set((state) => ({ ...state, errors })),
  
  toggleArrayItem: (field, value) => set((state) => {
    const currentArray = state[field];
    if (currentArray.includes(value)) {
      return { ...state, [field]: currentArray.filter(i => i !== value) };
    } else {
      return { ...state, [field]: [...currentArray, value] };
    }
  }),

  reset: () => set(initialState),
}));
