import React from 'react'
import { Listing } from '../../types/listing.types'
import {
  ListingCardBase,
  ListingCardPill,
  ListingCardBadge,
} from '../ui/ListingCardBase'

const BUS_TYPE_NAMES: Record<string, string> = {
  MINI_BUS: 'ميني باص',
  MEDIUM_BUS: 'حافلة متوسطة',
  LARGE_BUS: 'حافلة كبيرة',
  COASTER: 'كوستر',
  SCHOOL_BUS: 'حافلة مدرسية',
}

export interface BusCardProps {
  item: Listing
  onPress: () => void
  fullWidth?: boolean
  gridMode?: boolean
  showChips?: boolean
  maxChips?: number
  actionMenu?: React.ReactNode
  disableImageSwipe?: boolean
}

export const BusCard = ({
  item,
  onPress,
  fullWidth = false,
  gridMode = false,
  showChips = false,
  maxChips = 3,
  actionMenu,
  disableImageSwipe = false,
}: BusCardProps) => {
  const rawData = (item as any).raw || item
  const rawImages = (item.images && item.images.length > 0)
    ? item.images
    : (rawData.images || [])
  const displayImages = rawImages
    .map((img: any) => (typeof img === 'string' ? img : img?.url))
    .filter(Boolean) as string[]

  const imageCount =
    (item as any).imageCount ||
    rawData.imageCount ||
    rawData._count?.images ||
    displayImages.length

  const listingTypeStr = String(item.listingType || (item as any).type || '')
  const isRental = listingTypeStr === 'BUS_RENT' || listingTypeStr === 'RENTAL'
  const isSale = listingTypeStr === 'BUS_SALE' || listingTypeStr === 'SALE'

  const isSellerVerified =
    (item as any).isVerified ??
    rawData.user?.isVerified ??
    rawData.seller?.isVerified ??
    false

  // Price Calculation
  let priceLabel = `${item.price} ${item.currency === 'USD' ? '$' : 'ر.ع'}`
  if ((item as any).priceText) {
    priceLabel = (item as any).priceText
  } else if (!item.price && !rawData.price && !rawData.dailyPrice && !rawData.monthlyPrice) {
    priceLabel = 'تواصل للسعر'
  } else {
    const p =
      item.price ||
      rawData.price ||
      rawData.dailyPrice ||
      rawData.monthlyPrice ||
      rawData.budgetMax
    priceLabel = `${p} ${item.currency === 'USD' ? '$' : 'ر.ع'}`
    if (isRental) {
      if ((item as any).priceLabel) {
        priceLabel += ` / ${(item as any).priceLabel}`
      } else if (rawData.dailyPrice) {
        priceLabel = `${rawData.dailyPrice} ${item.currency === 'USD' ? '$' : 'ر.ع'} / يوم`
      } else if (rawData.monthlyPrice) {
        priceLabel = `${rawData.monthlyPrice} ${item.currency === 'USD' ? '$' : 'ر.ع'} / شهر`
      }
    }
  }

  // Specifications
  const make = rawData.make || rawData.bus?.make || rawData.details?.make
  const yearData = rawData.year || rawData.bus?.year || rawData.details?.year
  const mileageData = rawData.mileage || rawData.bus?.mileage || rawData.details?.mileage
  const busCapacity =
    rawData.capacity ||
    rawData.bus?.capacity ||
    rawData.details?.capacity ||
    (item as any).details?.capacity
  const busTypeRaw =
    rawData.busType ||
    rawData.bus?.busType ||
    rawData.details?.busType ||
    (item as any).details?.busType
  const condition =
    rawData.condition ||
    rawData.bus?.condition ||
    rawData.details?.condition ||
    (item as any).details?.condition

  const transRaw =
    rawData.transmission || rawData.bus?.transmission || rawData.details?.transmission
  const transLabel =
    transRaw === 'AUTOMATIC' ? 'أوتوماتيك' : transRaw === 'MANUAL' ? 'عادي' : transRaw

  const year = yearData ? String(yearData) : 'N/A'
  const mileage = mileageData ? `${Number(mileageData).toLocaleString('en-US')} كم` : ''
  const busTypeLabel = busTypeRaw ? BUS_TYPE_NAMES[busTypeRaw] || busTypeRaw : ''

  const busName =
    item.title ||
    (make
      ? `${make} ${busCapacity ? busCapacity + ' مقعد' : ''} ${year !== 'N/A' ? year : ''}`.trim()
      : 'إعلان حافلة')

  // Badges
  const badges: ListingCardBadge[] = []
  if (isRental) {
    badges.push({
      key: 'rental',
      label: 'إيجار',
      backgroundColor: '#FFCC00',
      textColor: '#000000',
    })
  }
  if (listingTypeStr === 'BUS_SALE_WITH_CONTRACT') {
    badges.push({
      key: 'contract',
      label: 'بيع مع عقد تشغيل',
      backgroundColor: '#8b5cf6',
      borderColor: 'rgba(255,255,255,0.3)',
      iconName: 'document-text',
    })
  }
  if (isRental && item.withDriver) {
    badges.push({
      key: 'driver',
      label: 'مع سائق',
      backgroundColor: '#10b981',
      iconName: 'person',
    })
  }
  if (isSale && condition === 'NEW') {
    badges.push({
      key: 'new',
      label: 'جديدة',
      backgroundColor: '#3b82f6',
    })
  }
  if (isSale && condition === 'USED') {
    badges.push({
      key: 'used',
      label: 'مستعملة',
      backgroundColor: '#64748b',
    })
  }
  if (item.isPremium) {
    badges.push({
      key: 'premium',
      label: 'مميز',
      backgroundColor: '#ef4444',
      iconName: 'star',
    })
  }

  // Pills
  const pills: ListingCardPill[] = []
  if (busTypeLabel) {
    pills.push({
      key: 'type',
      label: busTypeLabel,
      iconName: 'bus-outline',
      variant: 'neutral',
    })
  }
  if (year !== 'N/A') {
    pills.push({
      key: 'year',
      label: year,
      iconName: 'calendar-outline',
      variant: 'blue',
    })
  }
  if (transLabel) {
    pills.push({
      key: 'trans',
      label: transLabel,
      iconName: 'car-shift-pattern',
      iconFamily: 'MaterialCommunityIcons',
      variant: 'neutral',
    })
  }
  if (mileage) {
    pills.push({
      key: 'mileage',
      label: mileage,
      iconName: 'speedometer-outline',
      variant: 'amber',
    })
  }
  if (busCapacity) {
    pills.push({
      key: 'cap',
      label: `${busCapacity} مقعد`,
      iconName: 'people-outline',
      variant: 'neutral',
    })
  }

  return (
    <ListingCardBase
      item={item}
      title={busName}
      priceLabel={priceLabel}
      isPriceNegotiable={Boolean(isSale && item.isPriceNegotiable)}
      onPress={onPress}
      displayImages={displayImages}
      imageCount={imageCount}
      placeholderIcon="bus-outline"
      pills={pills}
      badges={badges}
      maxChips={maxChips}
      isSellerVerified={isSellerVerified}
      status={rawData.status}
      fullWidth={fullWidth}
      gridMode={gridMode}
      actionMenu={actionMenu}
      disableImageSwipe={disableImageSwipe}
      shareMessage={`شاهد هذه الحافلة المعروضة على سوق ون: ${busName}\nالسعر: ${priceLabel}\nhttps://souqone.app/listings/${item.id}`}
    />
  )
}
