import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { Colors } from '../../../constants/colors'
import { Spacing } from '../../../constants/spacing'
import { Radius } from '../../../constants/radius'
import { lineHeightFor } from '../../../constants/typography'
import type { OperatorChip } from './buildOperatorChips'

export interface OperatorCardChipsProps {
  chips: OperatorChip[]
  hasCertifications?: boolean
  extraCount?: number
}

const CHIP_HEIGHT = 26

/**
 * OperatorCardChips
 * Renders chips on ONE line with a strict budget and no wrapping.
 * Height is fixed to 26pt across all chips. Text truncates gracefully
 * with flexShrink while the +N badge and icons never shrink.
 */
export function OperatorCardChips({
  chips,
  hasCertifications = false,
  extraCount = 0,
}: OperatorCardChipsProps) {
  const certAlreadyInChips = chips.some((c) => c.isCertification || c.key === 'cert')
  const showLegacyCert = Boolean(hasCertifications && !certAlreadyInChips)

  if (chips.length === 0 && !showLegacyCert) return null

  return (
    <View style={s.chipsRow} testID="operator-chips-row">
      {chips.map((chip) => {
        const isCert = Boolean(chip.isCertification || chip.key === 'cert')
        const isType = chip.key === 'type'
        return (
          <View
            key={chip.key}
            style={[s.chip, isCert && s.certChip]}
            testID={`operator-chip-${chip.key}`}
          >
            {isCert ? (
              <Ionicons
                name="ribbon-outline"
                size={11}
                color={Colors.primary}
                style={s.chipIcon}
              />
            ) : chip.isMci ? (
              <MaterialCommunityIcons
                name={chip.icon as any}
                size={11}
                color={Colors.primary}
                style={s.chipIcon}
              />
            ) : (
              <Ionicons
                name={chip.icon as any}
                size={11}
                color={Colors.primary}
                style={s.chipIcon}
              />
            )}
            <Text
              style={[s.chipText, isType && s.typeChipText, isCert && s.certChipText]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {chip.label}
            </Text>
          </View>
        )
      })}

      {showLegacyCert && (
        <View style={[s.chip, s.certChip]} testID="operator-chip-legacy-cert">
          <Ionicons
            name="ribbon-outline"
            size={11}
            color={Colors.primary}
            style={s.chipIcon}
          />
          <Text
            style={[s.chipText, s.certChipText]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            شهادة معتمدة
          </Text>
        </View>
      )}

      {extraCount > 0 && (
        <View style={[s.chip, s.extraChip]} testID="operator-chip-extra">
          <Text style={s.extraChipText} numberOfLines={1}>
            +{extraCount}
          </Text>
        </View>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    overflow: 'hidden',
    alignItems: 'center',
    gap: Spacing.space1,
    marginTop: Spacing.space2,
  },
  chip: {
    height: CHIP_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: Spacing.space2,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    flexShrink: 1,
  },
  chipIcon: {
    flexShrink: 0,
  },
  chipText: {
    flexShrink: 1,
    minWidth: 0,
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    lineHeight: lineHeightFor(11),
    color: Colors.text,
  },
  typeChipText: {
    fontFamily: 'Almarai_700Bold',
    color: Colors.primaryDark,
  },
  certChip: {
    backgroundColor: Colors.paleMint,
    borderColor: Colors.border,
  },
  certChipText: {
    fontFamily: 'Almarai_700Bold',
    color: Colors.primaryDark,
  },
  extraChip: {
    height: CHIP_HEIGHT,
    flexShrink: 0,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  extraChipText: {
    flexShrink: 0,
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: lineHeightFor(11),
    color: Colors.textMuted,
  },
})
