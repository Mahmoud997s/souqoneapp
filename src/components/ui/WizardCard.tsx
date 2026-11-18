import React from 'react'
import { View, Text, StyleSheet, Platform, StyleProp, ViewStyle } from 'react-native'
import { Colors } from '../../constants/colors'
import { Radius } from '../../constants/radius'
import { Spacing } from '../../constants/spacing'

interface WizardCardProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
  testID?: string
}

export function WizardCard({ title, subtitle, children, style, testID = 'wizard-card' }: WizardCardProps) {
  return (
    <View testID={testID} style={[s.card, style]}>
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
    borderColor: Colors.border,
    backgroundColor: Colors.inputBg,
    gap: Spacing.space3,
    ...Platform.select({
      ios: { shadowColor: Colors.slateHeading, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4 },
      android: { elevation: 1.5 },
    }),
  },
  title: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 13,
    lineHeight: 18,
    color: Colors.slateHeading,
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
