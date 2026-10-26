import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../../constants/colors'
import { Spacing } from '../../../constants/spacing'
import { Radius } from '../../../constants/radius'
import { Shadows } from '../../../constants/shadows'
import { RTLText } from '../../../constants/rtl'
import { lineHeightFor } from '../../../constants/typography'
import type {
  OperatorCertificationItem,
  OperatorEquipmentTypeChip,
} from '../../../types/operatorDetailViewModel.types'
import { OperatorCertificationsList } from './OperatorCertificationsList'

export interface OperatorCertificationsCardProps {
  equipmentTypes?: OperatorEquipmentTypeChip[]
  certifications?: OperatorCertificationItem[]
  specializations?: string[]
  onPressCertificate?: (imageUrl: string) => void
}

/**
 * OperatorCertificationsCard
 * ONE merged block for operator specializations and professional credentials:
 * - Section 1: 'المعدات المعتمد عليها' (equipment chips, non-interactive)
 * - Section 2: 'التخصصات' (specializations chips)
 * - Section 3: 'الشهادات والمستندات' (delegated to OperatorCertificationsList)
 * - Renders null if all sections are empty
 */
export function OperatorCertificationsCard({
  equipmentTypes = [],
  certifications = [],
  specializations = [],
  onPressCertificate,
}: OperatorCertificationsCardProps) {
  const hasEquipment = equipmentTypes.length > 0
  const hasCertifications = certifications.length > 0
  const hasSpecializations = specializations.length > 0

  if (!hasEquipment && !hasCertifications && !hasSpecializations) {
    return null
  }

  return (
    <View style={s.card} testID="operator-certifications-card">
      <Text style={s.cardTitle} maxFontSizeMultiplier={1.3}>
        التخصصات والشهادات
      </Text>

      {/* Equipment Types Section */}
      {hasEquipment && (
        <View style={s.section} testID="operator-equipment-types-section">
          <Text style={s.sectionHeader} maxFontSizeMultiplier={1.3}>
            المعدات المعتمد عليها
          </Text>
          <View style={s.chipsWrap}>
            {equipmentTypes.map((eq) => (
              <View key={eq.value} style={s.chip} testID={`operator-eq-chip-${eq.value}`}>
                <Ionicons name="construct-outline" size={14} color={Colors.primary} />
                <Text style={s.chipText} maxFontSizeMultiplier={1.3}>
                  {eq.label}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Specializations Section */}
      {hasSpecializations && (
        <View style={s.section} testID="operator-specializations-section">
          <Text style={s.sectionHeader} maxFontSizeMultiplier={1.3}>
            التخصصات
          </Text>
          <View style={s.chipsWrap}>
            {specializations.map((spec, idx) => (
              <View key={`spec-${idx}`} style={s.specChip} testID={`operator-spec-chip-${idx}`}>
                <Text style={s.specChipText} maxFontSizeMultiplier={1.3}>
                  {spec}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Certifications Section */}
      {hasCertifications && (
        <View style={s.section} testID="operator-certs-section">
          <Text style={s.sectionHeader} maxFontSizeMultiplier={1.3}>
            الشهادات والمستندات
          </Text>
          <OperatorCertificationsList
            certifications={certifications}
            onPressCertificate={onPressCertificate}
          />
        </View>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.space4,
    marginVertical: Spacing.space2,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.space4,
    ...Shadows.sm,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.space3,
    writingDirection: RTLText.writingDirection,
    lineHeight: lineHeightFor(16),
  },
  section: {
    marginTop: Spacing.space2,
    marginBottom: Spacing.space2,
  },
  sectionHeader: {
    fontSize: 13,
    fontFamily: 'Almarai_700Bold',
    color: Colors.textMuted,
    marginBottom: Spacing.space2,
    writingDirection: RTLText.writingDirection,
    textAlign: 'left',
    lineHeight: lineHeightFor(13),
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.space2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space1,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.space3,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    lineHeight: lineHeightFor(12),
    color: Colors.text,
    writingDirection: RTLText.writingDirection,
    textAlign: 'left',
  },
  specChip: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.space3,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  specChipText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    lineHeight: lineHeightFor(12),
    color: Colors.textMuted,
    writingDirection: RTLText.writingDirection,
    textAlign: 'left',
  },
})
