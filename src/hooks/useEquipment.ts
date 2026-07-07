import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { equipmentApi } from '../api/equipment'
import { mapEquipmentToCard, mapOperatorToCard } from '../utils/mappers'
import { EquipmentListing, OperatorListing, EquipmentBid } from '../types/equipment.types'

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

import { UnifiedCardItem } from '../components/cards/UnifiedCard'

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
      if (id?.startsWith('op')) {
        // Return mock data for mock operators
        const mocks: Record<string, any> = {
          op1: { id: 'op1', title: 'مشغل بلدوزر وجرافة', dailyRate: 30, currency: 'ر.ع.', location: 'الباطنة شمال', operatorType: 'مشغل', experienceYears: 15, description: 'خبرة طويلة في قيادة جميع أنواع الحفارات والجرافات. مستعد للعمل في أي منطقة.', contactPhone: '+96891234567' },
          op2: { id: 'op2', title: 'فني صيانة مولدات كهربائية', dailyRate: 20, currency: 'ر.ع.', location: 'الداخلية', operatorType: 'صيانة', experienceYears: 6, description: 'متخصص في فحص وصيانة المولدات الكهربائية الصناعية.', contactPhone: '+96891234567' },
          op3: { id: 'op3', title: 'فني صيانة معدات هيدروليك', hourlyRate: 8, currency: 'ر.ع.', location: 'مسقط', operatorType: 'فني', experienceYears: 12, description: 'إصلاح جميع أعطال الأنظمة الهيدروليكية في المعدات الثقيلة.', contactPhone: '+96891234567' },
          op4: { id: 'op4', title: 'مشغل رافعة برجية معتمد', dailyRate: 35, currency: 'ر.ع.', location: 'ظفار', operatorType: 'مشغل', experienceYears: 8, description: 'حاصل على رخصة تشغيل رافعات برجية ولديه خبرة في مشاريع كبرى.' },
        }
        return mocks[id] || null
      }
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

// Operator Mutations
export function useCreateOperator() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<OperatorListing>) => equipmentApi.createOperator(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operators-infinite'] })
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
    },
  })
}

// Bid Mutations
export function useCreateEquipmentBid() {
  return useMutation({
    mutationFn: ({ equipmentId, data }: { equipmentId: string; data: Partial<EquipmentBid> }) =>
      equipmentApi.createBid(equipmentId, data),
  })
}
