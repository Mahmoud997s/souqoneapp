import { User } from './auth.types'

export type BusListingType = 'BUS_SALE' | 'BUS_SALE_WITH_CONTRACT' | 'BUS_RENT'
export type BusType = 'MINI_BUS' | 'MEDIUM_BUS' | 'LARGE_BUS' | 'COASTER' | 'SCHOOL_BUS'

export interface BusListing {
  id: string
  title: string
  description?: string
  busListingType: BusListingType
  busType: BusType
  make: string
  model: string
  year: number
  capacity: number
  
  // Sale
  price?: number
  isPriceNegotiable?: boolean
  
  // Rent
  dailyPrice?: number
  monthlyPrice?: number
  withDriver?: boolean
  minRentalDays?: number
  
  // Contract
  contractType?: string
  contractClient?: string
  contractMonthly?: number
  contractDuration?: number
  contractExpiry?: string
  
  // Request
  requestPassengers?: number
  requestRoute?: string
  requestSchedule?: string
  
  // General
  condition?: string
  fuelType?: string
  transmission?: string
  mileage?: number
  features?: string[]
  plateNumber?: string
  
  // Location
  governorate?: string
  city?: string
  latitude?: number
  longitude?: number
  
  images: string[] | { url: string; isPrimary?: boolean; order?: number }[]
  user?: User
  
  createdAt?: string
  updatedAt?: string
  viewCount?: number
  status?: string
}
