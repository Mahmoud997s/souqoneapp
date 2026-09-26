import { CarDetailApi, CarDetailApiImage, CarDetailApiSeller } from '../../types/carDetailApi.types'
import { carFieldRegistry, FieldDef } from '../../config/listing-detail/carFieldRegistry'
import { CAR_FEATURE_KEYS } from '../../constants/cars'
import {
  CarDetailViewModel,
  GalleryImage,
  LocationView,
  PriceView,
  RentalTermsView,
  SellerView,
  SpecItemView,
  SpecSectionView,
} from '../../types/carDetailViewModel.types'
import {
  formatDetailPrice,
  formatMemberSince,
  formatMileage,
  formatNumberWestern,
  formatRelativeTimeAr,
  parseDecimal,
} from './formatters'

/**
 * Arabic label dictionary for standard vehicle enums.
 * If a value is not in the dictionary, it passes through safely without error.
 */
const TRANSMISSION_MAP: Record<string, string> = {
  AUTOMATIC: 'أوتوماتيك',
  MANUAL: 'يدوي',
  CVT: 'CVT',
}

const FUEL_TYPE_MAP: Record<string, string> = {
  PETROL: 'بنزين',
  GASOLINE: 'بنزين',
  DIESEL: 'ديزل',
  HYBRID: 'هايبرد',
  ELECTRIC: 'كهربائي',
  PLUGIN_HYBRID: 'هايبرد قابل للشحن',
}

const DRIVE_TYPE_MAP: Record<string, string> = {
  FWD: 'دفع أمامي',
  RWD: 'دفع خلفي',
  AWD: 'دفع كلي مستمر (AWD)',
  '4WD': 'دفع رباعي (4x4)',
}

const BODY_TYPE_MAP: Record<string, string> = {
  SEDAN: 'سيدان',
  SUV: 'دفع رباعي / SUV',
  COUPE: 'كوبيه',
  HATCHBACK: 'هاتشباك',
  PICKUP: 'بيك أب / شاحنة',
  CONVERTIBLE: 'مكشوفة / كابريوليه',
  VAN: 'فان',
  WAGON: 'واجن',
}

const CONDITION_MAP: Record<string, string> = {
  NEW: 'جديد',
  USED: 'مستعمل',
}

function translateEnum(map: Record<string, string>, val?: string | null): string | undefined {
  if (!val || typeof val !== 'string') return undefined
  const trimmed = val.trim()
  if (!trimmed) return undefined
  return map[trimmed.toUpperCase()] ?? trimmed
}

/**
 * Normalizes currency code into display symbol.
 */
function normalizeCurrency(code?: string | null): string {
  if (!code) return 'ر.ع'
  const upper = code.trim().toUpperCase()
  if (upper === 'OMR') return 'ر.ع'
  if (upper === 'USD') return '$'
  return code
}

/**
 * Sorts and normalizes gallery images.
 * Always places primary image first, then sorts by order ascending.
 */
function mapImages(rawImages?: CarDetailApiImage[] | null): GalleryImage[] {
  if (!Array.isArray(rawImages) || rawImages.length === 0) {
    return []
  }

  return [...rawImages]
    .sort((a, b) => {
      if (a.isPrimary && !b.isPrimary) return -1
      if (!a.isPrimary && b.isPrimary) return 1
      return (a.order ?? 0) - (b.order ?? 0)
    })
    .map((img) => ({
      id: String(img.id),
      url: img.url,
      order: img.order ?? 0,
      isPrimary: Boolean(img.isPrimary),
    }))
}

/**
 * Maps location details and checks coordinate validity.
 */
function mapLocation(raw: CarDetailApi): LocationView {
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
    latitude: hasCoords ? raw.latitude! : undefined,
    longitude: hasCoords ? raw.longitude! : undefined,
  }
}

/**
 * Maps seller info into a safe UI view model.
 */
function mapSeller(seller: CarDetailApiSeller): SellerView {
  const id = seller.id ? String(seller.id) : ''
  const username = seller.username || 'مستخدم سوق ون'
  const name = seller.displayName?.trim() || username
  const isVerified = Boolean(seller.isVerified)
  const memberSinceLabel = seller.createdAt
    ? formatMemberSince(seller.createdAt)
    : 'عضو في سوق ون'

  return {
    id,
    name,
    username,
    avatarUrl: seller.avatarUrl || undefined,
    isVerified,
    memberSinceLabel,
    accountType: seller.accountType || undefined,
  }
}

/**
 * Maps price and rental rates based on listing type.
 */
function mapPrice(raw: CarDetailApi): PriceView {
  const currency = normalizeCurrency(raw.currency)
  const listingType = raw.listingType || 'SALE'
  const isNegotiable = Boolean(raw.isPriceNegotiable)

  let amount = parseDecimal(raw.price) ?? 0
  let caption: string | undefined

  const dailyAmount = parseDecimal(raw.dailyPrice)
  let dailyRate: PriceView['dailyRate']
  if (dailyAmount !== undefined) {
    dailyRate = {
      amount: dailyAmount,
      formatted: formatDetailPrice(dailyAmount, currency),
      label: `${formatDetailPrice(dailyAmount, currency)} / يوم`,
    }
  }

  const monthlyAmount = parseDecimal(raw.monthlyPrice)
  let monthlyRate: PriceView['monthlyRate']
  if (monthlyAmount !== undefined) {
    monthlyRate = {
      amount: monthlyAmount,
      formatted: formatDetailPrice(monthlyAmount, currency),
      label: `${formatDetailPrice(monthlyAmount, currency)} / شهر`,
    }
  }

  let fullPriceLabel = formatDetailPrice(amount, currency)

  if (listingType === 'RENTAL') {
    caption = 'للإيجار'
    if (dailyRate) {
      amount = dailyRate.amount
      fullPriceLabel = dailyRate.label
    } else if (monthlyRate) {
      amount = monthlyRate.amount
      fullPriceLabel = monthlyRate.label
    }
  } else if (listingType === 'WANTED') {
    caption = 'الميزانية المتوقعة'
  }

  return {
    amount,
    formattedAmount: formatNumberWestern(amount),
    currency,
    fullPriceLabel,
    isNegotiable,
    listingType,
    caption,
    dailyRate,
    monthlyRate,
  }
}

/**
 * Maps rental terms if listing is RENTAL or rental rates exist.
 */
function mapRentalTerms(raw: CarDetailApi, currency: string): RentalTermsView | undefined {
  const isRental =
    raw.listingType === 'RENTAL' ||
    parseDecimal(raw.dailyPrice) !== undefined ||
    parseDecimal(raw.monthlyPrice) !== undefined

  if (!isRental) return undefined

  const depositAmount = parseDecimal(raw.depositAmount)
  const kmLimitPerDay = parseDecimal(raw.kmLimitPerDay)

  return {
    minRentalDays: raw.minRentalDays ?? undefined,
    depositAmount,
    depositLabel:
      depositAmount !== undefined ? formatDetailPrice(depositAmount, currency) : undefined,
    kmLimitPerDay,
    kmLimitLabel:
      kmLimitPerDay !== undefined ? `${formatNumberWestern(kmLimitPerDay)} كم / يوم` : undefined,
    cancellationPolicy: raw.cancellationPolicy ?? undefined,
    withDriver: raw.withDriver != null ? Boolean(raw.withDriver) : undefined,
    deliveryAvailable: raw.deliveryAvailable != null ? Boolean(raw.deliveryAvailable) : undefined,
    insuranceIncluded: raw.insuranceIncluded != null ? Boolean(raw.insuranceIncluded) : undefined,
  }
}

const SPEC_SECTION_ORDER: FieldDef['group'][] = ['basic', 'specs', 'features', 'rental', 'location']

const SPEC_SECTION_TITLES: Record<FieldDef['group'], string> = {
  basic: 'المواصفات الأساسية',
  specs: 'المواصفات الفنية',
  features: 'الميزات الإضافية',
  rental: 'شروط الإيجار',
  location: 'الموقع',
}

/**
 * Builds the grouped spec sections from carFieldRegistry (the single source of truth for
 * labels/translations). Fields whose format() returns null and rental-only fields on
 * non-rental listings are skipped. The features group becomes icon chips: items with an
 * empty `value`, carrying the feature's Arabic label and icon.
 */
function buildSpecsSections(raw: CarDetailApi): SpecSectionView[] {
  const itemsByGroup = new Map<FieldDef['group'], SpecItemView[]>()

  for (const field of carFieldRegistry) {
    if (field.visibleWhen && !field.visibleWhen(raw)) continue
    const value = field.format(raw)
    if (!value) continue

    const items = itemsByGroup.get(field.group) ?? []
    if (field.group === 'features') {
      const featureIds = (raw.features ?? []).filter(
        (f): f is string => typeof f === 'string' && f.trim().length > 0
      )
      for (const featureId of featureIds) {
        const known = CAR_FEATURE_KEYS.find((f) => f.id === featureId)
        items.push({
          key: featureId,
          label: known?.label ?? featureId,
          value: '',
          icon: known?.icon,
        })
      }
    } else {
      items.push({ key: field.id, label: field.label, value })
    }
    itemsByGroup.set(field.group, items)
  }

  return SPEC_SECTION_ORDER.filter((group) => (itemsByGroup.get(group)?.length ?? 0) > 0).map(
    (group) => ({ title: SPEC_SECTION_TITLES[group], items: itemsByGroup.get(group)! })
  )
}

/**
 * Pure mapper converting raw car detail API response into strongly-typed UI ViewModel.
 * Guarantees zero null/undefined field pollution in specifications and sections.
 */
export function mapCarDetail(raw: CarDetailApi): CarDetailViewModel {
  const currency = normalizeCurrency(raw.currency)
  const price = mapPrice(raw)
  const images = mapImages(raw.images)
  const location = mapLocation(raw)
  const seller = mapSeller(raw.seller)
  const rentalTerms = mapRentalTerms(raw, currency)

  const conditionLabel = translateEnum(CONDITION_MAP, raw.condition)
  const transmissionLabel = translateEnum(TRANSMISSION_MAP, raw.transmission)
  const fuelTypeLabel = translateEnum(FUEL_TYPE_MAP, raw.fuelType)
  const driveTypeLabel = translateEnum(DRIVE_TYPE_MAP, raw.driveType)
  const bodyTypeLabel = translateEnum(BODY_TYPE_MAP, raw.bodyType)

  const mileageLabel = formatMileage(raw.mileage) || undefined

  // 1. Key Specs (high-level highlights for top cards)
  const keySpecs: SpecItemView[] = []
  if (raw.year) {
    keySpecs.push({ key: 'year', label: 'سنة الصنع', value: String(raw.year), icon: 'calendar' })
  }
  if (mileageLabel) {
    keySpecs.push({ key: 'mileage', label: 'الممشى', value: mileageLabel, icon: 'speedometer' })
  }
  if (transmissionLabel) {
    keySpecs.push({
      key: 'transmission',
      label: 'ناقل الحركة',
      value: transmissionLabel,
      icon: 'git-commit',
    })
  }
  if (fuelTypeLabel) {
    keySpecs.push({ key: 'fuelType', label: 'الوقود', value: fuelTypeLabel, icon: 'droplet' })
  }

  // 2. Structured Spec Sections (driven by carFieldRegistry)
  const specsSections = buildSpecsSections(raw)

  // Features list
  const features = Array.isArray(raw.features)
    ? raw.features.filter((f): f is string => typeof f === 'string' && f.trim().length > 0)
    : []

  return {
    id: String(raw.id),
    version: raw.version ?? 1,
    status: raw.status,
    title: raw.title || '',
    description: raw.description || '',
    listingType: raw.listingType || 'SALE',
    condition: raw.condition || undefined,
    conditionLabel,
    price,
    images,
    location,
    seller,
    whatsappEnabled: raw.whatsappEnabled !== false,
    postedAtLabel: formatRelativeTimeAr(raw.createdAt),
    viewCount: raw.viewCount,

    make: raw.make || '',
    model: raw.model || '',
    trim: raw.trim || undefined,
    year: raw.year ?? undefined,
    mileage: raw.mileage ?? undefined,
    mileageLabel,
    keySpecs,
    specsSections,
    features,
    rentalTerms,
  }
}
