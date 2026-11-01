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

function readResponseItems<T>(response: unknown): T[] {
  if (!response || typeof response !== 'object' || !('data' in response)) return []
  const payload = response.data
  if (!payload || typeof payload !== 'object') return []
  if ('items' in payload && Array.isArray(payload.items)) return payload.items as T[]
  if ('data' in payload && Array.isArray(payload.data)) return payload.data as T[]
  return []
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
  const results = await Promise.allSettled([
    listingsApi.getAll({ sellerId: userId, status: 'ACTIVE', page: 1, limit: 1, sortBy: 'createdAt', sortOrder: 'desc' }),
    busesApi.getAll({ userId, page: 1, limit: 1 }),
    equipmentApi.getAll({ userId, page: 1, limit: 1 }),
    partsApi.getAll({ sellerId: userId, page: 1, limit: 1, sortBy: 'createdAt', sortOrder: 'desc' }),
    servicesApi.getAll({ userId, page: 1, limit: 1 }),
  ])

  if (results.every((result) => result.status === 'rejected')) {
    throw new Error('All public profile listing queries failed')
  }

  const verticals = ['car', 'bus', 'equipment', 'part', 'service'] as const
  const candidates: DatedCandidate[] = []
  results.forEach((result, index) => {
    if (result.status === 'rejected') return
    const vertical = verticals[index]
    if (!vertical) return
    const candidate = toCandidate(vertical, readResponseItems<DatedListing>(result.value)[0])
    if (candidate) candidates.push(candidate)
  })

  const newest = candidates.reduce<DatedCandidate | null>((current, candidate) => {
    if (!current || Date.parse(candidate.createdAt) > Date.parse(current.createdAt)) return candidate
    return current
  }, null)

  if (!newest) return null
  return { entityId: newest.entityId, entityType: newest.entityType }
}
