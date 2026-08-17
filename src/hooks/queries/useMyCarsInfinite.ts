import { useInfiniteQuery } from '@tanstack/react-query'
import { listingsApi } from '../../api/listings'
import { Listing } from '../../types/listing.types'
import { PaginatedResult } from '../../types/my-listings.types'

export function useMyCarsInfinite() {
  return useInfiniteQuery({
    queryKey: ['my-cars'],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await listingsApi.getMy({ page: pageParam as number, limit: 20 })
      return res.data
    },
    getNextPageParam: (lastPage: PaginatedResult<Listing>) => {
      const meta = lastPage?.meta
      if (meta && typeof meta.page === 'number' && typeof meta.totalPages === 'number') {
        return meta.page < meta.totalPages ? meta.page + 1 : undefined
      }
      return undefined
    },
    initialPageParam: 1,
  })
}
