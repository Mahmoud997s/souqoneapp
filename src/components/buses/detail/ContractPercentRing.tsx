import React from 'react'
import { View, StyleSheet } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import { Colors } from '../../../constants/colors'
import { formatNumberWestern } from '../../../utils/listing-detail/formatters'

export interface ContractPercentRingProps {
  percent: number
  size?: number
}

export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(100, Math.max(0, Math.round(value)))
}

/**
 * ContractPercentRing
 * Compact SVG donut ring visualizing the contract recovery percentage of listing price.
 * Uses design tokens only (zero hex colors) and clamps values to 0..100.
 */
export function ContractPercentRing({
  percent,
  size = 32,
}: ContractPercentRingProps) {
  const clamped = clampPercent(percent)
  const strokeWidth = 3.5
  const center = size / 2
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (clamped / 100) * circumference
  const label = `نسبة من السعر ${formatNumberWestern(clamped)}%`

  return (
    <View
      style={[s.container, { width: size, height: size }]}
      testID="contract-percent-ring"
      accessible={true}
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: clamped }}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={Colors.border}
          strokeWidth={strokeWidth}
          fill={Colors.paleMint}
          testID="contract-percent-ring-track"
        />
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={Colors.primary}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${center}, ${center}`}
          testID="contract-percent-ring-progress"
        />
      </Svg>
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
})
