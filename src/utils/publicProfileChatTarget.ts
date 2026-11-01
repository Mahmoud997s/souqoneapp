import { busesApi } from '../api/buses'
import { equipmentApi } from '../api/equipment'
import { listingsApi } from '../api/listings'
import { partsApi } from '../api/parts'
import { servicesApi } from '../api/services'

export const publicProfileChatEntityTypes = {
  car: 'LISTING',
  bus: 'BUS_LISTING',
  equipment: 'EQUIPMENT_LISTING',
  part: 'SPARE_PART',
  service: 'CAR_SERVICE',
} as const

export type PublicProfileChatVertical = keyof typeof publicProfileChatEntityTypes
export type PublicProfileChatEntityType = (typeof publicProfileChatEntityTypes)[PublicProfileChatVertical]

export interface PublicProfileChatTarget {
  entityId: string
  entityType: PublicProfileChatEntityType
}

interface DatedListing {
  id: string
  createdAt?: string
}

interface DatedCandidate extends PublicProfileChatTarget {
  createdAt: string
}

function toCandidate<T extends DatedListing>(vertical: PublicProfileChatVertical, item?: T): DatedCandidate | null {
  if (!item || !item.createdAt || !Number.isFinite(Date.parse(item.createdAt))) return null

  return {
    entityId: item.id,
    entityType: publicProfileChatEntityTypes[vertical],
    createdAt: item.createdAt,
  }
}

export async function findNewestPublicProfileChatTarget(userId: string): Promise<PublicProfileChatTarget | null> {
  const [cars, buses, equipment, parts, services] = await Promise.all([
    listingsApi.getAll({ sellerId: userId, status: 'ACTIVE', page: 1, limit: 1, sortBy: 'createdAt', sortOrder: 'desc' }),
    busesApi.getAll({ userId, status: 'ACTIVE', page: 1, limit: 1, sortBy: 'createdAt', sortOrder: 'desc' }),
    equipmentApi.getAll({ userId, status: 'ACTIVE', page: 1, limit: 1, sortBy: 'createdAt', sortOrder: 'desc' }),
    partsApi.getAll({ sellerId: userId, status: 'ACTIVE', page: 1, limit: 1, sortBy: 'createdAt', sortOrder: 'desc' }),
    servicesApi.getAll({ userId, status: 'ACTIVE', page: 1, limit: 1, sortBy: 'createdAt', sortOrder: 'desc' }),
  ])

  const candidates = [
    toCandidate('car', cars.data.data[0]),
    toCandidate('bus', buses.data.data[0]),
    toCandidate('equipment', equipment.data.data[0]),
    toCandidate('part', parts.data.data[0]),
    toCandidate('service', services.data.data[0]),
  ].filter((candidate): candidate is DatedCandidate => candidate !== null)

  const newest = candidates.reduce<DatedCandidate | null>((current, candidate) => {
    if (!current || Date.parse(candidate.createdAt) > Date.parse(current.createdAt)) return candidate
    return current
  }, null)

  if (!newest) return null
  return { entityId: newest.entityId, entityType: newest.entityType }
}
