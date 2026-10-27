import React from 'react'
import { renderHook, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useServiceDetail } from '../useServiceDetail'
import { servicesApi } from '../../../../api/services'
import type { Service } from '../../../../types/listing.types'

jest.mock('../../../../api/services', () => ({
  servicesApi: {
    getById: jest.fn(),
  },
}))

jest.mock('../../../../store/authStore', () => ({
  useAuthStore: (selector: (s: { isLoggedIn: boolean }) => unknown) =>
    selector({ isLoggedIn: false }),
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useServiceDetail', () => {
  const mockServiceData: Service = {
    id: 'srv-1',
    title: 'تلميع ونانو سيراميك',
    serviceType: 'CLEANING',
    providerName: 'المتألق',
    description: 'غسيل وتلميع عالي الجودة',
    priceFrom: 10,
    priceTo: 30,
    governorate: 'مسقط',
    city: 'السيب',
    images: [],
    createdAt: '2026-10-20T00:00:00.000Z',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns loading state initially', async () => {
    ;(servicesApi.getById as jest.Mock).mockReturnValue(new Promise(() => {}))

    const { result } = await renderHook(() => useServiceDetail('srv-1'), {
      wrapper: createWrapper(),
    })

    expect(result.current.state).toBe('loading')
    expect(result.current.vm).toBeUndefined()
  })

  it('returns ready state with mapped vm when fetch succeeds', async () => {
    ;(servicesApi.getById as jest.Mock).mockResolvedValueOnce({
      data: mockServiceData,
    })

    const { result } = await renderHook(() => useServiceDetail('srv-1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.state).toBe('ready'))

    expect(result.current.vm).toBeDefined()
    expect(result.current.vm?.title).toBe('تلميع ونانو سيراميك')
    expect(result.current.vm?.serviceTypeLabel).toBe('غسيل وتلميع ونانو')
    expect(result.current.raw).toEqual(mockServiceData)
  })

  it('classifies 404 response as notFound state', async () => {
    const error404 = {
      response: { status: 404 },
      isAxiosError: true,
      message: 'Not found',
    }
    ;(servicesApi.getById as jest.Mock).mockRejectedValueOnce(error404)

    const { result } = await renderHook(() => useServiceDetail('srv-missing'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.state).toBe('notFound'))
    expect(result.current.vm).toBeUndefined()
  })

  it('classifies network error as offline state', async () => {
    const netErr = {
      code: 'ERR_NETWORK',
      message: 'Network Error',
      isAxiosError: true,
    }
    ;(servicesApi.getById as jest.Mock).mockRejectedValueOnce(netErr)

    const { result } = await renderHook(() => useServiceDetail('srv-offline'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.state).toBe('offline'))
    expect(result.current.vm).toBeUndefined()
  })

  it('classifies generic server errors as error state', async () => {
    const serverErr = {
      response: { status: 500 },
      isAxiosError: true,
      message: 'Internal error',
    }
    ;(servicesApi.getById as jest.Mock).mockRejectedValueOnce(serverErr)

    const { result } = await renderHook(() => useServiceDetail('srv-err'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.state).toBe('error'))
    expect(result.current.vm).toBeUndefined()
  })

  it('handles null or missing id as error state', async () => {
    const { result } = await renderHook(() => useServiceDetail(null), {
      wrapper: createWrapper(),
    })

    expect(result.current.state).toBe('error')
    expect(servicesApi.getById).not.toHaveBeenCalled()
  })
})
