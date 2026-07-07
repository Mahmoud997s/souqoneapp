import { useQuery } from '@tanstack/react-query'
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
