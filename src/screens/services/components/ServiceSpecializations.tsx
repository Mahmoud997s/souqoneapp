import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../../constants/colors'
import { Spacing } from '../../../constants/spacing'
import { Radius } from '../../../constants/radius'
import { Shadows } from '../../../constants/shadows'

export interface ServiceSpecializationsProps {
  specializations: string[]
}

/**
 * ServiceSpecializations
 * Renders technical specializations and service tags in a clean chip grid.
 */
export function ServiceSpecializations({
  specializations,
}: ServiceSpecializationsProps) {
  if (!Array.isArray(specializations) || specializations.length === 0) {
    return null
  }

  return (
    <View style={s.card} testID="service-specializations-card">
      <View style={s.headerRow}>
        <View style={s.iconCircle}>
          <Ionicons name="build-outline" size={18} color={Colors.primary} />
        </View>
        <Text style={s.title}>التخصصات والخدمات المقدمة</Text>
      </View>

      <View style={s.chipsWrap}>
        {specializations.map((spec, idx) => (
          <View key={idx} style={s.specChip}>
            <Ionicons
              name="checkmark-circle"
              size={15}
              color={Colors.success}
            />
            <Text style={s.specText}>{spec}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.space4,
    marginHorizontal: Spacing.space4,
    marginVertical: Spacing.space2,
    gap: Spacing.space3,
    ...Shadows.card,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space2,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    backgroundColor: Colors.paleMint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'Almarai_700Bold',
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.space2,
  },
  specChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space1,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.space3,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  specText: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'Almarai_700Bold',
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
})
