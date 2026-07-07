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
  governorate: string
  city: string
  user: UserSummary
  createdAt: string
}

export interface Service {
  id: string
  serviceName: string
  serviceType: string
  description: string
  pricePerHour?: number
  governorate: string
  city: string
  user: UserSummary
  images: ListingImage[]
  createdAt: string
}

export interface Part {
  id: string
  partName: string
  brand: string
  compatibility: string
  condition: 'NEW' | 'USED' | 'LIKE_NEW'
  price: number
  currency: 'OMR' | 'USD'
  governorate: string
  city: string
  user: UserSummary
  images: ListingImage[]
  createdAt: string
}

export interface Equipment {
  id: string
  title: string
  description: string
  price: number
  currency: 'OMR' | 'USD'
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
  listing?: { id: string; title: string; images: { url: string }[] }
}
