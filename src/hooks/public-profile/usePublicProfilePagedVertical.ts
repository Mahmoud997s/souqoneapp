import { useInfiniteQuery } from '@tanstack/react-query'
import { UnifiedCardItem } from '../../types/unified-card.types'
import { PublicProfileListingVertical, publicProfileKeys } from './publicProfileKeys'

export interface PublicProfileApiPage<T> {
  items?: T[]
  data?: T[]
  page?: number
  totalPages?: number
  meta?: { page?: number; totalPages?: number }
}

interface PublicProfilePagedOptions<T> {
  userId: string
  enabled?: boolean
  vertical: PublicProfileListingVertical
  filters: Record<string, unknown>
  fetchPage: (params: Record<string, unknown>) => Promise<PublicProfileApiPage<T>>
  mapItem: (item: T) => UnifiedCardItem
}

const PAGE_SIZE = 10

export function usePublicProfilePagedVertical<T>({ userId, enabled = true, vertical, filters, fetchPage, mapItem }: PublicProfilePagedOptions<T>) {
  const keyFilters = { ...filters, limit: PAGE_SIZE }

  return useInfiniteQuery({
    queryKey: publicProfileKeys.list(userId, vertical, keyFilters),
    enabled: Boolean(userId) && enabled,
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1 }) => {
      const response = await fetchPage({ ...keyFilters, page: pageParam })
      const rows = Array.isArray(response.items) ? response.items : Array.isArray(response.data) ? response.data : []
      const page = response.meta?.page ?? response.page
      const totalPages = response.meta?.totalPages ?? response.totalPages
      const hasValidMeta = typeof page === 'number' && typeof totalPages === 'number'
        && Number.isInteger(page) && Number.isInteger(totalPages) && page > 0 && totalPages >= page

      return {
        data: rows.map(mapItem),
        page: hasValidMeta ? page : pageParam,
        totalPages: hasValidMeta ? totalPages : pageParam,
      }
    },
    getNextPageParam: (lastPage) => lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
  })
}
