import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../../constants/colors'
import { Spacing } from '../../../constants/spacing'
import { Radius } from '../../../constants/radius'
import { RTLText } from '../../../constants/rtl'
import { lineHeightFor } from '../../../constants/typography'
import type { OperatorCertificationItem } from '../../../types/operatorDetailViewModel.types'

export interface OperatorCertificationsListProps {
  certifications: OperatorCertificationItem[]
  onPressCertificate?: (imageUrl: string) => void
}

/**
 * OperatorCertificationsList
 * Presentational list of certification items:
 * - Document thumbnail with tap-to-preview
 * - Text badge with ribbon icon for non-document certifications
 */
export function OperatorCertificationsList({
  certifications,
  onPressCertificate,
}: OperatorCertificationsListProps) {
  return (
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
  )
}

const s = StyleSheet.create({
  certsList: {
    gap: Spacing.space2,
  },
  docItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space3,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.md,
    padding: Spacing.space2,
    borderWidth: 1,
    borderColor: Colors.border,
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
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    lineHeight: lineHeightFor(13),
    color: Colors.text,
    writingDirection: RTLText.writingDirection,
    textAlign: 'left',
  },
  docHint: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    lineHeight: lineHeightFor(11),
    color: Colors.primary,
    writingDirection: RTLText.writingDirection,
    textAlign: 'left',
    marginTop: 2,
  },
  textCertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space2,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.space3,
    paddingVertical: Spacing.space2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textCertLabel: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 13,
    lineHeight: lineHeightFor(13),
    color: Colors.text,
    writingDirection: RTLText.writingDirection,
    textAlign: 'left',
  },
})
