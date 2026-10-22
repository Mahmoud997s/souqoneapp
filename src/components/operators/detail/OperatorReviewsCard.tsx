import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../../constants/colors'
import { Spacing } from '../../../constants/spacing'
import { Radius } from '../../../constants/radius'
import { Shadows } from '../../../constants/shadows'
import { RTLText } from '../../../constants/rtl'
import { lineHeightFor } from '../../../constants/typography'
import { OperatorStarsRow } from './OperatorStarsRow'
import { OperatorReviewsStates } from './OperatorReviewsStates'

export interface OperatorReviewsCardProps {
  averageRating?: number | null
  totalReviews?: number
  isLoading?: boolean
  isError?: boolean
  canWrite?: boolean
  onPressViewAll?: () => void
  onPressWrite?: () => void
  onRetry?: () => void
}

/**
 * OperatorReviewsCard
 * Displays rating summary and action buttons:
 * - Average with 1 decimal + 5 star icons (zero fake numbers)
 * - If count 0 shows 'لا توجد تقييمات بعد'
 * - Loading and error states delegated to OperatorReviewsStates
 * - 'عرض جميع التقييمات' when count > 0
 * - 'أضف تقييمك' button (hidden when canWrite is false)
 */
export function OperatorReviewsCard({
  averageRating,
  totalReviews = 0,
  isLoading = false,
  isError = false,
  canWrite = true,
  onPressViewAll,
  onPressWrite,
  onRetry,
}: OperatorReviewsCardProps) {
  if (isLoading || isError) {
    return (
      <OperatorReviewsStates
        isLoading={isLoading}
        isError={isError}
        onRetry={onRetry}
      />
    )
  }

  const hasReviews = totalReviews > 0
  const ratingValue = typeof averageRating === 'number' && averageRating > 0 ? averageRating : 0
  const formattedRating = ratingValue.toFixed(1)

  return (
    <View style={s.card} testID="operator-reviews-card">
      <View style={s.headerRow}>
        <Text style={s.cardTitle} maxFontSizeMultiplier={1.3}>
          تقييمات العملاء
        </Text>
        {hasReviews && (
          <Text style={s.countBadge} maxFontSizeMultiplier={1.3} testID="operator-reviews-count">
            ({totalReviews})
          </Text>
        )}
      </View>

      {!hasReviews ? (
        <View style={s.emptyRow} testID="operator-reviews-empty">
          <Ionicons name="star-outline" size={20} color={Colors.textMuted} />
          <Text style={s.emptyText} maxFontSizeMultiplier={1.3}>
            لا توجد تقييمات بعد
          </Text>
        </View>
      ) : (
        <View style={s.ratingRow} testID="operator-reviews-rating-row">
          <Text style={s.ratingNumber} maxFontSizeMultiplier={1.3} testID="operator-rating-number">
            {formattedRating}
          </Text>
          <OperatorStarsRow rating={ratingValue} size={18} />
        </View>
      )}

      {/* Action Buttons */}
      <View style={s.actionsRow}>
        {hasReviews && onPressViewAll && (
          <TouchableOpacity
            style={s.viewAllBtn}
            onPress={onPressViewAll}
            activeOpacity={0.8}
            testID="operator-reviews-view-all"
            accessibilityRole="button"
            accessibilityLabel="عرض جميع التقييمات"
          >
            <Text style={s.viewAllText} maxFontSizeMultiplier={1.3}>
              عرض جميع التقييمات
            </Text>
            <Ionicons name="chevron-back" size={16} color={Colors.primary} />
          </TouchableOpacity>
        )}

        {canWrite && onPressWrite && (
          <TouchableOpacity
            style={s.writeBtn}
            onPress={onPressWrite}
            activeOpacity={0.8}
            testID="operator-reviews-write"
            accessibilityRole="button"
            accessibilityLabel="أضف تقييمك"
          >
            <Ionicons name="create-outline" size={16} color={Colors.primary} />
            <Text style={s.writeText} maxFontSizeMultiplier={1.3}>
              أضف تقييمك
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.space4,
    marginVertical: Spacing.space2,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.space4,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space2,
    marginBottom: Spacing.space3,
  },
  cardTitle: {
    ...RTLText,
    fontFamily: 'Almarai_700Bold',
    fontSize: 16,
    lineHeight: lineHeightFor(16),
    color: Colors.text,
    textAlign: 'left',
  },
  countBadge: {
    ...RTLText,
    fontFamily: 'Almarai_400Regular',
    fontSize: 14,
    lineHeight: lineHeightFor(14),
    color: Colors.textMuted,
    textAlign: 'left',
  },
  emptyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space2,
    paddingVertical: Spacing.space2,
  },
  emptyText: {
    ...RTLText,
    fontFamily: 'Almarai_400Regular',
    fontSize: 14,
    lineHeight: lineHeightFor(14),
    color: Colors.textMuted,
    textAlign: 'left',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space3,
    paddingVertical: Spacing.space2,
  },
  ratingNumber: {
    ...RTLText,
    fontFamily: 'Almarai_700Bold',
    fontSize: 24,
    lineHeight: lineHeightFor(24),
    color: Colors.text,
    textAlign: 'left',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space3,
    marginTop: Spacing.space4,
    paddingTop: Spacing.space3,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space1,
  },
  viewAllText: {
    ...RTLText,
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    lineHeight: lineHeightFor(13),
    color: Colors.primary,
    textAlign: 'left',
  },
  writeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space1,
    marginRight: 'auto',
  },
  writeText: {
    ...RTLText,
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    lineHeight: lineHeightFor(13),
    color: Colors.primary,
    textAlign: 'left',
  },
})
