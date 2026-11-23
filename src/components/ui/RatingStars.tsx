import React from 'react'
import { View, TouchableOpacity, StyleSheet, type StyleProp, type ViewStyle } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'

export interface RatingStarsProps {
  /** Numeric rating value between 0 and 5 (supports half-stars in display mode) */
  rating: number
  /** Icon size in px (defaults to 18 in display mode, 32 in input mode) */
  size?: number
  /** When provided, renders interactive 1..5 star buttons with >=44pt touch targets */
  onChange?: (nextRating: number) => void
  /** Custom accessibility label for display mode */
  accessibilityLabel?: string
  /** Optional container testID */
  testID?: string
  /** Prefix for interactive star button testIDs (e.g. "review-star-btn" -> "review-star-btn-1") */
  starButtonTestIDPrefix?: string
  /** Optional container style override */
  style?: StyleProp<ViewStyle>
}

const STARS = [1, 2, 3, 4, 5] as const

/**
 * RatingStars
 * Single shared star-rating component across the app (replaces StarRow and OperatorStarsRow).
 * - Display mode (`onChange` omitted): full / half / outline stars, single accessible text group.
 * - Input mode (`onChange` provided): 5 interactive buttons with >=44pt touch targets.
 */
export function RatingStars({
  rating,
  size,
  onChange,
  accessibilityLabel,
  testID = 'rating-stars',
  starButtonTestIDPrefix = 'rating-star-btn',
  style,
}: RatingStarsProps) {
  const safeRating = typeof rating === 'number' && Number.isFinite(rating) && rating > 0 ? rating : 0
  const iconSize = size ?? (onChange ? 32 : 18)

  if (onChange) {
    return (
      <View style={[s.inputRow, style]} testID={testID}>
        {STARS.map((star) => {
          const isSelected = star <= safeRating
          return (
            <TouchableOpacity
              key={star}
              testID={`${starButtonTestIDPrefix}-${star}`}
              style={s.starButton}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`تقييم ${star} من 5 نجوم`}
              accessibilityState={{ selected: isSelected }}
              onPress={() => onChange(star)}
            >
              <Ionicons
                name={isSelected ? 'star' : 'star-outline'}
                size={iconSize}
                color={isSelected ? Colors.warning : Colors.border}
              />
            </TouchableOpacity>
          )
        })}
      </View>
    )
  }

  const displayLabel = accessibilityLabel ?? `التقييم ${safeRating} من 5 نجوم`

  return (
    <View
      style={[s.displayRow, style]}
      testID={testID}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={displayLabel}
    >
      {STARS.map((star) => {
        const isFilled = safeRating >= star
        const isHalf = !isFilled && safeRating >= star - 0.5
        return (
          <Ionicons
            key={star}
            name={isFilled ? 'star' : isHalf ? 'star-half' : 'star-outline'}
            size={iconSize}
            color={Colors.warning}
            accessible={false}
            accessibilityElementsHidden={true}
            importantForAccessibility="no"
          />
        )
      })}
    </View>
  )
}

const s = StyleSheet.create({
  displayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.space1,
  },
  starButton: {
    minWidth: Spacing.touch,
    minHeight: Spacing.touch,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
