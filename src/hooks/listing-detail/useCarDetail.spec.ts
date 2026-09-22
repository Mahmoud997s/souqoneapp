import React from 'react'
import { render, waitFor, act } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useCarDetail, UseCarDetailResult } from './useCarDetail'
import { listingsApi } from '../../api/listings'
import { CarDetailApi } from '../../types/carDetailApi.types'

jest.mock('../../api/listings', () => ({
  listingsApi: {
    getById: jest.fn(),
  },
}))

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  })
}

function renderCarDetailHook(id: string | null | undefined, queryClient: QueryClient) {
  let hookValue: UseCarDetailResult | undefined

  function Consumer() {
    hookValue = useCarDetail(id)
    return null
  }

  const rendered = render(
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(Consumer)
    )
  )

  return {
    get current(): UseCarDetailResult {
      if (!hookValue) {
        throw new Error('Hook value not yet populated')
      }
      return hookValue
    },
    ...rendered,
  }
}

describe('useCarDetail', () => {
  const mockCarData: CarDetailApi = {
    id: 'car-abc-123',
    status: 'ACTIVE',
    title: 'لكزس LX600 VIP 2023',
    description: 'سيارة بحالة الوكالة فل كامل صيانة دورية',
    listingType: 'SALE',
    condition: 'USED',
    price: 48000,
    currency: 'OMR',
    isPriceNegotiable: true,
    make: 'لكزس',
    model: 'LX600',
    year: 2023,
    mileage: 18000,
    images: [
      { id: 'img-1', url: 'https://example.com/lx1.jpg', order: 1, isPrimary: true },
    ],
    governorate: 'مسقط',
    city: 'بوشر',
    createdAt: '2026-09-20T00:00:00.000Z',
    seller: {
      id: 'seller-1',
      username: 'vip_motors',
      displayName: 'شركة كبار الشخصيات للسيارات',
      createdAt: '2021-01-01T00:00:00.000Z',
    },
    viewCount: 342,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns loading state initially while fetching', async () => {
    ;(listingsApi.getById as jest.Mock).mockReturnValue(new Promise(() => {}))
    const queryClient = createTestQueryClient()

    const hook = renderCarDetailHook('car-abc-123', queryClient)

    await waitFor(() => {
      expect(hook.current.state).toBe('loading')
    })
    expect(hook.current.vm).toBeUndefined()
    expect(hook.current.raw).toBeUndefined()
  })

  it('returns ready state with mapped vm when query succeeds', async () => {
    ;(listingsApi.getById as jest.Mock).mockResolvedValueOnce({
      data: mockCarData,
    })
    const queryClient = createTestQueryClient()

    const hook = renderCarDetailHook('car-abc-123', queryClient)

    await waitFor(() => {
      expect(hook.current.state).toBe('ready')
    })

    expect(hook.current.vm).toBeDefined()
    expect(hook.current.vm?.id).toBe('car-abc-123')
    expect(hook.current.vm?.title).toBe('لكزس LX600 VIP 2023')
    expect(hook.current.vm?.price.fullPriceLabel).toBe('48,000 ر.ع')
    expect(hook.current.vm?.location.fullLocationText).toBe('مسقط، بوشر')
    expect(hook.current.raw?.id).toBe('car-abc-123')
    expect(hook.current.error).toBeNull()
  })

  it('returns notFound state when API returns 404', async () => {
    const error404 = {
      isAxiosError: true,
      response: { status: 404, data: { message: 'Listing not found' } },
    }
    ;(listingsApi.getById as jest.Mock).mockRejectedValueOnce(error404)
    const queryClient = createTestQueryClient()

    const hook = renderCarDetailHook('non-existent-id', queryClient)

    await waitFor(() => {
      expect(hook.current.state).toBe('notFound')
    })

    expect(hook.current.vm).toBeUndefined()
    expect(hook.current.error).toEqual(error404)
  })

  it('returns offline state when network fails', async () => {
    const networkError = {
      isAxiosError: true,
      code: 'ERR_NETWORK',
      message: 'Network Error',
    }
    ;(listingsApi.getById as jest.Mock).mockRejectedValueOnce(networkError)
    const queryClient = createTestQueryClient()

    const hook = renderCarDetailHook('car-abc-123', queryClient)

    await waitFor(() => {
      expect(hook.current.state).toBe('offline')
    })

    expect(hook.current.vm).toBeUndefined()
    expect(hook.current.error).toEqual(networkError)
  })

  it('returns error state for general 500 or unknown errors', async () => {
    const serverError = {
      isAxiosError: true,
      response: { status: 500, data: { message: 'Internal server error' } },
    }
    ;(listingsApi.getById as jest.Mock).mockRejectedValueOnce(serverError)
    const queryClient = createTestQueryClient()

    const hook = renderCarDetailHook('car-abc-123', queryClient)

    await waitFor(() => {
      expect(hook.current.state).toBe('error')
    })

    expect(hook.current.vm).toBeUndefined()
    expect(hook.current.error).toEqual(serverError)
  })

  it('returns error immediately and does not fetch if id is null or empty', async () => {
    const queryClient = createTestQueryClient()

    const hook = renderCarDetailHook('', queryClient)

    await waitFor(() => {
      expect(hook.current.state).toBe('error')
    })
    expect(hook.current.vm).toBeUndefined()
    expect(listingsApi.getById).not.toHaveBeenCalled()
  })

  it('supports refetching the listing data', async () => {
    ;(listingsApi.getById as jest.Mock).mockResolvedValueOnce({
      data: mockCarData,
    })
    const queryClient = createTestQueryClient()

    const hook = renderCarDetailHook('car-abc-123', queryClient)

    await waitFor(() => {
      expect(hook.current.state).toBe('ready')
    })
    expect(listingsApi.getById).toHaveBeenCalledTimes(1)

    ;(listingsApi.getById as jest.Mock).mockResolvedValueOnce({
      data: { ...mockCarData, price: 47000 },
    })

    await act(async () => {
      await hook.current.refetch()
    })

    await waitFor(() => {
      expect(hook.current.vm?.price.fullPriceLabel).toBe('47,000 ر.ع')
    })
    expect(listingsApi.getById).toHaveBeenCalledTimes(2)
  })
})
