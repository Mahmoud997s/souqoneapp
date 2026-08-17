import { UnifiedCardItem } from '../components/cards/UnifiedCard'

export type MyListingEntityType =
  | 'car'
  | 'bus'
  | 'equipment'
  | 'operator'
  | 'part'
  | 'service'
  | 'job'

export type MyListingNormalizedStatus = 'active' | 'draft' | 'expired'

export interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface PaginatedResult<T> {
  items: T[]
  meta: PaginationMeta
}

export interface MyListingItem {
  id: string
  entityType: MyListingEntityType
  normalizedStatus: MyListingNormalizedStatus
  rawStatus: string
  title: string
  thumbnail?: string
  updatedAt: string
  /** The original raw backend entity */
  raw: unknown
  /** The mapped UnifiedCardItem (for cards that consume UnifiedCardItem) */
  mapped?: UnifiedCardItem
}
