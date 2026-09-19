import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Pressable,
  Platform,
  Share,
} from 'react-native'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { BlurView } from 'expo-blur'
import { useRouter } from 'expo-router'
import { useQueryClient } from '@tanstack/react-query'
import { Colors } from '../../constants/colors'
import { Radius } from '../../constants/radius'
import { CardSystem } from '../../constants/cardSystem'
import { useAuthStore } from '../../store/authStore'
import { favoritesApi } from '../../api/favorites'
import { formatDate } from '../../utils/format'
import { resolveListingLocation } from '../../utils/listingLocation'
import { CardImageSwiper } from './CardImageSwiper'

export interface ListingCardPill {
  key: string
  label: string
  iconName?: string
  iconFamily?: 'Ionicons' | 'MaterialCommunityIcons'
  variant?: 'neutral' | 'blue' | 'amber' | 'green' | 'red' | 'orange'
  textColor?: string
}

export interface ListingCardBadge {
  key: string
  label: string
  backgroundColor: string
  textColor?: string
  iconName?: string
  borderColor?: string
}

export interface ListingCardBaseProps {
  item: any
  title: string
  priceLabel: string
  isPriceNegotiable?: boolean
  location?: string
  onPress: () => void
  displayImages?: string[]
  imageCount?: number
  placeholderIcon?: string
  pills?: ListingCardPill[]
  badges?: ListingCardBadge[]
  customBadges?: React.ReactNode
  maxChips?: number
  isSellerVerified?: boolean
  isSold?: boolean
  status?: string
  fullWidth?: boolean
  gridMode?: boolean
  actionMenu?: React.ReactNode
  cardActions?: React.ReactNode
  disableImageSwipe?: boolean
  shareMessage?: string
  titleNumberOfLines?: number
  imageHeight?: number
  favoriteType?: string
  onFavorite?: (isFav: boolean) => void
  style?: any
}

export const ListingCardBase = ({
  item,
  title,
  priceLabel,
  isPriceNegotiable = false,
  location,
  onPress,
  displayImages = [],
  imageCount,
  placeholderIcon = 'car-sport',
  pills = [],
  badges = [],
  customBadges,
  maxChips = 3,
  isSellerVerified = false,
  isSold = false,
  status = 'ACTIVE',
  fullWidth = false,
  gridMode = false,
  actionMenu,
  cardActions,
  disableImageSwipe = false,
  shareMessage,
  titleNumberOfLines = 1,
  imageHeight,
  favoriteType = 'LISTING',
  onFavorite,
  style,
}: ListingCardBaseProps) => {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { isLoggedIn } = useAuthStore()

  const [isFav, setIsFav] = useState(Boolean(item?.isFavorite))
  const [cardWidth, setCardWidth] = useState(0)

  const resolvedLocation = location !== undefined ? location : resolveListingLocation(item)
  const rawStatus = status || item?.status || 'ACTIVE'
  const isActuallySold = isSold || rawStatus === 'SOLD'

  const effectiveImageCount =
    imageCount ??
    item?.imageCount ??
    item?.raw?.imageCount ??
    item?.raw?._count?.images ??
    (displayImages.length > 0 ? displayImages.length : undefined)

  const handleFavorite = async () => {
    if (!isLoggedIn) {
      router.push('/(auth)/login' as any)
      return
    }

    const nextFav = !isFav
    setIsFav(nextFav)
    onFavorite?.(nextFav)

    try {
      const targetId = item.id || item.raw?.id
      await favoritesApi.add((favoriteType || 'LISTING') as any, targetId)
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
    } catch (err: any) {
      console.log('Error toggling favorite:', err?.response?.data || err.message || err)
      setIsFav((prev) => !prev)
    }
  }

  const handleShare = async () => {
    try {
      await Share.share({
        message:
          shareMessage ||
          `شاهد هذا الإعلان على سوق ون: ${title}\nالسعر: ${priceLabel}\nhttps://souqone.app/listings/${item.id}`,
      })
    } catch (error) {
      console.log('Error sharing listing:', error)
    }
  }

  const imageContainerHeight = imageHeight
    ? imageHeight
    : fullWidth
    ? CardSystem.fullWidthHeight
    : CardSystem.aspectRatioHeight

  return (
    <View
      style={[
        s.card,
        fullWidth && { width: '100%' },
        gridMode && { width: '100%', flex: 1 },
        style,
      ]}
    >
      {/* ── IMAGE SECTION ── */}
      <View
        style={[
          s.imageContainer,
          imageHeight ? { height: imageHeight, aspectRatio: undefined } : undefined,
        ]}
        onLayout={(e) => setCardWidth(e.nativeEvent.layout.width)}
      >
        {displayImages.length > 0 ? (
          <CardImageSwiper
            images={displayImages}
            imageCount={effectiveImageCount}
            cardWidth={cardWidth}
            imageHeight={imageHeight}
            fullWidth={fullWidth}
            disableImageSwipe={disableImageSwipe}
            onPress={onPress}
          />
        ) : (
          <Pressable
            onPress={onPress}
            style={[
              s.imagePlaceholder,
              imageHeight ? { height: imageHeight, aspectRatio: undefined } : undefined,
              fullWidth && { height: CardSystem.fullWidthHeight, aspectRatio: undefined },
            ]}
          >
            <Ionicons
              name={placeholderIcon as any}
              size={40}
              color={Colors.borderStrong}
            />
          </Pressable>
        )}

        {/* Action Buttons (Share & Favorite) */}
        <View style={s.actionsContainer}>
          <TouchableOpacity
            style={s.actionBtn}
            onPress={handleShare}
            activeOpacity={0.8}
          >
            <Ionicons name="share-social" size={16} color={Colors.white} />
          </TouchableOpacity>
          <TouchableOpacity
            style={s.actionBtn}
            onPress={handleFavorite}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isFav ? 'heart' : 'heart-outline'}
              size={16}
              color={isFav ? '#ef4444' : Colors.white}
            />
          </TouchableOpacity>
        </View>

        {/* Sold Visual Overlay */}
        {isActuallySold && (
          <View style={[StyleSheet.absoluteFill, s.soldOverlay]}>
            <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={s.soldRibbon}>
              <Text style={s.soldRibbonText}>مباع</Text>
            </View>
          </View>
        )}

        {/* Badges Overlay */}
        <View style={s.badgesContainer}>
          {rawStatus === 'SOLD' && (
            <View style={[s.badge, { backgroundColor: '#FF3B30' }]}>
              <Text style={[s.badgeTxt, { color: Colors.white }]}>مباع</Text>
            </View>
          )}
          {rawStatus === 'ARCHIVED' && (
            <View style={[s.badge, { backgroundColor: '#8E8E93' }]}>
              <Text style={[s.badgeTxt, { color: Colors.white }]}>مؤرشف</Text>
            </View>
          )}
          {rawStatus === 'SUSPENDED' && (
            <View style={[s.badge, { backgroundColor: '#FF9500' }]}>
              <Text style={[s.badgeTxt, { color: Colors.white }]}>معلق</Text>
            </View>
          )}

          {badges.map((b) => (
            <View
              key={b.key}
              style={[
                s.badge,
                { backgroundColor: b.backgroundColor },
                b.borderColor && { borderWidth: 1, borderColor: b.borderColor },
              ]}
            >
              {b.iconName && (
                <Ionicons
                  name={b.iconName as any}
                  size={10}
                  color={b.textColor || Colors.white}
                  style={s.badgeIcon}
                />
              )}
              <Text style={[s.badgeTxt, { color: b.textColor || Colors.white }]}>
                {b.label}
              </Text>
            </View>
          ))}

          {customBadges}
        </View>

        {/* Optional Action Menu */}
        {actionMenu && <View style={s.actionMenuContainer}>{actionMenu}</View>}
      </View>

      {/* ── DETAILS SECTION ── */}
      <Pressable onPress={onPress} style={s.cardDetails}>
        <View style={s.headerRow}>
          <Text
            style={[s.cardTitle, { flex: 1 }]}
            numberOfLines={titleNumberOfLines}
            ellipsizeMode="tail"
          >
            {title}
          </Text>
          {isSellerVerified && (
            <View style={s.verifiedRow}>
              <Ionicons name="checkmark-circle" size={12} color="#1877F2" />
              <Text style={s.verifiedTxt}>موثق</Text>
            </View>
          )}
        </View>

        <View style={s.locationRow}>
          <View style={s.locationInner}>
            <Ionicons name="location-outline" size={14} color={Colors.textMuted} />
            <Text style={s.locationTxt} numberOfLines={1}>
              {resolvedLocation}
            </Text>
          </View>
          {!!item?.createdAt && (
            <>
              <Text style={s.dotSeparator}>•</Text>
              <View style={s.timeInner}>
                <Ionicons name="time-outline" size={12} color="#94a3b8" />
                <Text style={s.timeTxt}>{formatDate(item.createdAt)}</Text>
              </View>
            </>
          )}
        </View>

        <View style={s.divider} />

        {/* Details Pills List */}
        <View style={s.detailsList}>
          {(() => {
            if (!pills || pills.length === 0) return null
            const visiblePills = pills.slice(0, maxChips)
            const remainingCount = pills.length - maxChips

            return (
              <>
                {visiblePills.map((pill) => {
                  const pillBgStyle =
                    pill.variant === 'blue'
                      ? s.pillBlue
                      : pill.variant === 'amber'
                      ? s.pillAmber
                      : pill.variant === 'green'
                      ? s.pillGreen
                      : pill.variant === 'red'
                      ? s.pillRed
                      : pill.variant === 'orange'
                      ? s.pillOrange
                      : s.pillNeutral

                  const defaultTextColor =
                    pill.variant === 'blue'
                      ? '#3b82f6'
                      : pill.variant === 'amber'
                      ? '#d97706'
                      : pill.variant === 'green'
                      ? '#059669'
                      : pill.variant === 'red'
                      ? '#ef4444'
                      : '#475569'

                  const textColor = pill.textColor || defaultTextColor

                  return (
                    <View key={pill.key} style={[s.detailPill, pillBgStyle]}>
                      {pill.iconFamily === 'MaterialCommunityIcons' ? (
                        <MaterialCommunityIcons
                          name={pill.iconName as any}
                          size={12}
                          color={textColor}
                        />
                      ) : pill.iconName ? (
                        <Ionicons
                          name={pill.iconName as any}
                          size={13}
                          color={textColor}
                        />
                      ) : null}
                      <Text
                        style={[s.detailText, { color: textColor }]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {pill.label}
                      </Text>
                    </View>
                  )
                })}
                {remainingCount > 0 && (
                  <View style={[s.detailPill, s.pillNeutral, s.remainingPill]}>
                    <Text style={s.remainingText} numberOfLines={1}>
                      +{remainingCount}
                    </Text>
                  </View>
                )}
              </>
            )
          })()}
        </View>

        <View style={s.footerDivider} />

        {/* Footer Row (Price & Negotiable pill) */}
        <View style={s.footerRow}>
          <View
            style={[
              s.detailPill,
              isPriceNegotiable ? s.pillGreen : s.pillNeutral,
              { flex: 1 },
            ]}
          >
            <Ionicons
              name="wallet-outline"
              size={15}
              color={isPriceNegotiable ? '#059669' : '#64748b'}
            />
            <Text
              style={[
                s.budgetValText,
                isPriceNegotiable && { color: '#059669' },
              ]}
            >
              {priceLabel}
            </Text>
          </View>

          {isPriceNegotiable && (
            <View style={[s.detailPill, s.pillGreen]}>
              <Text
                style={[
                  s.detailText,
                  { color: '#059669', fontFamily: 'Almarai_700Bold' },
                ]}
              >
                قابل للتفاوض
              </Text>
            </View>
          )}
        </View>

        {cardActions && (
          <View style={s.cardActionsRow}>
            {cardActions}
          </View>
        )}
      </Pressable>
    </View>
  )
}

const s = StyleSheet.create({
  card: {
    width: Dimensions.get('window').width * 0.6,
    backgroundColor: Colors.white,
    borderRadius: CardSystem.radius.outer,
    alignSelf: 'flex-start',
    ...CardSystem.styles.border,
    overflow: 'hidden',
    ...CardSystem.styles.softShadow,
  },
  imageContainer: {
    position: 'relative',
    backgroundColor: '#F8F9FA',
    overflow: 'hidden',
  },
  imageFill: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: CardSystem.aspectRatioHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swiperScrollView: {
    width: '100%',
    height: CardSystem.aspectRatioHeight,
  },
  dotsWrapper: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  activeDot: {
    backgroundColor: '#fff',
    width: 14,
  },
  imageCountBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    zIndex: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderRadius: Radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  imageCountText: {
    color: Colors.white,
    fontSize: 10.5,
    fontFamily: 'Almarai_700Bold',
    lineHeight: 14,
  },
  actionsContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
    flexDirection: 'row',
    gap: 6,
  },
  actionBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  soldOverlay: {
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  soldRibbon: {
    backgroundColor: 'rgba(255, 59, 48, 0.9)',
    paddingVertical: 6,
    paddingHorizontal: 32,
    transform: [{ rotate: '-12deg' }],
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  soldRibbonText: {
    color: 'white',
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 18,
    letterSpacing: 1,
  },
  badgesContainer: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 75,
    flexDirection: 'row',
    gap: 5,
    flexWrap: 'wrap',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: CardSystem.radius.badge,
    ...CardSystem.styles.badgeShadow,
  },
  badgeIcon: {
    marginRight: 2,
  },
  badgeTxt: {
    ...CardSystem.typography.badgeText,
    color: Colors.white,
    writingDirection: 'rtl',
  },
  actionMenuContainer: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    zIndex: 30,
    elevation: 6,
  },
  cardDetails: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: CardSystem.gap.primary,
  },
  cardTitle: {
    ...CardSystem.typography.title,
    color: '#0f172a',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    marginTop: 2,
  },
  verifiedTxt: {
    ...CardSystem.typography.badgeText,
    color: '#2563eb',
    writingDirection: 'rtl',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 4,
    marginTop: 2,
    marginBottom: 5,
  },
  locationInner: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  locationTxt: {
    ...CardSystem.typography.subtitle,
    color: Colors.textMuted,
    marginStart: 4,
    writingDirection: 'rtl',
  },
  dotSeparator: {
    fontSize: 10,
    color: '#cbd5e1',
  },
  timeInner: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  timeTxt: {
    ...CardSystem.typography.subtitle,
    color: '#94a3b8',
    marginStart: 3,
    writingDirection: 'rtl',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginBottom: 6,
  },
  footerDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginTop: 2,
    marginBottom: 6,
  },
  detailsList: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    gap: 3.5,
    marginBottom: 4,
    overflow: 'hidden',
  },
  detailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 2.5,
    borderRadius: CardSystem.radius.inner,
    flexShrink: 1,
  },
  pillNeutral: CardSystem.styles.pillNeutral,
  pillBlue: CardSystem.styles.pillBlue,
  pillAmber: CardSystem.styles.pillAmber,
  pillGreen: CardSystem.styles.pillGreen,
  pillRed: CardSystem.styles.pillRed,
  pillOrange: CardSystem.styles.pillOrange,
  detailText: {
    ...CardSystem.typography.pillText,
    color: '#475569',
    writingDirection: 'rtl',
    flexShrink: 1,
  },
  remainingPill: {
    paddingHorizontal: 4.5,
    flexShrink: 0,
  },
  remainingText: {
    fontFamily: 'Almarai_700Bold',
    color: '#64748b',
    fontSize: 9.5,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 5,
  },
  budgetValText: {
    fontSize: 11.5,
    fontFamily: 'Almarai_800ExtraBold',
    color: '#64748b',
    lineHeight: 15,
    writingDirection: 'rtl',
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
})
