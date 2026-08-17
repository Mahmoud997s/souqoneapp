import { useInfiniteQuery } from '@tanstack/react-query'
import { busesApi } from '../../api/buses'
import { BusListing } from '../../types/bus.types'
import { PaginatedResult } from '../../types/my-listings.types'

export function useMyBusesInfinite() {
  return useInfiniteQuery({
    queryKey: ['my-buses'],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await busesApi.getMy({ page: pageParam as number, limit: 20 })
      return res.data
    },
    getNextPageParam: (lastPage: PaginatedResult<BusListing>) => {
      const meta = lastPage?.meta
      if (meta && typeof meta.page === 'number' && typeof meta.totalPages === 'number') {
        return meta.page < meta.totalPages ? meta.page + 1 : undefined
      }
      return undefined
    },
    initialPageParam: 1,
  })
}
