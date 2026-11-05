import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { equipmentApi } from '../api/equipment'
import { mapEquipmentToCard, mapOperatorToCard } from '../utils/mappers'
import { EquipmentListing, OperatorListing } from '../types/equipment.types'

// Equipment Queries
export function useEquipmentInfinite(params?: Record<string, unknown>) {
  return useInfiniteQuery({
    queryKey: ['equipment-infinite', params],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await equipmentApi.getAll({ ...params, page: pageParam, limit: 10 })
      const raw = (res.data as any)?.items ?? (res.data as any)?.data ?? res.data
      const arr = Array.isArray(raw) ? raw : []
      return {
        items: arr.map(mapEquipmentToCard),
        nextPage: arr.length === 10 ? pageParam + 1 : undefined,
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
  })
}

import { UnifiedCardItem } from '../types/unified-card.types'

// Simple query for homepage cards
export function useEquipment(params?: Record<string, unknown>, options?: any) {
  return useQuery<UnifiedCardItem[]>({
    queryKey: ['equipment', params],
    queryFn: async () => {
      const res = await equipmentApi.getAll(params)
      const raw = (res.data as any)?.items ?? (res.data as any)?.data ?? res.data
      const arr = Array.isArray(raw) ? raw : []
      return arr.map(mapEquipmentToCard)
    },
    ...options,
  })
}

export function useEquipmentItem(id: string) {
  return useQuery({
    queryKey: ['equipment-item', id],
    queryFn: async () => {
      const res = await equipmentApi.getById(id)
      return res.data
    },
    enabled: !!id,
  })
}

// Operators Queries
export function useOperatorsInfinite(params?: Record<string, unknown>) {
  return useInfiniteQuery({
    queryKey: ['operators-infinite', params],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await equipmentApi.getOperators({ ...params, page: pageParam, limit: 10 })
      const raw = (res.data as any)?.items ?? (res.data as any)?.data ?? res.data
      const arr = Array.isArray(raw) ? raw : []
      return {
        items: arr.map(mapOperatorToCard),
        nextPage: arr.length === 10 ? pageParam + 1 : undefined,
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
  })
}

export function useOperatorItem(id: string) {
  return useQuery({
    queryKey: ['operator-item', id],
    queryFn: async () => {
      const res = await equipmentApi.getOperatorById(id)
      return res.data
    },
    enabled: !!id,
  })
}

// Equipment Mutations
export function useCreateEquipment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<EquipmentListing>) => equipmentApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-infinite'] })
    },
  })
}

export function useUpdateEquipment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<EquipmentListing> }) => equipmentApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['equipment-infinite'] })
      queryClient.invalidateQueries({ queryKey: ['equipment-item', id] })
    },
  })
}

export function useMyOperators(enabled = true) {
  return useQuery({
    queryKey: ['my-operators'],
    queryFn: async () => {
      const res = await equipmentApi.getMyOperators()
      const raw = (res.data as any)?.items ?? (res.data as any)?.data ?? res.data
      return Array.isArray(raw) ? (raw as OperatorListing[]) : []
    },
    enabled,
  })
}

// Operator Mutations
export function useCreateOperator() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<OperatorListing>) => equipmentApi.createOperator(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operators-infinite'] })
      queryClient.invalidateQueries({ queryKey: ['my-operators'] })
    },
  })
}

export function useUpdateOperator() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<OperatorListing> }) => equipmentApi.updateOperator(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['operators-infinite'] })
      queryClient.invalidateQueries({ queryKey: ['operator-item', id] })
      queryClient.invalidateQueries({ queryKey: ['my-operators'] })
    },
  })
}

export function useDeleteOperator() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => equipmentApi.deleteOperator(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operators-infinite'] })
      queryClient.invalidateQueries({ queryKey: ['my-operators'] })
    },
  })
}

export function useCancelOperatorDeletionRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (requestId: string) => equipmentApi.cancelOperatorDeletionRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-operators'] })
      queryClient.invalidateQueries({ queryKey: ['operator-item'] })
    },
  })
}
