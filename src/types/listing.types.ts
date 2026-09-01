import { UserSummary } from './auth.types'

export interface ListingImage {
  id: string
  url: string
  isPrimary: boolean
  order: number
}

export interface CarDetails {
  brandId: string
  modelId: string
  year: number
  mileage: number
  fuelType: 'PETROL' | 'DIESEL' | 'HYBRID' | 'ELECTRIC'
  transmission: 'AUTOMATIC' | 'MANUAL'
  color: string
}

export interface Listing {
  id: string
  title: string
  description: string
  price: number
  currency: 'OMR' | 'USD'
  listingType: 'SALE' | 'RENTAL' | 'WANTED'
  condition: 'NEW' | 'USED' | 'LIKE_NEW'
  governorateId?: number
  wilayaId?: number
  governorateRef?: { id: number; nameAr: string; nameEn: string }
  wilayaRef?: { id: number; nameAr: string; nameEn: string }
  governorate: string
  city: string
  isPremium: boolean
  views: number
  user: UserSummary
  images: ListingImage[]
  car?: CarDetails
  createdAt: string
  // Flat properties returned directly from the API
  make?: string
  model?: string
  year?: number
  mileage?: number
  fuelType?: 'PETROL' | 'DIESEL' | 'HYBRID' | 'ELECTRIC'
  transmission?: 'AUTOMATIC' | 'MANUAL'
  isPriceNegotiable?: boolean
  // Rental specific properties
  dailyPrice?: string | number
  monthlyPrice?: string | number
  withDriver?: boolean
}

export interface Job {
  id: string
  title: string
  description: string
  salary?: number
  requirements?: string
  jobType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'HIRING' | 'OFFERING'
  governorateId?: number
  wilayaId?: number
  governorateRef?: { id: number; nameAr: string; nameEn: string }
  wilayaRef?: { id: number; nameAr: string; nameEn: string }
  governorate: string
  city: string
  user: UserSummary
  createdAt: string
}

export interface Service {
  id: string
  title: string
  serviceName?: string
  serviceType: string
  providerType?: 'WORKSHOP' | 'INDIVIDUAL' | 'MOBILE' | 'COMPANY'
  providerName?: string
  isHomeService?: boolean
  specializations?: string[]
  description: string
  price?: number
  priceFrom?: number
  priceTo?: number
  pricePerHour?: number
  workingHoursOpen?: string
  workingHoursClose?: string
  workingDays?: string[]
  address?: string
  contactPhone?: string
  whatsapp?: string
  website?: string
  governorateId?: number
  wilayaId?: number
  governorateRef?: { id: number; nameAr: string; nameEn: string }
  wilayaRef?: { id: number; nameAr: string; nameEn: string }
  governorate: string
  city: string
  latitude?: number
  longitude?: number
  user?: UserSummary
  images: ListingImage[]
  createdAt: string
  isPremium?: boolean
}

export interface Part {
  id: string
  title: string
  description?: string
  partName?: string
  partCategory: 'ENGINE' | 'BODY' | 'ELECTRICAL' | 'SUSPENSION' | 'BRAKES' | 'INTERIOR' | 'TIRES' | 'BATTERIES' | 'OILS' | 'ACCESSORIES' | 'OTHER'
  brand?: string
  compatibility?: string
  condition?: 'NEW' | 'USED' | 'REFURBISHED' | 'LIKE_NEW'
  isOriginal?: boolean
  partNumber?: string
  compatibleMakes?: string[]
  compatibleModels?: string[]
  yearFrom?: number
  yearTo?: number
  price: number
  isPriceNegotiable?: boolean
  currency?: 'OMR' | 'USD'
  contactPhone?: string
  whatsapp?: string
  governorateId?: number
  wilayaId?: number
  governorateRef?: { id: number; nameAr: string; nameEn: string }
  wilayaRef?: { id: number; nameAr: string; nameEn: string }
  governorate?: string
  city?: string
  latitude?: number
  longitude?: number
  hasWarranty?: boolean
  warrantyDuration?: 'ONE_MONTH' | 'THREE_MONTHS' | 'SIX_MONTHS' | 'ONE_YEAR' | 'TWO_YEARS'
  quantity?: 'ONE' | 'TWO_TO_FIVE' | 'SIX_TO_TEN' | 'ELEVEN_TO_TWENTY' | 'TWENTY_TO_FIFTY' | 'FIFTY_TO_HUNDRED' | 'OVER_HUNDRED'
  compatibleVehicleTypes?: ('CAR' | 'BUS' | 'EQUIPMENT')[]
  user?: UserSummary
  images: ListingImage[]
  createdAt: string
  isPremium?: boolean
}

export interface Equipment {
  id: string
  title: string
  description: string
  price: number
  currency: 'OMR' | 'USD'
  governorateId?: number
  wilayaId?: number
  governorateRef?: { id: number; nameAr: string; nameEn: string }
  wilayaRef?: { id: number; nameAr: string; nameEn: string }
  governorate: string
  city: string
  isPremium: boolean
  user: UserSummary
  images: ListingImage[]
  bids?: EquipmentBid[]
  createdAt: string
}

export interface EquipmentBid {
  id: string
  amount: number
  user: UserSummary
  createdAt: string
}

export interface ChatMessage {
  id: string
  roomId: string
  content: string
  sender: UserSummary
  createdAt: string
  isRead: boolean
  type?: 'TEXT' | 'IMAGE' | 'FILE'
  mediaUrl?: string
}

export interface ChatRoom {
  id: string
  entityType: string
  entityId: string
  participants: UserSummary[]
  lastMessage?: ChatMessage
  unreadCount: number
  updatedAt: string
  listing?: {
    id: string
    title: string
    price?: number
    currency?: string
    images?: { url: string }[]
    listingType?: 'SALE' | 'RENTAL' | 'WANTED'
    condition?: 'NEW' | 'USED' | 'LIKE_NEW'
    governorate?: string
    isPriceNegotiable?: boolean
    make?: string
    model?: string
    year?: number
  }
}
