import { resolveContactEntityType } from '../../utils/contactEntityType'
import type { UnifiedCardItem } from '../../types/unified-card.types'

export const SUPPORTED_FAVORITE_ENTITY_TYPES = [
  'LISTING',
  'BUS_LISTING',
  'EQUIPMENT_LISTING',
  'SPARE_PART',
  'CAR_SERVICE',
  'JOB',
  'DRIVER_JOB',
  'TRANSPORT_REQUEST',
] as const

export type FavoriteEntityType = (typeof SUPPORTED_FAVORITE_ENTITY_TYPES)[number]
export type SupportedFavoriteEntityType = FavoriteEntityType

const SUPPORTED_SET: Set<string> = new Set(SUPPORTED_FAVORITE_ENTITY_TYPES)

/**
 * Builds canonical favorite key string: "<ENTITY_TYPE>:<entityId>"
 */
export function favoriteKey(type: string, id: string): string {
  return `${type}:${id}`
}

/**
 * Resolves the valid FavoriteEntityType for a card item, or null if unsupported.
 * Explicit prop wins; otherwise delegates to resolveContactEntityType.
 * Operators and profile types (driver, employer, carrier) return null.
 */
export function favoriteTypeForCard(
  item: Partial<UnifiedCardItem> | Record<string, unknown> | null | undefined,
  explicitType?: string
): FavoriteEntityType | null {
  if (explicitType) {
    const upperExplicit = explicitType.trim().toUpperCase()
    if (upperExplicit === 'OPERATOR_LISTING') {
      return null
    }
    if (SUPPORTED_SET.has(upperExplicit)) {
      return upperExplicit as FavoriteEntityType
    }
    return null
  }

  if (!item) return null

  const resolved = resolveContactEntityType((item as any)?.category, item)

  if (resolved === 'OPERATOR_LISTING') {
    return null
  }

  if (SUPPORTED_SET.has(resolved)) {
    return resolved as FavoriteEntityType
  }

  return null
}
