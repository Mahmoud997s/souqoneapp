import React from 'react'
import { act, renderHook, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { busesApi } from '../../api/buses'
import { equipmentApi } from '../../api/equipment'
import { usePublicProfileBuses } from '../../hooks/public-profile/usePublicProfileBuses'
import { usePublicProfileEquipment } from '../../hooks/public-profile/usePublicProfileEquipment'

jest.mock('../../api/buses', () => ({ busesApi: { getAll: jest.fn() } }))
jest.mock('../../api/equipment', () => ({ equipmentApi: { getAll: jest.fn() } }))
jest.mock('../../utils/mappers', () => ({
  mapBusToCard: (item: { id: string }) => ({ id: item.id, title: item.id, images: [], raw: item }),
  mapEquipmentToCard: (item: { id: string }) => ({ id: item.id, title: item.id, images: [], raw: item }),
}))

const mockedBusesGetAll = jest.mocked(busesApi.getAll)
const mockedEquipmentGetAll = jest.mocked(equipmentApi.getAll)
let queryClient: QueryClient

function createWrapper() {
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
  return Wrapper
}

describe('public profile bus and equipment queries', () => {
  beforeEach(() => jest.clearAllMocks())
  afterEach(() => queryClient.clear())

  it('filters buses by user and uses backend meta for every page', async () => {
    mockedBusesGetAll
      .mockResolvedValueOnce({ data: { items: [{ id: 'bus-1' }], meta: { page: 1, totalPages: 3 } } } as never)
      .mockResolvedValueOnce({ data: { items: [{ id: 'bus-2' }], meta: { page: 2, totalPages: 3 } } } as never)
      .mockResolvedValueOnce({ data: { items: [{ id: 'bus-3' }], meta: { page: 3, totalPages: 3 } } } as never)
    const { result } = await renderHook(() => usePublicProfileBuses('seller-bus'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.hasNextPage).toBe(true))
    expect(mockedBusesGetAll).toHaveBeenNthCalledWith(1, { userId: 'seller-bus', limit: 10, page: 1 })
    let fetchedNextPage: Awaited<ReturnType<typeof result.current.fetchNextPage>> | undefined
    await act(async () => { fetchedNextPage = await result.current.fetchNextPage() })
    await waitFor(() => expect(mockedBusesGetAll).toHaveBeenCalledTimes(2))
    expect(mockedBusesGetAll).toHaveBeenNthCalledWith(2, { userId: 'seller-bus', limit: 10, page: 2 })
    expect(result.current.error).toBeNull()
    expect(fetchedNextPage?.data?.pages).toHaveLength(2)
    let fetchedThirdPage: Awaited<ReturnType<typeof result.current.fetchNextPage>> | undefined
    await act(async () => { fetchedThirdPage = await result.current.fetchNextPage() })
    await waitFor(() => expect(mockedBusesGetAll).toHaveBeenCalledTimes(3))
    expect(fetchedThirdPage?.data?.pages).toHaveLength(3)
    expect(fetchedThirdPage?.hasNextPage).toBe(false)
  })

  it('uses the ten-item equipment page size and keeps bus/equipment caches separate', async () => {
    mockedEquipmentGetAll.mockResolvedValueOnce({ data: { items: [{ id: 'equipment-1' }], meta: { page: 1, totalPages: 1 } } } as never)
    const { result } = await renderHook(() => usePublicProfileEquipment('seller-equipment'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockedEquipmentGetAll).toHaveBeenCalledWith({ userId: 'seller-equipment', limit: 10, page: 1 })
    const keys = queryClient.getQueryCache().getAll().map((query) => query.queryKey)
    expect(keys).toContainEqual(['public-profile-listings', 'seller-equipment', 'equipment', { userId: 'seller-equipment', limit: 10 }])
    expect(keys[0][0]).toBe('public-profile-listings')
    expect(result.current.data?.pages[0].data[0].id).toBe('equipment-1')
  })
})
