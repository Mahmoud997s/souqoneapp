import { create } from 'zustand'
import { DriverProfile, EmployerProfile } from '../types/jobs.types'

interface JobProfileState {
  driverProfile: DriverProfile | null
  employerProfile: EmployerProfile | null
  activeRole: 'driver' | 'employer' | null
  setDriverProfile: (p: DriverProfile | null) => void
  setEmployerProfile: (p: EmployerProfile | null) => void
  setActiveRole: (r: 'driver' | 'employer' | null) => void
  reset: () => void
}

export const useJobProfileStore = create<JobProfileState>((set) => ({
  driverProfile: null,
  employerProfile: null,
  activeRole: null,
  setDriverProfile: (p) => set({ driverProfile: p }),
  setEmployerProfile: (p) => set({ employerProfile: p }),
  setActiveRole: (r) => set({ activeRole: r }),
  reset: () => set({ driverProfile: null, employerProfile: null, activeRole: null }),
}))
