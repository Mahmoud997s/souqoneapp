import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../../constants/colors'

export interface OperatorStarsRowProps {
  rating: number
  size?: number
  accessibilityLabel?: string
}

/**
 * OperatorStarsRow
 * Presentational component rendering 5 stars with full/half/outline icons
 * based on numeric rating value.
 * Individual icons are marked hidden from accessibility; container announces
 * the overall rating via accessibilityLabel.
 */
export function OperatorStarsRow({
  rating,
  size = 18,
  accessibilityLabel,
}: OperatorStarsRowProps) {
  const ratingValue = typeof rating === 'number' && rating > 0 ? rating : 0
  const label = accessibilityLabel ?? `التقييم ${ratingValue} من 5`

  return (
    <View
      style={s.starsContainer}
      testID="operator-stars-row"
      accessible
      accessibilityRole="text"
      accessibilityLabel={label}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = ratingValue >= star
        const isHalf = !isFilled && ratingValue >= star - 0.5
        return (
          <Ionicons
            key={star}
            name={isFilled ? 'star' : isHalf ? 'star-half' : 'star-outline'}
            size={size}
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
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
})
