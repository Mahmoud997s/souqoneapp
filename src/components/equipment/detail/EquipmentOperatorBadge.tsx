import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../../constants/colors'
import { Spacing } from '../../../constants/spacing'
import { Radius } from '../../../constants/radius'
import { RTLText } from '../../../constants/rtl'
import { lineHeightFor } from '../../../constants/typography'
import type { EquipmentOperatorBadge as EquipmentOperatorBadgeType } from '../../../types/equipmentDetailViewModel.types'

export interface EquipmentOperatorBadgeProps {
  badge: EquipmentOperatorBadgeType | null
}

/**
 * EquipmentOperatorBadge
 * Renders an operator status pill for equipment rentals.
 * - 'with': positive tone pill (operator provided)
 * - 'without': neutral tone pill (operator not provided / self-operated)
 * - null: renders nothing
 */
export function EquipmentOperatorBadge({ badge }: EquipmentOperatorBadgeProps) {
  if (!badge) {
    return null
  }

  const isWithOperator = badge.kind === 'with'

  return (
    <View
      style={[
        s.badge,
        isWithOperator ? s.badgePositive : s.badgeNeutral,
      ]}
      testID="equipment-operator-badge"
      accessibilityRole="text"
      accessibilityLabel={badge.label}
    >
      <Ionicons
        name={isWithOperator ? 'person' : 'person-outline'}
        size={14}
        color={isWithOperator ? Colors.primary : Colors.textMuted}
      />
      <Text
        style={[
          s.label,
          isWithOperator ? s.labelPositive : s.labelNeutral,
        ]}
        maxFontSizeMultiplier={1.3}
      >
        {badge.label}
      </Text>
    </View>
  )
}

const s = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.space1,
    paddingHorizontal: Spacing.space3,
    paddingVertical: Spacing.space1,
    borderRadius: Radius.pill,
    borderWidth: 1,
    minHeight: 28,
  },
  badgePositive: {
    backgroundColor: Colors.paleMint,
    borderColor: Colors.borderStrong,
  },
  badgeNeutral: {
    backgroundColor: Colors.surfaceAlt,
    borderColor: Colors.border,
  },
  label: {
    ...RTLText,
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: lineHeightFor(12),
    textAlign: 'left',
  },
  labelPositive: {
    color: Colors.primaryDeep,
  },
  labelNeutral: {
    color: Colors.textMuted,
  },
})
