import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../../constants/colors'
import { Spacing } from '../../../constants/spacing'
import { Radius } from '../../../constants/radius'
import { Shadows } from '../../../constants/shadows'
import { RTLText } from '../../../constants/rtl'
import { lineHeightFor } from '../../../constants/typography'
import type { OperatorRatesView } from '../../../types/operatorDetailViewModel.types'

export interface OperatorRatesCardProps {
  rates: OperatorRatesView
}

/**
 * OperatorRatesCard
 * Displays operator wage rates breakdown:
 * - Title: 'الأجور'
 * - Daily rate row (primary) when dailyRateFormatted is present
 * - Hourly rate row (secondary) when hourlyRateFormatted is present
 * - Negotiable notice note
 * - Fallback: 'السعر عند التواصل' when hasAnyRate is false
 */
export function OperatorRatesCard({ rates }: OperatorRatesCardProps) {
  const hasDaily = Boolean(rates.dailyRateFormatted)
  const hasHourly = Boolean(rates.hourlyRateFormatted)

  return (
    <View style={s.card} testID="operator-rates-card">
      <Text style={s.cardTitle} maxFontSizeMultiplier={1.3}>
        الأجور
      </Text>

      {!rates.hasAnyRate && (
        <View style={s.noRateRow} testID="operator-rates-empty">
          <Ionicons name="pricetag-outline" size={18} color={Colors.textMuted} />
          <Text style={s.noRateText} maxFontSizeMultiplier={1.3}>
            السعر عند التواصل
          </Text>
        </View>
      )}

      {rates.hasAnyRate && (
        <View style={s.ratesContainer}>
          {hasDaily && (
            <View style={s.rateRow} testID="operator-daily-rate-row">
              <View style={s.labelCol}>
                <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
                <Text style={s.rateTypeLabel} maxFontSizeMultiplier={1.3}>
                  الأجر اليومي
                </Text>
              </View>
              <View style={s.rateBadge} testID="operator-daily-rate-badge">
                <Text style={s.rateValuePrimary} maxFontSizeMultiplier={1.3} testID="operator-daily-rate-value">
                  {rates.dailyRateFormatted}
                </Text>
              </View>
            </View>
          )}

          {hasHourly && (
            <View style={s.rateRow} testID="operator-hourly-rate-row">
              <View style={s.labelCol}>
                <Ionicons name="time-outline" size={18} color={Colors.primary} />
                <Text style={s.rateTypeLabel} maxFontSizeMultiplier={1.3}>
                  الأجر بالساعة
                </Text>
              </View>
              <View style={s.rateBadge} testID="operator-hourly-rate-badge">
                <Text style={s.rateValueSecondary} maxFontSizeMultiplier={1.3} testID="operator-hourly-rate-value">
                  {rates.hourlyRateFormatted}
                </Text>
              </View>
            </View>
          )}

          {rates.isNegotiable && (
            <View style={s.negotiableNoteRow} testID="operator-rates-negotiable-note">
              <Ionicons name="information-circle-outline" size={16} color={Colors.textMuted} />
              <Text style={s.negotiableNoteText} maxFontSizeMultiplier={1.3}>
                الأسعار قابلة للتفاوض حسب مدة العمل وطبيعة الموقع
              </Text>
            </View>
          )}
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
    fontFamily: 'Almarai_700Bold',
    fontSize: 16,
    color: Colors.text,
    marginBottom: Spacing.space3,
    writingDirection: RTLText.writingDirection,
    lineHeight: lineHeightFor(16),
  },
  ratesContainer: {
    gap: Spacing.space3,
  },
  rateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.space2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  labelCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space2,
  },
  rateTypeLabel: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 14,
    color: Colors.textMuted,
    writingDirection: RTLText.writingDirection,
    lineHeight: lineHeightFor(14),
  },
  rateBadge: {
    backgroundColor: Colors.paleMint,
    borderWidth: 1,
    borderColor: Colors.primaryHex30,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.space3,
    paddingVertical: Spacing.space1 + 2,
  },
  rateValuePrimary: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 15,
    color: Colors.primary,
    lineHeight: lineHeightFor(15),
  },
  rateValueSecondary: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 15,
    color: Colors.primary,
    lineHeight: lineHeightFor(15),
  },
  negotiableNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space1,
    marginTop: Spacing.space1,
  },
  negotiableNoteText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    flex: 1,
    writingDirection: RTLText.writingDirection,
    lineHeight: lineHeightFor(12),
  },
  noRateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space2,
    paddingVertical: Spacing.space2,
  },
  noRateText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 14,
    color: Colors.textMuted,
    writingDirection: RTLText.writingDirection,
    lineHeight: lineHeightFor(14),
  },
})
