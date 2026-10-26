import type {
  EquipmentDetailApi,
  EquipmentDetailApiImage,
  EquipmentDetailApiSeller,
} from '../../types/equipmentDetailApi.types'
import type {
  EquipmentDetailViewModel,
  EquipmentOperatorBadge,
  EquipmentRentalView,
  EquipmentWantedView,
} from '../../types/equipmentDetailViewModel.types'
import type {
  GalleryImage,
  LocationView,
  PriceView,
  SellerView,
  SpecItemView,
  SpecSectionView,
} from '../../types/listingDetail.types'
import {
  EQUIPMENT_CATEGORIES,
  EQUIPMENT_CONDITIONS,
  LISTING_TYPES,
  POPULAR_EQUIPMENT_FEATURES,
  RENTAL_DURATIONS,
} from '../../constants/equipment'
import {
  formatDetailPrice,
  formatMemberSince,
  formatNumberWestern,
  formatRelativeTimeAr,
  parseDecimal,
} from './formatters'
import { stripMarkdown } from './stripMarkdown'

/**
 * Translates an enum or code against a constant list of { id | key, label }.
 * If not found, falls back safely to the raw value.
 */
function translateFromConstants(
  list: readonly { id?: string; key?: string; label: string }[],
  val?: string | null
): string | undefined {
  if (!val || typeof val !== 'string') return undefined
  const trimmed = val.trim()
  if (!trimmed) return undefined
  const upper = trimmed.toUpperCase()
  const found = list.find((item) => {
    const candidate = item.id ?? item.key
    return candidate ? candidate.toUpperCase() === upper : false
  })
  return found?.label ?? trimmed
}

export function normalizeCurrency(code?: string | null): string {
  if (!code) return 'ر.ع'
  const upper = code.trim().toUpperCase()
  if (upper === 'OMR') return 'ر.ع'
  if (upper === 'USD') return '$'
  return code
}

/**
 * Sorts and normalizes gallery images.
 * Places primary image first, then sorts by order ascending.
 */
function mapImages(rawImages?: EquipmentDetailApiImage[] | null): GalleryImage[] {
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
function mapLocation(raw: EquipmentDetailApi): LocationView {
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
function mapSeller(user?: EquipmentDetailApiSeller | null): SellerView {
  const id = user?.id ? String(user.id) : ''
  const username = user?.username || 'مستخدم سوق ون'
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
 * Formats hours used with Arabic grouping and unit.
 * Example: 2500 -> "2,500 ساعة"
 */
export function formatHoursUsed(hours: number | null | undefined): string | undefined {
  if (hours === null || hours === undefined || isNaN(hours)) return undefined
  return `${formatNumberWestern(hours)} ساعة`
}

/**
 * Maps price and rental rates based on equipment listing type.
 */
function mapPrice(raw: EquipmentDetailApi): PriceView {
  const currency = normalizeCurrency(raw.currency)
  const isNegotiable = Boolean(raw.isPriceNegotiable)

  let amount = 0
  let caption: string | undefined
  let fullPriceLabel = ''

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

  if (raw.listingType === 'EQUIPMENT_RENT') {
    caption = 'للإيجار'
    if (dailyRate) {
      amount = dailyRate.amount
      fullPriceLabel = dailyRate.label
    } else if (monthlyRate) {
      amount = monthlyRate.amount
      fullPriceLabel = monthlyRate.label
    } else {
      fullPriceLabel = 'السعر عند التواصل'
    }
  } else if (raw.listingType === 'EQUIPMENT_WANTED') {
    caption = 'مطلوب معدة'
    amount = 0
    fullPriceLabel = 'طلب استئجار / شراء'
  } else {
    // EQUIPMENT_SALE or default
    caption = 'للبيع'
    const parsedPrice = parseDecimal(raw.price)
    if (parsedPrice !== undefined && parsedPrice > 0) {
      amount = parsedPrice
      fullPriceLabel = formatDetailPrice(amount, currency)
    } else {
      amount = 0
      fullPriceLabel = 'السعر عند التواصل'
    }
  }

  return {
    amount,
    formattedAmount: formatNumberWestern(amount),
    currency,
    fullPriceLabel,
    isNegotiable,
    listingType: raw.listingType,
    caption,
    dailyRate,
    monthlyRate,
  }
}

/**
 * Maps rental view details for EQUIPMENT_RENT.
 */
function mapRental(raw: EquipmentDetailApi): EquipmentRentalView | null {
  if (raw.listingType !== 'EQUIPMENT_RENT') {
    return null
  }

  const currency = normalizeCurrency(raw.currency)
  const dailyPrice = parseDecimal(raw.dailyPrice)
  const monthlyPrice = parseDecimal(raw.monthlyPrice)

  return {
    dailyPrice,
    dailyPriceFormatted: dailyPrice !== undefined ? formatDetailPrice(dailyPrice, currency) : undefined,
    monthlyPrice,
    monthlyPriceFormatted: monthlyPrice !== undefined ? formatDetailPrice(monthlyPrice, currency) : undefined,
    withOperator: Boolean(raw.withOperator),
    deliveryAvailable: Boolean(raw.deliveryAvailable),
  }
}

/**
 * Maps wanted view details for EQUIPMENT_WANTED.
 */
function mapWanted(raw: EquipmentDetailApi): EquipmentWantedView | null {
  if (raw.listingType !== 'EQUIPMENT_WANTED') {
    return null
  }

  const currency = normalizeCurrency(raw.currency)
  const budgetMin = parseDecimal(raw.budgetMin)
  const budgetMax = parseDecimal(raw.budgetMax)

  let budgetRangeFormatted: string | undefined
  if (budgetMin !== undefined && budgetMax !== undefined) {
    budgetRangeFormatted = `${formatDetailPrice(budgetMin, currency)} - ${formatDetailPrice(budgetMax, currency)}`
  } else if (budgetMin !== undefined) {
    budgetRangeFormatted = `من ${formatDetailPrice(budgetMin, currency)}`
  } else if (budgetMax !== undefined) {
    budgetRangeFormatted = `حتى ${formatDetailPrice(budgetMax, currency)}`
  }

  const rentalDurationLabel = translateFromConstants(RENTAL_DURATIONS, raw.rentalDuration)

  return {
    budgetMin,
    budgetMinFormatted: budgetMin !== undefined ? formatDetailPrice(budgetMin, currency) : undefined,
    budgetMax,
    budgetMaxFormatted: budgetMax !== undefined ? formatDetailPrice(budgetMax, currency) : undefined,
    budgetRangeFormatted,
    rentalDuration: raw.rentalDuration || undefined,
    rentalDurationLabel,
    startDate: raw.startDate || undefined,
    endDate: raw.endDate || undefined,
    quantity: typeof raw.quantity === 'number' && !isNaN(raw.quantity) ? raw.quantity : undefined,
    quantityFormatted:
      typeof raw.quantity === 'number' && !isNaN(raw.quantity)
        ? `${formatNumberWestern(raw.quantity)} عدد`
        : undefined,
    siteDetails: raw.siteDetails?.trim() || undefined,
  }
}

/**
 * Maps operator badge (Rent only).
 */
function mapOperatorBadge(raw: EquipmentDetailApi): EquipmentOperatorBadge | null {
  if (raw.listingType !== 'EQUIPMENT_RENT') {
    return null
  }

  return raw.withOperator
    ? { kind: 'with', label: 'مع مشغّل' }
    : { kind: 'without', label: 'بدون مشغّل' }
}

/**
 * Pure mapper converting raw equipment detail API response into strongly-typed UI ViewModel.
 */
export function mapEquipmentDetail(
  api: EquipmentDetailApi,
  opts?: { now?: Date }
): EquipmentDetailViewModel {
  const price = mapPrice(api)
  const images = mapImages(api.images)
  const location = mapLocation(api)
  const seller = mapSeller(api.user)
  const rental = mapRental(api)
  const wanted = mapWanted(api)
  const operatorBadge = mapOperatorBadge(api)

  const equipmentTypeLabel =
    translateFromConstants(EQUIPMENT_CATEGORIES, api.equipmentType) ?? api.equipmentType
  const listingTypeLabel =
    translateFromConstants(LISTING_TYPES, api.listingType) ?? api.listingType
  const conditionLabel = translateFromConstants(EQUIPMENT_CONDITIONS, api.condition)

  const hoursUsed =
    typeof api.hoursUsed === 'number' && !isNaN(api.hoursUsed) ? api.hoursUsed : undefined
  const hoursUsedLabel = formatHoursUsed(hoursUsed)

  // 1. Key Specs (high-level highlights for top cards)
  const keySpecs: SpecItemView[] = []

  // Main primary metric for equipment is hoursUsed
  if (hoursUsedLabel) {
    keySpecs.push({
      key: 'hoursUsed',
      label: 'ساعات العمل',
      value: hoursUsedLabel,
      icon: 'clock',
    })
  }

  if (api.year) {
    keySpecs.push({
      key: 'year',
      label: 'سنة الصنع',
      value: String(api.year),
      icon: 'calendar',
    })
  }

  if (api.capacity?.trim()) {
    keySpecs.push({
      key: 'capacity',
      label: 'السعة / الحمولة',
      value: api.capacity.trim(),
      icon: 'box',
    })
  }

  if (api.power?.trim()) {
    keySpecs.push({
      key: 'power',
      label: 'القوة',
      value: api.power.trim(),
      icon: 'zap',
    })
  }

  if (api.weight?.trim()) {
    keySpecs.push({
      key: 'weight',
      label: 'الوزن',
      value: api.weight.trim(),
      icon: 'shield',
    })
  }

  // 2. Structured Spec Sections
  const specsSections: SpecSectionView[] = []

  // Basic specs
  const basicItems: SpecItemView[] = []
  if (listingTypeLabel) {
    basicItems.push({ key: 'listingType', label: 'نوع الإعلان', value: listingTypeLabel })
  }
  if (equipmentTypeLabel) {
    basicItems.push({ key: 'equipmentType', label: 'نوع المعدة', value: equipmentTypeLabel })
  }
  if (api.make?.trim()) {
    basicItems.push({ key: 'make', label: 'الشركة المصنعة', value: api.make.trim() })
  }
  if (api.model?.trim()) {
    basicItems.push({ key: 'model', label: 'الموديل', value: api.model.trim() })
  }
  if (api.year) {
    basicItems.push({ key: 'year', label: 'سنة الصنع', value: String(api.year) })
  }
  if (conditionLabel) {
    basicItems.push({ key: 'condition', label: 'الحالة', value: conditionLabel })
  }
  if (basicItems.length > 0) {
    specsSections.push({ title: 'المواصفات الأساسية', items: basicItems })
  }

  // Technical specs
  const techItems: SpecItemView[] = []
  if (hoursUsedLabel) {
    techItems.push({ key: 'hoursUsed', label: 'ساعات العمل', value: hoursUsedLabel })
  }
  if (api.capacity?.trim()) {
    techItems.push({ key: 'capacity', label: 'السعة / الحمولة', value: api.capacity.trim() })
  }
  if (api.power?.trim()) {
    techItems.push({ key: 'power', label: 'القوة', value: api.power.trim() })
  }
  if (api.weight?.trim()) {
    techItems.push({ key: 'weight', label: 'الوزن', value: api.weight.trim() })
  }
  if (
    api.listingType === 'EQUIPMENT_RENT' &&
    api.withOperator !== undefined &&
    api.withOperator !== null
  ) {
    techItems.push({
      key: 'withOperator',
      label: 'مشغّل المعدة',
      value: api.withOperator ? 'مع مشغّل' : 'بدون مشغّل',
    })
  }
  if (api.deliveryAvailable !== undefined && api.deliveryAvailable !== null) {
    techItems.push({
      key: 'deliveryAvailable',
      label: 'خدمة التوصيل',
      value: api.deliveryAvailable ? 'متوفر' : 'غير متوفر',
    })
  }
  if (techItems.length > 0) {
    specsSections.push({ title: 'المواصفات الفنية', items: techItems })
  }

  // Features chips
  const rawFeatures = Array.isArray(api.features)
    ? api.features.filter((f): f is string => typeof f === 'string' && f.trim().length > 0)
    : []
  if (rawFeatures.length > 0) {
    const featureItems: SpecItemView[] = rawFeatures.map((fId) => {
      const known = POPULAR_EQUIPMENT_FEATURES.find(
        (item) => item.toLowerCase() === fId.toLowerCase()
      )
      return {
        key: fId,
        label: known ?? fId,
        value: '',
      }
    })
    specsSections.push({ title: 'المميزات الإضافية', items: featureItems })
  }

  // Location section
  const locationItems: SpecItemView[] = []
  if (location.governorateName) {
    locationItems.push({ key: 'governorate', label: 'المحافظة', value: location.governorateName })
  }
  if (location.wilayaName) {
    locationItems.push({ key: 'wilaya', label: 'الولاية', value: location.wilayaName })
  }
  if (locationItems.length > 0) {
    specsSections.push({ title: 'الموقع', items: locationItems })
  }

  return {
    id: String(api.id),
    version: api.version ?? 1,
    status: api.status,
    title: api.title || '',
    description: stripMarkdown(api.description || ''),
    listingType: api.listingType,
    condition: api.condition || undefined,
    conditionLabel,
    price,
    images,
    location,
    seller,
    whatsappEnabled: api.whatsappEnabled === true,
    postedAtLabel: formatRelativeTimeAr(api.createdAt, opts?.now),
    viewCount: api.viewCount ?? 0,

    equipmentListingType: api.listingType,
    equipmentType: api.equipmentType,
    equipmentTypeLabel,
    make: api.make || undefined,
    model: api.model || undefined,
    year: api.year ?? undefined,
    hoursUsed,
    hoursUsedLabel,
    keySpecs,
    specsSections,
    features: rawFeatures,
    operatorBadge,
    rental,
    wanted,
  }
}
