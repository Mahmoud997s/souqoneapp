import { useQuery } from '@tanstack/react-query'
import { transportApi } from '../api/transport'
import { mapTransportToCard } from '../utils/mappers'

const MOCK_TRANSPORT = [
  {
    id: 'mock-t1',
    serviceType: 'FURNITURE',
    status: 'OPEN',
    fromGovernorate: 'OM_MUS',
    fromCity: 'بوشر',
    toGovernorate: 'OM_BAT',
    toCity: 'صحار',
    cargoDescription: 'نقل أثاث منزلي كامل — غرفة نوم وصالة وأجهزة كهربائية',
    weightTons: 2.5,
    budgetMin: 80,
    budgetMax: 150,
    currency: 'ر.ع.',
    requiresHelper: true,
    scheduledAt: '2026-05-30T10:00:00.000Z',
    isFlexible: false,
    _count: { quotes: 3 },
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-t2',
    serviceType: 'GOODS',
    status: 'QUOTED',
    fromGovernorate: 'OM_DHL',
    fromCity: 'صلالة',
    toGovernorate: 'OM_MUS',
    toCity: 'مسقط',
    cargoDescription: 'بضائع تجارية — صناديق ومواد غذائية جافة، لا تتطلب تبريد',
    weightTons: 8,
    budgetMin: 200,
    budgetMax: 350,
    currency: 'ر.ع.',
    requiresHelper: false,
    scheduledAt: null,
    isFlexible: true,
    _count: { quotes: 7 },
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-t3',
    serviceType: 'CONSTRUCTION',
    status: 'OPEN',
    fromGovernorate: 'OM_DAK',
    fromCity: 'نزوى',
    toGovernorate: 'OM_MUS',
    toCity: 'العامرات',
    cargoDescription: 'مواد بناء — حديد تسليح وبلوك وأكياس إسمنت، كمية كبيرة',
    weightTons: 15,
    budgetMin: 120,
    budgetMax: 200,
    currency: 'ر.ع.',
    requiresHelper: false,
    scheduledAt: '2026-06-02T08:00:00.000Z',
    isFlexible: false,
    _count: { quotes: 1 },
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-t4',
    serviceType: 'HEAVY',
    status: 'OPEN',
    fromGovernorate: 'OM_SHA',
    fromCity: 'إبراء',
    toGovernorate: 'OM_MUS',
    toCity: 'السيب',
    cargoDescription: 'شحن ثقيل — معدة حفر صغيرة بحاجة إلى شاحنة مسطحة أو تريلر',
    weightTons: 22,
    budgetMin: null,
    budgetMax: null,
    currency: 'ر.ع.',
    requiresHelper: false,
    scheduledAt: null,
    isFlexible: true,
    _count: { quotes: 0 },
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
]

export function useTransport(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['transport', params],
    queryFn: async () => {
      try {
        const res = await transportApi.getAll(params)
        const raw = (res.data as any)?.items ?? (res.data as any)?.data ?? res.data
        const arr = Array.isArray(raw) ? raw : []
        if (arr.length > 0) return arr.map(mapTransportToCard)
      } catch (_) {}
      return MOCK_TRANSPORT.map(mapTransportToCard)
    },
  })
}

export function useTransportRaw(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['transport-raw', params],
    queryFn: async () => {
      try {
        const res = await transportApi.getAll(params)
        const raw = (res.data as any)?.items ?? (res.data as any)?.data ?? res.data
        const arr = Array.isArray(raw) ? raw : []
        if (arr.length > 0) return arr
      } catch (_) {}
      return MOCK_TRANSPORT
    },
  })
}

export function useTransportItem(id: string) {
  return useQuery({
    queryKey: ['transport-item', id],
    queryFn: async () => {
      const res = await transportApi.getById(id)
      return res.data
    },
    enabled: !!id,
  })
}
