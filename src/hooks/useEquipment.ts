import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { equipmentApi } from '../api/equipment'
import { mapEquipmentToCard, mapOperatorToCard } from '../utils/mappers'
import { parseListEnvelope } from '../utils/parseListEnvelope'
import { EquipmentListing, OperatorListing } from '../types/equipment.types'
import { UnifiedCardItem } from '../types/unified-card.types'

// Equipment Queries
export function useEquipmentInfinite(params?: Record<string, unknown>) {
  return useInfiniteQuery({
    queryKey: ['equipment-infinite', params],
    queryFn: async ({ pageParam = 1 }) => {
      const pageNum = pageParam as number
      const res = await equipmentApi.getAll({ ...params, page: pageNum, limit: 10 })
      const { items, meta, hasNextPage } = parseListEnvelope<EquipmentListing>(res.data)
      return {
        items: items.map(mapEquipmentToCard),
        meta,
        nextPage: hasNextPage ? pageNum + 1 : undefined,
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
  })
}

// Simple query for homepage cards
export function useEquipment(params?: Record<string, unknown>, options?: any) {
  return useQuery<UnifiedCardItem[]>({
    queryKey: ['equipment', params],
    queryFn: async () => {
      const res = await equipmentApi.getAll(params)
      const { items } = parseListEnvelope<EquipmentListing>(res.data)
      return items.map(mapEquipmentToCard)
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
      const pageNum = pageParam as number
      const res = await equipmentApi.getOperators({ ...params, page: pageNum, limit: 10 })
      const { items, meta, hasNextPage } = parseListEnvelope<OperatorListing>(res.data)
      return {
        items: items.map(mapOperatorToCard),
        meta,
        nextPage: hasNextPage ? pageNum + 1 : undefined,
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
      const { items } = parseListEnvelope<OperatorListing>(res.data)
      return items
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
