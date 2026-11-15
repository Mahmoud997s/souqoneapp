import type { Href } from 'expo-router'
import { busesApi } from '../api/buses'
import { equipmentApi } from '../api/equipment'
import { listingsApi } from '../api/listings'
import { partsApi } from '../api/parts'
import { servicesApi } from '../api/services'
import { getDetailErrorKind } from '../utils/listing-detail/getDetailErrorKind'
import {
  editRoute,
  normalizeListingEntityType,
  startEdit,
  type CarDetailApiInput,
  type EditableListingPayload,
  type ListingRouteEntityType,
} from './listingRoutes'

export type LegacyRedirectErrorKind = 'notFound' | 'offline' | 'timeout' | 'serverError' | 'error'

export type LegacyResolveResult =
  | { ok: true; entityType: ListingRouteEntityType; item: unknown }
  | { ok: false; errorKind: LegacyRedirectErrorKind }

function unwrapApiData(res: unknown): unknown {
  if (res && typeof res === 'object' && 'data' in res && (res as { data?: unknown }).data !== undefined) {
    return (res as { data: unknown }).data
  }
  return res
}

export function mapErrorToRedirectKind(err: unknown): LegacyRedirectErrorKind {
  const kind = getDetailErrorKind(err)
  if (kind === 'notFound') return 'notFound'
  if (kind === 'offline') return 'offline'
  if (kind === 'timeout') return 'timeout'
  if (kind === 'serverError') return 'serverError'
  return 'error'
}

const PROBE_ORDER: ReadonlyArray<{
  entityType: ListingRouteEntityType
  fetchById: (id: string) => Promise<unknown>
}> = [
  { entityType: 'LISTING', fetchById: (id) => listingsApi.getById(id) },
  { entityType: 'BUS_LISTING', fetchById: (id) => busesApi.getById(id) },
  { entityType: 'EQUIPMENT_LISTING', fetchById: (id) => equipmentApi.getById(id) },
  { entityType: 'OPERATOR_LISTING', fetchById: (id) => equipmentApi.getOperatorById(id) },
  { entityType: 'SPARE_PART', fetchById: (id) => partsApi.getById(id) },
  { entityType: 'CAR_SERVICE', fetchById: (id) => servicesApi.getById(id) },
]

export async function resolveLegacyListingById(id: string): Promise<LegacyResolveResult> {
  for (const probe of PROBE_ORDER) {
    try {
      const res = await probe.fetchById(id)
      const item = unwrapApiData(res)
      if (item) {
        return { ok: true, entityType: probe.entityType, item }
      }
    } catch (err) {
      const errorKind = mapErrorToRedirectKind(err)
      if (errorKind !== 'notFound') {
        return { ok: false, errorKind }
      }
    }
  }
  return { ok: false, errorKind: 'notFound' }
}

export async function resolveLegacyEditRoute(
  id: string,
  rawType?: string | null
): Promise<{ ok: true; href: Href } | { ok: false; errorKind: LegacyRedirectErrorKind }> {
  if (rawType) {
    const entityType = normalizeListingEntityType(rawType)
    if (
      entityType === 'BUS_LISTING' ||
      entityType === 'EQUIPMENT_LISTING' ||
      entityType === 'OPERATOR_LISTING'
    ) {
      return { ok: true, href: editRoute(entityType, id) }
    }
    try {
      let res: unknown
      if (entityType === 'SPARE_PART') {
        res = await partsApi.getById(id)
      } else if (entityType === 'CAR_SERVICE') {
        res = await servicesApi.getById(id)
      } else {
        res = await listingsApi.getById(id)
      }
      const item = unwrapApiData(res)
      if (!item) {
        return { ok: false, errorKind: 'notFound' }
      }
      return {
        ok: true,
        href: startEdit(entityType, item as EditableListingPayload | CarDetailApiInput),
      }
    } catch (err) {
      return { ok: false, errorKind: mapErrorToRedirectKind(err) }
    }
  }

  const resolved = await resolveLegacyListingById(id)
  if (!resolved.ok) {
    return resolved
  }

  if (
    resolved.entityType === 'BUS_LISTING' ||
    resolved.entityType === 'EQUIPMENT_LISTING' ||
    resolved.entityType === 'OPERATOR_LISTING'
  ) {
    return { ok: true, href: editRoute(resolved.entityType, id) }
  }

  return {
    ok: true,
    href: startEdit(
      resolved.entityType,
      resolved.item as EditableListingPayload | CarDetailApiInput
    ),
  }
}
