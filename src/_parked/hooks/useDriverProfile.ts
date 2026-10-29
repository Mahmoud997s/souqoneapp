import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { jobsApi } from '../api/jobs'
import { CreateDriverProfileDto } from '../types/jobs.types'

export function useMyDriverProfile() {
  return useQuery({
    queryKey: ['myDriverProfile'],
    queryFn: async () => {
      try {
        const res = await jobsApi.driverProfileGet()
        return res.data
      } catch (e) {
        // Return null if not found (expected when user has not onboarded yet)
        return null
      }
    },
  })
}

export function useCreateDriverProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateDriverProfileDto) => jobsApi.driverProfileCreate(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['myDriverProfile'] })
      qc.invalidateQueries({ queryKey: ['myJobs'] })
      qc.invalidateQueries({ queryKey: ['drivers'] })
    },
  })
}

export function useUpdateDriverProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<CreateDriverProfileDto>) => jobsApi.driverProfileUpdate(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['myDriverProfile'] })
      qc.invalidateQueries({ queryKey: ['drivers'] })
    },
  })
}
