import React from 'react'
import { renderHook, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { busesApi } from '../../api/buses'
import { equipmentApi } from '../../api/equipment'
import { listingsApi } from '../../api/listings'
import { partsApi } from '../../api/parts'
import { servicesApi } from '../../api/services'
import { usePublicProfileBuses } from '../../hooks/public-profile/usePublicProfileBuses'
import { usePublicProfileCars } from '../../hooks/public-profile/usePublicProfileCars'
import { usePublicProfileEquipment } from '../../hooks/public-profile/usePublicProfileEquipment'
import { usePublicProfileParts } from '../../hooks/public-profile/usePublicProfileParts'
import { usePublicProfileServices } from '../../hooks/public-profile/usePublicProfileServices'
import { PUBLIC_PROFILE_QUERY_ALLOWED_PARAMS, PublicProfileQueryVertical } from './publicProfileQueryContract.constants'

jest.mock('../../api/buses', () => ({ busesApi: { getAll: jest.fn() } }))
jest.mock('../../api/equipment', () => ({ equipmentApi: { getAll: jest.fn() } }))
jest.mock('../../api/listings', () => ({ listingsApi: { getAll: jest.fn() } }))
jest.mock('../../api/parts', () => ({ partsApi: { getAll: jest.fn() } }))
jest.mock('../../api/services', () => ({ servicesApi: { getAll: jest.fn() } }))

const apis = [listingsApi, busesApi, equipmentApi, partsApi, servicesApi]
let queryClient: QueryClient

function createWrapper() {
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children)
  }
  return Wrapper
}

beforeEach(() => {
  jest.clearAllMocks()
  apis.forEach((api) => jest.mocked(api.getAll).mockResolvedValue({ data: { items: [], meta: { total: 0, page: 1, limit: 10, totalPages: 1 } } } as never))
})
afterEach(() => queryClient.clear())

describe('public profile query contracts', () => {
  it('sends only parameters allowed by each backend DTO', async () => {
    const { result } = await renderHook(() => [
      usePublicProfileCars('seller-1'),
      usePublicProfileBuses('seller-1'),
      usePublicProfileEquipment('seller-1'),
      usePublicProfileParts('seller-1'),
      usePublicProfileServices('seller-1'),
    ], { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.every((query) => query.isSuccess)).toBe(true))

    const requests: { vertical: PublicProfileQueryVertical; params: Record<string, unknown> }[] = [
      { vertical: 'car', params: jest.mocked(listingsApi.getAll).mock.calls[0][0] ?? {} },
      { vertical: 'bus', params: jest.mocked(busesApi.getAll).mock.calls[0][0] ?? {} },
      { vertical: 'equipment', params: jest.mocked(equipmentApi.getAll).mock.calls[0][0] ?? {} },
      { vertical: 'part', params: jest.mocked(partsApi.getAll).mock.calls[0][0] ?? {} },
      { vertical: 'service', params: jest.mocked(servicesApi.getAll).mock.calls[0][0] ?? {} },
    ]

    requests.forEach(({ vertical, params }) => {
      const allowed = PUBLIC_PROFILE_QUERY_ALLOWED_PARAMS[vertical] as readonly string[]
      expect(Object.keys(params).every((key) => allowed.includes(key))).toBe(true)
    })
    expect(requests.map(({ vertical, params }) => [vertical, params])).toEqual([
      ['car', { sellerId: 'seller-1', status: 'ACTIVE', limit: 10, page: 1 }],
      ['bus', { userId: 'seller-1', limit: 10, page: 1 }],
      ['equipment', { userId: 'seller-1', limit: 10, page: 1 }],
      ['part', { sellerId: 'seller-1', limit: 10, page: 1 }],
      ['service', { userId: 'seller-1', limit: 10, page: 1 }],
    ])
  })
})