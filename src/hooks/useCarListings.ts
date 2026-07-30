import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { listingsApi } from '../api/listings'
import { Listing } from '../types/listing.types'



export function useCarListings(params?: Record<string, unknown>, options?: any) {
  return useQuery<Listing[], Error>({
    queryKey: ['car-listings', params],
    queryFn: async () => {
      const res = await listingsApi.getAll(params)
      const raw = (res.data as any)?.items ?? (res.data as any)?.data ?? res.data
      return (Array.isArray(raw) ? raw : []) as Listing[]
    },
    ...options,
  })
}

export function useInfiniteCarListings(params?: Record<string, unknown>, options?: any) {
  const limit = (params?.limit as number) || 30;
  
  return useInfiniteQuery({
    queryKey: ['car-listings-infinite', params],
    queryFn: async ({ pageParam = 1 }) => {
      const pageNum = pageParam as number;
      const res = await listingsApi.getAll({ ...params, page: pageNum, limit })
      const data = res.data as any;
      const items = data?.items ?? data?.data ?? data
      const listings = (Array.isArray(items) ? items : []) as Listing[]
      
      const hasNextPage = data?.meta?.hasNextPage ?? (listings.length === limit);
      return {
        items: listings,
        nextPage: hasNextPage ? pageNum + 1 : undefined
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
    ...options
  })
}
