import { busesApi } from '../../api/buses'
import { equipmentApi } from '../../api/equipment'
import { listingsApi } from '../../api/listings'
import { partsApi } from '../../api/parts'
import { servicesApi } from '../../api/services'
import { findNewestPublicProfileChatTarget, publicProfileChatEntityTypes } from '../../utils/publicProfileChatTarget'

jest.mock('../../api/buses', () => ({ busesApi: { getAll: jest.fn() } }))
jest.mock('../../api/equipment', () => ({ equipmentApi: { getAll: jest.fn() } }))
jest.mock('../../api/listings', () => ({ listingsApi: { getAll: jest.fn() } }))
jest.mock('../../api/parts', () => ({ partsApi: { getAll: jest.fn() } }))
jest.mock('../../api/services', () => ({ servicesApi: { getAll: jest.fn() } }))

const apis = [listingsApi, busesApi, equipmentApi, partsApi, servicesApi]
const response = (id: string, createdAt: string) => ({ data: { data: [{ id, createdAt }] } })

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

  it('starts all five active first-page lookups together and selects the newest listing', async () => {
    const resolvers: ((value: never) => void)[] = []
    apis.forEach((api) => jest.mocked(api.getAll).mockImplementation(() => new Promise((resolve) => resolvers.push(resolve)) as never))

    const pending = findNewestPublicProfileChatTarget('seller-1')

    expect(apis.every((api) => jest.mocked(api.getAll).mock.calls.length === 1)).toBe(true)
    expect(jest.mocked(listingsApi.getAll)).toHaveBeenCalledWith({ sellerId: 'seller-1', status: 'ACTIVE', page: 1, limit: 1, sortBy: 'createdAt', sortOrder: 'desc' })
    expect(jest.mocked(busesApi.getAll)).toHaveBeenCalledWith({ userId: 'seller-1', status: 'ACTIVE', page: 1, limit: 1, sortBy: 'createdAt', sortOrder: 'desc' })
    expect(jest.mocked(equipmentApi.getAll)).toHaveBeenCalledWith({ userId: 'seller-1', status: 'ACTIVE', page: 1, limit: 1, sortBy: 'createdAt', sortOrder: 'desc' })
    expect(jest.mocked(partsApi.getAll)).toHaveBeenCalledWith({ sellerId: 'seller-1', status: 'ACTIVE', page: 1, limit: 1, sortBy: 'createdAt', sortOrder: 'desc' })
    expect(jest.mocked(servicesApi.getAll)).toHaveBeenCalledWith({ userId: 'seller-1', status: 'ACTIVE', page: 1, limit: 1, sortBy: 'createdAt', sortOrder: 'desc' })

    resolvers[0](response('car-1', '2025-01-01T00:00:00.000Z') as never)
    resolvers[1](response('bus-1', '2025-03-01T00:00:00.000Z') as never)
    resolvers[2](response('equipment-1', '2025-02-01T00:00:00.000Z') as never)
    resolvers[3](response('part-1', '2025-04-01T00:00:00.000Z') as never)
    resolvers[4](response('service-1', '2025-05-01T00:00:00.000Z') as never)

    await expect(pending).resolves.toEqual({ entityId: 'service-1', entityType: 'CAR_SERVICE' })
  })

  it('returns null when no active listing is available', async () => {
    apis.forEach((api) => jest.mocked(api.getAll).mockResolvedValue({ data: { data: [] } } as never))

    await expect(findNewestPublicProfileChatTarget('seller-1')).resolves.toBeNull()
  })
})
