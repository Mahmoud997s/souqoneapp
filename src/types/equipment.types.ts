import { UserSummary } from './auth.types'
import { ListingImage } from './listing.types'

// Matches EquipmentType enum in Prisma
export type EquipmentType =
  | 'EXCAVATOR'
  | 'CRANE'
  | 'LOADER'
  | 'BULLDOZER'
  | 'FORKLIFT'
  | 'CONCRETE_MIXER'
  | 'GENERATOR'
  | 'COMPRESSOR'
  | 'SCAFFOLDING'
  | 'WELDING_MACHINE'
  | 'TRUCK'
  | 'DUMP_TRUCK'
  | 'WATER_TANKER'
  | 'LIGHT_EQUIPMENT'
  | 'OTHER_EQUIPMENT'

// Matches EquipmentListingType enum in Prisma
export type EquipmentListingType = 'EQUIPMENT_SALE' | 'EQUIPMENT_RENT' | 'EQUIPMENT_WANTED'

// Matches OperatorType enum in Prisma
export type OperatorType = 'DRIVER' | 'OPERATOR' | 'TECHNICIAN' | 'MAINTENANCE'

// Matches ListingStatus enum in Prisma
export type ListingStatus = 'ACTIVE' | 'PENDING' | 'REJECTED' | 'SOLD' | 'RENTED' | 'ARCHIVED' | 'EXPIRED'

export interface EquipmentListing {
  id: string
  title: string
  slug: string
  description: string

  equipmentType: EquipmentType
  listingType: EquipmentListingType

  // Technical Specs
  make?: string
  model?: string
  year?: number
  condition?: string
  hoursUsed?: number
  capacity?: string
  power?: string
  weight?: string

  // Pricing (Sale & Rent)
  price?: number
  dailyPrice?: number
  monthlyPrice?: number
  currency: string
  isPriceNegotiable: boolean
  withOperator: boolean
  deliveryAvailable: boolean

  // WANTED specific fields
  budgetMin?: number
  budgetMax?: number
  rentalDuration?: string
  startDate?: string
  endDate?: string
  quantity?: number
  siteDetails?: string

  // Location
  governorate?: string
  city?: string
  latitude?: number
  longitude?: number

  // Contact
  contactPhone?: string
  whatsapp?: string

  status: ListingStatus
  isPremium: boolean
  featuredUntil?: string
  viewCount: number

  userId: string
  user?: UserSummary

  images: ListingImage[]

  createdAt: string
  updatedAt: string
}

export interface OperatorListing {
  id: string
  userId: string
  user?: UserSummary & {
    isVerified?: boolean
    phone?: string
    avatarUrl?: string
    avatar?: string
    displayName?: string
    name?: string
  }

  operatorType: OperatorType
  title: string
  slug?: string
  description: string

  experienceYears?: number
  specializations?: string[]
  certifications?: string[]
  equipmentTypes?: (EquipmentType | string)[]

  dailyRate?: number
  hourlyRate?: number
  currency?: string
  isPriceNegotiable?: boolean
  isNegotiable?: boolean

  governorate?: string
  city?: string
  governorateId?: number
  wilayaId?: number
  governorateRef?: { id: number; nameAr: string; nameEn: string }
  wilayaRef?: { id: number; nameAr: string; nameEn: string }
  latitude?: number
  longitude?: number

  contactPhone?: string
  whatsapp?: string

  status?: ListingStatus
  isPremium?: boolean
  featuredUntil?: string
  viewCount?: number

  createdAt?: string
  updatedAt?: string
}

export interface EquipmentBid {
  id: string
  amount: number
  message?: string
  equipmentId: string
  userId: string
  user?: UserSummary
  createdAt: string
  updatedAt: string
}
