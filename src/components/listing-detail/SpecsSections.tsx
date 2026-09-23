import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'
import { Shadows } from '../../constants/shadows'
import type { SpecSectionView } from '../../types/carDetailViewModel.types'

export interface SpecsSectionsProps {
  sections: SpecSectionView[]
}

/**
 * SpecsSections
 * Presentational sections displaying grouped vehicle technical specifications.
 * Strictly skips rendering any section if its items array is empty.
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
        </View>
      ))}
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.space4,
    marginVertical: Spacing.space2,
    gap: Spacing.space2,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.space3,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  sectionTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 14,
    lineHeight: 19,
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
    marginBottom: Spacing.space2,
  },
  itemsContainer: {
    gap: 0,
  },
  specRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  specRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  specLabel: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.textMuted,
  },
  specValue: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.text,
    textAlign: 'left',
  },
})
