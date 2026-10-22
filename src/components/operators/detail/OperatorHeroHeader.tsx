import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../../constants/colors'
import { Spacing } from '../../../constants/spacing'
import { Radius } from '../../../constants/radius'
import { Shadows } from '../../../constants/shadows'
import { RTLText } from '../../../constants/rtl'
import { lineHeightFor } from '../../../constants/typography'
import type { OperatorDetailViewModel } from '../../../types/operatorDetailViewModel.types'
import { OperatorAvatarBlock } from './OperatorAvatarBlock'

export interface OperatorHeroHeaderProps {
  vm: OperatorDetailViewModel
}

/**
 * OperatorHeroHeader
 * Profile-header model for operator detail page (NO gallery).
 * Features:
 * - Large circular avatar with fallback to initials/icon
 * - Verified badge
 * - Operator title & operator type pill
 * - Experience pill (when experienceYearsLabel is present)
 * - Location line & posted date
 * - Rate summary under title (never "0 ر.ع", negotiable badge when flagged)
 */
export function OperatorHeroHeader({ vm }: OperatorHeroHeaderProps) {
  const avatarUrl = vm.profileImageUrl || vm.seller.avatarUrl
  const rateSummary = vm.rates.primaryLabel
  const isNegotiable = vm.rates.isNegotiable

  return (
    <View style={s.container} testID="operator-hero-header">
      {/* Avatar Block */}
      <OperatorAvatarBlock
        avatarUrl={avatarUrl}
        isVerified={vm.seller.isVerified}
      />

      {/* Title & Pill Row */}
      <Text style={s.title} maxFontSizeMultiplier={1.3} testID="operator-title">
        {vm.title}
      </Text>

      <View style={s.pillsRow}>
        <View style={s.typePill} testID="operator-type-pill">
          <Text style={s.typePillText} maxFontSizeMultiplier={1.3}>
            {vm.operatorTypeLabel}
          </Text>
        </View>

        {Boolean(vm.experienceYearsLabel) && (
          <View style={s.expPill} testID="operator-experience-pill">
            <Ionicons name="briefcase-outline" size={14} color={Colors.textMuted} />
            <Text style={s.expPillText} maxFontSizeMultiplier={1.3}>
              {vm.experienceYearsLabel}
            </Text>
          </View>
        )}
      </View>

      {/* Location & Time Subtitle */}
      <View style={s.metaRow}>
        <View style={s.metaItem}>
          <Ionicons name="location-outline" size={15} color={Colors.textMuted} />
          <Text style={s.metaText} maxFontSizeMultiplier={1.3}>
            {vm.location.fullLocationText}
          </Text>
        </View>
        <Text style={s.metaDot}>•</Text>
        <View style={s.metaItem}>
          <Ionicons name="time-outline" size={15} color={Colors.textMuted} />
          <Text style={s.metaText} maxFontSizeMultiplier={1.3}>
            {vm.postedAtLabel}
          </Text>
        </View>
      </View>

      {/* Rates Summary Hero Block */}
      <View style={s.rateBlock} testID="operator-rate-hero-block">
        <Text style={s.rateSummary} maxFontSizeMultiplier={1.3} testID="operator-rate-summary">
          {rateSummary}
        </Text>
        {isNegotiable && (
          <View style={s.negotiableBadge} testID="operator-negotiable-badge">
            <Text style={s.negotiableText} maxFontSizeMultiplier={1.3}>
              قابل للتفاوض
            </Text>
          </View>
        )}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    paddingTop: Spacing.space4,
    paddingBottom: Spacing.space5,
    paddingHorizontal: Spacing.space4,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    ...Shadows.sm,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: lineHeightFor(20),
    fontFamily: 'Cairo-Bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.space2,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.space2,
    marginBottom: Spacing.space3,
  },
  typePill: {
    backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: Spacing.space3,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typePillText: {
    ...RTLText,
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: lineHeightFor(12),
    color: Colors.primary,
    textAlign: 'center',
  },
  expPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: Spacing.space3,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  expPillText: {
    ...RTLText,
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    lineHeight: lineHeightFor(12),
    color: Colors.textMuted,
    textAlign: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.space2,
    marginBottom: Spacing.space3,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    ...RTLText,
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    lineHeight: lineHeightFor(12),
    color: Colors.textMuted,
    textAlign: 'center',
  },
  metaDot: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  rateBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space2,
    backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: Spacing.space4,
    paddingVertical: Spacing.space2,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rateSummary: {
    ...RTLText,
    fontFamily: 'Almarai_700Bold',
    fontSize: 18,
    lineHeight: lineHeightFor(18),
    color: Colors.primary,
    textAlign: 'center',
  },
  negotiableBadge: {
    backgroundColor: Colors.paleMint,
    paddingHorizontal: Spacing.space2,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  negotiableText: {
    ...RTLText,
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    lineHeight: lineHeightFor(11),
    color: Colors.primary,
    textAlign: 'center',
  },
})
