import React from 'react'
import { renderHook, waitFor, cleanup } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { listingsApi } from '../../api/listings'
import { useCarListings, useInfiniteCarListings } from '../../hooks/useCarListings'
import { useListings } from '../../hooks/useListings'
import { ListContractError } from '../../utils/parseListEnvelope'

jest.mock('../../api/listings', () => ({
  listingsApi: {
    getAll: jest.fn(),
    getById: jest.fn(),
    getMy: jest.fn(),
  },
}))

jest.mock('../../api/favorites', () => ({
  favoritesApi: {
    getAll: jest.fn(),
  },
}))

jest.mock('../../utils/mappers', () => ({
  mapListingToCard: (item: any) => ({
    id: item.id,
    title: item.title || item.id,
    category: 'cars',
    raw: item,
  }),
  mapServiceToCard: jest.fn(),
  mapPartToCard: jest.fn(),
  mapBusToCard: jest.fn(),
  mapEquipmentToCard: jest.fn(),
}))

const mockedGetAll = jest.mocked(listingsApi.getAll)

let queryClient: QueryClient

function createWrapper() {
  queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('Cars & Listings Hooks with S1 parseListEnvelope Contract (D-277)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(async () => {
    queryClient?.clear()
    await cleanup()
  })

  describe('useCarListings', () => {
    it('returns items on valid { items, meta } response', async () => {
      mockedGetAll.mockResolvedValueOnce({
        data: {
          items: [{ id: 'car-1', title: 'Toyota Land Cruiser' }],
          meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
        },
      } as never)

      const { result } = await renderHook(
        () => useCarListings({ listingType: 'SALE', limit: 10 }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toHaveLength(1)
      expect(result.current.data?.[0].id).toBe('car-1')
    })

    it('accepts direct array responses cleanly', async () => {
      mockedGetAll.mockResolvedValueOnce({
        data: [{ id: 'car-arr-1', title: 'Nissan Patrol' }],
      } as never)

      const { result } = await renderHook(() => useCarListings({ limit: 10 }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toHaveLength(1)
      expect(result.current.data?.[0].id).toBe('car-arr-1')
    })

    it('rejects legacy { data } envelope with ListContractError instead of silent []', async () => {
      mockedGetAll.mockResolvedValueOnce({
        data: { data: [{ id: 'car-legacy' }] },
      } as never)

      const { result } = await renderHook(() => useCarListings({ limit: 10 }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isError).toBe(true))
      expect(result.current.error).toBeInstanceOf(ListContractError)
    })

    it('rejects { results } envelope with ListContractError instead of silent []', async () => {
      mockedGetAll.mockResolvedValueOnce({
        data: { results: [{ id: 'car-results' }] },
      } as never)

      const { result } = await renderHook(() => useCarListings({ limit: 10 }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isError).toBe(true))
      expect(result.current.error).toBeInstanceOf(ListContractError)
    })

    it('surfaces network errors as isError=true instead of swallowing them', async () => {
      const networkError = { isAxiosError: true, message: 'Network Error', code: 'ERR_NETWORK' }
      mockedGetAll.mockRejectedValueOnce(networkError)

      const { result } = await renderHook(() => useCarListings({ limit: 10 }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isError).toBe(true))
      expect(result.current.error).toEqual(networkError)
      expect(result.current.data).toBeUndefined()
    })
  })

  describe('useInfiniteCarListings', () => {
    it('computes nextPage from meta when page < totalPages and stops at last page', async () => {
      mockedGetAll.mockResolvedValueOnce({
        data: {
          items: [{ id: 'car-p1' }],
          meta: { total: 20, page: 1, limit: 10, totalPages: 2 },
        },
      } as never)

      const { result } = await renderHook(() => useInfiniteCarListings({ limit: 10 }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.hasNextPage).toBe(true)
      expect(result.current.data?.pages[0].nextPage).toBe(2)

      mockedGetAll.mockResolvedValueOnce({
        data: {
          items: [{ id: 'car-p2' }],
          meta: { total: 20, page: 2, limit: 10, totalPages: 2 },
        },
      } as never)

      await result.current.fetchNextPage()
      await waitFor(() => expect(result.current.data?.pages).toHaveLength(2))
      expect(result.current.hasNextPage).toBe(false)
      expect(result.current.data?.pages[1].nextPage).toBeUndefined()
    })

    it('falls back to items.length === limit when meta is absent on array responses', async () => {
      mockedGetAll.mockResolvedValueOnce({
        data: [{ id: 'c1' }, { id: 'c2' }],
      } as never)

      const { result } = await renderHook(() => useInfiniteCarListings({ limit: 2 }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.hasNextPage).toBe(true)
      expect(result.current.data?.pages[0].nextPage).toBe(2)
    })

    it('sets isError=true with ListContractError on malformed response', async () => {
      mockedGetAll.mockResolvedValueOnce({
        data: { meta: { total: 1, page: 1, limit: 10, totalPages: 1 } },
      } as never)

      const { result } = await renderHook(() => useInfiniteCarListings({ limit: 10 }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isError).toBe(true))
      expect(result.current.error).toBeInstanceOf(ListContractError)
    })
  })

  describe('useListings (S1 + non-swallowing errors)', () => {
    it('maps { items, meta } payload via parseListEnvelope', async () => {
      mockedGetAll.mockResolvedValueOnce({
        data: {
          items: [{ id: 'home-car-1', title: 'Lexus LX' }],
          meta: { total: 1, page: 1, limit: 8, totalPages: 1 },
        },
      } as never)

      const { result } = await renderHook(() => useListings({ limit: 8 }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toHaveLength(1)
      expect(result.current.data?.[0].id).toBe('home-car-1')
    })

    it('throws rejected API error to React Query instead of returning []', async () => {
      const serverError = { isAxiosError: true, response: { status: 500 }, message: 'Server Down' }
      mockedGetAll.mockRejectedValueOnce(serverError)

      const { result } = await renderHook(() => useListings({ limit: 8 }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isError).toBe(true))
      expect(result.current.error).toEqual(serverError)
      expect(result.current.data).toBeUndefined()
    })

    it('enters isError with ListContractError on unexpected payload shape', async () => {
      mockedGetAll.mockResolvedValueOnce({
        data: { results: [] },
      } as never)

      const { result } = await renderHook(() => useListings({ limit: 8 }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isError).toBe(true))
      expect(result.current.error).toBeInstanceOf(ListContractError)
    })
  })
})
