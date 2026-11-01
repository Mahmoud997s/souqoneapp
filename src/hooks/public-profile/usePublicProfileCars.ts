import { useInfiniteQuery } from '@tanstack/react-query'
import { listingsApi } from '../../api/listings'
import { Listing } from '../../types/listing.types'
import { mapListingToCard } from '../../utils/mappers'
import { publicProfileKeys } from './publicProfileKeys'

const PAGE_SIZE = 10

export function usePublicProfileCars(userId: string, enabled = true) {
  const filters = { sellerId: userId, status: 'ACTIVE', limit: PAGE_SIZE }

  return useInfiniteQuery({
    queryKey: publicProfileKeys.list(userId, 'car', filters),
    enabled: Boolean(userId) && enabled,
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1 }) => {
      const response = await listingsApi.getAll({ ...filters, page: pageParam })
      const payload = response.data as unknown as {
        items?: Listing[]
        data?: Listing[]
        page?: number
        totalPages?: number
        meta?: { page?: number; totalPages?: number }
      }
      const rows = Array.isArray(payload.items) ? payload.items : Array.isArray(payload.data) ? payload.data : []
      const page = payload.meta?.page ?? payload.page
      const totalPages = payload.meta?.totalPages ?? payload.totalPages
      const hasValidMeta = typeof page === 'number' && typeof totalPages === 'number'
        && Number.isInteger(page) && Number.isInteger(totalPages) && page > 0 && totalPages >= page

      return {
        data: rows.map(mapListingToCard),
        page: hasValidMeta ? page : pageParam,
        totalPages: hasValidMeta ? totalPages : pageParam,
      }
    },
    getNextPageParam: (lastPage) => lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
  })
}
