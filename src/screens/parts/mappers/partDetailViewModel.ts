import type {
  GalleryImage,
  LocationView,
  PriceView,
  SellerView,
  SpecItemView,
  SpecSectionView,
} from '../../../types/listingDetail.types'
import type { PartDetailViewModel } from '../../../types/partDetailViewModel.types'
import {
  PART_CATEGORIES,
  PART_CONDITIONS,
  POPULAR_PART_MAKES,
  WARRANTY_DURATION_LABELS,
  QUANTITY_LABELS,
  VEHICLE_TYPE_LABELS,
} from '../../../constants/parts'
import {
  formatDetailPrice,
  formatMemberSince,
  formatNumberWestern,
  formatRelativeTimeAr,
  parseDecimal,
} from '../../../utils/listing-detail/formatters'
import { stripMarkdown } from '../../../utils/listing-detail/stripMarkdown'

const COND_LABELS: Record<string, string> = {
  NEW: 'جديد',
  LIKE_NEW: 'شبه جديد',
  USED: 'مستعمل',
  GOOD: 'جيد',
  FAIR: 'مقبول',
  REFURBISHED: 'مجدد / فحص',
}

export interface MapPartDetailOptions {
  now?: Date
}

export function formatPartYearRange(from?: number | null, to?: number | null): string | undefined {
  const hasFrom = typeof from === 'number' && !isNaN(from) && from > 0
  const hasTo = typeof to === 'number' && !isNaN(to) && to > 0

  if (hasFrom && hasTo) {
    if (from === to) return `${from}`
    return `من ${from} إلى ${to}`
  }
  if (hasFrom) return `من سنة ${from}`
  if (hasTo) return `حتى سنة ${to}`
  return undefined
}

export function mapPartImages(rawImages?: unknown): GalleryImage[] {
  if (!Array.isArray(rawImages) || rawImages.length === 0) {
    return []
  }

  return rawImages
    .map((img: unknown, idx: number) => {
      if (typeof img === 'string') {
        return {
          id: String(idx),
          url: img,
          order: idx,
          isPrimary: idx === 0,
        }
      }
      if (img && typeof img === 'object') {
        const item = img as Record<string, unknown>
        const url = typeof item.url === 'string' ? item.url : typeof item.path === 'string' ? item.path : ''
        return {
          id: String(item.id ?? idx),
          url,
          order: typeof item.order === 'number' ? item.order : idx,
          isPrimary: Boolean(item.isPrimary ?? (idx === 0)),
        }
      }
      return null
    })
    .filter((img): img is GalleryImage => Boolean(img && img.url))
    .sort((a, b) => {
      if (a.isPrimary && !b.isPrimary) return -1
      if (!a.isPrimary && b.isPrimary) return 1
      return (a.order ?? 0) - (b.order ?? 0)
    })
}

export function mapPartLocation(raw: Record<string, unknown>): LocationView {
  const govRef = raw.governorateRef as { nameAr?: string } | undefined
  const wilRef = raw.wilayaRef as { nameAr?: string } | undefined

  const governorateName = govRef?.nameAr || (typeof raw.governorate === 'string' ? raw.governorate : undefined)
  const wilayaName = wilRef?.nameAr || (typeof raw.city === 'string' ? raw.city : undefined)

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

  const lat = typeof raw.latitude === 'number' && !isNaN(raw.latitude) ? raw.latitude : undefined
  const lng = typeof raw.longitude === 'number' && !isNaN(raw.longitude) ? raw.longitude : undefined
  const hasCoordinates = Boolean(lat !== undefined && lng !== undefined && (lat !== 0 || lng !== 0))

  return {
    governorateName,
    wilayaName,
    fullLocationText,
    hasCoordinates,
    latitude: lat,
    longitude: lng,
  }
}

export function mapPartSeller(raw: Record<string, unknown>): SellerView {
  const seller = (raw.seller ?? raw.user) as Record<string, unknown> | undefined

  const id = typeof seller?.id === 'string' ? seller.id : typeof seller?.id === 'number' ? String(seller.id) : ''
  const name =
    typeof seller?.displayName === 'string' && seller.displayName.trim()
      ? seller.displayName.trim()
      : typeof seller?.name === 'string' && seller.name.trim()
      ? seller.name.trim()
      : typeof seller?.username === 'string' && seller.username.trim()
      ? seller.username.trim()
      : 'البائع'

  const username = typeof seller?.username === 'string' ? seller.username : ''
  const avatarUrl = typeof seller?.avatarUrl === 'string' && seller.avatarUrl.trim() ? seller.avatarUrl.trim() : undefined
  const isVerified = Boolean(seller?.isVerified)
  const memberSinceLabel =
    typeof seller?.createdAt === 'string' ? formatMemberSince(seller.createdAt) : 'عضو في سوق ون'
  const accountType = typeof seller?.accountType === 'string' ? seller.accountType : undefined

  return {
    id,
    name,
    username,
    avatarUrl,
    isVerified,
    memberSinceLabel,
    accountType,
  }
}

export function mapPartDetailViewModel(
  rawInput: unknown,
  options?: MapPartDetailOptions
): PartDetailViewModel {
  const raw = (rawInput && typeof rawInput === 'object' ? rawInput : {}) as Record<string, unknown>

  const id = String(raw.id ?? '')
  const version = typeof raw.version === 'number' ? raw.version : 1
  const rawStatus = typeof raw.status === 'string' ? raw.status.toUpperCase() : 'ACTIVE'
  const status: PartDetailViewModel['status'] =
    rawStatus === 'SOLD' ||
    rawStatus === 'RENTED' ||
    rawStatus === 'ARCHIVED' ||
    rawStatus === 'SUSPENDED' ||
    rawStatus === 'DRAFT'
      ? rawStatus
      : 'ACTIVE'

  const titleRaw = typeof raw.title === 'string' ? raw.title : typeof raw.partName === 'string' ? raw.partName : 'قطعة غيار'
  const title = stripMarkdown(titleRaw)
  const description = stripMarkdown(typeof raw.description === 'string' ? raw.description : '')

  // Part Category
  const partCategory = typeof raw.partCategory === 'string' ? raw.partCategory : 'OTHER'
  const foundCat = PART_CATEGORIES.find((c) => c.id.toUpperCase() === partCategory.toUpperCase())
  const partCategoryLabel = foundCat?.label ?? partCategory

  // Condition
  const condition = typeof raw.condition === 'string' ? raw.condition : 'USED'
  const foundCond = PART_CONDITIONS.find((c) => c.id.toUpperCase() === condition.toUpperCase())
  const conditionLabel = COND_LABELS[condition] ?? foundCond?.label ?? condition

  // Part Number
  const partNumber = typeof raw.partNumber === 'string' && raw.partNumber.trim() ? raw.partNumber.trim() : undefined

  // Originality
  const isOriginal = Boolean(raw.isOriginal)
  const originalityLabel = isOriginal ? 'أصلي وكالة' : 'تجاري / بديل'

  // Compatibility
  const rawMakes = Array.isArray(raw.compatibleMakes) ? raw.compatibleMakes : []
  const compatibleMakes = rawMakes.map((m) => String(m))
  const compatibleMakesLabels = compatibleMakes.map((m) => {
    if (m === 'all') return 'متوافق مع الجميع'
    const found = POPULAR_PART_MAKES.find((pm) => pm.id.toLowerCase() === m.toLowerCase())
    return found ? found.label : m
  })

  const rawModels = Array.isArray(raw.compatibleModels) ? raw.compatibleModels : []
  const compatibleModels = rawModels.map((m) => String(m))

  // Year range
  const yearFrom = typeof raw.yearFrom === 'number' && !isNaN(raw.yearFrom) ? raw.yearFrom : undefined
  const yearTo = typeof raw.yearTo === 'number' && !isNaN(raw.yearTo) ? raw.yearTo : undefined
  const yearRangeLabel = formatPartYearRange(yearFrom, yearTo)

  // Warranty
  const hasWarranty = Boolean(raw.hasWarranty)
  const warrantyDuration =
    typeof raw.warrantyDuration === 'string' && raw.warrantyDuration.trim()
      ? raw.warrantyDuration.trim()
      : undefined
  const warrantyDurationLabel = warrantyDuration
    ? WARRANTY_DURATION_LABELS[warrantyDuration] ?? warrantyDuration
    : hasWarranty
    ? 'يوجد ضمان'
    : 'بدون ضمان'

  // Quantity
  const quantity =
    typeof raw.quantity === 'string' && raw.quantity.trim() ? raw.quantity.trim() : undefined
  const quantityLabel = quantity ? QUANTITY_LABELS[quantity] ?? quantity : undefined

  // Compatible vehicle types
  const rawTypes = Array.isArray(raw.compatibleVehicleTypes) ? raw.compatibleVehicleTypes : []
  const compatibleVehicleTypes = rawTypes.map((t) => String(t))
  const compatibleVehicleTypesLabels = compatibleVehicleTypes.map(
    (t) => VEHICLE_TYPE_LABELS[t] ?? t
  )

  // Price
  const parsedPrice = parseDecimal(raw.price)
  const amount = parsedPrice !== undefined ? parsedPrice : 0
  const isPriceNegotiable = Boolean(raw.isPriceNegotiable)
  const price: PriceView = {
    amount,
    formattedAmount: formatNumberWestern(amount),
    currency: 'ر.ع',
    fullPriceLabel: amount > 0 ? formatDetailPrice(amount, 'ر.ع') : 'تواصل للسعر',
    isNegotiable: isPriceNegotiable,
    listingType: 'SALE',
  }

  // Images, location, seller
  const images = mapPartImages(raw.images ?? raw.existingImages)
  const location = mapPartLocation(raw)
  const seller = mapPartSeller(raw)

  const whatsappEnabled = Boolean(raw.whatsappEnabled)
  const postedAtLabel =
    typeof raw.createdAt === 'string' ? formatRelativeTimeAr(raw.createdAt, options?.now) : ''
  const viewCount = typeof raw.viewCount === 'number' && !isNaN(raw.viewCount) ? raw.viewCount : 0

  // Key Specs
  const keySpecs: SpecItemView[] = [
    { key: 'category', label: 'الفئة', value: partCategoryLabel, icon: 'grid-outline' },
    { key: 'condition', label: 'الحالة', value: conditionLabel, icon: 'construct-outline' },
    { key: 'originality', label: 'النوع', value: originalityLabel, icon: 'shield-checkmark-outline' },
  ]

  if (partNumber) {
    keySpecs.push({ key: 'partNumber', label: 'رقم القطعة', value: partNumber, icon: 'barcode-outline' })
  }
  if (hasWarranty) {
    keySpecs.push({ key: 'warranty', label: 'الضمان', value: warrantyDurationLabel, icon: 'ribbon-outline' })
  }
  if (quantityLabel) {
    keySpecs.push({ key: 'quantity', label: 'الكمية', value: quantityLabel, icon: 'cube-outline' })
  }
  if (yearRangeLabel) {
    keySpecs.push({ key: 'yearRange', label: 'الموديلات', value: yearRangeLabel, icon: 'calendar-outline' })
  }

  // Specs Sections
  const basicSectionItems: SpecItemView[] = [
    { key: 'category', label: 'فئة القطعة', value: partCategoryLabel },
    { key: 'condition', label: 'حالة القطعة', value: conditionLabel },
    { key: 'originality', label: 'نوع القطعة', value: originalityLabel },
  ]
  if (partNumber) {
    basicSectionItems.push({ key: 'partNumber', label: 'رقم القطعة الأصلي', value: partNumber })
  }
  if (quantityLabel) {
    basicSectionItems.push({ key: 'quantity', label: 'الكمية المتوفرة', value: quantityLabel })
  }
  basicSectionItems.push({ key: 'warranty', label: 'الضمان', value: warrantyDurationLabel })

  const specsSections: SpecSectionView[] = [
    { title: 'المواصفات الأساسية', items: basicSectionItems },
  ]

  // Compatibility Section
  const compatItems: SpecItemView[] = []
  if (compatibleMakesLabels.length > 0) {
    compatItems.push({
      key: 'makes',
      label: 'الماركات المتوافقة',
      value: compatibleMakesLabels.join('، '),
    })
  }
  if (compatibleModels.length > 0) {
    compatItems.push({
      key: 'models',
      label: 'الموديلات المتوافقة',
      value: compatibleModels.join('، '),
    })
  }
  if (yearRangeLabel) {
    compatItems.push({
      key: 'yearRange',
      label: 'سنوات الصنع المتوافقة',
      value: yearRangeLabel,
    })
  }
  if (compatibleVehicleTypesLabels.length > 0) {
    compatItems.push({
      key: 'vehicleTypes',
      label: 'أنواع المركبات المتوافقة',
      value: compatibleVehicleTypesLabels.join('، '),
    })
  }

  if (compatItems.length > 0) {
    specsSections.push({ title: 'التوافق والسيارات', items: compatItems })
  }

  return {
    id,
    version,
    status,
    title,
    description,
    listingType: 'SALE',
    condition,
    conditionLabel,
    price,
    images,
    location,
    seller,
    whatsappEnabled,
    postedAtLabel,
    viewCount,
    partCategory,
    partCategoryLabel,
    partNumber,
    isOriginal,
    originalityLabel,
    compatibleMakes,
    compatibleMakesLabels,
    compatibleModels,
    yearFrom,
    yearTo,
    yearRangeLabel,
    hasWarranty,
    warrantyDuration,
    warrantyDurationLabel,
    quantity,
    quantityLabel,
    compatibleVehicleTypes,
    compatibleVehicleTypesLabels,
    keySpecs,
    specsSections,
  }
}
