export interface ServicePriceViewModel {
  amountLabel: string
  typeLabel?: string
  isRange: boolean
  formattedRange?: string
}

export interface ServiceScheduleViewModel {
  hasSchedule: boolean
  workingDays: string[]
  workingDaysSummary: string
  workingHoursLabel?: string
  isOpenHoursProvided: boolean
}

export interface ServiceLocationViewModel {
  fullLocationText: string
  address?: string
  hasCoordinates: boolean
  latitude?: number
  longitude?: number
}

export interface ServiceWebsiteViewModel {
  url: string
  displayUrl: string
}

export interface ServiceSellerViewModel {
  id: string
  name: string
  username: string
  avatarUrl?: string
  isVerified: boolean
  memberSinceLabel?: string
  governorate?: string
}

export interface ServiceDetailViewModel {
  id: string
  version: number
  status: string
  title: string
  serviceType: string
  serviceTypeLabel: string
  providerType?: string
  providerTypeLabel?: string
  providerName?: string
  isHomeService: boolean
  homeServiceLabel?: string
  specializations: string[]
  description: string
  price: ServicePriceViewModel
  workingSchedule: ServiceScheduleViewModel
  images: string[]
  location: ServiceLocationViewModel
  website?: ServiceWebsiteViewModel
  seller: ServiceSellerViewModel
  whatsappEnabled: boolean
  postedAtLabel: string
  viewCount: number
}
