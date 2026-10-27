import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { Colors } from '../../../constants/colors'
import { Spacing } from '../../../constants/spacing'
import { Radius } from '../../../constants/radius'
import {
  ListingCardBase,
  ListingCardPill,
  ListingCardBadge,
} from '../../../components/ui/ListingCardBase'
import { useListingContact } from '../../../hooks/listing-detail/useListingContact'
import { resolveContactEntityType } from '../../../utils/contactEntityType'
import type { UnifiedCardItem } from '../../../components/cards/UnifiedCard'

export interface PartFavoriteCardAdapterProps {
  item: UnifiedCardItem
  onPress?: () => void
  onFavorite?: (isFav: boolean) => void
}

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  parts: 'settings-outline',
  services: 'build-outline',
  equipment: 'construct-outline',
  cars: 'car-outline',
  buses: 'bus-outline',
  jobs: 'briefcase-outline',
}

const TYPE_LABELS: Record<string, string> = {
  SALE: 'للبيع',
  RENTAL: 'للإيجار',
  WANTED: 'مطلوب',
  PART: 'قطعة',
  SERVICE: 'خدمة',
}

const CONDITION_LABELS: Record<string, string> = {
  NEW: 'جديد',
  LIKE_NEW: 'شبه جديد',
  USED: 'مستعمل',
  GOOD: 'جيد',
  FAIR: 'مقبول',
  POOR: 'ضعيف',
  REFURBISHED: 'مجدد',
}

/**
 * PartFavoriteCardAdapter
 * Adapter rendering ListingCardBase with fullWidth={true} for parts & services cards
 * inside the favorites screen (app/profile/favorites.tsx), ensuring parity with CarCard.
 */
export function PartFavoriteCardAdapter({
  item,
  onPress,
  onFavorite,
}: PartFavoriteCardAdapterProps) {
  const rawData = (item.raw ?? {}) as Record<string, unknown>
  const rawImages: unknown[] =
    item.images && item.images.length > 0
      ? item.images
      : Array.isArray(rawData.images) && rawData.images.length > 0
      ? (rawData.images as unknown[])
      : typeof rawData.imageUrl === 'string'
      ? [rawData.imageUrl]
      : typeof rawData.image === 'string'
      ? [rawData.image]
      : []

  const displayImages = (rawImages as unknown[])
    .map((img) =>
      typeof img === 'string'
        ? img
        : (img as { url?: string; path?: string } | undefined)?.url ||
          (img as { url?: string; path?: string } | undefined)?.path
    )
    .filter((img): img is string => Boolean(img))
    .slice(0, 5)

  const isPremium = Boolean(item.isPremium || item.isElite)
  const condLabel =
    CONDITION_LABELS[item.condition?.toUpperCase() ?? ''] || item.condition
  const typeLabel = item.listingType
    ? TYPE_LABELS[item.listingType.toUpperCase()]
    : undefined

  let priceLabel = 'تواصل للسعر'
  if (item.priceText) {
    priceLabel = item.priceText
  } else if (item.price && item.price > 0) {
    const curr =
      item.currency === 'OMR' || item.currency === '?.?.' || !item.currency
        ? 'ر.ع.'
        : item.currency
    priceLabel = `${item.price.toLocaleString('en-US')} ${curr}${
      item.priceLabel ? ` / ${item.priceLabel}` : ''
    }`
  }

  const badges: ListingCardBadge[] = []
  if (isPremium) {
    badges.push({
      key: 'premium',
      label: 'مميز',
      backgroundColor: Colors.accent,
      iconName: 'star',
    })
  }
  if (typeLabel) {
    badges.push({
      key: 'type',
      label: typeLabel,
      backgroundColor: Colors.primaryDark,
    })
  }

  const pills: ListingCardPill[] = []
  if (condLabel) {
    pills.push({
      key: 'cond',
      label: condLabel,
      variant: 'amber',
    })
  }
  if (item.details && item.details.length > 0) {
    item.details.slice(0, 3).forEach((d, idx) => {
      pills.push({
        key: `detail-${idx}`,
        label: d.value,
        iconName: d.icon,
        variant: 'neutral',
      })
    })
  }

  const entityType = resolveContactEntityType(item.category, item)
  const contact = useListingContact(
    entityType,
    item.id,
    item.href || (item.category ? `/${item.category}/${item.id}` : `/listings/${item.id}`),
    item.title
  )
  const hasWhatsapp = item.whatsappEnabled === true || item.raw?.whatsappEnabled === true

  const handlePress = () => {
    if (onPress) {
      onPress()
      return
    }
    if (item.href) {
      router.push(item.href as Parameters<typeof router.push>[0])
      return
    }
    const cat = item.category || 'listings'
    const routeBase = cat === 'cars' ? 'cars' : cat === 'real_estate' ? 'listings' : cat
    router.push(`/${routeBase}/${item.id}` as Parameters<typeof router.push>[0])
  }

  const renderCardActions = () => (
    <View style={s.cardActionsRow}>
      <TouchableOpacity
        style={s.actionBtnCall}
        onPress={(e) => {
          e?.stopPropagation?.()
          contact.call()
        }}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="اتصال هاتفي"
        testID="part-favorite-call-btn"
      >
        <Ionicons name="call-outline" size={16} color={Colors.primary} />
        <Text style={s.actionBtnCallText}>اتصال</Text>
      </TouchableOpacity>

      {hasWhatsapp ? (
        <TouchableOpacity
          style={s.actionBtnWhatsapp}
          onPress={(e) => {
            e?.stopPropagation?.()
            contact.whatsApp()
          }}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="محادثة واتساب"
          testID="part-favorite-whatsapp-btn"
        >
          <Ionicons name="logo-whatsapp" size={16} color={Colors.success} />
          <Text style={s.actionBtnWhatsappText}>واتساب</Text>
        </TouchableOpacity>
      ) : null}

      <TouchableOpacity
        style={s.actionBtnChatWrapper}
        onPress={(e) => {
          e?.stopPropagation?.()
          contact.chat()
        }}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="محادثة فورية"
        testID="part-favorite-chat-btn"
      >
        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.actionBtnChat}
        >
          <Ionicons name="chatbubble-outline" size={16} color={Colors.white} />
          <Text style={s.actionBtnChatText}>محادثة</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  )

  return (
    <ListingCardBase
      item={item}
      title={item.title}
      priceLabel={priceLabel}
      location={item.governorate}
      onPress={handlePress}
      onFavorite={onFavorite}
      displayImages={displayImages}
      imageCount={
        item.imageCount ||
        item.raw?.imageCount ||
        item.raw?._count?.images ||
        displayImages.length
      }
      placeholderIcon={CATEGORY_ICONS[item.category ?? 'parts'] || 'settings-outline'}
      pills={pills}
      badges={badges}
      isSellerVerified={item.isVerified}
      cardActions={renderCardActions()}
      fullWidth={true}
      titleNumberOfLines={2}
      favoriteType={entityType}
    />
  )
}

const s = StyleSheet.create({
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space2,
    marginTop: Spacing.space2,
    paddingTop: Spacing.space2,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionBtnCall: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 38,
    paddingHorizontal: Spacing.space3,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionBtnCallText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.text,
  },
  actionBtnWhatsapp: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 38,
    paddingHorizontal: Spacing.space3,
    borderRadius: Radius.pill,
    backgroundColor: Colors.paleMint,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionBtnWhatsappText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.primaryDeep,
  },
  actionBtnChatWrapper: {
    flex: 1,
  },
  actionBtnChat: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 38,
    borderRadius: Radius.pill,
  },
  actionBtnChatText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.white,
  },
})
