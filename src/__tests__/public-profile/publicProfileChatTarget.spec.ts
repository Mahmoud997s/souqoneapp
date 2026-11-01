import { busesApi } from '../../api/buses'
import { equipmentApi } from '../../api/equipment'
import { listingsApi } from '../../api/listings'
import { partsApi } from '../../api/parts'
import { servicesApi } from '../../api/services'
import { findNewestPublicProfileChatTarget, publicProfileChatEntityTypes } from '../../utils/publicProfileChatTarget'
import { PUBLIC_PROFILE_QUERY_ALLOWED_PARAMS, PublicProfileQueryVertical } from './publicProfileQueryContract.constants'

jest.mock('../../api/buses', () => ({ busesApi: { getAll: jest.fn() } }))
jest.mock('../../api/equipment', () => ({ equipmentApi: { getAll: jest.fn() } }))
jest.mock('../../api/listings', () => ({ listingsApi: { getAll: jest.fn() } }))
jest.mock('../../api/parts', () => ({ partsApi: { getAll: jest.fn() } }))
jest.mock('../../api/services', () => ({ servicesApi: { getAll: jest.fn() } }))

const apis = [listingsApi, busesApi, equipmentApi, partsApi, servicesApi]
const meta = { total: 1, page: 1, limit: 1, totalPages: 1 }
const response = (id: string, createdAt: string) => ({ data: { items: [{ id, createdAt }], meta } })
const emptyResponse = { data: { items: [], meta: { ...meta, total: 0 } } }

beforeEach(() => jest.clearAllMocks())

describe('findNewestPublicProfileChatTarget', () => {
  it('maps every vertical to its supported chat entity type', () => {
    expect(publicProfileChatEntityTypes).toEqual({
      car: 'LISTING',
      bus: 'BUS_LISTING',
      equipment: 'EQUIPMENT_LISTING',
      part: 'SPARE_PART',
      service: 'CAR_SERVICE',
    })
    expect(Object.values(publicProfileChatEntityTypes)).not.toContain('USER')
  })

  it('requests only whitelisted params and chooses the newest listing from real items responses', async () => {
    const resolvers: ((value: never) => void)[] = []
    apis.forEach((api) => jest.mocked(api.getAll).mockImplementation(() => new Promise((resolve) => resolvers.push(resolve)) as never))

    const pending = findNewestPublicProfileChatTarget('seller-1')
    expect(apis.every((api) => jest.mocked(api.getAll).mock.calls.length === 1)).toBe(true)

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
      ['car', { sellerId: 'seller-1', status: 'ACTIVE', page: 1, limit: 1, sortBy: 'createdAt', sortOrder: 'desc' }],
      ['bus', { userId: 'seller-1', page: 1, limit: 1 }],
      ['equipment', { userId: 'seller-1', page: 1, limit: 1 }],
      ['part', { sellerId: 'seller-1', page: 1, limit: 1, sortBy: 'createdAt', sortOrder: 'desc' }],
      ['service', { userId: 'seller-1', page: 1, limit: 1 }],
    ])

    resolvers[0](response('car-1', '2025-01-01T00:00:00.000Z') as never)
    resolvers[1](response('bus-1', '2025-03-01T00:00:00.000Z') as never)
    resolvers[2](response('equipment-1', '2025-02-01T00:00:00.000Z') as never)
    resolvers[3](response('part-1', '2025-04-01T00:00:00.000Z') as never)
    resolvers[4](response('service-new', '2025-05-01T00:00:00.000Z') as never)

    await expect(pending).resolves.toEqual({ entityId: 'service-new', entityType: 'CAR_SERVICE' })
  })

  it('uses successful verticals when one endpoint fails', async () => {
    jest.mocked(listingsApi.getAll).mockResolvedValue(response('car-1', '2025-01-01T00:00:00.000Z') as never)
    jest.mocked(busesApi.getAll).mockResolvedValue(response('bus-1', '2025-03-01T00:00:00.000Z') as never)
    jest.mocked(equipmentApi.getAll).mockRejectedValue(new Error('equipment unavailable'))
    jest.mocked(partsApi.getAll).mockResolvedValue(response('part-1', '2025-04-01T00:00:00.000Z') as never)
    jest.mocked(servicesApi.getAll).mockResolvedValue(response('service-1', '2025-02-01T00:00:00.000Z') as never)

    await expect(findNewestPublicProfileChatTarget('seller-1')).resolves.toEqual({ entityId: 'part-1', entityType: 'SPARE_PART' })
  })

  it('returns null when successful endpoints contain no active listing', async () => {
    apis.forEach((api) => jest.mocked(api.getAll).mockResolvedValue(emptyResponse as never))

    await expect(findNewestPublicProfileChatTarget('seller-1')).resolves.toBeNull()
  })

  it('uses the legacy data array only when the items field is absent', async () => {
    apis.forEach((api) => jest.mocked(api.getAll).mockResolvedValue(emptyResponse as never))
    jest.mocked(busesApi.getAll).mockResolvedValue({ data: { data: [{ id: 'legacy-bus', createdAt: '2025-03-01T00:00:00.000Z' }], meta } } as never)

    await expect(findNewestPublicProfileChatTarget('seller-1')).resolves.toEqual({ entityId: 'legacy-bus', entityType: 'BUS_LISTING' })
  })

  it('throws when all five endpoints fail so the route can show its retry message', async () => {
    apis.forEach((api) => jest.mocked(api.getAll).mockRejectedValue(new Error('request failed')))

    await expect(findNewestPublicProfileChatTarget('seller-1')).rejects.toThrow('All public profile listing queries failed')
  })
})
