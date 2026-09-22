export interface CarDetailApiImage {
  id: string
  url: string
  order: number
  isPrimary: boolean
  createdAt?: string | null
}

export interface CarDetailApiSeller {
  id: string
  username: string
  displayName?: string | null
  avatarUrl?: string | null
  isVerified?: boolean | null
  createdAt: string
  accountType?: string | null
}

export interface CarDetailApiLocationRef {
  id: number
  nameAr: string
  nameEn?: string | null
}

export interface CarDetailApi {
  id: string
  version?: number
  status: 'DRAFT' | 'ACTIVE' | 'SOLD' | 'RENTED' | 'ARCHIVED' | 'SUSPENDED'
  title: string
  description: string
  listingType: 'SALE' | 'RENTAL' | 'WANTED' | string
  condition?: 'NEW' | 'USED' | string | null

  // Pricing
  price: number
  currency: 'OMR' | 'USD' | string
  isPriceNegotiable?: boolean | null

  // Rental specific fields
  dailyPrice?: number | null
  monthlyPrice?: number | null
  minRentalDays?: number | null
  depositAmount?: number | null
  kmLimitPerDay?: number | null
  cancellationPolicy?: string | null
  withDriver?: boolean | null
  deliveryAvailable?: boolean | null
  insuranceIncluded?: boolean | null

  // Vehicle specifications
  make?: string | null
  model?: string | null
  trim?: string | null
  year?: number | null
  mileage?: number | null
  fuelType?: string | null
  transmission?: string | null
  bodyType?: string | null
  exteriorColor?: string | null
  interior?: string | null
  engineSize?: string | null
  horsepower?: number | null
  doors?: number | null
  seats?: number | null
  driveType?: string | null
  features?: string[] | null

  // Master Data IDs
  brandId?: string | null
  carModelId?: string | null
  carTrimId?: string | null

  // Location
  governorateId?: number | null
  wilayaId?: number | null
  latitude?: number | null
  longitude?: number | null
  governorateRef?: CarDetailApiLocationRef | null
  wilayaRef?: CarDetailApiLocationRef | null
  governorate?: string | null
  city?: string | null

  // Media
  images: CarDetailApiImage[]

  // Ownership & Contact
  seller: CarDetailApiSeller
  whatsappEnabled?: boolean | null

  // Metadata
  viewCount: number
  createdAt: string
  updatedAt?: string | null
}
