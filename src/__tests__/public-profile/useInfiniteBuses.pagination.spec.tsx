import React from 'react'
import { act, renderHook, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { busesApi } from '../../api/buses'
import { useInfiniteBuses } from '../../hooks/useBuses'

jest.mock('../../api/buses', () => ({ busesApi: { getAll: jest.fn() } }))
jest.mock('../../utils/mappers', () => ({ mapBusToCard: (item: { id: string }) => ({ id: item.id }) }))

const mockedGetAll = jest.mocked(busesApi.getAll)
let activeQueryClient: QueryClient

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  activeQueryClient = queryClient
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
  return { Wrapper, queryClient }
}

describe('useInfiniteBuses pagination metadata', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    activeQueryClient.clear()
  })

  it('uses nested meta to advance from page one through the last page', async () => {
    mockedGetAll
      .mockResolvedValueOnce({ data: { data: [{ id: 'bus-1' }], meta: { page: 1, totalPages: 3 } } } as never)
      .mockResolvedValueOnce({ data: { data: [{ id: 'bus-2' }], meta: { page: 2, totalPages: 3 } } } as never)
      .mockResolvedValueOnce({ data: { data: [{ id: 'bus-3' }], meta: { page: 3, totalPages: 3 } } } as never)
    const { Wrapper } = createWrapper()
    const { result } = await renderHook(() => useInfiniteBuses(), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.hasNextPage).toBe(true))
    expect(result.current.data?.pages[0].data[0].id).toBe('bus-1')
    await act(async () => { await result.current.fetchNextPage() })
    await waitFor(() => expect(result.current.data?.pages).toHaveLength(2))
    expect(result.current.data?.pages[1].page).toBe(2)
    await act(async () => { await result.current.fetchNextPage() })
    await waitFor(() => expect(result.current.data?.pages).toHaveLength(3))
    expect(result.current.hasNextPage).toBe(false)
    expect(result.current.data?.pages[2].page).toBe(3)
  })

  it('treats missing or invalid metadata as terminal and keeps mapped page data', async () => {
    mockedGetAll.mockResolvedValueOnce({ data: { data: [{ id: 'bus-safe' }] } } as never)
    const { Wrapper } = createWrapper()
    const { result } = await renderHook(() => useInfiniteBuses(), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.hasNextPage).toBe(false)
    expect(result.current.data?.pages[0]).toEqual({ data: [{ id: 'bus-safe' }], page: 1, totalPages: 1 })
  })

  it('preserves browse pagination params and page data shape', async () => {
    mockedGetAll.mockResolvedValueOnce({ data: { data: [{ id: 'bus-filtered' }], meta: { page: 1, totalPages: 2 } } } as never)
    const { Wrapper } = createWrapper()
    const { result } = await renderHook(() => useInfiniteBuses({ cityId: 7 }), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockedGetAll).toHaveBeenCalledWith({ cityId: 7, page: 1, limit: 10 })
    expect(result.current.data?.pages[0].data).toEqual([{ id: 'bus-filtered' }])
    expect(result.current.hasNextPage).toBe(true)
  })
})
