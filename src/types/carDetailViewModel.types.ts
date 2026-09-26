export interface PriceView {
  amount: number
  formattedAmount: string
  currency: string
  fullPriceLabel: string
  isNegotiable: boolean
  listingType: 'SALE' | 'RENTAL' | 'WANTED' | string
  caption?: string
  dailyRate?: {
    amount: number
    formatted: string
    label: string
  }
  monthlyRate?: {
    amount: number
    formatted: string
    label: string
  }
}

export interface GalleryImage {
  id: string
  url: string
  order: number
  isPrimary: boolean
}

export interface LocationView {
  governorateName?: string
  wilayaName?: string
  fullLocationText: string
  hasCoordinates: boolean
  latitude?: number
  longitude?: number
}

export interface SellerView {
  id: string
  name: string
  username: string
  avatarUrl?: string
  isVerified: boolean
  memberSinceLabel: string
  accountType?: string
}

export interface SpecItemView {
  key: string
  label: string
  value: string
  icon?: string
}

export interface SpecSectionView {
  title: string
  items: SpecItemView[]
}

export interface BaseDetailViewModel {
  id: string
  version: number
  status: 'DRAFT' | 'ACTIVE' | 'SOLD' | 'RENTED' | 'ARCHIVED' | 'SUSPENDED'
  title: string
  description: string
  listingType: 'SALE' | 'RENTAL' | 'WANTED' | string
  condition?: string
  conditionLabel?: string
  price: PriceView
  images: GalleryImage[]
  location: LocationView
  seller: SellerView
  whatsappEnabled: boolean
  postedAtLabel: string
  viewCount: number
}

export interface RentalTermsView {
  minRentalDays?: number
  depositAmount?: number
  depositLabel?: string
  kmLimitPerDay?: number
  kmLimitLabel?: string
  cancellationPolicy?: string
  withDriver?: boolean
  deliveryAvailable?: boolean
  insuranceIncluded?: boolean
}

export interface CarDetailViewModel extends BaseDetailViewModel {
  make: string
  model: string
  trim?: string
  year?: number
  mileage?: number
  mileageLabel?: string
  keySpecs: SpecItemView[]
  specsSections: SpecSectionView[]
  features: string[]
  rentalTerms?: RentalTermsView
}
