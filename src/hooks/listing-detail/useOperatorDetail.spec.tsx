import React from 'react'
import { renderHook, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useOperatorDetail } from './useOperatorDetail'
import { equipmentApi } from '../../api/equipment'
import type { OperatorDetailApi } from '../../types/operatorDetailApi.types'

jest.mock('../../api/equipment', () => ({
  equipmentApi: {
    getOperatorById: jest.fn(),
  },
}))

jest.mock('../../store/authStore', () => ({
  useAuthStore: jest.fn((selector) => selector({ isLoggedIn: true })),
}))

const sampleOperatorApi: OperatorDetailApi = {
  id: 'op-1',
  title: 'مشغل رافعة معتمد',
  slug: 'crane-op-1',
  description: 'خبرة طويلة في الرافعات',
  operatorType: 'OPERATOR',
  equipmentTypes: ['CRANE'],
  specializations: ['رافعات'],
  dailyRate: 70,
  hourlyRate: 12,
  currency: 'OMR',
  isPriceNegotiable: true,
  status: 'ACTIVE',
  userId: 'user-1',
  user: {
    id: 'user-1',
    username: 'crane_master',
    displayName: 'سعيد المعمري',
    createdAt: '2023-01-01',
  },
  createdAt: '2026-10-01',
  updatedAt: '2026-10-10',
}

describe('useOperatorDetail', () => {
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

  it('fetches operator detail and transitions to ready state with mapped vm', async () => {
    ;(equipmentApi.getOperatorById as jest.Mock).mockResolvedValueOnce({
      data: sampleOperatorApi,
    })

    const { result } = await renderHook(() => useOperatorDetail('op-1'), { wrapper })

    expect(result.current.state).toBe('loading')

    await waitFor(() => {
      expect(result.current.state).toBe('ready')
    })

    expect(result.current.vm).toBeDefined()
    expect(result.current.vm?.id).toBe('op-1')
    expect(result.current.vm?.title).toBe('مشغل رافعة معتمد')
    expect(result.current.vm?.rates.dailyRateFormatted).toBe('70 ر.ع / يوم')
    expect(result.current.error).toBeNull()
  })

  it('classifies HTTP 404 response as notFound state', async () => {
    const error404 = {
      isAxiosError: true,
      response: { status: 404, data: { message: 'إعلان المشغل غير موجود' } },
    }
    ;(equipmentApi.getOperatorById as jest.Mock).mockRejectedValueOnce(error404)

    const { result } = await renderHook(() => useOperatorDetail('op-missing'), { wrapper })

    await waitFor(() => {
      expect(result.current.state).toBe('notFound')
    })

    expect(result.current.vm).toBeUndefined()
    expect(result.current.error).toEqual(error404)
  })

  it('classifies network error as offline state', async () => {
    const netError = {
      isAxiosError: true,
      code: 'ERR_NETWORK',
      message: 'Network Error',
    }
    ;(equipmentApi.getOperatorById as jest.Mock).mockRejectedValueOnce(netError)

    const { result } = await renderHook(() => useOperatorDetail('op-net'), { wrapper })

    await waitFor(() => {
      expect(result.current.state).toBe('offline')
    })

    expect(result.current.error).toEqual(netError)
  })

  it('classifies generic server 500 error as error state', async () => {
    const error500 = {
      isAxiosError: true,
      response: { status: 500 },
    }
    ;(equipmentApi.getOperatorById as jest.Mock).mockRejectedValueOnce(error500)

    const { result } = await renderHook(() => useOperatorDetail('op-err'), { wrapper })

    await waitFor(() => {
      expect(result.current.state).toBe('error')
    })
  })
})
