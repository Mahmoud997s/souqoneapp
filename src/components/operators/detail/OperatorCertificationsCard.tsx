import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native'
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

export interface OperatorCertificationsCardProps {
  equipmentTypes?: OperatorEquipmentTypeChip[]
  certifications?: OperatorCertificationItem[]
  specializations?: string[]
  onPressCertificate?: (imageUrl: string) => void
}

/**
 * OperatorCertificationsCard
 * Displays certified equipment and professional credentials:
 * - Section 1: 'المعدات المعتمد عليها' (equipment chips, non-interactive)
 * - Section 2: 'الشهادات والمستندات' (text certifications & tappable document thumbnails)
 * - Section 3: 'التخصصات' (chips when present)
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
        الاعتمادات والمؤهلات
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
          <View style={s.certsList}>
            {certifications.map((cert) => {
              if (cert.isDocument && cert.imageUrl) {
                return (
                  <TouchableOpacity
                    key={cert.key}
                    style={s.docItem}
                    activeOpacity={0.8}
                    onPress={() => onPressCertificate?.(cert.imageUrl!)}
                    testID={`operator-cert-doc-${cert.key}`}
                    accessibilityRole="button"
                    accessibilityLabel={cert.label}
                  >
                    <Image
                      source={{ uri: cert.imageUrl }}
                      style={s.docThumb}
                      resizeMode="cover"
                    />
                    <View style={s.docMeta}>
                      <Text style={s.docLabel} maxFontSizeMultiplier={1.3} numberOfLines={1}>
                        {cert.label}
                      </Text>
                      <Text style={s.docHint} maxFontSizeMultiplier={1.3}>
                        اضغط للمعاينة
                      </Text>
                    </View>
                    <Ionicons name="eye-outline" size={20} color={Colors.primary} />
                  </TouchableOpacity>
                )
              }

              return (
                <View key={cert.key} style={s.textCertItem} testID={`operator-cert-text-${cert.key}`}>
                  <Ionicons name="ribbon-outline" size={18} color={Colors.primary} />
                  <Text style={s.textCertLabel} maxFontSizeMultiplier={1.3}>
                    {cert.label}
                  </Text>
                </View>
              )
            })}
          </View>
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
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: Spacing.space2,
    writingDirection: RTLText.writingDirection,
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
    paddingHorizontal: Spacing.space3,
    paddingVertical: Spacing.space1,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipText: {
    fontSize: 13,
    color: Colors.text,
    writingDirection: RTLText.writingDirection,
    lineHeight: lineHeightFor(13),
  },
  specChip: {
    backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: Spacing.space3,
    paddingVertical: Spacing.space1,
    borderRadius: Radius.pill,
  },
  specChipText: {
    fontSize: 12,
    color: Colors.textMuted,
    writingDirection: RTLText.writingDirection,
    lineHeight: lineHeightFor(12),
  },
  certsList: {
    gap: Spacing.space2,
  },
  docItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space3,
    padding: Spacing.space2,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 52,
  },
  docThumb: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
    backgroundColor: Colors.border,
  },
  docMeta: {
    flex: 1,
  },
  docLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    writingDirection: RTLText.writingDirection,
    lineHeight: lineHeightFor(13),
  },
  docHint: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
    writingDirection: RTLText.writingDirection,
    lineHeight: lineHeightFor(11),
  },
  textCertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space2,
    paddingVertical: Spacing.space2,
    paddingHorizontal: Spacing.space2,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.md,
  },
  textCertLabel: {
    fontSize: 13,
    color: Colors.text,
    flex: 1,
    writingDirection: RTLText.writingDirection,
    lineHeight: lineHeightFor(13),
  },
})
