import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter, router as expoRouter } from 'expo-router'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'
import { Shadows } from '../../constants/shadows'
import { lineHeightFor } from '../../constants/typography'
import { RatingStars } from '../ui/RatingStars'
import { useSellerReviewSummary } from '../../hooks/listing-detail/useSellerReviewSummary'
import { useAuthStore } from '../../store/authStore'
import { loginRoute } from '../../navigation/listingRoutes'
import { formatNumberWestern } from '../../utils/numberFormat'

export interface SellerRatingBlockProps {
  sellerId?: string
  isOwner: boolean
  testID?: string
}

/**
 * SellerRatingBlock
 * Single shared seller-rating card placed near SellerCard on all 5 main detail screens
 * (Cars, Buses, Equipment, Parts, Services).
 * - Hidden for the listing owner (cannot rate yourself) and when sellerId is missing.
 * - Reads aggregate rating via GET /reviews/summary/:userId (cached across detail & profile).
 * - Opens /reviews/:sellerId?type=USER (or loginRoute when logged out and pressing rate).
 */
export function SellerRatingBlock({
  sellerId,
  isOwner,
  testID = 'seller-rating-block',
}: SellerRatingBlockProps) {
  const trimmedSellerId = sellerId?.trim() ?? ''
  const shouldRender = !isOwner && trimmedSellerId.length > 0
  const router = typeof useRouter === 'function' ? useRouter() : expoRouter
  const { user } = useAuthStore()
  const { averageRating, reviewCount } = useSellerReviewSummary(
    shouldRender ? trimmedSellerId : undefined,
  )

  if (!shouldRender) {
    return null
  }

  const hasReviews = reviewCount > 0 && averageRating !== null
  const formattedAvg = hasReviews ? averageRating.toFixed(1) : ''
  const formattedCount = formatNumberWestern(reviewCount)

  const handleViewReviews = () => {
    router.push(`/reviews/${trimmedSellerId}?type=USER`)
  }

  const handleRateSeller = () => {
    const target = `/reviews/${trimmedSellerId}?type=USER&write=true`
    if (!user) {
      router.push(loginRoute(target))
      return
    }
    router.push(target)
  }

  return (
    <View style={s.card} testID={testID}>
      <View style={s.topRow}>
        <View style={s.titleGroup}>
          <Text style={s.title}>تقييم البائع</Text>
          {hasReviews ? (
            <TouchableOpacity
              style={s.ratingRow}
              onPress={handleViewReviews}
              activeOpacity={0.75}
              testID={`${testID}-summary`}
              accessibilityRole="button"
              accessibilityLabel={`التقييم ${formattedAvg} من 5 بناءً على ${formattedCount} تقييم`}
            >
              <RatingStars rating={averageRating} size={16} />
              <Text style={s.ratingNumber}>{formattedAvg}</Text>
              <Text style={s.ratingCount}>({formattedCount})</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity
          style={s.rateBtn}
          onPress={handleRateSeller}
          activeOpacity={0.8}
          testID={`${testID}-rate-btn`}
          accessibilityRole="button"
          accessibilityLabel="تقييم البائع"
        >
          <Ionicons name="star-outline" size={16} color={Colors.primary} />
          <Text style={s.rateBtnText}>تقييم البائع</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.space4,
    marginVertical: Spacing.space1,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.space4,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.space3,
  },
  titleGroup: {
    flex: 1,
    gap: Spacing.space1,
  },
  title: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 14,
    lineHeight: lineHeightFor(14),
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space2,
    minHeight: Spacing.touch,
  },
  ratingNumber: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 15,
    lineHeight: lineHeightFor(15),
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  ratingCount: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    lineHeight: lineHeightFor(12),
    color: Colors.textMuted,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  rateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.space2,
    minHeight: Spacing.touch,
    paddingHorizontal: Spacing.space3,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.primarySoft30,
    backgroundColor: Colors.primarySoft12,
  },
  rateBtnText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    lineHeight: lineHeightFor(13),
    color: Colors.primary,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
})
