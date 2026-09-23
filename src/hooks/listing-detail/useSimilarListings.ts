import { useQuery } from '@tanstack/react-query'
import { listingsApi } from '../../api/listings'
import { Listing } from '../../types/listing.types'

export type SimilarCarItem = Listing

export interface UseSimilarListingsResult {
  items: SimilarCarItem[]
  isLoading: boolean
  isError: boolean
  refetch: () => void
}

/**
 * useSimilarListings
 *
 * Fetches similar listings for a given listing ID via GET /listings/:id/similar?limit={limit}.
 *
 * Query Key: ['listing-similar', id, limit]
 *
 * Behavior:
 * - On success: returns fetched array of SimilarCarItem.
 * - On 404: original listing is hidden/not visible, so gracefully returns empty items array (isError: false).
 * - On other errors: sets isError: true, items: [].
 */
export function useSimilarListings(id: string, limit = 8): UseSimilarListingsResult {
  const query = useQuery<SimilarCarItem[], unknown>({
    queryKey: ['listing-similar', id, limit],
    queryFn: async () => {
      try {
        const res = await listingsApi.getSimilar(id, limit)
        return res.data ?? []
      } catch (err: any) {
        if (err?.response?.status === 404) {
          return []
        }
        throw err
      }
    },
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5, // 5 minutes matching backend cache TTL
  })

  return {
    items: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: () => {
      query.refetch()
    },
  }
}
