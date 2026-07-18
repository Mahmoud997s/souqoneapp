import { create } from 'zustand';
import { TransportServiceType } from '../types/transport.types';

export interface TransportWizardState {
  serviceType: TransportServiceType | '';
  cargoDescription: string;
  weightTons?: number;
  requiresHelper: boolean;

  fromGovernorate: string;
  fromCity?: string;
  fromLat?: number;
  fromLng?: number;

  toGovernorate: string;
  toCity?: string;
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
  fromGovernorate: '',
  toGovernorate: '',
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
  
  reset: () => set({ data: initialState, currentStep: 1, errors: {} }),
}));
