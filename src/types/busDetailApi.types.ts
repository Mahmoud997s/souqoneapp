import type { BusListingType, BusType } from './bus.types'
import type { BaseDetailViewModel } from './listingDetail.types'

export interface BusDetailApiImage {
  id: string
  url: string
  isPrimary?: boolean
  order?: number
}

export interface BusDetailApiSeller {
  id: string
  username: string
  displayName?: string | null
  avatarUrl?: string | null
  isVerified?: boolean
  governorate?: string | null
  createdAt: string
}

export interface BusDetailApiLocationRef {
  id: number
  nameAr: string
  nameEn?: string | null
  code?: string
}

export interface BusDetailApi {
  id: string
  slug: string
  title: string
  description?: string | null

  busListingType: BusListingType
  busType: BusType

  make: string
  model: string
  manufacturerId?: string | null
  modelId?: string | null

  year: number
  capacity: number
  mileage?: number | null

  fuelType?: string | null
  transmission?: string | null
  condition?: string | null
  features: string[]
  plateNumber?: string | null

  price: number | string | null
  currency: string
  isPriceNegotiable: boolean

  dailyPrice?: number | string | null
  monthlyPrice?: number | string | null
  withDriver: boolean

  // Contract fields (stripped for visitors / unauthenticated users)
  contractType?: string | null
  contractClient?: string | null
  contractMonthly?: number | string | null
  contractDuration?: number | null
  contractExpiry?: string | null

  latitude?: number | null
  longitude?: number | null

  whatsappEnabled: boolean

  status: BaseDetailViewModel['status']
  hiddenByOwnerStatus: boolean
  isPremium: boolean
  featuredUntil?: string | null
  viewCount: number

  userId: string
  user: BusDetailApiSeller
  images: BusDetailApiImage[]

  createdAt: string
  updatedAt: string
  version: number

  governorateId?: number | null
  wilayaId?: number | null
  governorateRef?: BusDetailApiLocationRef | null
  wilayaRef?: BusDetailApiLocationRef | null
}
