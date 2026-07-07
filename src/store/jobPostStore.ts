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
  languages: string[]
  vehicleTypes: string[]
  hasOwnVehicle: boolean
  governorate: string
  city: string
  contactPhone: string
  contactEmail: string
  whatsapp: string

  set: (updates: Partial<Omit<JobPostState, 'set' | 'reset'>>) => void
  reset: () => void
}

const initial: Omit<JobPostState, 'set' | 'reset'> = {
  jobType: 'HIRING',
  title: '',
  description: '',
  employmentType: 'FULL_TIME',
  salary: undefined,
  salaryPeriod: 'MONTHLY',
  licenseTypes: [],
  experienceYears: undefined,
  languages: [],
  vehicleTypes: [],
  hasOwnVehicle: false,
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
      set: (updates) => set((state) => ({ ...state, ...updates })),
      reset: () => set(initial),
    }),
    {
      name: 'job-post-draft-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
