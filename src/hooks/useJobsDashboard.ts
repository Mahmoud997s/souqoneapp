import { useQuery } from '@tanstack/react-query'
import { jobsApi } from '../api/jobs'

export function useMyJobs(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['myJobs', params],
    queryFn: async () => {
      const res = await jobsApi.getMyJobs(params)
      return res.data
    },
  })
}

export function useMyApplications() {
  return useQuery({
    queryKey: ['myApplications'],
    queryFn: async () => {
      const res = await jobsApi.getMyApplications()
      return res.data
    },
  })
}

export function useJobApplications(jobId: string) {
  return useQuery({
    queryKey: ['jobApplications', jobId],
    queryFn: async () => {
      const res = await jobsApi.getApplicants(jobId)
      return res.data
    },
    enabled: !!jobId,
  })
}
