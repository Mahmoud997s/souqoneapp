import { useQuery } from '@tanstack/react-query'
import { jobsApi } from '../api/jobs'
import { DriverJob } from '../types/jobs.types'

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

import { useInfiniteQuery } from '@tanstack/react-query'

export function useInfiniteJobsRaw(params?: Record<string, unknown>) {
  return useInfiniteQuery({
    queryKey: ['jobsRawInfinite', params],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await jobsApi.getAll({ ...params, page: pageParam, limit: 10 });
      return res.data as any; // Usually returns { items: DriverJob[], meta: { totalPages: number } }
    },
    getNextPageParam: (lastPage, allPages) => {
      const totalPages = lastPage?.meta?.totalPages || 1;
      const nextPage = allPages.length + 1;
      return nextPage <= totalPages ? nextPage : undefined;
    },
    initialPageParam: 1,
  });
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
