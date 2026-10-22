import type {
  OperatorDetailApi,
  OperatorDetailApiSeller,
  OperatorPendingDeletionApi,
} from '../../types/operatorDetailApi.types'
import type {
  OperatorCertificationItem,
  OperatorDetailViewModel,
  OperatorEquipmentTypeChip,
  OperatorPendingDeletionView,
  OperatorRatesView,
} from '../../types/operatorDetailViewModel.types'
import type { LocationView, SellerView } from '../../types/listingDetail.types'
import type { EquipmentType } from '../../types/equipment.types'
import {
  getOperatorTypeLabel,
  getEquipmentTypeLabel,
  EQUIPMENT_TYPES,
} from '../equipment-mappers'
import { normalizeCurrency } from './mapEquipmentDetail'
import {
  formatDetailPrice,
  formatMemberSince,
  formatNumberWestern,
  formatRelativeTimeAr,
  parseDecimal,
} from './formatters'
import { stripMarkdown } from './stripMarkdown'

export { normalizeCurrency }

/**
 * Maps location details from governorate/wilaya refs or fallback fields.
 */
function mapLocation(raw: OperatorDetailApi): LocationView {
  const governorateName = raw.governorateRef?.nameAr || raw.governorate || undefined
  const wilayaName = raw.wilayaRef?.nameAr || raw.city || undefined

  let fullLocationText = 'سلطنة عُمان'
  if (governorateName && wilayaName) {
    if (governorateName === wilayaName) {
      fullLocationText = governorateName
    } else {
      fullLocationText = `${governorateName}، ${wilayaName}`
    }
  } else if (governorateName) {
    fullLocationText = governorateName
  } else if (wilayaName) {
    fullLocationText = wilayaName
  }

  const hasCoords =
    typeof raw.latitude === 'number' &&
    typeof raw.longitude === 'number' &&
    !isNaN(raw.latitude) &&
    !isNaN(raw.longitude)

  return {
    governorateName,
    wilayaName,
    fullLocationText,
    hasCoordinates: hasCoords,
    latitude: hasCoords ? (raw.latitude as number) : undefined,
    longitude: hasCoords ? (raw.longitude as number) : undefined,
  }
}

/**
 * Maps seller info into a safe UI view model.
 */
function mapSeller(user?: OperatorDetailApiSeller | null): SellerView {
  const id = user?.id ? String(user.id) : ''
  const username = user?.username || 'مشغل معتمد'
  const name = user?.displayName?.trim() || username
  const isVerified = Boolean(user?.isVerified)
  const memberSinceLabel = user?.createdAt
    ? formatMemberSince(user.createdAt)
    : 'عضو في سوق ون'

  return {
    id,
    name,
    username,
    avatarUrl: user?.avatarUrl || undefined,
    isVerified,
    memberSinceLabel,
    accountType: undefined,
  }
}

/**
 * Maps rates view:
 * - daily rate is primary
 * - hourly rate is secondary
 * - strictly avoids "0 ر.ع" (uses "السعر عند التواصل" when no rate is present)
 */
function mapRates(raw: OperatorDetailApi): OperatorRatesView {
  const currency = normalizeCurrency(raw.currency)
  const isNegotiable = Boolean(raw.isPriceNegotiable)

  const parsedDaily = parseDecimal(raw.dailyRate)
  const dailyRate = parsedDaily !== undefined && parsedDaily > 0 ? parsedDaily : undefined
  const dailyRateFormatted = dailyRate !== undefined ? `${formatNumberWestern(dailyRate)} ${currency} / يوم` : undefined

  const parsedHourly = parseDecimal(raw.hourlyRate)
  const hourlyRate = parsedHourly !== undefined && parsedHourly > 0 ? parsedHourly : undefined
  const hourlyRateFormatted = hourlyRate !== undefined ? `${formatNumberWestern(hourlyRate)} ${currency} / ساعة` : undefined

  const hasAnyRate = Boolean(dailyRate !== undefined || hourlyRate !== undefined)

  let primaryLabel = 'السعر عند التواصل'
  if (dailyRateFormatted && hourlyRateFormatted) {
    primaryLabel = `${dailyRateFormatted} • ${hourlyRateFormatted}`
  } else if (dailyRateFormatted) {
    primaryLabel = dailyRateFormatted
  } else if (hourlyRateFormatted) {
    primaryLabel = hourlyRateFormatted
  }

  return {
    dailyRate,
    dailyRateFormatted,
    hourlyRate,
    hourlyRateFormatted,
    currency,
    isNegotiable,
    primaryLabel,
    hasAnyRate,
  }
}

/**
 * Maps certifications:
 * String items starting with http or / are considered image URLs/documents;
 * other strings are text certificate titles.
 */
function mapCertifications(certs?: string[] | null): OperatorCertificationItem[] {
  if (!Array.isArray(certs) || certs.length === 0) return []

  return certs
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter((item) => item.length > 0)
    .map((item, idx) => {
      const isUrl = item.startsWith('http://') || item.startsWith('https://') || item.startsWith('/')
      if (isUrl) {
        return {
          key: `cert-doc-${idx}`,
          label: `شهادة مهنية ${idx + 1}`,
          imageUrl: item,
          isDocument: true,
        }
      }
      return {
        key: `cert-text-${idx}`,
        label: item,
        imageUrl: undefined,
        isDocument: false,
      }
    })
}

export function isKnownEquipmentType(type: string): type is EquipmentType {
  return Object.prototype.hasOwnProperty.call(EQUIPMENT_TYPES, type)
}

/**
 * Maps equipment types into chip items with Arabic labels.
 * Filters unknown strings so value is guaranteed to be a valid EquipmentType without casting.
 */
function mapEquipmentTypes(types?: unknown[] | null): OperatorEquipmentTypeChip[] {
  if (!Array.isArray(types) || types.length === 0) return []

  const result: OperatorEquipmentTypeChip[] = []
  for (const t of types) {
    if (typeof t === 'string') {
      const trimmed = t.trim()
      if (isKnownEquipmentType(trimmed)) {
        result.push({
          value: trimmed,
          label: getEquipmentTypeLabel(trimmed),
        })
      }
    }
  }
  return result
}

/**
 * Maps pending deletion request (only present for owner).
 */
function mapPendingDeletion(request?: OperatorPendingDeletionApi | null): OperatorPendingDeletionView | null {
  if (!request || !request.id) return null

  return {
    id: String(request.id),
    requestedAt: request.createdAt,
    requestedAtLabel: formatRelativeTimeAr(request.createdAt),
    status: request.status || 'PENDING',
  }
}

/**
 * Format experience years with Arabic plural/noun formatting.
 * 0 is valid (e.g. حديث التخرج / أقل من سنة).
 */
export function formatExperienceYears(years?: number | null): string | undefined {
  if (years === null || years === undefined || isNaN(years)) return undefined
  if (years === 0) return 'أقل من سنة خبرة'
  if (years === 1) return 'سنة خبرة واحدة'
  if (years === 2) return 'سنتان خبرة'
  if (years >= 3 && years <= 10) return `${formatNumberWestern(years)} سنوات خبرة`
  return `${formatNumberWestern(years)} سنة خبرة`
}

/**
 * Pure mapper from backend OperatorDetailApi payload to OperatorDetailViewModel.
 */
export function mapOperatorDetail(raw: OperatorDetailApi): OperatorDetailViewModel {
  const cleanTitle = (raw.title || '').trim() || 'مشغل معدات'
  const cleanDescription = raw.description ? stripMarkdown(raw.description) : ''

  const operatorTypeLabel = getOperatorTypeLabel(raw.operatorType)
  const experienceYears = typeof raw.experienceYears === 'number' && !isNaN(raw.experienceYears)
    ? raw.experienceYears
    : undefined
  const experienceYearsLabel = formatExperienceYears(experienceYears)

  const specializations = Array.isArray(raw.specializations)
    ? raw.specializations.map((s) => (typeof s === 'string' ? s.trim() : '')).filter((s) => s.length > 0)
    : []

  const equipmentTypes = mapEquipmentTypes(raw.equipmentTypes)
  const certifications = mapCertifications(raw.certifications)
  const rates = mapRates(raw)
  const seller = mapSeller(raw.user)
  const location = mapLocation(raw)
  const pendingDeletion = mapPendingDeletion(raw.pendingDeletionRequest)

  const postedAtLabel = formatRelativeTimeAr(raw.createdAt)

  return {
    id: String(raw.id),
    title: cleanTitle,
    description: cleanDescription,
    operatorType: raw.operatorType,
    operatorTypeLabel,
    specializations,
    experienceYears,
    experienceYearsLabel,
    equipmentTypes,
    certifications,
    rates,
    profileImageUrl: raw.profileImageUrl || undefined,
    seller,
    location,
    whatsappEnabled: Boolean(raw.whatsappEnabled),
    viewCount: typeof raw.viewCount === 'number' && !isNaN(raw.viewCount) ? raw.viewCount : 0,
    postedAtLabel,
    status: raw.status || 'ACTIVE',
    hiddenByOwnerStatus: Boolean(raw.hiddenByOwnerStatus),
    pendingDeletion,
  }
}
