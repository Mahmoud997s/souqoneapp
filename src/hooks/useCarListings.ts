import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { listingsApi } from '../api/listings'
import { Listing } from '../types/listing.types'
import { parseListEnvelope } from '../utils/parseListEnvelope'

export function useCarListings(params?: Record<string, unknown>, options?: any) {
  return useQuery<Listing[], Error>({
    queryKey: ['car-listings', params],
    queryFn: async () => {
      const res = await listingsApi.getAll(params)
      const { items } = parseListEnvelope<Listing>(res.data)
      return items
    },
    ...options,
  })
}

export function useInfiniteCarListings(params?: Record<string, unknown>, options?: any) {
  const limit = (params?.limit as number) || 30

  return useInfiniteQuery({
    queryKey: ['car-listings-infinite', params],
    queryFn: async ({ pageParam = 1 }) => {
      const pageNum = pageParam as number
      const res = await listingsApi.getAll({ ...params, page: pageNum, limit })
      const { items, meta, hasNextPage } = parseListEnvelope<Listing>(res.data)
      const resolvedHasNextPage = meta !== undefined ? hasNextPage : items.length === limit

      return {
        items,
        nextPage: resolvedHasNextPage ? pageNum + 1 : undefined,
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
    ...options,
  })
}
