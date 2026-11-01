import React from 'react'
import { View, Text, StyleSheet, Platform, StyleProp, ViewStyle } from 'react-native'
import { GlassSurface } from '../navigation/glassSupport'
import type { GlassSupport } from '../navigation/glassCapability'
import { BottomBarTokens } from '../../constants/bottomBarTokens'
import { Colors } from '../../constants/colors'
import { Radius } from '../../constants/radius'
import { Spacing } from '../../constants/spacing'

interface WizardCardProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
  support?: GlassSupport
  testID?: string
}

export function WizardCard({ title, subtitle, children, style, support, testID = 'wizard-card' }: WizardCardProps) {
  return (
    <View testID={testID} style={[s.card, style]}>
      <GlassSurface
        testID={`${testID}-surface`}
        variant="surface"
        borderRadius={Radius.lg}
        noBorder
        intensity={50}
        washColor={Colors.white}
        washOpacity={BottomBarTokens.lightWashOpacity}
        support={support}
      />
      <View style={s.tint} pointerEvents="none" />

      <Text style={s.title}>{title}</Text>
      {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}
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
    borderColor: 'rgba(255,255,255,0.6)',
    backgroundColor: 'transparent',
    gap: Spacing.space3,
    ...Platform.select({
      ios: { shadowColor: '#0f172a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4 },
      android: { elevation: 1.5 },
    }),
  },
  tint: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Colors.primary,
    opacity: 0.04,
  },
  title: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 13,
    lineHeight: 18,
    color: '#0F172A',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  subtitle: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 10.5,
    lineHeight: 14.5,
    color: Colors.textMuted,
    textAlign: 'left',
    writingDirection: 'rtl',
    marginTop: -4,
    marginBottom: 4,
  },
})
