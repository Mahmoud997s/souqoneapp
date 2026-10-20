import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../../constants/colors'
import { Spacing } from '../../../constants/spacing'
import { Radius } from '../../../constants/radius'
import { Shadows } from '../../../constants/shadows'
import { RTLText } from '../../../constants/rtl'
import { BusContractView } from '../../../types/busDetailViewModel.types'
import { PriceView } from '../../../types/listingDetail.types'
import { BusListingType } from '../../../types/bus.types'
import { formatNumberWestern } from '../../../utils/listing-detail/formatters'
import { computeBusContractEstimate } from '../../../utils/listing-detail/computeBusContractEstimate'

export interface BusContractSectionProps {
  contract: BusContractView
  price?: PriceView
  busListingType: BusListingType
  onRequireLogin: () => void
  now?: Date
}

function formatExpiryDate(isoDate?: string): string | undefined {
  if (!isoDate) return undefined
  const date = new Date(isoDate)
  if (isNaN(date.getTime())) return undefined
  const year = date.getUTCFullYear()
  const month = date.getUTCMonth() + 1
  const day = date.getUTCDate()
  return `${year}/${month < 10 ? '0' + month : month}/${day < 10 ? '0' + day : day}`
}

export function BusContractSection({
  contract,
  price,
  busListingType,
  onRequireLogin,
  now,
}: BusContractSectionProps) {
  if (contract.access === 'hidden') {
    return null
  }

  if (contract.access === 'locked') {
    return (
      <View style={s.card}>
        <View style={s.headerRow}>
          <View style={s.iconBadge}>
            <Ionicons name="lock-closed-outline" size={20} color={Colors.primary} />
          </View>
          <View style={s.headerTextWrap}>
            <Text style={s.cardTitle} maxFontSizeMultiplier={1.3}>
              عقد التشغيل
            </Text>
            {contract.typeLabel ? (
              <Text style={s.cardSub} maxFontSizeMultiplier={1.3}>
                {contract.typeLabel}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={s.lockedContent}>
          <Text style={s.lockedNotice} maxFontSizeMultiplier={1.3}>
            سجّل الدخول لعرض تفاصيل عقد التشغيل
          </Text>
          <TouchableOpacity
            style={s.loginButton}
            onPress={onRequireLogin}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="تسجيل الدخول"
          >
            <Ionicons name="log-in-outline" size={18} color={Colors.white} />
            <Text style={s.loginButtonText} maxFontSizeMultiplier={1.3}>
              تسجيل الدخول
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  // Visible contract state
  const referenceNow = now ?? new Date()
  const estimate = computeBusContractEstimate(
    {
      busListingType,
      price: price?.amount,
      monthlyIncome: contract.monthlyIncome,
      durationMonths: contract.durationMonths,
      expiryIso: contract.expiryIso,
    },
    referenceNow
  )

  const formattedExpiry = formatExpiryDate(contract.expiryIso)

  return (
    <View style={s.card}>
      {/* Header */}
      <View style={s.headerRow}>
        <View style={s.iconBadge}>
          <Ionicons name="document-text-outline" size={20} color={Colors.primary} />
        </View>
        <View style={s.headerTextWrap}>
          <Text style={s.cardTitle} maxFontSizeMultiplier={1.3}>
            عقد التشغيل
          </Text>
          {contract.typeLabel ? (
            <Text style={s.cardSub} maxFontSizeMultiplier={1.3}>
              {contract.typeLabel}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Contract Terms Grid */}
      <View style={s.termsList}>
        {contract.typeLabel ? (
          <View style={s.termRow}>
            <Text style={s.termLabel} maxFontSizeMultiplier={1.3}>نوع العقد</Text>
            <Text style={s.termValue} maxFontSizeMultiplier={1.3}>{contract.typeLabel}</Text>
          </View>
        ) : null}

        {contract.clientName ? (
          <View style={s.termRow}>
            <Text style={s.termLabel} maxFontSizeMultiplier={1.3}>جهة التعاقد</Text>
            <Text style={s.termValue} maxFontSizeMultiplier={1.3}>{contract.clientName}</Text>
          </View>
        ) : null}

        <View style={s.termRow}>
          <Text style={s.termLabel} maxFontSizeMultiplier={1.3}>السائق</Text>
          <Text style={s.termValue} maxFontSizeMultiplier={1.3}>
            {contract.withDriver ? 'مع سائق' : 'بدون سائق'}
          </Text>
        </View>

        <View style={s.termRow}>
          <Text style={s.termLabel} maxFontSizeMultiplier={1.3}>الدخل الشهري</Text>
          <Text style={s.termValuePrimary} maxFontSizeMultiplier={1.3}>
            {formatNumberWestern(contract.monthlyIncome)} ر.ع
          </Text>
        </View>

        {contract.durationMonths ? (
          <View style={s.termRow}>
            <Text style={s.termLabel} maxFontSizeMultiplier={1.3}>مدة العقد الأصلية</Text>
            <Text style={s.termValue} maxFontSizeMultiplier={1.3}>
              {formatNumberWestern(contract.durationMonths)} شهر
            </Text>
          </View>
        ) : null}

        {formattedExpiry ? (
          <View style={s.termRow}>
            <Text style={s.termLabel} maxFontSizeMultiplier={1.3}>تاريخ الانتهاء</Text>
            <Text style={s.termValue} maxFontSizeMultiplier={1.3}>{formattedExpiry}</Text>
          </View>
        ) : null}
      </View>

      {/* Financial Estimates Grid (shown only if values exist) */}
      {(estimate.remainingIncome !== null ||
        estimate.annualYieldPercent !== null ||
        estimate.paybackMonths !== null) && (
        <View style={s.estimatesContainer}>
          <View style={s.tilesRow}>
            {estimate.remainingIncome !== null ? (
              <View style={s.tile}>
                <Text style={s.tileLabel} maxFontSizeMultiplier={1.3}>
                  إجمالي الدخل المتبقي
                </Text>
                <Text style={s.tileValue} maxFontSizeMultiplier={1.3}>
                  {formatNumberWestern(estimate.remainingIncome)} ر.ع
                </Text>
                {estimate.recoveryPercent !== null ? (
                  <Text style={s.tileSub} maxFontSizeMultiplier={1.3}>
                    نسبة الاسترداد: {formatNumberWestern(estimate.recoveryPercent)}%
                  </Text>
                ) : null}
              </View>
            ) : null}

            {estimate.annualYieldPercent !== null ? (
              <View style={s.tile}>
                <Text style={s.tileLabel} maxFontSizeMultiplier={1.3}>
                  العائد السنوي
                </Text>
                <Text style={s.tileValue} maxFontSizeMultiplier={1.3}>
                  {estimate.annualYieldPercent}%
                </Text>
              </View>
            ) : null}

            {estimate.paybackMonths !== null ? (
              <View style={s.tile}>
                <Text style={s.tileLabel} maxFontSizeMultiplier={1.3}>
                  مدة السداد
                </Text>
                <Text style={s.tileValue} maxFontSizeMultiplier={1.3}>
                  {formatNumberWestern(estimate.paybackMonths)} شهر
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      )}

      {/* Mandatory Disclaimer Note */}
      <Text style={s.disclaimerText} maxFontSizeMultiplier={1.3}>
        تقدير مبني على إجمالي دخل العقد المتبقي، ولا يشمل التكاليف التشغيلية
      </Text>
    </View>
  )
}

const s = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.space4,
    marginHorizontal: Spacing.space4,
    marginVertical: Spacing.space2,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space3,
    marginBottom: Spacing.space4,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.paleMint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrap: {
    flex: 1,
    alignItems: 'flex-start',
  },
  cardTitle: {
    ...RTLText,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  cardSub: {
    ...RTLText,
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  lockedContent: {
    alignItems: 'center',
    paddingVertical: Spacing.space4,
    gap: Spacing.space3,
  },
  lockedNotice: {
    ...RTLText,
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.space2,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.space2,
    paddingHorizontal: Spacing.space5,
    minHeight: Spacing.touch,
  },
  loginButtonText: {
    ...RTLText,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  termsList: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.space3,
    gap: Spacing.space2,
  },
  termRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.space1,
  },
  termLabel: {
    ...RTLText,
    fontSize: 13,
    color: Colors.textMuted,
  },
  termValue: {
    ...RTLText,
    fontSize: 13,
    fontWeight: '500',
    color: Colors.text,
  },
  termValuePrimary: {
    ...RTLText,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  estimatesContainer: {
    marginTop: Spacing.space3,
    paddingTop: Spacing.space3,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  tilesRow: {
    flexDirection: 'row',
    gap: Spacing.space2,
  },
  tile: {
    flex: 1,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.md,
    padding: Spacing.space2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tileLabel: {
    ...RTLText,
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 4,
  },
  tileValue: {
    ...RTLText,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  tileSub: {
    ...RTLText,
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
  disclaimerText: {
    ...RTLText,
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.space3,
    lineHeight: 16,
  },
})
