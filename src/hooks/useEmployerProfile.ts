import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { jobsApi } from '../api/jobs'
import { CreateEmployerProfileDto } from '../types/jobs.types'

export function useMyEmployerProfile() {
  return useQuery({
    queryKey: ['myEmployerProfile'],
    queryFn: async () => {
      try {
        const res = await jobsApi.employerProfileGet()
        return res.data
      } catch (e) {
        // Return null if not found (expected when user has not onboarded yet)
        return null
      }
    },
  })
}

export function useCreateEmployerProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateEmployerProfileDto) => jobsApi.employerProfileCreate(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['myEmployerProfile'] })
      qc.invalidateQueries({ queryKey: ['myJobs'] })
    },
  })
}

export function useUpdateEmployerProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<CreateEmployerProfileDto>) => jobsApi.employerProfileUpdate(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['myEmployerProfile'] })
    },
  })
}
