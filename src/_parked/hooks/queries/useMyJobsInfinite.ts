import { useInfiniteQuery } from '@tanstack/react-query'
import { jobsApi } from '../../api/jobs'
import { DriverJob } from '../../types/jobs.types'
import { PaginatedResult } from '../../types/my-listings.types'

export function useMyJobsInfinite() {
  return useInfiniteQuery({
    queryKey: ['my-jobs'],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await jobsApi.getMy({ page: pageParam as number, limit: 20 })
      return res.data
    },
    getNextPageParam: (lastPage: PaginatedResult<DriverJob>) => {
      const meta = lastPage?.meta
      if (meta && typeof meta.page === 'number' && typeof meta.totalPages === 'number') {
        return meta.page < meta.totalPages ? meta.page + 1 : undefined
      }
      return undefined
    },
    initialPageParam: 1,
  })
}
