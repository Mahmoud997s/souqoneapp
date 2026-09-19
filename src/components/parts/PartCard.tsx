import React from 'react'
import {
  ListingCardBase,
  ListingCardPill,
  ListingCardBadge,
} from '../ui/ListingCardBase'
import { formatLocation } from '../../utils/mappers'
import {
  POPULAR_PART_MAKES,
  WARRANTY_DURATION_LABELS,
  VEHICLE_TYPE_LABELS,
} from '../../constants/parts'
import { useBrands } from '../../hooks/useCars'

export interface PartCardProps {
  item: any
  onPress: () => void
  fullWidth?: boolean
  gridMode?: boolean
  showChips?: boolean
  maxChips?: number
  actionMenu?: React.ReactNode
  disableImageSwipe?: boolean
}

const CATEGORY_MAP: Record<string, string> = {
  ENGINE: 'محرك وملحقاته',
  BODY: 'الهيكل والبودي',
  ELECTRICAL: 'كهرباء وإلكترونيات',
  SUSPENSION: 'مساعدات ونظام تعليق',
  BRAKES: 'فرامل ومكابح',
  INTERIOR: 'مقصورة وداخلية',
  TIRES: 'إطارات وجنوط',
  BATTERIES: 'بطاريات',
  OILS: 'زيوت وفلاتر',
  ACCESSORIES: 'إكسسوارات وزينة',
  OTHER: 'أخرى',
}

const CONDITION_MAP: Record<string, string> = {
  NEW: 'جديد',
  LIKE_NEW: 'شبه جديد',
  USED: 'مستعمل',
  REFURBISHED: 'مجدد',
  GOOD: 'جيد',
  FAIR: 'مقبول',
}

export const PartCard: React.FC<PartCardProps> = ({
  item,
  onPress,
  fullWidth = false,
  gridMode = false,
  showChips = false,
  maxChips = 3,
  actionMenu,
  disableImageSwipe = false,
}) => {
  const rawData = item.raw || item
  const { data: brands } = useBrands()

  // Images
  const displayImages = (rawData.images || item.images || [])
    .map((img: any) => (typeof img === 'string' ? img : img?.url || img?.path))
    .filter(Boolean) as string[]

  // Seller verification
  const isSellerVerified =
    item.isVerified ??
    rawData.isVerified ??
    rawData.user?.isVerified ??
    rawData.seller?.isVerified ??
    false

  // Title
  const partTitle =
    item.title ||
    rawData.title ||
    rawData.partName ||
    (rawData.brand ? `قطعة ${rawData.brand}` : 'قطعة غيار')

  // Price formatting
  const rawPrice = rawData.price ?? item.price
  const priceNum = parseFloat(String(rawPrice ?? '0'))
  const currency = rawData.currency === 'USD' || item.currency === 'USD' ? '$' : 'ر.ع'
  let priceLabel = 'تواصل للسعر'
  if (priceNum > 0) {
    priceLabel = `${priceNum.toLocaleString('en-US')} ${currency}`
  } else if (item.priceText) {
    priceLabel = item.priceText
  }

  const isPriceNegotiable = Boolean(rawData.isPriceNegotiable ?? item.isPriceNegotiable)

  // Category
  const rawCategory = rawData.partCategory || rawData.category || item.partCategory
  const categoryLabel = CATEGORY_MAP[rawCategory] || rawCategory || ''

  // Condition
  const rawCondition = String(rawData.condition || item.condition || '').toUpperCase()
  const conditionLabel = CONDITION_MAP[rawCondition] || rawCondition

  // Originality
  const isOriginal = rawData.isOriginal ?? item.isOriginal

  // Part Number
  const partNumber = rawData.partNumber || item.partNumber

  // Compatibility (Makes, Models, Years)
  const makes: string[] = Array.isArray(rawData.compatibleMakes)
    ? rawData.compatibleMakes
    : rawData.brand
    ? [rawData.brand]
    : []
  const makeLabels = makes
    .map((m) => {
      if (m === 'all') return 'متوافق مع الجميع'
      const foundApi = brands?.find((b) => b.id === m)
      if (foundApi) return foundApi.nameAr || foundApi.name
      const foundLocal = POPULAR_PART_MAKES.find((pm) => pm.id === m)
      return foundLocal ? foundLocal.label : m
    })
    .filter(Boolean)

  const compatibleModels =
    typeof rawData.compatibleModels === 'string'
      ? rawData.compatibleModels
      : Array.isArray(rawData.compatibleModels)
      ? rawData.compatibleModels.join('، ')
      : ''

  const yearFrom = rawData.yearFrom || item.yearFrom
  const yearTo = rawData.yearTo || item.yearTo
  let yearRange = ''
  if (yearFrom && yearTo) {
    yearRange = `${yearFrom} - ${yearTo}`
  } else if (yearFrom) {
    yearRange = `من ${yearFrom}`
  } else if (yearTo) {
    yearRange = `حتى ${yearTo}`
  }

  // Location
  const location = item.governorate
    ? item.governorate
    : formatLocation(rawData) || 'موقع غير محدد'

  // Badges
  const badges: ListingCardBadge[] = []
  if (isOriginal === true) {
    badges.push({
      key: 'orig',
      label: 'أصلي وكالة',
      backgroundColor: '#ea580c',
      iconName: 'shield-checkmark',
    })
  } else if (isOriginal === false) {
    badges.push({
      key: 'commercial',
      label: 'تجاري / بديل',
      backgroundColor: '#475569',
    })
  }

  if (rawCondition === 'NEW') {
    badges.push({ key: 'new', label: 'جديد', backgroundColor: '#10b981' })
  } else if (rawCondition === 'LIKE_NEW') {
    badges.push({ key: 'like_new', label: 'شبه جديد', backgroundColor: '#14b8a6' })
  } else if (rawCondition === 'USED') {
    badges.push({ key: 'used', label: 'مستعمل', backgroundColor: '#64748b' })
  } else if (rawCondition === 'REFURBISHED') {
    badges.push({ key: 'refurbished', label: 'مجدد', backgroundColor: '#d97706' })
  }

  if (rawData.isPremium || item.isPremium) {
    badges.push({
      key: 'premium',
      label: 'مميز',
      backgroundColor: '#ef4444',
      iconName: 'star',
    })
  }

  // Pills
  const pills: ListingCardPill[] = []
  if (categoryLabel) {
    pills.push({
      key: 'cat',
      label: categoryLabel,
      iconName: 'grid-outline',
      variant: 'neutral',
    })
  }
  if (partNumber) {
    pills.push({
      key: 'partNo',
      label: partNumber,
      iconName: 'barcode-outline',
      variant: 'blue',
    })
  }
  if (makeLabels.length > 0) {
    pills.push({
      key: 'makes',
      label: makeLabels.slice(0, 2).join('، '),
      iconName: 'car-outline',
      variant: 'neutral',
    })
  }
  if (compatibleModels) {
    pills.push({
      key: 'models',
      label: compatibleModels,
      iconName: 'car-sport-outline',
      variant: 'neutral',
    })
  }
  if (yearRange) {
    pills.push({
      key: 'year',
      label: yearRange,
      iconName: 'calendar-outline',
      variant: 'blue',
    })
  }
  if (conditionLabel) {
    pills.push({
      key: 'cond',
      label: conditionLabel,
      iconName: 'information-circle-outline',
      variant: 'amber',
    })
  }
  if (rawData.hasWarranty ?? item.hasWarranty) {
    const duration = rawData.warrantyDuration ?? item.warrantyDuration
    pills.push({
      key: 'warranty',
      label: duration ? (WARRANTY_DURATION_LABELS[duration] ?? 'ضمان') : 'يوجد ضمان',
      iconName: 'shield-checkmark-outline',
      variant: 'green',
    })
  }
  const vehicleTypes = rawData.compatibleVehicleTypes ?? item.compatibleVehicleTypes
  if (Array.isArray(vehicleTypes) && vehicleTypes.length > 0) {
    const typeLabels = vehicleTypes.map((t: string) => VEHICLE_TYPE_LABELS[t] ?? t)
    pills.push({
      key: 'vehTypes',
      label: typeLabels.join('، '),
      iconName: 'construct-outline',
      variant: 'neutral',
    })
  }

  return (
    <ListingCardBase
      item={item}
      title={partTitle}
      priceLabel={priceLabel}
      isPriceNegotiable={isPriceNegotiable}
      location={location}
      onPress={onPress}
      displayImages={displayImages}
      placeholderIcon="construct-outline"
      pills={pills}
      badges={badges}
      maxChips={maxChips}
      isSellerVerified={isSellerVerified}
      status={rawData.status}
      fullWidth={fullWidth}
      gridMode={gridMode}
      actionMenu={actionMenu}
      disableImageSwipe={disableImageSwipe}
      titleNumberOfLines={2}
      favoriteType="SPARE_PART"
      shareMessage={`شاهد هذه القطعة المعروضة على سوق ون: ${partTitle}\nالسعر: ${priceLabel}\nhttps://souqone.app/parts/${rawData.id || item.id}`}
    />
  )
}
