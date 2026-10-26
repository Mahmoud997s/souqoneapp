import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../../constants/colors'
import { Spacing } from '../../../constants/spacing'
import { Radius } from '../../../constants/radius'
import { lineHeightFor } from '../../../constants/typography'
import type { OperatorDetailViewModel } from '../../../types/operatorDetailViewModel.types'
import { OperatorAvatarBlock } from './OperatorAvatarBlock'

export interface OperatorHeroHeaderProps {
  vm: OperatorDetailViewModel
}

/**
 * OperatorHeroHeader
 * Profile-style hero header for operator detail page.
 * - Circular avatar with verified badge
 * - Strong operator name (Almarai)
 * - Role / specialty line
 * - Location (city/region)
 * - 2-3 real stat chips in ONE row (experience, rate, equipment)
 * - Strict absence of listing-style price box and ad badges
 */
export function OperatorHeroHeader({ vm }: OperatorHeroHeaderProps) {
  const avatarUrl = vm.profileImageUrl || vm.seller.avatarUrl
  const hasExperience = Boolean(vm.experienceYearsLabel)
  const hasRate = Boolean(vm.rates?.hasAnyRate)
  const hasEquipment = Boolean(vm.equipmentTypes && vm.equipmentTypes.length > 0)
  const isNegotiable = Boolean(vm.rates?.isNegotiable)

  return (
    <View style={s.container} testID="operator-hero-header">
      {/* Avatar with Verified Badge */}
      <OperatorAvatarBlock
        avatarUrl={avatarUrl}
        isVerified={vm.seller.isVerified}
      />

      {/* Operator Name */}
      <Text style={s.name} maxFontSizeMultiplier={1.3} testID="operator-title">
        {vm.title}
      </Text>

      {/* Role / Specialty Subtitle */}
      <View style={s.roleContainer} testID="operator-type-pill">
        <Text style={s.roleText} maxFontSizeMultiplier={1.3}>
          {vm.operatorTypeLabel}
        </Text>
      </View>

      {/* Location & Time Row */}
      <View style={s.metaRow} testID="operator-location">
        <Ionicons name="location-outline" size={15} color={Colors.textMuted} />
        <Text style={s.metaText} maxFontSizeMultiplier={1.3}>
          {vm.location.fullLocationText}
        </Text>
        {Boolean(vm.postedAtLabel) && (
          <>
            <Text style={s.metaDot}>•</Text>
            <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
            <Text style={s.metaText} maxFontSizeMultiplier={1.3}>
              {vm.postedAtLabel}
            </Text>
          </>
        )}
      </View>

      {/* Real Stat Chips in ONE row */}
      {(hasExperience || hasRate || hasEquipment) && (
        <View style={s.statChipsRow} testID="operator-stat-chips-row">
          {/* Experience Stat Chip */}
          {hasExperience && (
            <View style={s.statChip} testID="operator-experience-pill">
              <Ionicons name="briefcase-outline" size={14} color={Colors.primary} />
              <Text style={s.statChipText} maxFontSizeMultiplier={1.3}>
                {vm.experienceYearsLabel}
              </Text>
            </View>
          )}

          {/* Rate Stat Chip */}
          {hasRate && (
            <View style={s.statChip} testID="operator-stat-rate">
              <Ionicons name="cash-outline" size={14} color={Colors.primary} />
              <Text style={s.statChipText} maxFontSizeMultiplier={1.3}>
                {vm.rates.primaryLabel}
              </Text>
            </View>
          )}

          {/* Negotiable Indicator Badge if flagged */}
          {isNegotiable && (
            <View style={s.negotiableBadge} testID="operator-negotiable-badge">
              <Text style={s.negotiableText} maxFontSizeMultiplier={1.3}>
                قابل للتفاوض
              </Text>
            </View>
          )}

          {/* Primary Equipment Stat Chip */}
          {hasEquipment && (
            <View style={s.statChip} testID="operator-stat-equipment">
              <Ionicons name="construct-outline" size={14} color={Colors.primary} />
              <Text style={s.statChipText} maxFontSizeMultiplier={1.3}>
                {vm.equipmentTypes[0].label}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    paddingTop: Spacing.space5,
    paddingBottom: Spacing.space4,
    paddingHorizontal: Spacing.space4,
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  name: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 22,
    lineHeight: lineHeightFor(22),
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.space1,
  },
  roleContainer: {
    marginBottom: Spacing.space2,
  },
  roleText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 15,
    lineHeight: lineHeightFor(15),
    color: Colors.textMuted,
    textAlign: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.space1,
    marginBottom: Spacing.space4,
  },
  metaDot: {
    color: Colors.textMuted,
    marginHorizontal: Spacing.space1,
    fontSize: 12,
  },
  metaText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 13,
    lineHeight: lineHeightFor(13),
    color: Colors.textMuted,
  },
  statChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.space2,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space1,
    backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: Spacing.space3,
    paddingVertical: Spacing.space2,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statChipText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    lineHeight: lineHeightFor(13),
    color: Colors.text,
  },
  negotiableBadge: {
    backgroundColor: Colors.paleMint,
    paddingHorizontal: Spacing.space2,
    paddingVertical: Spacing.space1,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  negotiableText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: lineHeightFor(11),
    color: Colors.primary,
  },
})
