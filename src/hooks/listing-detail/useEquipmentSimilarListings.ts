import { useQuery } from '@tanstack/react-query'
import { equipmentApi } from '../../api/equipment'
import { EquipmentSimilarItemApi } from '../../types/equipmentDetailApi.types'
import { equipmentQueryKeys } from '../../utils/listing-detail/equipmentQueryKeys'

export type SimilarEquipmentItem = EquipmentSimilarItemApi

export interface UseEquipmentSimilarListingsResult {
  items: SimilarEquipmentItem[]
  isLoading: boolean
  isError: boolean
  refetch: () => void
}

/**
 * useEquipmentSimilarListings
 *
 * Fetches similar equipment listings for a given equipment ID via GET /equipment/:id/similar?limit={limit}.
 *
 * Query Key: ['equipment-similar', id, limit]
 *
 * Behavior:
 * - On success: returns fetched array of SimilarEquipmentItem.
 * - On 404: original listing is hidden/deleted/not visible, so gracefully returns empty items array (isError: false).
 * - On other errors: sets isError: true, items: [].
 */
export function useEquipmentSimilarListings(id: string, limit = 8): UseEquipmentSimilarListingsResult {
  const query = useQuery<SimilarEquipmentItem[], unknown>({
    queryKey: equipmentQueryKeys.similar(id, limit),
    queryFn: async () => {
      try {
        const res = await equipmentApi.getSimilar(id, limit)
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
