import { Listing } from '../types/listing.types'
import { UnifiedCardItem } from '../types/unified-card.types'

export type CardItemLike =
  | UnifiedCardItem
  | Listing
  | {
      isPriceNegotiable?: boolean
      isVerified?: boolean
      raw?: any
      user?: { isVerified?: boolean }
      seller?: { isVerified?: boolean }
    }

/**
 * Returns whether price is negotiable for a card item.
 * Preserves the exact runtime precedence:
 * (item as any).isPriceNegotiable ?? rawData.isPriceNegotiable
 */
export function getCardPriceNegotiable(item: CardItemLike | null | undefined): boolean | undefined {
  if (!item) return undefined
  const raw = (item as any).raw || item
  return item.isPriceNegotiable ?? raw.isPriceNegotiable
}

/**
 * Returns whether the seller is verified for a card item.
 * Preserves the exact runtime precedence:
 * item.isVerified ?? raw.isVerified ?? raw.user?.isVerified ?? raw.seller?.isVerified ?? false
 */
export function getCardSellerVerified(item: CardItemLike | null | undefined): boolean {
  if (!item) return false
  const raw = (item as any).raw || item
  return Boolean(
    item.isVerified ??
    raw.isVerified ??
    raw.user?.isVerified ??
    raw.seller?.isVerified ??
    false
  )
}
