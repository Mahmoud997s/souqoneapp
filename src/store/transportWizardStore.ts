import { create } from 'zustand';
import { TransportServiceType } from '../types/transport.types';

export interface TransportWizardState {
  serviceType: TransportServiceType | '';
  cargoDescription: string;
  weightTons?: number;
  requiresHelper: boolean;

  fromGovernorateId: number | null;
  fromWilayaId: number | null;
  fromGovernorateNameAr: string;
  fromWilayaNameAr: string;
  fromLat?: number;
  fromLng?: number;

  toGovernorateId: number | null;
  toWilayaId: number | null;
  toGovernorateNameAr: string;
  toWilayaNameAr: string;
  toLat?: number;
  toLng?: number;

  scheduledDate?: string;
  scheduledTime?: string;
  scheduledDateObj?: string;
  scheduledTimeObj?: string;
  isFlexible: boolean;
  timingType?: 'asap' | 'scheduled';

  budgetMin?: number;
  budgetMax?: number;

  images: string[];
  notes?: string;
}

const initialState: TransportWizardState = {
  serviceType: '',
  cargoDescription: '',
  requiresHelper: false,
  fromGovernorateId: null,
  fromWilayaId: null,
  fromGovernorateNameAr: '',
  fromWilayaNameAr: '',
  toGovernorateId: null,
  toWilayaId: null,
  toGovernorateNameAr: '',
  toWilayaNameAr: '',
  isFlexible: true,
  images: [],
  notes: '',
};

interface TransportWizardStore {
  currentStep: number;
  data: TransportWizardState;
  errors: Record<string, string>;
  setField: <K extends keyof TransportWizardState>(key: K, value: TransportWizardState[K]) => void;
  setErrors: (errors: Record<string, string>) => void;
  clearErrors: () => void;
  nextStep: () => void;
  prevStep: () => void;
  setStep: (step: number) => void;
  setFromLocation: (govId: number, wilId: number, govName: string, wilName: string) => void;
  setToLocation: (govId: number, wilId: number, govName: string, wilName: string) => void;
  reset: () => void;
}

export const useTransportWizardStore = create<TransportWizardStore>((set) => ({
  currentStep: 1,
  data: initialState,
  errors: {},

  setField: (key, value) => 
    set((state) => ({ data: { ...state.data, [key]: value } })),

  setErrors: (errors) => set({ errors }),

  clearErrors: () => set({ errors: {} }),
    
  nextStep: () => 
    set((state) => ({ currentStep: Math.min(state.currentStep + 1, 5), errors: {} })),
    
  prevStep: () => 
    set((state) => ({ currentStep: Math.max(state.currentStep - 1, 1), errors: {} })),
    
  setStep: (step) => set({ currentStep: step }),
  
  setFromLocation: (govId, wilId, govName, wilName) => set((state) => ({
    data: {
      ...state.data,
      fromGovernorateId: govId,
      fromWilayaId: wilId,
      fromGovernorateNameAr: govName,
      fromWilayaNameAr: wilName,
    }
  })),

  setToLocation: (govId, wilId, govName, wilName) => set((state) => ({
    data: {
      ...state.data,
      toGovernorateId: govId,
      toWilayaId: wilId,
      toGovernorateNameAr: govName,
      toWilayaNameAr: wilName,
    }
  })),

  reset: () => set({ data: initialState, currentStep: 1, errors: {} }),
}));
