import { useQuery, useQueryClient } from '@tanstack/react-query'
import { servicesApi } from '../api/services'
import { mapServiceToCard } from '../utils/mappers'
import { UnifiedCardItem } from '../types/unified-card.types'
import { parseListEnvelope } from '../utils/parseListEnvelope'

export function useServices(params?: Record<string, unknown>, options?: any) {
  return useQuery<UnifiedCardItem[]>({
    queryKey: ['services', params],
    queryFn: async () => {
      const res = await servicesApi.getAll(params)
      const { items } = parseListEnvelope(res.data)
      return items.map(mapServiceToCard)
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
    ...options
  })
}

export function useService(id: string) {
  const queryClient = useQueryClient()
  const disableRetry = queryClient.getDefaultOptions().queries?.retry === false

  return useQuery({
    queryKey: ['service', id],
    queryFn: async ({ signal }) => {
      const res = await servicesApi.getById(id, { timeout: 15_000, signal })
      return res.data
    },
    enabled: !!id,
    retry: disableRetry ? false : 1,
  })
}
