import { renderHook, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { usePartDetail } from '../usePartDetail'
import { partsApi } from '../../../../api/parts'
import type { Part } from '../../../../types/listing.types'

jest.mock('../../../../api/parts')

const mockPart: Part = {
  id: 'part-test-1',
  title: 'سفايف بريك تويوتا كامري',
  description: 'سفايف ممتازة جديدة أصلية',
  partCategory: 'BRAKES',
  condition: 'NEW',
  partNumber: '04465-33471',
  isOriginal: true,
  compatibleMakes: ['toyota'],
  compatibleModels: ['Camry'],
  yearFrom: 2018,
  yearTo: 2023,
  price: 45,
  currency: 'OMR',
  isPriceNegotiable: true,
  whatsappEnabled: true,
  governorate: 'مسقط',
  city: 'بوشر',
  hasWarranty: true,
  warrantyDuration: 'SIX_MONTHS',
  quantity: 'TWO_TO_FIVE',
  compatibleVehicleTypes: ['CAR'],
  images: [],
  createdAt: '2026-10-27T00:00:00.000Z',
  user: {
    id: 'user-seller-1',
    username: 'parts_om',
    displayName: 'سوق قطع الغيار',
  },
}

describe('usePartDetail', () => {
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
    ;(partsApi.getById as jest.Mock).mockResolvedValueOnce({
      data: mockPart,
    })

    const { result } = await renderHook(() => usePartDetail('part-test-1'), { wrapper })

    expect(result.current.state).toBe('loading')

    await waitFor(() => {
      expect(result.current.state).toBe('ready')
    })

    expect(result.current.vm).toBeDefined()
    expect(result.current.vm?.id).toBe('part-test-1')
    expect(result.current.vm?.title).toBe('سفايف بريك تويوتا كامري')
    expect(result.current.vm?.partCategoryLabel).toBe('فرامل ومكابح')
    expect(result.current.raw).toEqual(mockPart)
    expect(result.current.error).toBeNull()
  })

  it('classifies 404 response as notFound', async () => {
    const error404 = {
      response: {
        status: 404,
        data: { message: 'قطعة الغيار غير موجودة' },
      },
      isAxiosError: true,
    }
    ;(partsApi.getById as jest.Mock).mockRejectedValueOnce(error404)

    const { result } = await renderHook(() => usePartDetail('part-not-found'), { wrapper })

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
    ;(partsApi.getById as jest.Mock).mockRejectedValueOnce(networkError)

    const { result } = await renderHook(() => usePartDetail('part-offline'), { wrapper })

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
    ;(partsApi.getById as jest.Mock).mockRejectedValueOnce(serverError)

    const { result } = await renderHook(() => usePartDetail('part-500'), { wrapper })

    await waitFor(() => {
      expect(result.current.state).toBe('error')
    })
  })

  it('sets error state immediately when id is null or empty', async () => {
    const { result } = await renderHook(() => usePartDetail(null), { wrapper })
    expect(result.current.state).toBe('error')
  })
})
