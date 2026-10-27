import type {
  BaseDetailViewModel,
  SpecItemView,
  SpecSectionView,
} from './listingDetail.types'

export interface PartDetailViewModel extends BaseDetailViewModel {
  partCategory: string
  partCategoryLabel: string
  condition: string
  conditionLabel: string
  partNumber?: string
  isOriginal: boolean
  originalityLabel: string
  compatibleMakes: string[]
  compatibleMakesLabels: string[]
  compatibleModels: string[]
  yearFrom?: number
  yearTo?: number
  yearRangeLabel?: string
  hasWarranty: boolean
  warrantyDuration?: string
  warrantyDurationLabel?: string
  quantity?: string
  quantityLabel?: string
  compatibleVehicleTypes: string[]
  compatibleVehicleTypesLabels: string[]
  keySpecs: SpecItemView[]
  specsSections: SpecSectionView[]
}
