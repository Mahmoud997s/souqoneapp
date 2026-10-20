import type { BaseDetailViewModel, SpecItemView, SpecSectionView } from './listingDetail.types'
import type { BusListingType } from './bus.types'

export type BusContractView =
  | { access: 'hidden' }                 // مفيش عقد أو العقد منتهي
  | { access: 'locked'; typeLabel?: string }   // زائر: بطاقة مقفولة تدعو لتسجيل الدخول
  | {
      access: 'visible'
      typeLabel?: string
      clientName?: string
      withDriver: boolean
      monthlyIncome: number               // contractMonthly كرقم
      durationMonths?: number             // contractDuration
      expiryIso?: string                  // contractExpiry
    }

export interface BusDetailViewModel extends BaseDetailViewModel {
  busListingType: BusListingType
  busTypeLabel: string
  make: string
  model: string
  year?: number
  capacity?: number
  mileage?: number
  mileageLabel?: string
  keySpecs: SpecItemView[]
  specsSections: SpecSectionView[]
  features: string[]
  contract: BusContractView
}
