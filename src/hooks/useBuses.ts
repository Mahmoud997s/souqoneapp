import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { busesApi } from '../api/buses'
import { mapBusToCard } from '../utils/mappers'
import { BusManufacturer, BusModel } from '../types/bus.types'
import { UnifiedCardItem } from '../components/cards/UnifiedCard'

export function useBuses(params?: Record<string, unknown>, options?: any) {
  return useQuery<UnifiedCardItem[], Error>({
    queryKey: ['buses', params],
    queryFn: async () => {
      const res = await busesApi.getAll(params)
      const raw = (res.data as any)?.items ?? (res.data as any)?.data ?? res.data
      const arr = Array.isArray(raw) ? raw : []
      return arr.map(mapBusToCard)
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
      const res = await busesApi.getAll({ ...params, page: pageParam, limit: 10 });
      const raw = (res.data as any)?.items ?? (res.data as any)?.data ?? res.data;
      const arr = Array.isArray(raw) ? raw : [];
      return {
        data: arr.map(mapBusToCard),
        page: (res.data as any)?.page || pageParam,
        totalPages: (res.data as any)?.totalPages || 1,
      };
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) return lastPage.page + 1;
      return undefined;
    },
    initialPageParam: 1,
  });
}

export function useBus(id: string) {
  return useQuery({
    queryKey: ['bus', id],
    queryFn: async () => {
      const res = await busesApi.getById(id)
      return res.data
    },
    enabled: !!id,
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
