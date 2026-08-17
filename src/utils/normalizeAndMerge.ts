import {
  MyListingItem,
  MyListingEntityType,
  MyListingNormalizedStatus,
} from '../types/my-listings.types'
import {
  mapListingToCard,
  mapBusToCard,
  mapEquipmentToCard,
  mapOperatorToCard,
  mapPartToCard,
  mapServiceToCard,
  mapJobToCard,
} from './mappers'

export interface RawEntitiesBundle {
  cars?: any
  buses?: any
  services?: any
  jobs?: any
  equipment?: any
  operators?: any
  parts?: any
}

/**
 * Robustly extracts an array from direct array, { items: [] }, { data: [] }, or null/undefined
 */
export function extractArray<T = any>(input: any): T[] {
  if (!input) return []
  if (Array.isArray(input)) return input
  if (Array.isArray(input.items)) return input.items
  if (Array.isArray(input.data)) return input.data
  return []
}

/**
 * Normalizes status based on Prisma Enums (ListingStatus, JobStatus)
 */
export function normalizeEntityStatus(
  entityType: MyListingEntityType,
  rawStatus?: string
): MyListingNormalizedStatus {
  const status = (rawStatus || '').toUpperCase()

  if (entityType === 'job') {
    if (status === 'ACTIVE' || status === 'OPEN') return 'active'
    if (status === 'CLOSED' || status === 'EXPIRED') return 'expired'
    return 'active'
  }

  // ListingStatus: DRAFT, ACTIVE, SOLD, RENTED, ARCHIVED, SUSPENDED
  switch (status) {
    case 'ACTIVE':
    case 'PUBLISHED':
      return 'active'
    case 'DRAFT':
    case 'PENDING':
    case 'SUSPENDED':
      return 'draft'
    case 'SOLD':
    case 'RENTED':
    case 'ARCHIVED':
    case 'EXPIRED':
      return 'expired'
    default:
      return 'active'
  }
}

function extractThumbnail(images?: any[]): string | undefined {
  if (!images || !Array.isArray(images) || images.length === 0) return undefined
  const first = images[0]
  if (typeof first === 'string') return first
  if (first && typeof first === 'object' && typeof first.url === 'string') return first.url
  return undefined
}

/**
 * Pure function to normalize and merge raw entities from all 7 marketplace sources,
 * and sort them globally by updatedAt descending.
 */
export function normalizeAndMerge(bundle: RawEntitiesBundle): MyListingItem[] {
  const results: MyListingItem[] = []

  // 1. Cars
  const cars = extractArray(bundle.cars)
  for (const car of cars) {
    if (!car || !car.id) continue
    const rawStatus = car.status || 'ACTIVE'
    results.push({
      id: car.id,
      entityType: 'car',
      normalizedStatus: normalizeEntityStatus('car', rawStatus),
      rawStatus,
      title: car.title || `${car.make || ''} ${car.model || ''}`.trim() || 'سيارة',
      thumbnail: extractThumbnail(car.images),
      updatedAt: car.updatedAt || car.createdAt || '',
      raw: car,
      mapped: mapListingToCard(car),
    })
  }

  // 2. Buses
  const buses = extractArray(bundle.buses)
  for (const bus of buses) {
    if (!bus || !bus.id) continue
    const rawStatus = bus.status || 'ACTIVE'
    results.push({
      id: bus.id,
      entityType: 'bus',
      normalizedStatus: normalizeEntityStatus('bus', rawStatus),
      rawStatus,
      title: bus.title || `${bus.make || ''} ${bus.model || ''}`.trim() || 'حافلة',
      thumbnail: extractThumbnail(bus.images),
      updatedAt: bus.updatedAt || bus.createdAt || '',
      raw: bus,
      mapped: mapBusToCard(bus),
    })
  }

  // 3. Services
  const services = extractArray(bundle.services)
  for (const s of services) {
    if (!s || !s.id) continue
    const rawStatus = s.status || 'ACTIVE'
    results.push({
      id: s.id,
      entityType: 'service',
      normalizedStatus: normalizeEntityStatus('service', rawStatus),
      rawStatus,
      title: s.title || s.serviceName || 'خدمة مركبات',
      thumbnail: extractThumbnail(s.images),
      updatedAt: s.updatedAt || s.createdAt || '',
      raw: s,
      mapped: mapServiceToCard(s),
    })
  }

  // 4. Jobs
  const jobs = extractArray(bundle.jobs)
  for (const j of jobs) {
    if (!j || !j.id) continue
    const rawStatus = j.status || 'ACTIVE'
    results.push({
      id: j.id,
      entityType: 'job',
      normalizedStatus: normalizeEntityStatus('job', rawStatus),
      rawStatus,
      title: j.title || 'وظيفة سائق',
      thumbnail: undefined,
      updatedAt: j.updatedAt || j.createdAt || '',
      raw: j,
      mapped: mapJobToCard(j),
    })
  }

  // 5. Equipment
  const equipment = extractArray(bundle.equipment)
  for (const eq of equipment) {
    if (!eq || !eq.id) continue
    const rawStatus = eq.status || 'ACTIVE'
    results.push({
      id: eq.id,
      entityType: 'equipment',
      normalizedStatus: normalizeEntityStatus('equipment', rawStatus),
      rawStatus,
      title: eq.title || `${eq.make || ''} ${eq.model || ''}`.trim() || 'معدة',
      thumbnail: extractThumbnail(eq.images as any),
      updatedAt: eq.updatedAt || eq.createdAt || '',
      raw: eq,
      mapped: mapEquipmentToCard(eq),
    })
  }

  // 6. Operators
  const operators = extractArray(bundle.operators)
  for (const op of operators) {
    if (!op || !op.id) continue
    const rawStatus = op.status || 'ACTIVE'
    results.push({
      id: op.id,
      entityType: 'operator',
      normalizedStatus: normalizeEntityStatus('operator', rawStatus),
      rawStatus,
      title: op.title || 'مشغل معدات',
      thumbnail: undefined,
      updatedAt: op.updatedAt || op.createdAt || '',
      raw: op,
      mapped: mapOperatorToCard(op),
    })
  }

  // 7. Parts
  const parts = extractArray(bundle.parts)
  for (const part of parts) {
    if (!part || !part.id) continue
    const rawStatus = part.status || 'ACTIVE'
    results.push({
      id: part.id,
      entityType: 'part',
      normalizedStatus: normalizeEntityStatus('part', rawStatus),
      rawStatus,
      title: part.title || part.partName || 'قطعة غيار',
      thumbnail: extractThumbnail(part.images),
      updatedAt: part.updatedAt || part.createdAt || '',
      raw: part,
      mapped: mapPartToCard(part),
    })
  }

  // Sort globally by updatedAt descending (latest first)
  results.sort((a, b) => {
    const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0
    const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0
    return timeB - timeA
  })

  return results
}
