import type { SellerView, LocationView, SpecItemView } from './listingDetail.types'
import type { OperatorType, EquipmentType } from './equipment.types'

export interface OperatorCertificationItem {
  key: string
  label: string
  imageUrl?: string
  isDocument?: boolean
}

export interface OperatorEquipmentTypeChip {
  value: EquipmentType
  label: string
}

export interface OperatorRatesView {
  dailyRate?: number
  dailyRateFormatted?: string
  hourlyRate?: number
  hourlyRateFormatted?: string
  currency: string
  isNegotiable: boolean
  primaryLabel: string
  hasAnyRate: boolean
}

export interface OperatorPendingDeletionView {
  id: string
  requestedAt: string
  requestedAtLabel: string
  status: string
}

export interface OperatorDetailViewModel {
  id: string
  title: string
  description: string

  operatorType: OperatorType
  operatorTypeLabel: string

  specializations: string[]
  experienceYears?: number
  experienceYearsLabel?: string

  equipmentTypes: OperatorEquipmentTypeChip[]
  certifications: OperatorCertificationItem[]

  rates: OperatorRatesView

  profileImageUrl?: string | null

  seller: SellerView
  location: LocationView

  whatsappEnabled: boolean
  viewCount: number
  postedAtLabel: string

  status: string
  hiddenByOwnerStatus: boolean

  pendingDeletion: OperatorPendingDeletionView | null
}
