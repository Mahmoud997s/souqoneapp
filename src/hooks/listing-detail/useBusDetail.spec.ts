import React from 'react'
import { render, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useBusDetail, UseBusDetailResult } from './useBusDetail'
import { busesApi } from '../../api/buses'
import { BusDetailApi } from '../../types/busDetailApi.types'
import { useAuthStore } from '../../store/authStore'
import { busQueryKeys, invalidateBusListingQueries } from '../../utils/listing-detail/busQueryKeys'

jest.mock('../../api/buses', () => ({
  busesApi: {
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

function renderBusDetailHook(
  id: string | null | undefined,
  queryClient: QueryClient,
  options?: { now?: Date }
) {
  let hookValue: UseBusDetailResult | undefined

  function Consumer() {
    hookValue = useBusDetail(id, options)
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
    get current(): UseBusDetailResult {
      if (!hookValue) {
        throw new Error('Hook value not yet populated')
      }
      return hookValue
    },
    ...rendered,
  }
}

describe('useBusDetail', () => {
  const mockNow = new Date('2026-10-20T12:00:00.000Z')

  const mockBusData: BusDetailApi = {
    id: 'bus-123',
    slug: 'bus-toyota-coaster-123',
    title: 'تويوتا كوستر 2022',
    description: 'حافلة ممتازة للبيع مع عقد تشغيل',
    busListingType: 'BUS_SALE_WITH_CONTRACT',
    busType: 'COASTER',
    make: 'Toyota',
    model: 'Coaster',
    year: 2022,
    capacity: 30,
    mileage: 50000,
    features: ['ac'],
    price: 25000,
    currency: 'OMR',
    isPriceNegotiable: true,
    contractType: 'SCHOOL',
    contractClient: 'مدرسة خاصة',
    contractMonthly: 600,
    contractDuration: 24,
    contractExpiry: '2027-06-30T00:00:00.000Z',
    withDriver: true,
    status: 'ACTIVE',
    hiddenByOwnerStatus: false,
    isPremium: false,
    viewCount: 120,
    userId: 'user-1',
    user: {
      id: 'user-1',
      username: 'bus_owner',
      createdAt: '2024-01-01T00:00:00.000Z',
    },
    images: [{ id: 'img-1', url: 'https://example.com/1.jpg', isPrimary: true }],
    createdAt: '2026-10-15T00:00:00.000Z',
    updatedAt: '2026-10-16T00:00:00.000Z',
    version: 2,
    whatsappEnabled: true,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    useAuthStore.setState({
      user: null,
      isLoggedIn: false,
      isGuest: true,
    })
  })

  it('returns loading state initially while fetching', async () => {
    ;(busesApi.getById as jest.Mock).mockReturnValue(new Promise(() => {}))
    const queryClient = createTestQueryClient()

    const hook = renderBusDetailHook('bus-123', queryClient)

    await waitFor(() => {
      expect(hook.current.state).toBe('loading')
    })
    expect(hook.current.vm).toBeUndefined()
    expect(hook.current.raw).toBeUndefined()
  })

  it('returns ready state with mapped vm when query succeeds (guest -> contract locked)', async () => {
    ;(busesApi.getById as jest.Mock).mockResolvedValueOnce({
      data: mockBusData,
    })
    const queryClient = createTestQueryClient()

    const hook = renderBusDetailHook('bus-123', queryClient, { now: mockNow })

    await waitFor(() => {
      expect(hook.current.state).toBe('ready')
    })

    expect(hook.current.vm).toBeDefined()
    expect(hook.current.vm?.id).toBe('bus-123')
    expect(hook.current.vm?.title).toBe('تويوتا كوستر 2022')
    expect(hook.current.vm?.contract.access).toBe('locked')
    expect(hook.current.raw?.id).toBe('bus-123')
    expect(hook.current.error).toBeNull()
  })

  it('returns ready state with contract visible when user is logged in', async () => {
    useAuthStore.setState({
      user: { id: 'u1', username: 'testuser' } as any,
      isLoggedIn: true,
      isGuest: false,
    })

    ;(busesApi.getById as jest.Mock).mockResolvedValueOnce({
      data: mockBusData,
    })
    const queryClient = createTestQueryClient()

    const hook = renderBusDetailHook('bus-123', queryClient, { now: mockNow })

    await waitFor(() => {
      expect(hook.current.state).toBe('ready')
    })

    expect(hook.current.vm?.contract.access).toBe('visible')
    if (hook.current.vm?.contract.access === 'visible') {
      expect(hook.current.vm.contract.monthlyIncome).toBe(600)
      expect(hook.current.vm.contract.clientName).toBe('مدرسة خاصة')
    }
  })

  it('returns notFound state when API returns 404', async () => {
    const error404 = {
      isAxiosError: true,
      response: { status: 404, data: { message: 'Bus listing not found' } },
    }
    ;(busesApi.getById as jest.Mock).mockRejectedValueOnce(error404)
    const queryClient = createTestQueryClient()

    const hook = renderBusDetailHook('non-existent-bus', queryClient)

    await waitFor(() => {
      expect(hook.current.state).toBe('notFound')
    })

    expect(hook.current.vm).toBeUndefined()
    expect(hook.current.error).toEqual(error404)
  })

  it('returns offline state when network error occurs', async () => {
    const networkError = {
      isAxiosError: true,
      code: 'ERR_NETWORK',
      message: 'Network Error',
    }
    ;(busesApi.getById as jest.Mock).mockRejectedValueOnce(networkError)
    const queryClient = createTestQueryClient()

    const hook = renderBusDetailHook('bus-123', queryClient)

    await waitFor(() => {
      expect(hook.current.state).toBe('offline')
    })

    expect(hook.current.vm).toBeUndefined()
    expect(hook.current.error).toEqual(networkError)
  })

  it('returns error state when other server error occurs', async () => {
    const serverError = {
      isAxiosError: true,
      response: { status: 500, data: { message: 'Internal Server Error' } },
    }
    ;(busesApi.getById as jest.Mock).mockRejectedValueOnce(serverError)
    const queryClient = createTestQueryClient()

    const hook = renderBusDetailHook('bus-123', queryClient)

    await waitFor(() => {
      expect(hook.current.state).toBe('error')
    })

    expect(hook.current.vm).toBeUndefined()
    expect(hook.current.error).toEqual(serverError)
  })

  it('returns error state when id is missing or null', async () => {
    const queryClient = createTestQueryClient()

    const hook = renderBusDetailHook(null, queryClient)

    await waitFor(() => {
      expect(hook.current.state).toBe('error')
    })
    expect(hook.current.vm).toBeUndefined()
  })

  it('preserves ready state and mapped vm when cached data exists even if background refetch fails', async () => {
    const queryClient = createTestQueryClient()
    queryClient.setQueryData(busQueryKeys.detail('bus-123', false), mockBusData)

    const networkError = { isAxiosError: true, code: 'ERR_NETWORK', message: 'Offline' }
    ;(busesApi.getById as jest.Mock).mockRejectedValueOnce(networkError)

    const hook = renderBusDetailHook('bus-123', queryClient, { now: mockNow })

    await waitFor(() => {
      expect(hook.current.state).toBe('ready')
    })

    expect(hook.current.vm).toBeDefined()
    expect(hook.current.vm?.id).toBe('bus-123')
    expect(hook.current.raw?.id).toBe('bus-123')
  })

  describe('busQueryKeys.detail auth awareness', () => {
    it('returns auth key for logged in users and guest key for guests', () => {
      expect(busQueryKeys.detail('bus-99', true)).toEqual(['bus-detail', 'bus-99', 'auth'])
      expect(busQueryKeys.detail('bus-99', false)).toEqual(['bus-detail', 'bus-99', 'guest'])
      expect(busQueryKeys.detail('bus-99')).toEqual(['bus-detail', 'bus-99'])
      expect(busQueryKeys.detailPrefix('bus-99')).toEqual(['bus-detail', 'bus-99'])
    })

    it('invalidateBusListingQueries clears both auth and guest queries via prefix matching', async () => {
      const queryClient = createTestQueryClient()
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries')

      await invalidateBusListingQueries(queryClient, 'bus-99')

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['bus-detail', 'bus-99'] })
    })
  })
})