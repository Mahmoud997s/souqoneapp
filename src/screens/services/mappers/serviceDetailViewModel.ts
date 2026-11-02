import type { ServiceDetailResponse } from '../../../types/serviceDetailResponse.types'
import type { ServiceDetailViewModel } from '../../../types/serviceDetailViewModel.types'
import { SERVICE_TYPES, PROVIDER_TYPES } from '../../../constants/services'
import {
  formatWorkingDays,
  formatServiceWorkingHours,
  formatServicePrice,
  sanitizeWebsiteUrl,
} from '../utils/serviceFormatters'
import { formatDate } from '../../../utils/format'

export interface MapServiceDetailOptions {
  now?: Date
}

/**
 * Maps the backend service detail payload into a clean, strongly-typed
 * ServiceDetailViewModel suitable for presentational components.
 */
export function mapServiceDetailViewModel(
  raw: ServiceDetailResponse,
  _options?: MapServiceDetailOptions
): ServiceDetailViewModel {
  // 1. Basic Identifiers & Status
  const id = raw.id || ''
  const version = raw.version ?? 1
  const status = raw.status ?? 'ACTIVE'
  const title = (raw.title || 'خدمة سيارات').trim()

  // 2. Service & Provider Types
  const serviceType = raw.serviceType || 'OTHER_SERVICE'
  const serviceTypeMatch = SERVICE_TYPES.find((t) => t.id === serviceType)
  const serviceTypeLabel = serviceTypeMatch ? serviceTypeMatch.label : serviceType

  const providerType = raw.providerType ?? undefined
  const providerTypeMatch = PROVIDER_TYPES.find((p) => p.id === providerType)
  const providerTypeLabel = providerTypeMatch ? providerTypeMatch.label : providerType

  const providerName = raw.providerName ? raw.providerName.trim() : undefined

  // 3. Home / Mobile Service
  const isHomeService = Boolean(raw.isHomeService)
  const homeServiceLabel = isHomeService ? 'خدمة منزلية / متنقلة' : undefined

  // 4. Specializations
  const specializations: string[] = Array.isArray(raw.specializations)
    ? raw.specializations
        .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
        .map((s) => s.trim())
    : []

  // 5. Description
  const description = (raw.description || '').trim()

  // 6. Pricing
  const rawCurrency = raw.currency ?? 'OMR'
  const price = formatServicePrice(raw.priceFrom, raw.priceTo, undefined, rawCurrency)

  // 7. Schedule (Working days & hours)
  const workingDaysResult = formatWorkingDays(raw.workingDays)
  const workingHoursLabel = formatServiceWorkingHours(
    raw.workingHoursOpen,
    raw.workingHoursClose
  )
  const hasSchedule =
    workingDaysResult.labels.length > 0 || Boolean(workingHoursLabel)
  const isOpenHoursProvided = Boolean(
    raw.workingHoursOpen || raw.workingHoursClose
  )

  const workingSchedule = {
    hasSchedule,
    workingDays: workingDaysResult.labels,
    workingDaysSummary: workingDaysResult.summary,
    workingHoursLabel,
    isOpenHoursProvided,
  }

  // 8. Images
  const images = (raw.images ?? [])
    .map((image) => image.url)
    .filter((url): url is string => typeof url === 'string' && url.trim().length > 0)

  // 9. Location & Coordinates
  const govName = raw.governorateRef?.nameAr || ''
  const wilayaName = raw.wilayaRef?.nameAr || ''
  const locationParts = [govName, wilayaName].filter(Boolean)
  const fullLocationText =
    locationParts.length > 0 ? locationParts.join(' - ') : 'عُمان'

  const address =
    typeof raw.address === 'string' && raw.address.trim().length > 0
      ? raw.address.trim()
      : undefined

  const lat = typeof raw.latitude === 'number' ? raw.latitude : undefined
  const lng = typeof raw.longitude === 'number' ? raw.longitude : undefined

  const hasCoordinates = Boolean(
    lat !== undefined && lng !== undefined && (lat !== 0 || lng !== 0)
  )

  const location = {
    fullLocationText,
    address,
    hasCoordinates,
    latitude: lat,
    longitude: lng,
  }

  // 10. Website
  const website = sanitizeWebsiteUrl(raw.website ?? undefined)

  // 11. Seller Information
  const rawSeller = raw.user
  const sellerId = rawSeller?.id ?? raw.userId ?? ''

  const sellerName =
    typeof rawSeller?.displayName === 'string' && rawSeller.displayName.trim()
      ? rawSeller.displayName.trim()
      : typeof rawSeller?.username === 'string' && rawSeller.username.trim()
      ? rawSeller.username.trim()
      : providerName || 'مقدم الخدمة'

  const sellerUsername =
    typeof rawSeller?.username === 'string' ? rawSeller.username : ''

  const sellerAvatar =
    typeof rawSeller?.avatarUrl === 'string' ? rawSeller.avatarUrl : undefined

  const isSellerVerified = Boolean(rawSeller?.isVerified)

  let memberSinceLabel = 'عضو منذ فترة'
  if (typeof rawSeller?.createdAt === 'string') {
    try {
      const d = new Date(rawSeller.createdAt)
      if (!isNaN(d.getTime())) {
        memberSinceLabel = `عضو منذ ${d.getFullYear()}`
      }
    } catch {
      // keep fallback
    }
  }

  const sellerGov =
    typeof rawSeller?.governorate === 'string' ? rawSeller.governorate : undefined

  const seller = {
    id: sellerId,
    name: sellerName,
    username: sellerUsername,
    avatarUrl: sellerAvatar,
    isVerified: isSellerVerified,
    memberSinceLabel,
    governorate: sellerGov,
  }

  // 12. Miscellaneous Meta
  const whatsappEnabled = Boolean(raw.whatsappEnabled)

  let postedAtLabel = 'حديثاً'
  if (typeof raw.createdAt === 'string') {
    try {
      postedAtLabel = formatDate(raw.createdAt)
    } catch {
      postedAtLabel = 'حديثاً'
    }
  }

  const viewCount = raw.viewCount ?? 0

  return {
    id,
    version,
    status,
    title,
    serviceType,
    serviceTypeLabel,
    providerType,
    providerTypeLabel,
    providerName,
    isHomeService,
    homeServiceLabel,
    specializations,
    description,
    price,
    workingSchedule,
    images,
    location,
    website,
    seller,
    whatsappEnabled,
    postedAtLabel,
    viewCount,
  }
}
