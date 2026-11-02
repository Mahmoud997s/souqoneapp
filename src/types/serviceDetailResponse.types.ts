/**
 * Public detail payload returned by GET /services/:id.
 * Fields follow CarService and the relations included by BaseListingService.
 */
export interface ServiceDetailImage {
  id: string
  url: string
  isPrimary?: boolean
  order?: number
  carServiceId?: string
  createdAt?: string
}

export interface ServiceDetailLocationRef {
  id: number
  nameAr: string
  nameEn: string
  isActive: boolean
  governorateId?: number
}

export interface ServiceDetailSeller {
  id: string
  username?: string | null
  displayName?: string | null
  avatarUrl?: string | null
  isVerified?: boolean
  governorate?: string | null
  createdAt?: string | null
}

export interface ServiceDetailResponse {
  id: string
  title: string
  description: string
  serviceType: string
  createdAt: string
  slug?: string
  providerType?: 'WORKSHOP' | 'INDIVIDUAL' | 'MOBILE' | 'COMPANY' | null
  providerName?: string | null
  specializations?: string[]
  priceFrom?: number | string | null
  priceTo?: number | string | null
  currency?: string | null
  isHomeService?: boolean
  workingHoursOpen?: string | null
  workingHoursClose?: string | null
  workingDays?: string[]
  address?: string | null
  latitude?: number | null
  longitude?: number | null
  contactPhone?: string | null
  whatsapp?: string | null
  whatsappEnabled?: boolean
  website?: string | null
  status?: string
  hiddenByOwnerStatus?: boolean
  viewCount?: number
  userId?: string
  user?: ServiceDetailSeller | null
  images?: ServiceDetailImage[]
  version?: number
  updatedAt?: string
  deletedAt?: string | null
  governorateId?: number | null
  governorateRef?: ServiceDetailLocationRef | null
  wilayaId?: number | null
  wilayaRef?: ServiceDetailLocationRef | null
}
