import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'
import { Shadows } from '../../constants/shadows'
import type { SpecSectionView } from '../../types/carDetailViewModel.types'
import { RTLText } from '../../constants/rtl'
import { lineHeightFor } from '../../constants/typography'

export interface SpecsSectionsProps {
  sections: SpecSectionView[]
}

/**
 * SpecsSections
 * Presentational sections displaying grouped vehicle technical specifications.
 * Strictly skips rendering any section if its items array is empty.
 * A section whose items all have an empty `value` is a chips section (e.g. features):
 * each item renders as a small chip with its optional Ionicons `icon` and its `label`.
 */
export function SpecsSections({ sections }: SpecsSectionsProps) {
  // Filter out any sections that have no items
  const validSections = sections.filter(
    (section) => section.items && section.items.length > 0
  )

  if (validSections.length === 0) {
    return null
  }

  return (
    <View style={s.container}>
      {validSections.map((section, sIndex) => (
        <View key={sIndex} style={s.card}>
          <Text style={s.sectionTitle}>{section.title}</Text>

          {section.items.every((item) => item.value === '') ? (
            <View style={s.chipsContainer}>
              {section.items.map((item, iIndex) => (
                <View key={item.key || iIndex} style={s.chip}>
                  <Ionicons
                    name={(item.icon as keyof typeof Ionicons.glyphMap) ?? 'checkmark-circle-outline'}
                    size={14}
                    color={Colors.primary}
                  />
                  <Text style={s.chipText}>{item.label}</Text>
                </View>
              ))}
            </View>
          ) : (
          <View style={s.itemsContainer}>
            {section.items.map((item, iIndex) => (
              <View
                key={item.key || iIndex}
                style={[
                  s.specRow,
                  iIndex < section.items.length - 1 && s.specRowBorder,
                ]}
              >
                <Text style={s.specLabel}>{item.label}</Text>
                <Text style={s.specValue}>{item.value}</Text>
              </View>
            ))}
          </View>
          )}
        </View>
      ))}
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.space4,
    marginVertical: Spacing.space2,
    gap: Spacing.space3,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.space4,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  sectionTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 16,
    lineHeight: lineHeightFor(16),
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
    marginBottom: Spacing.space3,
  },
  itemsContainer: {
    gap: 0,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.space2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space1,
    backgroundColor: Colors.paleMint,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
    paddingHorizontal: Spacing.space3,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  chipText: {
    ...RTLText,
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: lineHeightFor(12),
    color: Colors.text,
  },
  specRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.space2,
  },
  specRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  specLabel: {
    ...RTLText,
    fontFamily: 'Almarai_400Regular',
    fontSize: 13,
    lineHeight: lineHeightFor(13),
    color: Colors.textMuted,
  },
  specValue: {
    ...RTLText,
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    lineHeight: lineHeightFor(13),
    color: Colors.text,
    textAlign: 'left',
  },
})
