import { Listing, CardRawPayload } from '../types/listing.types'
import { UnifiedCardItem } from '../types/unified-card.types'

export type { CardRawPayload }

export type CardItemLike =
  | UnifiedCardItem
  | Listing
  | {
      isPriceNegotiable?: boolean
      isVerified?: boolean
      raw?: CardRawPayload
      user?: { isVerified?: boolean; id?: string }
      seller?: { isVerified?: boolean; id?: string }
      [key: string]: unknown
    }

function resolveRawPayload(item: CardItemLike): CardRawPayload {
  if ('raw' in item && item.raw && typeof item.raw === 'object') {
    return item.raw
  }
  return item as CardRawPayload
}

/**
 * Returns whether price is negotiable for a card item.
 * Preserves the exact runtime precedence:
 * item.isPriceNegotiable ?? raw.isPriceNegotiable
 */
export function getCardPriceNegotiable(item: CardItemLike | null | undefined): boolean | undefined {
  if (!item) return undefined
  const raw = resolveRawPayload(item)
  return item.isPriceNegotiable ?? raw.isPriceNegotiable
}

/**
 * Returns whether the seller is verified for a card item.
 * Preserves the exact runtime precedence:
 * item.isVerified ?? raw.isVerified ?? raw.user?.isVerified ?? raw.seller?.isVerified ?? false
 */
export function getCardSellerVerified(item: CardItemLike | null | undefined): boolean {
  if (!item) return false
  const raw = resolveRawPayload(item)
  return Boolean(
    item.isVerified ??
    raw.isVerified ??
    raw.user?.isVerified ??
    raw.seller?.isVerified ??
    false
  )
}
