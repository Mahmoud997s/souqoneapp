import { useContext } from 'react'
import { QueryClient, QueryClientContext, useQuery } from '@tanstack/react-query'
import { listingsApi } from '../../api/listings'
import { busesApi } from '../../api/buses'
import { equipmentApi } from '../../api/equipment'
import { partsApi } from '../../api/parts'
import { servicesApi } from '../../api/services'
import type { Listing, Part, Service } from '../../types/listing.types'
import type { BusListing } from '../../types/bus.types'
import type { EquipmentSimilarItemApi } from '../../types/equipmentDetailApi.types'
import { busQueryKeys } from '../../utils/listing-detail/busQueryKeys'
import { equipmentQueryKeys } from '../../utils/listing-detail/equipmentQueryKeys'

export type SimilarCarItem = Listing
export type SimilarBusItem = BusListing
export type SimilarEquipmentItem = EquipmentSimilarItemApi
export type SimilarPartItem = Part
export type SimilarServiceItem = Service

export type SimilarVertical = 'car' | 'bus' | 'equipment' | 'part' | 'service'

export interface SimilarItemByVertical {
  car: SimilarCarItem
  bus: SimilarBusItem
  equipment: SimilarEquipmentItem
  part: SimilarPartItem
  service: SimilarServiceItem
}

export interface UseSimilarListingsResult<TItem = SimilarCarItem> {
  items: TItem[]
  isLoading: boolean
  isError: boolean
  refetch: () => void
}

function getSimilarQueryKey(vertical: SimilarVertical, id: string, limit: number): readonly unknown[] {
  switch (vertical) {
    case 'car':
      return ['listing-similar', id, limit]
    case 'bus':
      return busQueryKeys.similar(id, limit)
    case 'equipment':
      return equipmentQueryKeys.similar(id, limit)
    case 'part':
      return ['part-similar', id, limit]
    case 'service':
      return ['service-similar', id, limit]
  }
}

async function fetchSimilarByVertical<V extends SimilarVertical>(
  vertical: V,
  id: string,
  limit: number,
): Promise<SimilarItemByVertical[V][]> {
  switch (vertical) {
    case 'car': {
      const res = await listingsApi.getSimilar(id, limit)
      return (res.data ?? []) as SimilarItemByVertical[V][]
    }
    case 'bus': {
      const res = await busesApi.getSimilar(id, limit)
      return (res.data ?? []) as SimilarItemByVertical[V][]
    }
    case 'equipment': {
      const res = await equipmentApi.getSimilar(id, limit)
      return (res.data ?? []) as SimilarItemByVertical[V][]
    }
    case 'part': {
      const res = await partsApi.getSimilar(id, limit)
      return (res.data ?? []) as SimilarItemByVertical[V][]
    }
    case 'service': {
      const res = await servicesApi.getSimilar(id, limit)
      return (res.data ?? []) as SimilarItemByVertical[V][]
    }
  }
}

function isHttp404(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const response = (err as { response?: { status?: unknown } }).response
  return response?.status === 404
}

/**
 * useVerticalSimilarListings
 *
 * Single generic hook replacing per-vertical similar listing hooks across all 5 main verticals:
 * - car       -> GET /listings/:id/similar?limit={limit}
 * - bus       -> GET /buses/:id/similar?limit={limit}
 * - equipment -> GET /equipment/:id/similar?limit={limit}
 * - part      -> GET /parts/:id/similar?limit={limit}
 * - service   -> GET /services/:id/similar?limit={limit}
 *
 * Behavior:
 * - On success: returns fetched array of items.
 * - On 404: original listing is hidden/deleted/not visible, so gracefully returns [] (isError: false).
 * - On other errors: sets isError: true, items: [].
 */
const fallbackQueryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
})

export function useVerticalSimilarListings<V extends SimilarVertical>(
  vertical: V,
  id: string,
  limit = 8,
): UseSimilarListingsResult<SimilarItemByVertical[V]> {
  const contextClient = useContext(QueryClientContext)
  const hasQueryClient = Boolean(contextClient)

  const query = useQuery<SimilarItemByVertical[V][], unknown>(
    {
      queryKey: getSimilarQueryKey(vertical, id, limit),
      queryFn: async () => {
        try {
          return await fetchSimilarByVertical(vertical, id, limit)
        } catch (err: unknown) {
          if (isHttp404(err)) {
            return []
          }
          throw err
        }
      },
      enabled: Boolean(id) && hasQueryClient,
      staleTime: 1000 * 60 * 5, // 5 minutes matching backend cache TTL
    },
    contextClient ?? fallbackQueryClient,
  )

  return {
    items: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: () => {
      query.refetch()
    },
  }
}

/**
 * Convenience wrapper for Cars detail screen & legacy callers.
 */
export function useSimilarListings(id: string, limit = 8): UseSimilarListingsResult<SimilarCarItem> {
  return useVerticalSimilarListings('car', id, limit)
}
