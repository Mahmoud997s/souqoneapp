import React from 'react'
import {
  ListingCardBase,
  ListingCardPill,
  ListingCardBadge,
} from '../ui/ListingCardBase'
import { UnifiedCardItem } from '../cards/UnifiedCard'

const SERVICE_TYPE_LABELS: Record<string, string> = {
  MAINTENANCE: 'صيانة',
  CLEANING: 'غسيل وتلميع',
  MODIFICATION: 'تعديل',
  INSPECTION: 'فحص',
  BODYWORK: 'سمكرة وصبغ',
  ACCESSORIES_INSTALL: 'إكسسوارات',
  KEYS_LOCKS: 'مفاتيح وأقفال',
  TOWING: 'ونش وإنقاذ',
  OTHER_SERVICE: 'أخرى',
}

const PROVIDER_TYPE_LABELS: Record<string, string> = {
  WORKSHOP: 'ورشة',
  INDIVIDUAL: 'فرد',
  MOBILE: 'خدمة متنقلة',
  COMPANY: 'شركة',
}

export interface ServiceCardProps {
  item: UnifiedCardItem
  onPress: () => void
  fullWidth?: boolean
  gridMode?: boolean
  disableImageSwipe?: boolean
}

export const ServiceCard = ({
  item,
  onPress,
  fullWidth = false,
  gridMode = false,
  disableImageSwipe = false,
}: ServiceCardProps) => {
  const displayImages = (item.images || [])
    .map((img: any) => (typeof img === 'string' ? img : img?.url))
    .filter(Boolean) as string[]

  const rawData = item.raw || {}
  const providerName = rawData.providerName || ''
  const providerType = rawData.providerType || ''
  const isHomeService = rawData.isHomeService || false
  const serviceType = rawData.serviceType || ''

  const serviceTypeLabel = SERVICE_TYPE_LABELS[serviceType] || serviceType
  const providerTypeLabel = PROVIDER_TYPE_LABELS[providerType] || providerType
  const workingHoursOpen = rawData.workingHoursOpen || ''
  const workingHoursClose = rawData.workingHoursClose || ''

  let priceLabel = 'تواصل للسعر'
  if (item.price && item.price > 0) {
    if (rawData.priceTo && rawData.priceTo > item.price) {
      priceLabel = `${item.price} - ${rawData.priceTo} ${item.currency === 'USD' ? '$' : 'ر.ع'}`
    } else {
      priceLabel = `من ${item.price} ${item.currency === 'USD' ? '$' : 'ر.ع'}`
    }
  } else if (item.priceText) {
    priceLabel = item.priceText
  }

  // Badges
  const badges: ListingCardBadge[] = []
  if (isHomeService) {
    badges.push({
      key: 'home',
      label: 'خدمة متنقلة',
      backgroundColor: '#10b981',
      iconName: 'home',
    })
  }
  if (serviceTypeLabel) {
    badges.push({
      key: 'type',
      label: serviceTypeLabel,
      backgroundColor: '#3b82f6',
    })
  }

  // Pills
  const pills: ListingCardPill[] = []
  if (providerName) {
    pills.push({
      key: 'provider',
      label: providerName,
      iconName: 'business-outline',
      variant: 'neutral',
    })
  }
  if (providerTypeLabel) {
    pills.push({
      key: 'providerType',
      label: providerTypeLabel,
      iconName: 'person-outline',
      variant: 'blue',
    })
  }
  if (workingHoursOpen && workingHoursClose) {
    pills.push({
      key: 'hours',
      label: `${workingHoursOpen} - ${workingHoursClose}`,
      iconName: 'time-outline',
      variant: 'neutral',
    })
  }

  return (
    <ListingCardBase
      item={item}
      title={item.title}
      priceLabel={priceLabel}
      location={item.governorate || ''}
      onPress={onPress}
      displayImages={displayImages}
      placeholderIcon="build"
      pills={pills}
      badges={badges}
      fullWidth={fullWidth}
      gridMode={gridMode}
      disableImageSwipe={disableImageSwipe}
      titleNumberOfLines={2}
      favoriteType="CAR_SERVICE"
      shareMessage={`شاهد هذه الخدمة على سوق ون: ${item.title}\nالمزود: ${providerName}\nhttps://souqone.app/services/${item.id}`}
    />
  )
}
