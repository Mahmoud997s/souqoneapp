import React from 'react'
import { StyleSheet, View, Platform, type StyleProp, type ViewStyle } from 'react-native'
import { Colors } from '../../constants/colors'
import { Radius } from '../../constants/radius'
import { Spacing } from '../../constants/spacing'

export interface WizardReviewCardProps {
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
  testID?: string
}

export function WizardReviewCard({
  children,
  style,
  testID,
}: WizardReviewCardProps) {
  return (
    <View testID={testID} style={[s.card, style]}>
      {children}
    </View>
  )
}

const s = StyleSheet.create({
  card: {
    overflow: 'hidden',
    borderRadius: Radius.lg,
    padding: Spacing.space4,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    gap: 12,
    ...Platform.select({
      ios: { shadowColor: Colors.slateHeading, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4 },
      android: { elevation: 1.5 },
    }),
  },
})
