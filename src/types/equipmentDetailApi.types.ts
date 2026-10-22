import type { EquipmentListingType, EquipmentType } from './equipment.types'
import type { BaseDetailViewModel } from './listingDetail.types'

export interface EquipmentDetailApiImage {
  id: string
  url: string
  isPrimary?: boolean
  order?: number
}

export interface EquipmentDetailApiSeller {
  id: string
  username: string
  displayName?: string | null
  avatarUrl?: string | null
  isVerified?: boolean
  governorate?: string | null
  createdAt: string
}

export interface EquipmentDetailApiLocationRef {
  id: number
  nameAr: string
  nameEn?: string | null
}

export interface EquipmentDetailApi {
  id: string
  title: string
  slug: string
  description?: string | null

  equipmentType: EquipmentType
  listingType: EquipmentListingType

  make?: string | null
  model?: string | null
  year?: number | null
  condition?: string | null
  capacity?: string | null
  power?: string | null
  weight?: string | null
  hoursUsed?: number | null
  features: string[]

  price?: number | string | null
  dailyPrice?: number | string | null
  monthlyPrice?: number | string | null
  currency?: string
  isPriceNegotiable?: boolean
  withOperator?: boolean
  deliveryAvailable?: boolean

  // Fields for EQUIPMENT_WANTED
  budgetMin?: number | string | null
  budgetMax?: number | string | null
  rentalDuration?: string | null
  startDate?: string | null
  endDate?: string | null
  quantity?: number | null
  siteDetails?: string | null

  governorate?: string | null
  city?: string | null
  latitude?: number | null
  longitude?: number | null

  whatsappEnabled?: boolean

  status: BaseDetailViewModel['status']
  hiddenByOwnerStatus?: boolean
  isPremium?: boolean
  featuredUntil?: string | null
  viewCount?: number

  userId: string
  user: EquipmentDetailApiSeller
  images: EquipmentDetailApiImage[]

  createdAt: string
  updatedAt: string
  version: number

  governorateId?: number | null
  wilayaId?: number | null
  governorateRef?: EquipmentDetailApiLocationRef | null
  wilayaRef?: EquipmentDetailApiLocationRef | null
}

export interface EquipmentSimilarItemApi {
  id: string
  slug: string
  title: string
  equipmentType: EquipmentType
  listingType: EquipmentListingType
  make?: string | null
  model?: string | null
  year?: number | null
  price?: number | string | null
  dailyPrice?: number | string | null
  monthlyPrice?: number | string | null
  currency?: string
  isPriceNegotiable?: boolean
  hoursUsed?: number | null
  city?: string | null
  governorate?: string | null
  governorateRef?: EquipmentDetailApiLocationRef | null
  wilayaRef?: EquipmentDetailApiLocationRef | null
  images: EquipmentDetailApiImage[]
  user: {
    id: string
    displayName?: string | null
    avatarUrl?: string | null
    isVerified?: boolean
  }
  createdAt: string
}

export interface EquipmentStatusLogApi {
  id: string
  fromStatus: BaseDetailViewModel['status']
  toStatus: BaseDetailViewModel['status']
  changedBy: string
  createdAt: string
}

export interface EquipmentStatsApi {
  viewCount: number
  favoritesCount: number
  conversationsCount: number
  statusHistory: EquipmentStatusLogApi[]
}
