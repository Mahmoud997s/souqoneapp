import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { busesApi } from '../api/buses'
import { mapBusToCard } from '../utils/mappers'

export function useBuses(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['buses', params],
    queryFn: async () => {
      const res = await busesApi.getAll(params)
      const raw = (res.data as any)?.items ?? (res.data as any)?.data ?? res.data
      const arr = Array.isArray(raw) ? raw : []
      return arr.map(mapBusToCard)
    },
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
