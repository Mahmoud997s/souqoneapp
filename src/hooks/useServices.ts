import { useQuery } from '@tanstack/react-query'
import { servicesApi } from '../api/services'
import { mapServiceToCard } from '../utils/mappers'
import { UnifiedCardItem } from '../components/cards/UnifiedCard'

export function useServices(params?: Record<string, unknown>, options?: any) {
  return useQuery<UnifiedCardItem[]>({
    queryKey: ['services', params],
    queryFn: async () => {
      const res = await servicesApi.getAll(params)
      const raw = (res.data as any)?.items ?? (res.data as any)?.data ?? res.data
      const arr = Array.isArray(raw) ? raw : []
      return arr.map(mapServiceToCard)
    },
    ...options
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
