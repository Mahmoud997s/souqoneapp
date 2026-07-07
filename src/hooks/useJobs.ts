import { useQuery } from '@tanstack/react-query'
import { jobsApi } from '../api/jobs'
import { mapJobToCard } from '../utils/mappers'
import { DriverJob } from '../types/jobs.types'

export function useJobs(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['jobs', params],
    queryFn: async () => {
      const res = await jobsApi.getAll(params)
      const raw = (res.data as any)?.items ?? (res.data as any)?.data ?? res.data
      const arr = Array.isArray(raw) ? raw : []
      return arr.map(mapJobToCard)
    },
  })
}

/** Returns raw DriverJob[] — use this when you need full job data for JobCard */
export function useJobsRaw(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['jobsRaw', params],
    queryFn: async () => {
      const res = await jobsApi.getAll(params)
      const raw = (res.data as any)?.items ?? (res.data as any)?.data ?? res.data
      return (Array.isArray(raw) ? raw : []) as DriverJob[]
    },
  })
}

export function useJob(id: string) {
  return useQuery({
    queryKey: ['job', id],
    queryFn: async () => {
      const res = await jobsApi.getById(id)
      return res.data
    },
    enabled: !!id,
  })
}
