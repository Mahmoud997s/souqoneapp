import { useQuery } from '@tanstack/react-query'
import { partsApi } from '../api/parts'
import { mapPartToCard } from '../utils/mappers'

export function useParts(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['parts', params],
    queryFn: async () => {
      const res = await partsApi.getAll(params)
      const raw = (res.data as any)?.items ?? (res.data as any)?.data ?? res.data
      const arr = Array.isArray(raw) ? raw : []
      return arr.map(mapPartToCard)
    },
  })
}

export function usePart(id: string) {
  return useQuery({
    queryKey: ['part', id],
    queryFn: async () => {
      const res = await partsApi.getById(id)
      return res.data
    },
    enabled: !!id,
  })
}
