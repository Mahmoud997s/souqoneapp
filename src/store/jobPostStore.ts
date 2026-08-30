import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { JobType, EmploymentType, SalaryPeriod, LicenseType } from '../types/jobs.types'

interface JobPostState {
  jobType: JobType
  title: string
  description: string
  employmentType: EmploymentType
  salary?: number
  salaryPeriod: SalaryPeriod
  licenseTypes: LicenseType[]
  experienceYears?: number
  minAge?: number
  maxAge?: number
  nationality?: string
  languages: string[]
  vehicleTypes: string[]
  hasOwnVehicle: boolean
  governorateId: number | null
  wilayaId: number | null
  governorateNameAr: string
  wilayaNameAr: string
  governorate: string
  city: string
  contactPhone: string
  contactEmail: string
  whatsapp: string

  setLocation: (govId: number, wilId: number, govName: string, wilName: string) => void
  set: (updates: Partial<Omit<JobPostState, 'set' | 'reset' | 'setLocation'>>) => void
  reset: () => void
}

const initial: Omit<JobPostState, 'set' | 'reset' | 'setLocation'> = {
  jobType: 'HIRING',
  title: '',
  description: '',
  employmentType: 'FULL_TIME',
  salary: undefined,
  salaryPeriod: 'MONTHLY',
  licenseTypes: [],
  experienceYears: undefined,
  minAge: undefined,
  maxAge: undefined,
  nationality: undefined,
  languages: [],
  vehicleTypes: [],
  hasOwnVehicle: false,
  governorateId: null,
  wilayaId: null,
  governorateNameAr: '',
  wilayaNameAr: '',
  governorate: '',
  city: '',
  contactPhone: '',
  contactEmail: '',
  whatsapp: '',
}

export const useJobPostStore = create<JobPostState>()(
  persist(
    (set) => ({
      ...initial,
      setLocation: (govId, wilId, govName, wilName) => 
        set((state) => ({ 
          ...state, 
          governorateId: govId, 
          wilayaId: wilId, 
          governorateNameAr: govName, 
          wilayaNameAr: wilName 
        })),
      set: (updates) => set((state) => ({ ...state, ...updates })),
      reset: () => set(initial),
    }),
    {
      name: 'job-post-draft-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
