import { useQuery } from '@tanstack/react-query'
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
