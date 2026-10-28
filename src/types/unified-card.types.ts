export interface UnifiedCardItem {
  id: string
  title: string
  price?: number
  priceText?: string
  priceLabel?: string
  currency?: string
  governorate?: string
  images: string[]
  imageCount?: number
  category?: string
  listingType?: string
  condition?: string
  details?: { icon: string; value: string }[]
  description?: string
  raw?: any
  isPremium?: boolean
  isElite?: boolean
  isFavorite?: boolean
  isVerified?: boolean
  whatsappEnabled?: boolean
  href?: string
}
