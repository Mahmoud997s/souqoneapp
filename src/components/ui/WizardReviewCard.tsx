import React from 'react'
import { StyleSheet, View, Platform, type StyleProp, type ViewStyle } from 'react-native'
import { GlassSurface } from '../navigation/glassSupport'
import { BottomBarTokens } from '../../constants/bottomBarTokens'
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
      <GlassSurface
        testID={testID ? `${testID}-surface` : undefined}
        variant="surface"
        borderRadius={Radius.lg}
        noBorder
        intensity={50}
        washColor={Colors.white}
        washOpacity={BottomBarTokens.lightWashOpacity}
      />
      <View style={s.cardTint} pointerEvents="none" />
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
    borderColor: BottomBarTokens.borderColor,
    backgroundColor: 'transparent',
    gap: 12,
    ...Platform.select({
      ios: { shadowColor: Colors.primaryDark, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3 },
      android: { elevation: 1 },
    }),
  },
  cardTint: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Colors.primary,
    opacity: 0.04,
  },
})
