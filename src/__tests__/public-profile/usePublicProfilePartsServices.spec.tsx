import React from 'react'
import { renderHook, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { partsApi } from '../../api/parts'
import { servicesApi } from '../../api/services'
import { usePublicProfileParts } from '../../hooks/public-profile/usePublicProfileParts'
import { usePublicProfileServices } from '../../hooks/public-profile/usePublicProfileServices'

jest.mock('../../api/parts', () => ({ partsApi: { getAll: jest.fn() } }))
jest.mock('../../api/services', () => ({ servicesApi: { getAll: jest.fn() } }))
jest.mock('../../utils/mappers', () => ({
  mapPartToCard: (item: { id: string }) => ({ id: item.id, title: item.id, images: [], raw: item }),
  mapServiceToCard: (item: { id: string }) => ({ id: item.id, title: item.id, images: [], raw: item }),
}))

const mockedPartsGetAll = jest.mocked(partsApi.getAll)
const mockedServicesGetAll = jest.mocked(servicesApi.getAll)
let queryClient: QueryClient

function createWrapper() {
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
  return Wrapper
}

describe('public profile parts and services queries', () => {
  beforeEach(() => jest.clearAllMocks())
  afterEach(() => queryClient.clear())

  it('filters parts by seller id and retains the raw payload on its mapped card', async () => {
    mockedPartsGetAll.mockResolvedValueOnce({ data: { items: [{ id: 'part-1' }], meta: { page: 1, totalPages: 1 } } } as never)
    const { result } = await renderHook(() => usePublicProfileParts('seller-part'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockedPartsGetAll).toHaveBeenCalledWith({ sellerId: 'seller-part', status: 'ACTIVE', limit: 10, page: 1 })
    expect(result.current.data?.pages[0].data[0].raw).toEqual({ id: 'part-1' })
  })

  it('filters services by user id and uses an isolated service query key', async () => {
    mockedServicesGetAll.mockResolvedValueOnce({ data: { data: [{ id: 'service-1' }], meta: { page: 1, totalPages: 1 } } } as never)
    const { result } = await renderHook(() => usePublicProfileServices('seller-service'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockedServicesGetAll).toHaveBeenCalledWith({ userId: 'seller-service', status: 'ACTIVE', limit: 10, page: 1 })
    const keys = queryClient.getQueryCache().getAll().map((query) => query.queryKey)
    expect(keys).toContainEqual(['public-profile-listings', 'seller-service', 'service', { userId: 'seller-service', status: 'ACTIVE', limit: 10 }])
    expect(result.current.data?.pages[0].data[0].raw).toEqual({ id: 'service-1' })
  })
})
