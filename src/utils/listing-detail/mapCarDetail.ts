import { CarDetailApi, CarDetailApiImage, CarDetailApiSeller } from '../../types/carDetailApi.types'
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

  let amount = typeof raw.price === 'number' && !isNaN(raw.price) ? raw.price : 0
  let caption: string | undefined

  let dailyRate: PriceView['dailyRate']
  if (typeof raw.dailyPrice === 'number' && !isNaN(raw.dailyPrice)) {
    dailyRate = {
      amount: raw.dailyPrice,
      formatted: formatDetailPrice(raw.dailyPrice, currency),
      label: `${formatDetailPrice(raw.dailyPrice, currency)} / يوم`,
    }
  }

  let monthlyRate: PriceView['monthlyRate']
  if (typeof raw.monthlyPrice === 'number' && !isNaN(raw.monthlyPrice)) {
    monthlyRate = {
      amount: raw.monthlyPrice,
      formatted: formatDetailPrice(raw.monthlyPrice, currency),
      label: `${formatDetailPrice(raw.monthlyPrice, currency)} / شهر`,
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
    typeof raw.dailyPrice === 'number' ||
    typeof raw.monthlyPrice === 'number'

  if (!isRental) return undefined

  return {
    minRentalDays: raw.minRentalDays ?? undefined,
    depositAmount: raw.depositAmount ?? undefined,
    depositLabel:
      raw.depositAmount != null ? formatDetailPrice(raw.depositAmount, currency) : undefined,
    kmLimitPerDay: raw.kmLimitPerDay ?? undefined,
    kmLimitLabel:
      raw.kmLimitPerDay != null ? `${formatNumberWestern(raw.kmLimitPerDay)} كم / يوم` : undefined,
    cancellationPolicy: raw.cancellationPolicy ?? undefined,
    withDriver: raw.withDriver != null ? Boolean(raw.withDriver) : undefined,
    deliveryAvailable: raw.deliveryAvailable != null ? Boolean(raw.deliveryAvailable) : undefined,
    insuranceIncluded: raw.insuranceIncluded != null ? Boolean(raw.insuranceIncluded) : undefined,
  }
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

  // 2. Structured Spec Sections
  const basicItems: SpecItemView[] = []
  if (raw.make) basicItems.push({ key: 'make', label: 'الشركة المصنعة', value: raw.make })
  if (raw.model) basicItems.push({ key: 'model', label: 'الموديل', value: raw.model })
  if (raw.trim) basicItems.push({ key: 'trim', label: 'الفئة (Trim)', value: raw.trim })
  if (raw.year) basicItems.push({ key: 'year', label: 'سنة الصنع', value: String(raw.year) })
  if (conditionLabel) basicItems.push({ key: 'condition', label: 'الحالة', value: conditionLabel })
  if (mileageLabel) basicItems.push({ key: 'mileage', label: 'المسافة المقطوعة', value: mileageLabel })

  const engineItems: SpecItemView[] = []
  if (fuelTypeLabel) engineItems.push({ key: 'fuelType', label: 'نوع الوقود', value: fuelTypeLabel })
  if (transmissionLabel)
    engineItems.push({ key: 'transmission', label: 'ناقل الحركة', value: transmissionLabel })
  if (driveTypeLabel) engineItems.push({ key: 'driveType', label: 'نوع الدفع', value: driveTypeLabel })
  if (raw.engineSize) engineItems.push({ key: 'engineSize', label: 'سعة المحرك', value: raw.engineSize })
  if (raw.horsepower)
    engineItems.push({ key: 'horsepower', label: 'القوة الحصانية', value: `${formatNumberWestern(raw.horsepower)} حصان` })

  const appearanceItems: SpecItemView[] = []
  if (bodyTypeLabel) appearanceItems.push({ key: 'bodyType', label: 'نوع الهيكل', value: bodyTypeLabel })
  if (raw.exteriorColor)
    appearanceItems.push({ key: 'exteriorColor', label: 'اللون الخارجي', value: raw.exteriorColor })
  if (raw.interior)
    appearanceItems.push({ key: 'interior', label: 'الفرش الداخلي', value: raw.interior })
  if (raw.doors) appearanceItems.push({ key: 'doors', label: 'عدد الأبواب', value: String(raw.doors) })
  if (raw.seats) appearanceItems.push({ key: 'seats', label: 'عدد المقاعد', value: String(raw.seats) })

  const specsSections: SpecSectionView[] = []
  if (basicItems.length > 0) {
    specsSections.push({ title: 'المواصفات الأساسية', items: basicItems })
  }
  if (engineItems.length > 0) {
    specsSections.push({ title: 'المحرك والأداء', items: engineItems })
  }
  if (appearanceItems.length > 0) {
    specsSections.push({ title: 'المظهر والأبعاد', items: appearanceItems })
  }

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
