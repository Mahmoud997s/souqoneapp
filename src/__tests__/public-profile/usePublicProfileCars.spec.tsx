import React from 'react'
import { act, renderHook, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { listingsApi } from '../../api/listings'
import { usePublicProfileCars } from '../../hooks/public-profile/usePublicProfileCars'

jest.mock('../../api/listings', () => ({ listingsApi: { getAll: jest.fn() } }))
jest.mock('../../utils/mappers', () => ({ mapListingToCard: (item: { id: string }) => ({ id: item.id, title: item.id, images: [], raw: item }) }))

const mockedGetAll = jest.mocked(listingsApi.getAll)
let queryClient: QueryClient

function createWrapper() {
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
  return Wrapper
}

describe('usePublicProfileCars', () => {
  beforeEach(() => jest.clearAllMocks())
  afterEach(() => queryClient.clear())

  it('requests only active cars by seller id and advances using page metadata', async () => {
    mockedGetAll
      .mockResolvedValueOnce({ data: { items: [{ id: 'car-1' }], meta: { page: 1, totalPages: 2 } } } as never)
      .mockResolvedValueOnce({ data: { items: [{ id: 'car-2' }], meta: { page: 2, totalPages: 2 } } } as never)
    const { result } = await renderHook(() => usePublicProfileCars('seller-1'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.hasNextPage).toBe(true))
    expect(mockedGetAll).toHaveBeenNthCalledWith(1, { sellerId: 'seller-1', status: 'ACTIVE', limit: 10, page: 1 })
    expect(result.current.data?.pages[0].data[0].id).toBe('car-1')
    await act(async () => { await result.current.fetchNextPage() })
    await waitFor(() => expect(result.current.data?.pages).toHaveLength(2))
    expect(mockedGetAll).toHaveBeenNthCalledWith(2, { sellerId: 'seller-1', status: 'ACTIVE', limit: 10, page: 2 })
    expect(result.current.hasNextPage).toBe(false)
  })

  it('uses isolated seller and vertical keys rather than listing roots', async () => {
    mockedGetAll.mockResolvedValueOnce({ data: { items: [], meta: { page: 1, totalPages: 1 } } } as never)
    const wrapper = createWrapper()
    const { result } = await renderHook(() => usePublicProfileCars('seller-2'), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const keys = queryClient.getQueryCache().getAll().map((query) => query.queryKey)
    expect(keys[0]).toEqual(['public-profile-listings', 'seller-2', 'car', { sellerId: 'seller-2', status: 'ACTIVE', limit: 10 }])
    expect(keys[0][0]).not.toBe('listings')
  })
})
