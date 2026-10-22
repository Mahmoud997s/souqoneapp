import React from 'react'
import { View, Text, StyleSheet, Image } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../../constants/colors'
import { Spacing } from '../../../constants/spacing'
import { Radius } from '../../../constants/radius'
import { Shadows } from '../../../constants/shadows'
import { RTLText } from '../../../constants/rtl'
import { lineHeightFor } from '../../../constants/typography'
import type { OperatorDetailViewModel } from '../../../types/operatorDetailViewModel.types'

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
      <View style={s.avatarContainer}>
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={s.avatarImage}
            resizeMode="cover"
            testID="operator-avatar-image"
            accessibilityRole="image"
            accessibilityLabel="صورة المشغل"
          />
        ) : (
          <View style={s.avatarFallback} testID="operator-avatar-fallback">
            <Ionicons name="person" size={44} color={Colors.primary} />
          </View>
        )}

        {vm.seller.isVerified && (
          <View
            style={s.verifiedBadge}
            testID="operator-verified-badge"
            accessibilityLabel="حساب موثق"
          >
            <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
          </View>
        )}
      </View>

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
  avatarContainer: {
    position: 'relative',
    marginBottom: Spacing.space3,
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: Radius.pill,
    borderWidth: 3,
    borderColor: Colors.surface,
    backgroundColor: Colors.surfaceAlt,
  },
  avatarFallback: {
    width: 96,
    height: 96,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: Colors.surface,
    borderRadius: Radius.pill,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.space2,
    lineHeight: lineHeightFor(20),
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.space2,
    marginBottom: Spacing.space3,
  },
  typePill: {
    backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: Spacing.space3,
    paddingVertical: Spacing.space1,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typePillText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
    lineHeight: lineHeightFor(13),
  },
  expPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space1,
    backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: Spacing.space3,
    paddingVertical: Spacing.space1,
    borderRadius: Radius.pill,
  },
  expPillText: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: lineHeightFor(12),
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
    gap: Spacing.space1,
  },
  metaText: {
    fontSize: 12,
    color: Colors.textMuted,
    writingDirection: RTLText.writingDirection,
    lineHeight: lineHeightFor(12),
  },
  metaDot: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  rateBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.space2,
    marginTop: Spacing.space1,
    paddingHorizontal: Spacing.space3,
    paddingVertical: Spacing.space2,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.md,
  },
  rateSummary: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
    textAlign: 'center',
    lineHeight: lineHeightFor(18),
  },
  negotiableBadge: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.space2,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  negotiableText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
    lineHeight: lineHeightFor(11),
  },
})
