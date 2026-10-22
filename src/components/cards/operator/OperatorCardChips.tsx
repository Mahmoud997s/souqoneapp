import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { Colors } from '../../../constants/colors'
import { Spacing } from '../../../constants/spacing'
import { Radius } from '../../../constants/radius'
import { lineHeightFor } from '../../../constants/typography'

export interface OperatorCardChipsProps {
  chips: Array<{ key: string; label: string; icon: any; isMci?: boolean }>
  hasCertifications: boolean
  extraCount: number
}

/**
 * OperatorCardChips
 * Renders chips for operator type, experience, equipment specializations,
 * verified certification badge, and extra count (+N).
 */
export function OperatorCardChips({
  chips,
  hasCertifications,
  extraCount,
}: OperatorCardChipsProps) {
  if (chips.length === 0 && !hasCertifications) return null

  return (
    <View style={s.chipsRow}>
      {chips.map((chip) => (
        <View key={chip.key} style={s.chip}>
          {chip.isMci ? (
            <MaterialCommunityIcons name={chip.icon} size={11} color={Colors.primary} />
          ) : (
            <Ionicons name={chip.icon} size={11} color={Colors.primary} />
          )}
          <Text style={s.chipText} numberOfLines={1}>
            {chip.label}
          </Text>
        </View>
      ))}

      {hasCertifications && (
        <View style={[s.chip, s.certChip]}>
          <Ionicons name="ribbon-outline" size={11} color={Colors.warning} />
          <Text style={[s.chipText, s.certChipText]} numberOfLines={1}>
            شهادة معتمدة
          </Text>
        </View>
      )}

      {extraCount > 0 && (
        <View style={[s.chip, s.extraChip]}>
          <Text style={s.extraChipText}>+{extraCount}</Text>
        </View>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.space1,
    marginTop: Spacing.space2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: Spacing.space2,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 10.5,
    lineHeight: lineHeightFor(10.5),
    color: Colors.text,
  },
  certChip: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
  },
  certChipText: {
    fontFamily: 'Almarai_700Bold',
    color: Colors.warning,
  },
  extraChip: {
    paddingHorizontal: 5,
  },
  extraChipText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 9.5,
    color: Colors.textMuted,
  },
})
