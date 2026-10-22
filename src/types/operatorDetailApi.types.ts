import type { OperatorType, EquipmentType } from './equipment.types'

export interface OperatorPendingDeletionApi {
  id: string
  createdAt: string
  status: string
}

export interface OperatorDetailApiSeller {
  id: string
  username: string
  displayName?: string | null
  avatarUrl?: string | null
  isVerified?: boolean
  governorate?: string | null
  createdAt: string
}

export interface OperatorDetailApiLocationRef {
  id: number
  nameAr: string
  nameEn?: string | null
}

export interface OperatorDetailApi {
  id: string
  title: string
  slug: string
  description?: string | null

  operatorType: OperatorType
  specializations?: string[] | null
  experienceYears?: number | null
  equipmentTypes: EquipmentType[]
  certifications?: string[] | null

  dailyRate?: number | string | null
  hourlyRate?: number | string | null
  currency?: string | null
  isPriceNegotiable?: boolean | null

  governorate?: string | null
  city?: string | null
  latitude?: number | null
  longitude?: number | null

  governorateId?: number | null
  governorateRef?: OperatorDetailApiLocationRef | null
  wilayaId?: number | null
  wilayaRef?: OperatorDetailApiLocationRef | null

  profileImageUrl?: string | null

  whatsappEnabled?: boolean | null

  status: string
  hiddenByOwnerStatus?: boolean | null
  viewCount?: number | null

  userId: string
  user: OperatorDetailApiSeller

  createdAt: string
  updatedAt: string

  /** Present only when requester is the owner of the operator listing */
  pendingDeletionRequest?: OperatorPendingDeletionApi | null
}
