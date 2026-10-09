import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'

export interface HowItWorksStep {
  stepNumber: number | string
  icon: keyof typeof Ionicons.glyphMap
  title: string
  desc: string
}

export interface HowItWorksCardProps {
  title: string
  subTitle: string
  steps: HowItWorksStep[]
}

export function HowItWorksCard({ title, subTitle, steps }: HowItWorksCardProps) {
  return (
    <View style={s.container}>
      <View style={[s.sectionHeader, { marginBottom: Spacing.space4 }]}>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[s.sectionTitleHeader, { textAlign: 'center' }]}>{title}</Text>
          <Text style={[s.sectionSubHeader, { textAlign: 'center' }]}>{subTitle}</Text>
        </View>
      </View>

      <View style={s.stepsContainer}>
        {steps.map((step) => (
          <View key={String(step.stepNumber)} style={s.stepItem}>
            <View style={s.stepIconBox}>
              <Ionicons name={step.icon} size={24} color={Colors.primary} />
              <View style={s.stepNumberBadge}>
                <Text style={s.stepNumberTxt}>{step.stepNumber}</Text>
              </View>
            </View>
            <View style={s.stepTextContent}>
              <Text style={s.stepTitle}>{step.title}</Text>
              <Text style={s.stepDesc}>{step.desc}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container: {},
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitleHeader: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 15,
    color: Colors.text,
    lineHeight: 24,
    paddingTop: 4,
    writingDirection: 'rtl',
  },
  sectionSubHeader: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 20,
    paddingTop: 2,
    writingDirection: 'rtl',
  },
  stepsContainer: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.space4,
    gap: Spacing.space4,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space3,
  },
  stepIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.paleMint,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  stepNumberBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: Colors.primary,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  stepNumberTxt: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 10.5,
    color: Colors.white,
    lineHeight: 14,
    paddingTop: 1,
  },
  stepTextContent: {
    flex: 1,
  },
  stepTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 14,
    color: Colors.text,
    textAlign: 'left',
    lineHeight: 20,
    paddingTop: 2,
    marginBottom: 2,
    writingDirection: 'rtl',
  },
  stepDesc: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'left',
    lineHeight: 18,
    writingDirection: 'rtl',
  },
})
