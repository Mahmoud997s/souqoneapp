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
  name: string
  avatarUrl?: string | null
  images?: string[]
  isVerified: boolean
  isOnline?: boolean
  operatorTypeLabel?: string | null
  locationDisplay: string
  isOwnerMode: boolean
  displayPrice: string
  actionMenu?: React.ReactNode
  isFavorite?: boolean
  onToggleFavorite?: (e: any) => void
}

/**
 * OperatorCardHeader
 * Top row of OperatorCard rendering rounded photo/avatar with location pill,
 * optional carousel arrows (>1 image), verified badge, name, specialty,
 * live "متصل الآن" pill (only when isOnline===true), price badge, and favorite heart.
 */
export function OperatorCardHeader({
  name,
  avatarUrl,
  images = [],
  isVerified,
  isOnline = false,
  operatorTypeLabel,
  locationDisplay,
  isOwnerMode,
  displayPrice,
  actionMenu,
  isFavorite = false,
  onToggleFavorite,
}: OperatorCardHeaderProps) {
  const [imageIndex, setImageIndex] = useState(0)
  const photoList = images.length > 0 ? images : avatarUrl ? [avatarUrl] : []
  const hasMultiplePhotos = photoList.length > 1
  const activePhoto = photoList[imageIndex] ?? avatarUrl ?? null

  const handlePrevPhoto = (e: any) => {
    e.stopPropagation?.()
    setImageIndex((prev) => (prev - 1 + photoList.length) % photoList.length)
  }

  const handleNextPhoto = (e: any) => {
    e.stopPropagation?.()
    setImageIndex((prev) => (prev + 1) % photoList.length)
  }

  return (
    <View style={s.topRow}>
      <View style={s.photoContainer}>
        {activePhoto ? (
          <Image
            source={{ uri: activePhoto }}
            style={s.avatar}
            contentFit="cover"
            testID="operator-avatar"
          />
        ) : (
          <View style={s.avatarFallback} testID="operator-avatar-fallback">
            <Ionicons name="person" size={24} color={Colors.textMuted} />
          </View>
        )}

        <View style={s.locationPill} testID="operator-location-pill">
          <Ionicons name="location-outline" size={11} color={Colors.white} />
          <Text style={s.locationPillText} numberOfLines={1} ellipsizeMode="tail">
            {locationDisplay}
          </Text>
        </View>

        {hasMultiplePhotos && (
          <>
            <TouchableOpacity
              testID="operator-photo-prev"
              style={[s.carouselArrow, s.carouselArrowStart]}
              onPress={handlePrevPhoto}
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
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="الصورة التالية"
            >
              <Ionicons name="chevron-back" size={12} color={Colors.white} />
            </TouchableOpacity>
          </>
        )}

        {isVerified && (
          <View
            style={s.verifiedBadge}
            testID="operator-verified-badge"
            accessible
            accessibilityLabel="حساب موثق"
          >
            <VerifiedBadge size={17} />
          </View>
        )}
      </View>

      <View style={s.nameCol}>
        <View style={s.nameRow}>
          <Text style={s.nameText} numberOfLines={1} ellipsizeMode="tail">
            {name}
          </Text>
        </View>

        <View style={s.metaRow}>
          {isOnline === true && (
            <View style={s.onlinePill} testID="operator-online-pill">
              <View style={s.onlineDot} />
              <Text style={s.onlineText} numberOfLines={1}>
                متصل الآن
              </Text>
            </View>
          )}
          {!isOwnerMode && (
            <View
              style={s.priceBadge}
              testID="operator-price-badge"
              accessible
              accessibilityLabel={`الأجر: ${displayPrice}`}
            >
              <Text style={s.priceText} numberOfLines={1} ellipsizeMode="tail">
                {displayPrice}
              </Text>
            </View>
          )}
        </View>
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
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={isFavorite ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={20}
              color={isFavorite ? Colors.error : Colors.textMuted}
            />
          </TouchableOpacity>
        )
      )}
    </View>
  )
}

const s = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.space2,
  },
  photoContainer: {
    position: 'relative',
    width: 68,
    height: 68,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatarFallback: {
    width: 68,
    height: 68,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  locationPill: {
    position: 'absolute',
    bottom: 4,
    start: 4,
    end: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    backgroundColor: Colors.primaryDark,
    borderRadius: Radius.pill,
    paddingHorizontal: 4,
    paddingVertical: 1,
    opacity: 0.9,
  },
  locationPillText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: lineHeightFor(11),
    color: Colors.white,
    textAlign: 'left',
    writingDirection: 'rtl',
    flexShrink: 1,
  },
  carouselArrow: {
    position: 'absolute',
    top: '35%',
    width: 18,
    height: 18,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.85,
  },
  carouselArrowStart: {
    start: 2,
  },
  carouselArrowEnd: {
    end: 2,
  },
  verifiedBadge: {
    position: 'absolute',
    top: 2,
    end: 2,
    backgroundColor: Colors.white,
    borderRadius: Radius.pill,
    padding: 1,
  },
  nameCol: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space1,
  },
  nameText: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 14,
    lineHeight: lineHeightFor(14),
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
    flexShrink: 1,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.space1,
    marginTop: 2,
  },
  onlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.paleMint,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.space2,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
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
    color: Colors.primary,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  priceBadge: {
    backgroundColor: Colors.paleMint,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.space2,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    maxWidth: '45%',
    flexShrink: 1,
  },
  priceText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: lineHeightFor(12),
    color: Colors.primaryDark,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  favoriteBtn: {
    minWidth: Spacing.touch,
    minHeight: Spacing.touch,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.pill,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionMenuContainer: {
    minWidth: Spacing.touch,
    minHeight: Spacing.touch,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
})
