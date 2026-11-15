import { MyListingItem } from '../../../types/my-listings.types'

export type OwnerStatusTone = 'success' | 'neutral' | 'warning'

export interface MyListingStatusBadge {
  label: string
  tone: OwnerStatusTone
}

/**
 * Real backend `ListingStatus` enum values (`apps/api/prisma/schema.prisma:961-968`).
 * Unknown / non-API statuses return `null` without inventing labels.
 */
const REAL_LISTING_STATUS_BADGES: Record<string, MyListingStatusBadge> = {
  ACTIVE: { label: 'نشط', tone: 'success' },
  DRAFT: { label: 'مسودة', tone: 'neutral' },
  SOLD: { label: 'مباع', tone: 'neutral' },
  RENTED: { label: 'مؤجر', tone: 'neutral' },
  ARCHIVED: { label: 'مؤرشف', tone: 'neutral' },
  SUSPENDED: { label: 'موقوف', tone: 'warning' },
}

export function getMyListingStatusBadge(
  rawStatus?: string
): MyListingStatusBadge | null {
  if (!rawStatus) return null
  const normalized = rawStatus.toUpperCase()
  return REAL_LISTING_STATUS_BADGES[normalized] ?? null
}

export function getMyListingStatusBadgeForItem(
  item: Pick<MyListingItem, 'rawStatus'>
): MyListingStatusBadge | null {
  return getMyListingStatusBadge(item.rawStatus)
}
