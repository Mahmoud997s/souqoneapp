import { BusDetailApi, BusDetailApiImage, BusDetailApiSeller } from '../../types/busDetailApi.types'
import {
  BUS_CONDITIONS,
  BUS_CONTRACT_TYPES,
  BUS_FEATURES,
  BUS_FUEL_TYPES,
  BUS_LISTING_TYPES,
  BUS_TRANSMISSIONS,
  BUS_TYPES,
} from '../../constants/buses'
import {
  GalleryImage,
  LocationView,
  PriceView,
  SellerView,
  SpecItemView,
  SpecSectionView,
} from '../../types/listingDetail.types'
import {
  BusContractView,
  BusDetailViewModel,
} from '../../types/busDetailViewModel.types'
import {
  formatDetailPrice,
  formatMemberSince,
  formatMileage,
  formatNumberWestern,
  formatRelativeTimeAr,
  parseDecimal,
} from './formatters'

/**
 * Translates an enum or code against a constant list of { id, label }.
 * If not found, falls back safely to the raw value.
 */
function translateFromConstants(
  list: readonly { id: string; label: string }[],
  val?: string | null
): string | undefined {
  if (!val || typeof val !== 'string') return undefined
  const trimmed = val.trim()
  if (!trimmed) return undefined
  const upper = trimmed.toUpperCase()
  const found = list.find((item) => item.id.toUpperCase() === upper)
  return found?.label ?? trimmed
}

/**
 * Normalizes currency code into display symbol.
 */
export function normalizeCurrency(code?: string | null): string {
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
function mapImages(rawImages?: BusDetailApiImage[] | null): GalleryImage[] {
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
function mapLocation(raw: BusDetailApi): LocationView {
  const governorateName = raw.governorateRef?.nameAr || undefined
  const wilayaName = raw.wilayaRef?.nameAr || undefined

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
function mapSeller(user?: BusDetailApiSeller | null): SellerView {
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
 * Maps price and rental rates based on bus listing type.
 */
function mapPrice(raw: BusDetailApi): PriceView {
  const currency = normalizeCurrency(raw.currency)
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

  if (raw.busListingType === 'BUS_RENT') {
    caption = 'للإيجار'
    if (dailyRate) {
      amount = dailyRate.amount
      fullPriceLabel = dailyRate.label
    } else if (monthlyRate) {
      amount = monthlyRate.amount
      fullPriceLabel = monthlyRate.label
    }
  } else if (raw.busListingType === 'BUS_SALE_WITH_CONTRACT') {
    caption = 'بيع مع عقد تشغيل'
  }

  return {
    amount,
    formattedAmount: formatNumberWestern(amount),
    currency,
    fullPriceLabel,
    isNegotiable,
    listingType: raw.busListingType,
    caption,
    dailyRate,
    monthlyRate,
  }
}

/**
 * Maps commercial contract data according to authentication and validity rules.
 * - hidden: if not BUS_SALE_WITH_CONTRACT, monthlyIncome <= 0, or contractExpiry < now.
 * - locked: if contract is valid but user is not authenticated (strips numbers from VM).
 * - visible: authenticated user with active valid contract.
 */
function mapContract(
  api: BusDetailApi,
  opts: { isAuthenticated: boolean; now?: Date }
): BusContractView {
  if (api.busListingType !== 'BUS_SALE_WITH_CONTRACT') {
    return { access: 'hidden' }
  }

  const now = opts.now ?? new Date()
  if (api.contractExpiry) {
    const expiryDate = new Date(api.contractExpiry)
    if (!isNaN(expiryDate.getTime()) && expiryDate.getTime() < now.getTime()) {
      return { access: 'hidden' }
    }
  }

  const typeLabel = translateFromConstants(BUS_CONTRACT_TYPES, api.contractType)

  if (!opts.isAuthenticated) {
    // If contractMonthly is explicitly present and <= 0, it is not a valid contract
    if (api.contractMonthly !== undefined && api.contractMonthly !== null) {
      const parsed = parseDecimal(api.contractMonthly)
      if (parsed === undefined || parsed <= 0) {
        return { access: 'hidden' }
      }
    }
    return {
      access: 'locked',
      typeLabel,
    }
  }

  // Authenticated user
  const monthlyIncome = parseDecimal(api.contractMonthly)
  if (monthlyIncome === undefined || monthlyIncome <= 0) {
    return { access: 'hidden' }
  }

  return {
    access: 'visible',
    typeLabel,
    clientName: api.contractClient?.trim() || undefined,
    withDriver: Boolean(api.withDriver),
    monthlyIncome,
    durationMonths: api.contractDuration ?? undefined,
    expiryIso: api.contractExpiry || undefined,
  }
}

/**
 * Pure mapper converting raw bus detail API response into strongly-typed UI ViewModel.
 * Guarantees zero null/undefined/empty field pollution in specifications and sections.
 */
export function mapBusDetail(
  api: BusDetailApi,
  opts: { isAuthenticated: boolean; now?: Date }
): BusDetailViewModel {
  const price = mapPrice(api)
  const images = mapImages(api.images)
  const location = mapLocation(api)
  const seller = mapSeller(api.user)
  const contract = mapContract(api, opts)

  const conditionLabel = translateFromConstants(BUS_CONDITIONS, api.condition)
  const transmissionLabel = translateFromConstants(BUS_TRANSMISSIONS, api.transmission)
  const fuelTypeLabel = translateFromConstants(BUS_FUEL_TYPES, api.fuelType)
  const busTypeLabel = translateFromConstants(BUS_TYPES, api.busType) ?? api.busType
  const busListingTypeLabel = translateFromConstants(BUS_LISTING_TYPES, api.busListingType)
  const contractTypeLabel = translateFromConstants(BUS_CONTRACT_TYPES, api.contractType)

  const mileageLabel = formatMileage(api.mileage) || undefined

  // 1. Key Specs (high-level highlights for top cards)
  const keySpecs: SpecItemView[] = []
  if (api.year) {
    keySpecs.push({ key: 'year', label: 'سنة الصنع', value: String(api.year), icon: 'calendar' })
  }
  if (api.capacity) {
    keySpecs.push({
      key: 'capacity',
      label: 'سعة الركاب',
      value: `${formatNumberWestern(api.capacity)} راكب`,
      icon: 'people',
    })
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
  const specsSections: SpecSectionView[] = []

  // Basic specs
  const basicItems: SpecItemView[] = []
  if (busListingTypeLabel) {
    basicItems.push({ key: 'busListingType', label: 'نوع الإعلان', value: busListingTypeLabel })
  }
  if (busTypeLabel) {
    basicItems.push({ key: 'busType', label: 'نوع الحافلة', value: busTypeLabel })
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
  if (api.capacity) {
    basicItems.push({
      key: 'capacity',
      label: 'سعة الركاب',
      value: `${formatNumberWestern(api.capacity)} راكب`,
    })
  }
  if (conditionLabel) {
    basicItems.push({ key: 'condition', label: 'الحالة', value: conditionLabel })
  }
  if (contractTypeLabel) {
    basicItems.push({ key: 'contractType', label: 'نوع العقد', value: contractTypeLabel })
  }
  if (basicItems.length > 0) {
    specsSections.push({ title: 'المواصفات الأساسية', items: basicItems })
  }

  // Technical specs
  const techItems: SpecItemView[] = []
  if (transmissionLabel) {
    techItems.push({ key: 'transmission', label: 'ناقل الحركة', value: transmissionLabel })
  }
  if (fuelTypeLabel) {
    techItems.push({ key: 'fuelType', label: 'نوع الوقود', value: fuelTypeLabel })
  }
  if (mileageLabel) {
    techItems.push({ key: 'mileage', label: 'الممشى', value: mileageLabel })
  }
  if (api.plateNumber?.trim()) {
    techItems.push({ key: 'plateNumber', label: 'رقم اللوحة', value: api.plateNumber.trim() })
  }
  if (
    (api.busListingType === 'BUS_RENT' || api.busListingType === 'BUS_SALE_WITH_CONTRACT') &&
    api.withDriver !== undefined &&
    api.withDriver !== null
  ) {
    techItems.push({
      key: 'withDriver',
      label: 'سائق',
      value: api.withDriver ? 'مع سائق' : 'بدون سائق',
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
      const known = BUS_FEATURES.find((item) => item.id.toLowerCase() === fId.toLowerCase())
      return {
        key: fId,
        label: known?.label ?? fId,
        value: '',
      }
    })
    specsSections.push({ title: 'الميزات الإضافية', items: featureItems })
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
    description: api.description || '',
    listingType: api.busListingType,
    condition: api.condition || undefined,
    conditionLabel,
    price,
    images,
    location,
    seller,
    whatsappEnabled: api.whatsappEnabled === true,
    postedAtLabel: formatRelativeTimeAr(api.createdAt, opts.now),
    viewCount: api.viewCount ?? 0,

    busListingType: api.busListingType,
    busTypeLabel,
    make: api.make || '',
    model: api.model || '',
    year: api.year ?? undefined,
    capacity: api.capacity ?? undefined,
    mileage: api.mileage ?? undefined,
    mileageLabel,
    keySpecs,
    specsSections,
    features: rawFeatures,
    contract,
  }
}
