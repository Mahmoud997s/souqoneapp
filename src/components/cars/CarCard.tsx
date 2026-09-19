import React from 'react'
import { Listing } from '../../types/listing.types'
import {
  ListingCardBase,
  ListingCardPill,
  ListingCardBadge,
} from '../ui/ListingCardBase'

export interface CarCardProps {
  item: Listing
  onPress: () => void
  fullWidth?: boolean
  gridMode?: boolean
  showChips?: boolean
  maxChips?: number
  actionMenu?: React.ReactNode
  disableImageSwipe?: boolean
}

export const CarCard = ({
  item,
  onPress,
  fullWidth = false,
  gridMode = false,
  showChips = false,
  maxChips = 3,
  actionMenu,
  disableImageSwipe = false,
}: CarCardProps) => {
  const displayImages = (item.images || [])
    .map((img: any) => (typeof img === 'string' ? img : img?.url))
    .filter(Boolean) as string[]

  const listingTypeStr = String(item.listingType || (item as any).type || '')
  const isRental = listingTypeStr === 'RENTAL' || listingTypeStr === 'EQUIPMENT_RENT'
  const isSale = listingTypeStr === 'SALE' || listingTypeStr === 'EQUIPMENT_SALE'

  const rawData = (item as any).raw || item
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
    } else if (listingTypeStr === 'EQUIPMENT_WANTED' && rawData.budgetMax) {
      priceLabel = `الميزانية: ${rawData.budgetMax} ${item.currency === 'USD' ? '$' : 'ر.ع'}`
    }
  }

  // Specifications
  const make = rawData.make || rawData.car?.make || rawData.details?.make
  const model = rawData.model || rawData.car?.model || rawData.details?.model
  const yearData = rawData.year || rawData.car?.year || rawData.details?.year
  const mileageData = rawData.mileage || rawData.car?.mileage || rawData.details?.mileage

  const transRaw =
    rawData.transmission || rawData.car?.transmission || rawData.details?.transmission
  const transLabel =
    transRaw === 'AUTOMATIC' ? 'أوتوماتيك' : transRaw === 'MANUAL' ? 'عادي' : transRaw

  const year = yearData ? String(yearData) : 'N/A'
  const mileage = mileageData ? `${Number(mileageData).toLocaleString('en-US')} كم` : ''

  const isEquipment =
    listingTypeStr.startsWith('EQUIPMENT') ||
    (item as any).category === 'equipment' ||
    rawData.category === 'equipment'
  const hoursUsedData =
    rawData.hoursUsed || rawData.details?.hoursUsed || (item as any).details?.hoursUsed
  const eqCondition =
    rawData.condition || rawData.details?.condition || (item as any).details?.condition
  const equipmentConditionLabel =
    eqCondition === 'NEW'
      ? 'جديدة'
      : eqCondition === 'USED'
      ? 'مستعملة'
      : eqCondition === 'LIKE_NEW'
      ? 'شبه جديدة'
      : eqCondition === 'REFURBISHED'
      ? 'مجددة'
      : eqCondition

  const carName =
    item.title ||
    (make && model
      ? `${make} ${model} ${year !== 'N/A' ? year : ''}`.trim()
      : 'إعلان بدون عنوان')

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
  if (isRental && item.withDriver) {
    badges.push({
      key: 'driver',
      label: 'مع سائق',
      backgroundColor: '#10b981',
      iconName: 'person',
    })
  }
  if (isSale && item.condition === 'NEW') {
    badges.push({
      key: 'new',
      label: 'جديد',
      backgroundColor: '#3b82f6',
    })
  }
  if (isSale && item.condition === 'LIKE_NEW') {
    badges.push({
      key: 'like_new',
      label: 'شبه جديد',
      backgroundColor: '#14b8a6',
    })
  }
  if (isSale && item.condition === 'USED') {
    badges.push({
      key: 'used',
      label: 'مستعمل',
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
  if (isEquipment) {
    if (make) {
      pills.push({
        key: 'make',
        label: make,
        iconName: 'construct-outline',
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
    if (hoursUsedData) {
      pills.push({
        key: 'hours',
        label: `${hoursUsedData} س`,
        iconName: 'time-outline',
        variant: 'neutral',
      })
    }
    if (equipmentConditionLabel) {
      pills.push({
        key: 'cond',
        label: equipmentConditionLabel,
        iconName: 'information-circle-outline',
        variant: 'amber',
      })
    }
  } else {
    if (model) {
      pills.push({
        key: 'model',
        label: model,
        iconName: 'car-outline',
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
  }

  return (
    <ListingCardBase
      item={item}
      title={carName}
      priceLabel={priceLabel}
      isPriceNegotiable={Boolean(isSale && item.isPriceNegotiable)}
      onPress={onPress}
      displayImages={displayImages}
      placeholderIcon="car-sport"
      pills={pills}
      badges={badges}
      maxChips={maxChips}
      isSellerVerified={isSellerVerified}
      status={rawData.status}
      fullWidth={fullWidth}
      gridMode={gridMode}
      actionMenu={actionMenu}
      disableImageSwipe={disableImageSwipe}
      shareMessage={`شاهد هذه السيارة المعروضة على سوق ون: ${carName}\nالسعر: ${priceLabel}\nhttps://souqone.app/listings/${item.id}`}
    />
  )
}
