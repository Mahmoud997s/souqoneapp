import { useQuery } from '@tanstack/react-query'
import { servicesApi } from '../api/services'
import { mapServiceToCard } from '../utils/mappers'

export function useServices(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['services', params],
    queryFn: async () => {
      const res = await servicesApi.getAll(params)
      const raw = (res.data as any)?.items ?? (res.data as any)?.data ?? res.data
      const arr = Array.isArray(raw) ? raw : []
      return arr.map(mapServiceToCard)
    },
  })
}

export function useService(id: string) {
  return useQuery({
    queryKey: ['service', id],
    queryFn: async () => {
      const res = await servicesApi.getById(id)
      return res.data
    },
    enabled: !!id,
  })
}
