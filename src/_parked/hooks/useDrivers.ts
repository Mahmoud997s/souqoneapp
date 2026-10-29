import { useQuery } from '@tanstack/react-query'
import { jobsApi } from '../api/jobs'

export function useDrivers(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['drivers', params],
    queryFn: async () => {
      const res = await jobsApi.getAllDrivers(params)
      return res.data
    },
  })
}

export function useDriver(id: string) {
  return useQuery({
    queryKey: ['driver', id],
    queryFn: async () => {
      const res = await jobsApi.getDriverById(id)
      return res.data
    },
    enabled: !!id,
  })
}
