import React from 'react'
import { StyleSheet, View, Text, Platform, type StyleProp, type ViewStyle } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
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

export interface WizardReviewContactRowProps {
  whatsappEnabled?: boolean | null
  testID?: string
}

export function WizardReviewContactRow({
  whatsappEnabled,
  testID = 'wizard-review-contact-row',
}: WizardReviewContactRowProps) {
  const isWhatsappOn = Boolean(whatsappEnabled)
  return (
    <View testID={testID} style={wizardReviewRowStyles.row}>
      <View style={s.contactIconLabel}>
        <Ionicons
          name={isWhatsappOn ? 'logo-whatsapp' : 'call-outline'}
          size={16}
          color={isWhatsappOn ? Colors.emerald : Colors.slateText}
        />
        <Text style={wizardReviewRowStyles.label}>طرق التواصل</Text>
      </View>
      <Text testID={`${testID}-value`} style={wizardReviewRowStyles.value}>
        {isWhatsappOn ? 'اتصال + واتساب' : 'اتصال'}
      </Text>
    </View>
  )
}

export const WIZARD_REVIEW_ROW_STYLES = {
  row: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: 3,
    gap: Spacing.space3,
  },
  label: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11.5,
    lineHeight: 16,
    color: Colors.slateText,
    textAlign: 'left' as const,
    writingDirection: 'rtl' as const,
    flexShrink: 0,
  },
  value: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12.5,
    lineHeight: 17,
    color: Colors.slateDark,
    textAlign: 'left' as const,
    writingDirection: 'rtl' as const,
    flexShrink: 1,
  },
}

export const wizardReviewRowStyles = StyleSheet.create(WIZARD_REVIEW_ROW_STYLES)

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
  contactIconLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
})
