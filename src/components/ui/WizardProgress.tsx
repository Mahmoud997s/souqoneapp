import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'

interface WizardProgressProps {
  current: number
  total: number
}

export function WizardProgress({ current, total }: WizardProgressProps) {
  return (
    <View style={wp.bar}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            wp.segment,
            i < current ? wp.segmentDone : i === current - 1 ? wp.segmentActive : wp.segmentPending,
          ]}
        />
      ))}
    </View>
  )
}

const wp = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    gap: Spacing.space1,
    paddingHorizontal: Spacing.space4,
    paddingVertical: Spacing.space2,
    backgroundColor: Colors.white,
  },
  segment: {
    flex: 1, 
    height: 4, 
    borderRadius: 2,
  },
  segmentDone: { backgroundColor: Colors.primary },
  segmentActive: { backgroundColor: Colors.primary },
  segmentPending: { backgroundColor: Colors.border },
})
