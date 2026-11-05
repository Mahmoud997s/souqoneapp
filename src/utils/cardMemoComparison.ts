import type {
  ListingCardBaseProps,
  ListingCardBadge,
  ListingCardPill,
} from '../components/ui/ListingCardBase'

function extractImageUrl(img: unknown): string {
  if (typeof img === 'string') return img
  if (img && typeof img === 'object') {
    const rec = img as Record<string, unknown>
    return String(rec.url ?? rec.path ?? '')
  }
  return ''
}

export function areImageListsEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (!Array.isArray(a) || !Array.isArray(b)) return false
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i += 1) {
    if (extractImageUrl(a[i]) !== extractImageUrl(b[i])) return false
  }
  return true
}

function areShallowRecordsEqual(
  a: Record<string, unknown> | null | undefined,
  b: Record<string, unknown> | null | undefined
): boolean {
  if (a === b) return true
  if (!a || !b) return false
  const keysA = Object.keys(a)
  const keysB = Object.keys(b)
  if (keysA.length !== keysB.length) return false
  for (let i = 0; i < keysA.length; i += 1) {
    const key = keysA[i]
    if (key === 'raw') continue
    if (key === 'images') {
      if (!areImageListsEqual(a.images, b.images)) return false
      continue
    }
    if (a[key] !== b[key]) return false
  }
  return true
}

export function areCardItemsEqual(prevItem: unknown, nextItem: unknown): boolean {
  if (prevItem === nextItem) return true
  if (!prevItem || !nextItem) return false
  if (typeof prevItem !== 'object' || typeof nextItem !== 'object') return false

  const prev = prevItem as Record<string, unknown>
  const next = nextItem as Record<string, unknown>

  if (!areShallowRecordsEqual(prev, next)) return false

  const prevRaw = prev.raw as Record<string, unknown> | undefined
  const nextRaw = next.raw as Record<string, unknown> | undefined
  if (prevRaw !== nextRaw) {
    if (!areShallowRecordsEqual(prevRaw, nextRaw)) return false
  }

  return true
}

export function arePillsEqual(
  a: ListingCardPill[] | undefined,
  b: ListingCardPill[] | undefined
): boolean {
  if (a === b) return true
  if (!a || !b) return (!a || a.length === 0) && (!b || b.length === 0)
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i += 1) {
    const pa = a[i]
    const pb = b[i]
    if (
      pa.key !== pb.key ||
      pa.label !== pb.label ||
      pa.iconName !== pb.iconName ||
      pa.iconFamily !== pb.iconFamily ||
      pa.variant !== pb.variant ||
      pa.textColor !== pb.textColor
    ) {
      return false
    }
  }
  return true
}

export function areBadgesEqual(
  a: ListingCardBadge[] | undefined,
  b: ListingCardBadge[] | undefined
): boolean {
  if (a === b) return true
  if (!a || !b) return (!a || a.length === 0) && (!b || b.length === 0)
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i += 1) {
    const ba = a[i]
    const bb = b[i]
    if (
      ba.key !== bb.key ||
      ba.label !== bb.label ||
      ba.backgroundColor !== bb.backgroundColor ||
      ba.textColor !== bb.textColor ||
      ba.iconName !== bb.iconName ||
      ba.borderColor !== bb.borderColor
    ) {
      return false
    }
  }
  return true
}

export function areCardPropsEqual<
  T extends {
    item: unknown
    onPress?: () => void
    fullWidth?: boolean
    gridMode?: boolean
    showChips?: boolean
    maxChips?: number
    actionMenu?: unknown
    disableImageSwipe?: boolean
    titleNumberOfLines?: number
    imageHeight?: number
    compactBody?: boolean
    liquidGlass?: boolean
    glassSupport?: unknown
  }
>(prev: T, next: T): boolean {
  return (
    prev.onPress === next.onPress &&
    prev.fullWidth === next.fullWidth &&
    prev.gridMode === next.gridMode &&
    prev.showChips === next.showChips &&
    prev.maxChips === next.maxChips &&
    prev.actionMenu === next.actionMenu &&
    prev.disableImageSwipe === next.disableImageSwipe &&
    prev.titleNumberOfLines === next.titleNumberOfLines &&
    prev.imageHeight === next.imageHeight &&
    prev.compactBody === next.compactBody &&
    prev.liquidGlass === next.liquidGlass &&
    prev.glassSupport === next.glassSupport &&
    areCardItemsEqual(prev.item, next.item)
  )
}

export function areListingCardBasePropsEqual(
  prev: ListingCardBaseProps,
  next: ListingCardBaseProps
): boolean {
  return (
    prev.title === next.title &&
    prev.priceLabel === next.priceLabel &&
    prev.isPriceNegotiable === next.isPriceNegotiable &&
    prev.location === next.location &&
    prev.onPress === next.onPress &&
    prev.imageCount === next.imageCount &&
    prev.placeholderIcon === next.placeholderIcon &&
    prev.customBadges === next.customBadges &&
    prev.maxChips === next.maxChips &&
    prev.isSellerVerified === next.isSellerVerified &&
    prev.isSold === next.isSold &&
    prev.status === next.status &&
    prev.fullWidth === next.fullWidth &&
    prev.gridMode === next.gridMode &&
    prev.actionMenu === next.actionMenu &&
    prev.cardActions === next.cardActions &&
    prev.disableImageSwipe === next.disableImageSwipe &&
    prev.shareMessage === next.shareMessage &&
    prev.titleNumberOfLines === next.titleNumberOfLines &&
    prev.imageHeight === next.imageHeight &&
    prev.compactBody === next.compactBody &&
    prev.favoriteType === next.favoriteType &&
    prev.onFavorite === next.onFavorite &&
    prev.liquidGlass === next.liquidGlass &&
    prev.pillNativeGlass === next.pillNativeGlass &&
    prev.glassSupport === next.glassSupport &&
    prev.initialCardWidth === next.initialCardWidth &&
    prev.style === next.style &&
    areImageListsEqual(prev.displayImages, next.displayImages) &&
    arePillsEqual(prev.pills, next.pills) &&
    areBadgesEqual(prev.badges, next.badges) &&
    areCardItemsEqual(prev.item, next.item)
  )
}
