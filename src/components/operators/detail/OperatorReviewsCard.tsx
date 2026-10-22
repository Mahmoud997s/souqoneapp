import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../../constants/colors'
import { Spacing } from '../../../constants/spacing'
import { Radius } from '../../../constants/radius'
import { Shadows } from '../../../constants/shadows'
import { RTLText } from '../../../constants/rtl'
import { lineHeightFor } from '../../../constants/typography'

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
 * - Loading indicator state
 * - Error state with retry button
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
  if (isLoading) {
    return (
      <View style={s.card} testID="operator-reviews-loading">
        <ActivityIndicator size="small" color={Colors.primary} />
        <Text style={s.loadingText} maxFontSizeMultiplier={1.3}>
          جاري تحميل التقييمات...
        </Text>
      </View>
    )
  }

  if (isError) {
    return (
      <View style={s.card} testID="operator-reviews-error">
        <Ionicons name="alert-circle-outline" size={24} color={Colors.error} />
        <Text style={s.errorText} maxFontSizeMultiplier={1.3}>
          تعذر تحميل التقييمات حالياً
        </Text>
        {onRetry && (
          <TouchableOpacity
            style={s.retryButton}
            onPress={onRetry}
            activeOpacity={0.8}
            testID="operator-reviews-retry"
            accessibilityRole="button"
            accessibilityLabel="إعادة المحاولة"
          >
            <Text style={s.retryText} maxFontSizeMultiplier={1.3}>
              إعادة المحاولة
            </Text>
          </TouchableOpacity>
        )}
      </View>
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
          <View style={s.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => {
              const isFilled = ratingValue >= star
              const isHalf = !isFilled && ratingValue >= star - 0.5
              return (
                <Ionicons
                  key={star}
                  name={isFilled ? 'star' : isHalf ? 'star-half' : 'star-outline'}
                  size={18}
                  color={Colors.warning}
                />
              )
            })}
          </View>
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
    ...Shadows.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space2,
    marginBottom: Spacing.space3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    writingDirection: RTLText.writingDirection,
    lineHeight: lineHeightFor(16),
  },
  countBadge: {
    fontSize: 14,
    color: Colors.textMuted,
    lineHeight: lineHeightFor(14),
  },
  loadingText: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: Spacing.space2,
    textAlign: 'center',
    writingDirection: RTLText.writingDirection,
    lineHeight: lineHeightFor(13),
  },
  errorText: {
    fontSize: 13,
    color: Colors.error,
    marginTop: Spacing.space2,
    textAlign: 'center',
    writingDirection: RTLText.writingDirection,
    lineHeight: lineHeightFor(13),
  },
  retryButton: {
    marginTop: Spacing.space2,
    alignSelf: 'center',
    paddingHorizontal: Spacing.space3,
    paddingVertical: Spacing.space1,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  retryText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    lineHeight: lineHeightFor(12),
  },
  emptyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space2,
    paddingVertical: Spacing.space2,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
    writingDirection: RTLText.writingDirection,
    lineHeight: lineHeightFor(14),
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space3,
    paddingVertical: Spacing.space2,
  },
  ratingNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
    lineHeight: lineHeightFor(28),
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.space3,
    paddingTop: Spacing.space2,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    minHeight: 44,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 44,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
    lineHeight: lineHeightFor(13),
  },
  writeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space1,
    minHeight: 44,
  },
  writeText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
    lineHeight: lineHeightFor(13),
  },
})
