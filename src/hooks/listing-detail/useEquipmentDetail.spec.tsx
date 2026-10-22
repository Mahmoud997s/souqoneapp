import { renderHook, act, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useEquipmentDetail } from './useEquipmentDetail'
import { equipmentApi } from '../../api/equipment'
import type { EquipmentDetailApi } from '../../types/equipmentDetailApi.types'

jest.mock('../../api/equipment')

const mockBaseEquipment: EquipmentDetailApi = {
  id: 'eq-test-1',
  title: 'حفار كوماتسو 2021',
  slug: 'komatsu-2021',
  description: 'حفار كوماتسو بحالة جيدة جداً',
  equipmentType: 'EXCAVATOR',
  listingType: 'EQUIPMENT_SALE',
  price: 25000,
  currency: 'OMR',
  features: [],
  status: 'ACTIVE',
  userId: 'user-owner-1',
  user: {
    id: 'user-owner-1',
    username: 'heavy_om',
    createdAt: '2025-01-01T00:00:00.000Z',
  },
  images: [],
  createdAt: '2026-10-22T00:00:00.000Z',
  updatedAt: '2026-10-22T00:00:00.000Z',
  version: 2,
  viewCount: 15,
}

describe('useEquipmentDetail', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    jest.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  it('transitions from loading to ready with mapped vm and raw response', async () => {
    ;(equipmentApi.getById as jest.Mock).mockResolvedValueOnce({
      data: mockBaseEquipment,
    })

    const { result } = await renderHook(() => useEquipmentDetail('eq-test-1'), { wrapper })

    expect(result.current.state).toBe('loading')

    await waitFor(() => {
      expect(result.current.state).toBe('ready')
    })

    expect(result.current.vm).toBeDefined()
    expect(result.current.vm?.id).toBe('eq-test-1')
    expect(result.current.vm?.title).toBe('حفار كوماتسو 2021')
    expect(result.current.raw).toEqual(mockBaseEquipment)
    expect(result.current.error).toBeNull()
  })

  it('classifies 404 response as notFound', async () => {
    const error404 = {
      response: {
        status: 404,
        data: { message: 'الإعلان غير موجود' },
      },
      isAxiosError: true,
    }
    ;(equipmentApi.getById as jest.Mock).mockRejectedValueOnce(error404)

    const { result } = await renderHook(() => useEquipmentDetail('eq-not-found'), { wrapper })

    await waitFor(() => {
      expect(result.current.state).toBe('notFound')
    })

    expect(result.current.vm).toBeUndefined()
    expect(result.current.error).toBeDefined()
  })

  it('classifies network error as offline', async () => {
    const networkError = {
      code: 'ERR_NETWORK',
      message: 'Network Error',
      isAxiosError: true,
    }
    ;(equipmentApi.getById as jest.Mock).mockRejectedValueOnce(networkError)

    const { result } = await renderHook(() => useEquipmentDetail('eq-offline'), { wrapper })

    await waitFor(() => {
      expect(result.current.state).toBe('offline')
    })

    expect(result.current.vm).toBeUndefined()
  })

  it('classifies unexpected 500 error as error state', async () => {
    const serverError = {
      response: { status: 500 },
      message: 'Internal server error',
    }
    ;(equipmentApi.getById as jest.Mock).mockRejectedValueOnce(serverError)

    const { result } = await renderHook(() => useEquipmentDetail('eq-500'), { wrapper })

    await waitFor(() => {
      expect(result.current.state).toBe('error')
    })
  })

  it('sets error state immediately when id is null or empty', async () => {
    const { result } = await renderHook(() => useEquipmentDetail(null), { wrapper })
    expect(result.current.state).toBe('error')
  })
})
