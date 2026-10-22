import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../../constants/colors'
import { Spacing } from '../../../constants/spacing'
import { Radius } from '../../../constants/radius'
import { RTLText } from '../../../constants/rtl'
import { lineHeightFor } from '../../../constants/typography'

export interface OperatorReviewsStatesProps {
  isLoading?: boolean
  isError?: boolean
  onRetry?: () => void
}

/**
 * OperatorReviewsStates
 * Renders loading and error state cards for OperatorReviewsCard.
 */
export function OperatorReviewsStates({
  isLoading,
  isError,
  onRetry,
}: OperatorReviewsStatesProps) {
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

  return null
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...RTLText,
    fontFamily: 'Almarai_400Regular',
    fontSize: 13,
    lineHeight: lineHeightFor(13),
    color: Colors.textMuted,
    marginTop: Spacing.space2,
    textAlign: 'center',
  },
  errorText: {
    ...RTLText,
    fontFamily: 'Almarai_400Regular',
    fontSize: 13,
    lineHeight: lineHeightFor(13),
    color: Colors.error,
    marginVertical: Spacing.space2,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: Spacing.space3,
    paddingVertical: Spacing.space2,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignSelf: 'center',
  },
  retryText: {
    ...RTLText,
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    lineHeight: lineHeightFor(13),
    color: Colors.primary,
  },
})
