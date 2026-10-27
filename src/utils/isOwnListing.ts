/**
 * Helper to determine whether a listing belongs to the currently authenticated user.
 * Supports all vertical item shapes (cars, buses, equipment, parts, services, and unified cards).
 */

function extractId(val: unknown): string | null {
  if (typeof val === 'string' && val.trim().length > 0) {
    return val.trim()
  }
  if (val && typeof val === 'object' && 'id' in val) {
    const idVal = (val as { id: unknown }).id
    if (typeof idVal === 'string' && idVal.trim().length > 0) {
      return idVal.trim()
    }
  }
  return null
}

/**
 * Extracts the owner (seller/user) ID from a listing across all vertical item shapes.
 * Handles both flattened items and wrapped items containing a `.raw` payload.
 */
export function extractListingOwnerId(item: unknown): string | null {
  if (!item || typeof item !== 'object') {
    return null
  }

  const it = item as Record<string, unknown>
  const raw = it.raw && typeof it.raw === 'object' ? (it.raw as Record<string, unknown>) : null

  const candidates: unknown[] = [
    it.userId,
    it.sellerId,
    it.ownerId,
    it.authorId,
    it.user,
    it.seller,
    raw?.userId,
    raw?.sellerId,
    raw?.ownerId,
    raw?.authorId,
    raw?.user,
    raw?.seller,
  ]

  for (const candidate of candidates) {
    const extracted = extractId(candidate)
    if (extracted) {
      return extracted
    }
  }

  return null
}

/**
 * Returns true if the listing belongs to the currently authenticated user.
 * Returns false if currentUserId is missing/empty, if the item is invalid,
 * or if the listing owner ID cannot be extracted.
 */
export function isOwnListing(item: unknown, currentUserId?: string | null): boolean {
  if (!currentUserId || typeof currentUserId !== 'string' || currentUserId.trim().length === 0) {
    return false
  }

  const ownerId = extractListingOwnerId(item)
  if (!ownerId) {
    return false
  }

  return ownerId === currentUserId.trim()
}
