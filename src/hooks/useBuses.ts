import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { busesApi } from '../api/buses'
import { mapBusToCard } from '../utils/mappers'
import { parseListEnvelope } from '../utils/parseListEnvelope'
import { BusManufacturer, BusModel, BusListing } from '../types/bus.types'
import { UnifiedCardItem } from '../types/unified-card.types'

function normalizeBusListPayload(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return raw
  }

  const candidate = raw as Record<string, unknown>
  if ('items' in candidate) {
    return raw
  }

  if ('data' in candidate) {
    if ('meta' in candidate && candidate.meta !== undefined) {
      const meta = candidate.meta as Record<string, unknown> | null
      if (
        meta &&
        typeof meta === 'object' &&
        !Array.isArray(meta) &&
        typeof meta.total === 'undefined' &&
        typeof meta.limit === 'undefined'
      ) {
        const len = Array.isArray(candidate.data) ? candidate.data.length : 0
        return {
          items: candidate.data,
          meta: {
            ...meta,
            total: len,
            limit: 10,
          },
        }
      }
      return {
        items: candidate.data,
        meta: candidate.meta,
      }
    }

    if (
      'total' in candidate ||
      'page' in candidate ||
      'limit' in candidate ||
      'totalPages' in candidate
    ) {
      return {
        items: candidate.data,
        meta: {
          total: candidate.total,
          page: candidate.page ?? 1,
          limit: candidate.limit ?? 10,
          totalPages: candidate.totalPages ?? 1,
        },
      }
    }

    return { items: candidate.data }
  }

  return raw
}

export function useBuses(params?: Record<string, unknown>, options?: any) {
  return useQuery<UnifiedCardItem[], Error>({
    queryKey: ['buses', params],
    queryFn: async () => {
      const res = await busesApi.getAll(params)
      const { items } = parseListEnvelope<BusListing>(normalizeBusListPayload(res.data))
      return items.map(mapBusToCard)
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
    ...options,
  })
}

export function useInfiniteBuses(params?: Record<string, unknown>) {
  return useInfiniteQuery({
    queryKey: ['buses_infinite', params],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await busesApi.getAll({ ...params, page: pageParam, limit: 10 })
      const { items, meta } = parseListEnvelope<BusListing>(normalizeBusListPayload(res.data))
      const page = meta?.page ?? pageParam
      const totalPages = meta?.totalPages ?? pageParam

      return {
        data: items.map(mapBusToCard),
        page,
        totalPages,
      }
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) return lastPage.page + 1
      return undefined
    },
    initialPageParam: 1,
  })
}

export function useBusManufacturers() {
  return useQuery<BusManufacturer[]>({
    queryKey: ['bus-manufacturers'],
    queryFn: () => busesApi.getManufacturers(),
    staleTime: 60 * 60 * 1000,
  })
}

export function useBusModels(manufacturerId: string) {
  return useQuery<BusModel[]>({
    queryKey: ['bus-models', manufacturerId],
    queryFn: () => busesApi.getModels(manufacturerId),
    enabled: !!manufacturerId,
    staleTime: 60 * 60 * 1000,
  })
}
