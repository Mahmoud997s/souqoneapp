import React from 'react'
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Radius } from '../../constants/radius'
import { Spacing } from '../../constants/spacing'
import { CardSystem } from '../../constants/cardSystem'
import { TopBarTokens } from '../../constants/topBarTokens'
import { GlassSurface } from '../navigation/glassSupport'
import { HOME_BOTTOM_TOKENS, HOME_HOW_IT_WORKS_STEPS, getHomeHowItWorksWidth } from './homeBottomContent'

export interface HomeHowItWorksProps {
  testID?: string
}

export function HomeHowItWorks({ testID = 'home-how-it-works' }: HomeHowItWorksProps) {
  const { width: screenWidth } = useWindowDimensions()
  const width = getHomeHowItWorksWidth(screenWidth)

  return (
    <View testID={testID} style={[styles.wrapper, { width }]}>
      <View style={styles.card}>
        <GlassSurface
          testID={testID}
          borderRadius={HOME_BOTTOM_TOKENS.cardRadius}
          intensity={TopBarTokens.blurIntensity}
          tint={TopBarTokens.blurTint}
          washColor={HOME_BOTTOM_TOKENS.glassWashColor}
          washOpacity={0}
        />
        <View pointerEvents="none" style={styles.glassTint} />
        <View style={styles.content}>
          <Text testID={`${testID}-title`} style={styles.title}>كيف يعمل سوق وان؟</Text>
          <Text style={styles.subtitle}>3 خطوات بسيطة</Text>
          <View style={styles.steps}>
            {HOME_HOW_IT_WORKS_STEPS.map((step, index) => (
              <View key={step.id} testID={`${testID}-step-${step.id}`} style={[styles.step, index > 0 && styles.stepDivider]}>
                <View style={styles.stepText}>
                  <Text style={styles.stepTitle} numberOfLines={HOME_BOTTOM_TOKENS.titleLines}>{step.title}</Text>
                  <Text style={styles.stepDescription} numberOfLines={HOME_BOTTOM_TOKENS.descriptionLines}>{step.description}</Text>
                </View>
                <View style={styles.stepIconBox}>
                  <Ionicons name={step.icon} size={HOME_BOTTOM_TOKENS.stepIconSize} color={Colors.primary} />
                  <View style={styles.stepBadge}><Text style={styles.stepNumber}>{step.number}</Text></View>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { alignSelf: 'center', marginTop: Spacing.space6, marginBottom: Spacing.space4 },
  card: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: Radius.lg,
    borderWidth: TopBarTokens.buttonBorderWidth,
    borderColor: TopBarTokens.buttonBorderColor,
    backgroundColor: Colors.surface,
    ...CardSystem.styles.softShadow,
  },
  glassTint: {
    ...StyleSheet.absoluteFill,
    backgroundColor: HOME_BOTTOM_TOKENS.glassWashColor,
    opacity: HOME_BOTTOM_TOKENS.glassWashOpacity,
  },
  content: { padding: Spacing.space4 },
  title: {
    fontFamily: 'Almarai_800ExtraBold', fontSize: HOME_BOTTOM_TOKENS.headerFontSize,
    lineHeight: HOME_BOTTOM_TOKENS.headerLineHeight,
    color: Colors.text, textAlign: 'center', writingDirection: 'rtl',
  },
  subtitle: {
    marginTop: Spacing.space1, fontFamily: 'Almarai_400Regular',
    fontSize: HOME_BOTTOM_TOKENS.subtitleFontSize, lineHeight: HOME_BOTTOM_TOKENS.subtitleLineHeight,
    color: Colors.textMuted, textAlign: 'center', writingDirection: 'rtl',
  },
  steps: { marginTop: Spacing.space3 },
  step: { flexDirection: 'row', alignItems: 'center', gap: Spacing.space3, paddingVertical: Spacing.space2 },
  stepDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border },
  stepText: { flex: 1 },
  stepTitle: {
    fontFamily: 'Almarai_800ExtraBold', fontSize: HOME_BOTTOM_TOKENS.stepTitleFontSize,
    lineHeight: HOME_BOTTOM_TOKENS.stepTitleLineHeight,
    color: Colors.text, textAlign: 'left', writingDirection: 'rtl',
  },
  stepDescription: {
    marginTop: Spacing.space1, fontFamily: 'Almarai_400Regular',
    fontSize: HOME_BOTTOM_TOKENS.stepDescriptionFontSize,
    lineHeight: HOME_BOTTOM_TOKENS.stepDescriptionLineHeight,
    color: Colors.textMuted, textAlign: 'left', writingDirection: 'rtl',
  },
  stepIconBox: {
    width: HOME_BOTTOM_TOKENS.stepIconBox, height: HOME_BOTTOM_TOKENS.stepIconBox,
    borderRadius: Radius.md, backgroundColor: Colors.surface, borderWidth: 1,
    borderColor: Colors.border, alignItems: 'center', justifyContent: 'center',
  },
  stepBadge: {
    position: 'absolute', top: HOME_BOTTOM_TOKENS.badgeOffset, right: HOME_BOTTOM_TOKENS.badgeOffset,
    width: HOME_BOTTOM_TOKENS.stepBadgeSize,
    height: HOME_BOTTOM_TOKENS.stepBadgeSize, borderRadius: Radius.pill,
    backgroundColor: Colors.primaryDark, alignItems: 'center', justifyContent: 'center',
  },
  stepNumber: {
    color: Colors.white, fontFamily: 'Almarai_800ExtraBold',
    fontSize: HOME_BOTTOM_TOKENS.stepNumberFontSize, lineHeight: HOME_BOTTOM_TOKENS.stepNumberLineHeight,
  },
})
