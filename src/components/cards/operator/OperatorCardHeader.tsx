import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../../constants/colors'
import { Spacing } from '../../../constants/spacing'
import { Radius } from '../../../constants/radius'
import { lineHeightFor } from '../../../constants/typography'
import { VerifiedBadge } from '../../ui/VerifiedBadge'

export interface OperatorCardHeaderProps {
  operatorId?: string
  name: string
  avatarUrl?: string | null
  images?: string[]
  isVerified: boolean
  isOnline?: boolean
  operatorTypeLabel?: string | null
  operatorTypeIcon?: React.ComponentProps<typeof Ionicons>['name']
  locationDisplay: string
  isOwnerMode: boolean
  displayPrice: string
  hasExplicitPrice?: boolean
  averageRating?: number
  reviewCount?: number
  actionMenu?: React.ReactNode
  isFavorite?: boolean
  onToggleFavorite?: (e: any) => void
  chipsNode?: React.ReactNode
}

const TOUCH_HIT_SLOP = { top: 12, bottom: 12, left: 12, right: 12 } as const
const AVATAR_SIZE = 48
const EQUIP_PHOTO_WIDTH = 112
const EQUIP_PHOTO_HEIGHT = 84

/**
 * OperatorCardHeader (v2 mockup alignment)
 * Two-column RTL header:
 * - Right column (start): top meta row (online pill + location pill + heart/menu),
 *   circular 48x48 operator avatar with verified badge, bold name, rating line, and chips.
 * - Left column (end): 112x84 equipment photo carousel (or type-icon placeholder) with
 *   3 dots (>1 image) and mint/neutral price box directly below.
 */
export function OperatorCardHeader({
  operatorId,
  name,
  avatarUrl,
  images = [],
  isVerified,
  isOnline = false,
  operatorTypeIcon = 'construct-outline',
  locationDisplay,
  isOwnerMode,
  displayPrice,
  hasExplicitPrice = true,
  averageRating = 0,
  reviewCount = 0,
  actionMenu,
  isFavorite = false,
  onToggleFavorite,
  chipsNode,
}: OperatorCardHeaderProps) {
  const [imageIndex, setImageIndex] = useState(0)
  const hasEquipmentImages = images.length > 0
  const hasMultiplePhotos = images.length > 1
  const safeIndex = hasEquipmentImages ? imageIndex % images.length : 0
  const activeEquipmentPhoto = hasEquipmentImages ? images[safeIndex] : null
  const activeDotIndex = hasEquipmentImages ? safeIndex % 3 : 0

  const handlePrevPhoto = (e: any) => {
    e.stopPropagation?.()
    if (!hasEquipmentImages) return
    setImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const handleNextPhoto = (e: any) => {
    e.stopPropagation?.()
    if (!hasEquipmentImages) return
    setImageIndex((prev) => (prev + 1) % images.length)
  }

  return (
    <View style={s.columnsRow}>
      {/* Right Column (start in RTL): Meta top row + Avatar/Name/Rating + Chips */}
      <View style={s.infoCol}>
        <View style={s.topMetaRow}>
          {isOnline === true && (
            <View style={s.onlinePill} testID="operator-online-pill">
              <View style={s.onlineDot} />
              <Text style={s.onlineText} numberOfLines={1}>
                متصل الآن
              </Text>
            </View>
          )}

          <View style={s.locationPill} testID="operator-location-pill">
            <Ionicons name="location-outline" size={12} color={Colors.primary} />
            <Text style={s.locationPillText} numberOfLines={1} ellipsizeMode="tail">
              {locationDisplay}
            </Text>
          </View>

          {isOwnerMode ? (
            <View
              style={s.actionMenuContainer}
              testID="operator-action-menu-container"
            >
              {actionMenu}
            </View>
          ) : (
            onToggleFavorite && (
              <TouchableOpacity
                testID="operator-favorite-btn"
                style={s.favoriteBtn}
                onPress={onToggleFavorite}
                hitSlop={TOUCH_HIT_SLOP}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={isFavorite ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
              >
                <Ionicons
                  name={isFavorite ? 'heart' : 'heart-outline'}
                  size={18}
                  color={isFavorite ? Colors.error : Colors.primary}
                />
              </TouchableOpacity>
            )
          )}
        </View>

        <View style={s.identityRow}>
          <View style={s.avatarWrap}>
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={s.avatar}
                contentFit="cover"
                cachePolicy="memory-disk"
                recyclingKey={`avatar-${operatorId ?? name}`}
                testID="operator-avatar"
              />
            ) : (
              <View style={s.avatarFallback} testID="operator-avatar-fallback">
                <Ionicons name="person" size={22} color={Colors.textMuted} />
              </View>
            )}

            {isVerified && (
              <View
                style={s.verifiedBadge}
                testID="operator-verified-badge"
                accessible
                accessibilityLabel="حساب موثق"
              >
                <VerifiedBadge size={16} />
              </View>
            )}
          </View>

          <View style={s.nameCol}>
            <Text style={s.nameText} numberOfLines={1} ellipsizeMode="tail">
              {name}
            </Text>

            {averageRating > 0 && (
              <View style={s.ratingRow} testID="operator-stat-rating">
                <Ionicons name="star" size={13} color={Colors.warning} />
                <Text style={s.ratingText} numberOfLines={1}>
                  {averageRating.toFixed(1)}
                  {reviewCount > 0 ? ` | (${reviewCount}) تقييم` : ''}
                </Text>
              </View>
            )}
          </View>
        </View>

        {chipsNode}
      </View>

      {/* Left Column (end in RTL): Equipment photo carousel / placeholder + dots + price */}
      <View style={s.mediaCol}>
        <View style={s.equipPhotoWrap}>
          {activeEquipmentPhoto ? (
            <Image
              source={{ uri: activeEquipmentPhoto }}
              style={s.equipPhoto}
              contentFit="cover"
              cachePolicy="memory-disk"
              recyclingKey={`equip-${operatorId ?? name}-${safeIndex}`}
              testID="operator-equipment-image"
            />
          ) : (
            <View style={s.equipPlaceholder} testID="operator-equipment-placeholder">
              <Ionicons name={operatorTypeIcon} size={28} color={Colors.textMuted} />
            </View>
          )}

          {hasMultiplePhotos && (
            <>
              <TouchableOpacity
                testID="operator-photo-prev"
                style={[s.carouselArrow, s.carouselArrowStart]}
                onPress={handlePrevPhoto}
                hitSlop={TOUCH_HIT_SLOP}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="الصورة السابقة"
              >
                <Ionicons name="chevron-forward" size={12} color={Colors.white} />
              </TouchableOpacity>
              <TouchableOpacity
                testID="operator-photo-next"
                style={[s.carouselArrow, s.carouselArrowEnd]}
                onPress={handleNextPhoto}
                hitSlop={TOUCH_HIT_SLOP}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="الصورة التالية"
              >
                <Ionicons name="chevron-back" size={12} color={Colors.white} />
              </TouchableOpacity>
            </>
          )}
        </View>

        {hasMultiplePhotos && (
          <View style={s.dotsRow} testID="operator-photo-dots">
            {[0, 1, 2].map((dotIdx) => (
              <View
                key={dotIdx}
                style={[s.dot, dotIdx === activeDotIndex ? s.dotActive : s.dotInactive]}
              />
            ))}
          </View>
        )}

        {!isOwnerMode && (
          <View
            style={[s.priceBox, !hasExplicitPrice && s.priceBoxNeutral]}
            testID="operator-price-badge"
            accessible
            accessibilityLabel={`الأجر: ${displayPrice}`}
          >
            <Text
              style={[s.priceText, !hasExplicitPrice && s.priceTextNeutral]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {displayPrice}
            </Text>
          </View>
        )}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  columnsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.space3,
  },
  infoCol: {
    flex: 1,
    minWidth: 0,
  },
  topMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.space1,
    marginBottom: Spacing.space2,
  },
  onlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.paleMint,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    paddingHorizontal: Spacing.space2,
    paddingVertical: 2,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primary,
  },
  onlineText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: lineHeightFor(11),
    color: Colors.primaryDark,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.space2,
    paddingVertical: 2,
    flexShrink: 1,
  },
  locationPillText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    lineHeight: lineHeightFor(11),
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
    flexShrink: 1,
  },
  favoriteBtn: {
    marginStart: 'auto',
    width: 30,
    height: 30,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionMenuContainer: {
    marginStart: 'auto',
    minWidth: Spacing.touch,
    minHeight: Spacing.touch,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space2,
  },
  avatarWrap: {
    position: 'relative',
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    flexShrink: 0,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatarFallback: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    end: -2,
    backgroundColor: Colors.white,
    borderRadius: Radius.pill,
  },
  nameCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  nameText: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 15,
    lineHeight: lineHeightFor(15),
    color: Colors.primaryDeep,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    lineHeight: lineHeightFor(12),
    color: Colors.textMuted,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  mediaCol: {
    width: EQUIP_PHOTO_WIDTH,
    alignItems: 'center',
    gap: Spacing.space1,
    flexShrink: 0,
  },
  equipPhotoWrap: {
    position: 'relative',
    width: EQUIP_PHOTO_WIDTH,
    height: EQUIP_PHOTO_HEIGHT,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  equipPhoto: {
    width: EQUIP_PHOTO_WIDTH,
    height: EQUIP_PHOTO_HEIGHT,
  },
  equipPlaceholder: {
    width: EQUIP_PHOTO_WIDTH,
    height: EQUIP_PHOTO_HEIGHT,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  carouselArrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -11,
    width: 22,
    height: 22,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primaryDark,
    opacity: 0.78,
    alignItems: 'center',
    justifyContent: 'center',
  },
  carouselArrowStart: {
    start: 4,
  },
  carouselArrowEnd: {
    end: 4,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 2,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: Radius.pill,
  },
  dotActive: {
    backgroundColor: Colors.primary,
  },
  dotInactive: {
    backgroundColor: Colors.border,
  },
  priceBox: {
    width: '100%',
    backgroundColor: Colors.paleMint,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.space2,
    paddingVertical: Spacing.space1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  priceBoxNeutral: {
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  priceText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 14,
    lineHeight: lineHeightFor(14),
    color: Colors.primary,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  priceTextNeutral: {
    color: Colors.primaryDark,
  },
})
