import type {
  BaseDetailViewModel,
  SpecItemView,
  SpecSectionView,
} from './listingDetail.types'
import type { EquipmentListingType, EquipmentType } from './equipment.types'

export interface EquipmentRentalView {
  dailyPrice?: number
  dailyPriceFormatted?: string
  monthlyPrice?: number
  monthlyPriceFormatted?: string
  withOperator: boolean
  deliveryAvailable: boolean
}

export interface EquipmentWantedView {
  budgetMin?: number
  budgetMinFormatted?: string
  budgetMax?: number
  budgetMaxFormatted?: string
  budgetRangeFormatted?: string
  rentalDuration?: string
  rentalDurationLabel?: string
  startDate?: string
  endDate?: string
  quantity?: number
  quantityFormatted?: string
  siteDetails?: string
}

export interface EquipmentOperatorBadge {
  kind: 'with' | 'without'
  label: string
}

export interface EquipmentDetailViewModel extends BaseDetailViewModel {
  equipmentListingType: EquipmentListingType
  equipmentType: EquipmentType
  equipmentTypeLabel: string
  make?: string
  model?: string
  year?: number
  hoursUsed?: number
  hoursUsedLabel?: string
  keySpecs: SpecItemView[]
  specsSections: SpecSectionView[]
  features: string[]
  operatorBadge: EquipmentOperatorBadge | null
  rental: EquipmentRentalView | null
  wanted: EquipmentWantedView | null
}
