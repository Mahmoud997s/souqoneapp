import { useInfiniteQuery } from '@tanstack/react-query'
import { servicesApi } from '../../api/services'
import { Service } from '../../types/listing.types'
import { PaginatedResult } from '../../types/my-listings.types'

export function useMyServicesInfinite() {
  return useInfiniteQuery({
    queryKey: ['my-services'],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await servicesApi.getMy({ page: pageParam as number, limit: 20 })
      return res.data
    },
    getNextPageParam: (lastPage: PaginatedResult<Service>) => {
      const meta = lastPage?.meta
      if (meta && typeof meta.page === 'number' && typeof meta.totalPages === 'number') {
        return meta.page < meta.totalPages ? meta.page + 1 : undefined
      }
      return undefined
    },
    initialPageParam: 1,
  })
}
