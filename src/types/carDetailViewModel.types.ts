import type {
  PriceView,
  GalleryImage,
  LocationView,
  SellerView,
  SpecItemView,
  SpecSectionView,
  BaseDetailViewModel,
} from './listingDetail.types'

export type {
  PriceView,
  GalleryImage,
  LocationView,
  SellerView,
  SpecItemView,
  SpecSectionView,
  BaseDetailViewModel,
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
