import { useQuery } from '@tanstack/react-query'
import { busesApi } from '../../api/buses'
import { BusListing } from '../../types/bus.types'
import { busQueryKeys } from '../../utils/listing-detail/busQueryKeys'

export type SimilarBusItem = BusListing

export interface UseBusSimilarListingsResult {
  items: SimilarBusItem[]
  isLoading: boolean
  isError: boolean
  refetch: () => void
}

/**
 * useBusSimilarListings
 *
 * Fetches similar bus listings for a given bus ID via GET /buses/:id/similar?limit={limit}.
 *
 * Query Key: ['bus-similar', id, limit]
 *
 * Behavior:
 * - On success: returns fetched array of SimilarBusItem.
 * - On 404: original listing is hidden/not visible, so gracefully returns empty items array (isError: false).
 * - On other errors: sets isError: true, items: [].
 */
export function useBusSimilarListings(id: string, limit = 8): UseBusSimilarListingsResult {
  const query = useQuery<SimilarBusItem[], unknown>({
    queryKey: busQueryKeys.similar(id, limit),
    queryFn: async () => {
      try {
        const res = await busesApi.getSimilar(id, limit)
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
