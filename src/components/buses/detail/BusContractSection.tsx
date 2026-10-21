import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated'
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
import { useAppReducedMotion } from '../../../utils/listing-detail/useAppReducedMotion'
import { BusContractLockedCard } from './BusContractLockedCard'

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

/**
 * BusContractSection (Variant C)
 * Collapsible commercial bus operating contract card.
 *
 * Visible above the fold:
 * - Monthly income and remaining contract income
 * - % of price and remaining duration
 * - End date and elapsed duration progress bar
 * - Mandatory disclaimer note
 *
 * Inside expandable accordion:
 * - Annual yield with asterisk and calculation formula
 * - Payback period with asterisk and calculation formula
 * - Asterisk footnote: "assuming the contract is renewed at the same monthly income"
 *
 * Strict Compliance:
 * - Zero forbidden promotional words ("ربح", "مضمون", "أرباح", "فرصة")
 * - Zero emoji
 */
export function BusContractSection({
  contract,
  price,
  busListingType,
  onRequireLogin,
  now,
}: BusContractSectionProps) {
  const [isAccordionOpen, setIsAccordionOpen] = useState(false)

  if (contract.access === 'hidden') {
    return null
  }

  if (contract.access === 'locked') {
    return (
      <BusContractLockedCard
        contract={contract}
        onRequireLogin={onRequireLogin}
      />
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
  const hasExtraCalculations =
    estimate.annualYieldPercent !== null || estimate.paybackMonths !== null

  const shouldReduceMotion = useAppReducedMotion()
  const animatedProgress = useSharedValue(0)

  useEffect(() => {
    const target = estimate.progressPercent ?? 0
    if (shouldReduceMotion) {
      animatedProgress.value = target
    } else {
      animatedProgress.value = withTiming(target, { duration: 750 })
    }
  }, [estimate.progressPercent, shouldReduceMotion])

  const progressFillAnimatedStyle = useAnimatedStyle(() => ({
    width: `${animatedProgress.value}%`,
  }))

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

      {/* Contract Terms List */}
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
      </View>

      {/* Highlight Metrics Grid (Visible) */}
      <View style={s.metricsGrid}>
        <View style={s.metricBox}>
          <Text style={s.metricLabel} maxFontSizeMultiplier={1.3}>الدخل الشهري</Text>
          <Text style={s.metricValue} maxFontSizeMultiplier={1.3}>
            {formatNumberWestern(contract.monthlyIncome)} <Text style={s.metricUnit}>ر.ع</Text>
          </Text>
          <Text style={s.metricSub} maxFontSizeMultiplier={1.3}>عقد تشغيلي معتمد</Text>
        </View>

        <View style={s.metricBox}>
          <Text style={s.metricLabel} maxFontSizeMultiplier={1.3}>الدخل المتبقي من العقد</Text>
          <Text style={s.metricValue} maxFontSizeMultiplier={1.3}>
            {formatNumberWestern(estimate.remainingIncome ?? 0)} <Text style={s.metricUnit}>ر.ع</Text>
          </Text>
          <Text style={s.metricSub} maxFontSizeMultiplier={1.3}>
            {estimate.recoveryPercent !== null ? `نسبة من السعر: ${formatNumberWestern(estimate.recoveryPercent)}%` : 'دخل متبقي'}
            {estimate.remainingMonths ? ` (${formatNumberWestern(estimate.remainingMonths)} شهر)` : ''}
          </Text>
        </View>
      </View>

      {/* Contract Duration Progress Track */}
      {formattedExpiry ? (
        <View style={s.progressSection}>
          <View style={s.progressLabelsRow}>
            <Text style={s.progressDateText} maxFontSizeMultiplier={1.3}>
              المدة المنقضية من العقد (ينتهي {formattedExpiry})
            </Text>
            {estimate.progressPercent !== null ? (
              <Text style={s.progressPercentText} maxFontSizeMultiplier={1.3}>
                {formatNumberWestern(estimate.progressPercent)}%
              </Text>
            ) : null}
          </View>
          <View style={s.progressTrack}>
            <Animated.View
              style={[
                s.progressFill,
                progressFillAnimatedStyle,
              ]}
            />
          </View>
        </View>
      ) : null}

      {/* Mandatory Disclaimer Note */}
      <Text style={s.disclaimerText} maxFontSizeMultiplier={1.3}>
        تقدير مبني على إجمالي دخل العقد المتبقي، ولا يشمل التكاليف التشغيلية
      </Text>

      {/* Collapsible Accordion (Variant C) */}
      {hasExtraCalculations ? (
        <View style={s.accordionWrapper}>
          <TouchableOpacity
            style={s.accordionHeader}
            onPress={() => setIsAccordionOpen((prev) => !prev)}
            activeOpacity={0.7}
            testID="btn-toggle-contract-accordion"
          >
            <Text style={s.accordionHeaderText} maxFontSizeMultiplier={1.3}>
              عرض التفاصيل المالية وحسابات السداد
            </Text>
            <Ionicons
              name={isAccordionOpen ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={Colors.primary}
            />
          </TouchableOpacity>

          {isAccordionOpen ? (
            <View style={s.accordionBody} testID="contract-accordion-body">
              <View style={s.extraMetricsGrid}>
                {estimate.annualYieldPercent !== null ? (
                  <View style={s.extraMetricBox}>
                    <Text style={s.extraMetricLabel} maxFontSizeMultiplier={1.3}>العائد السنوي*</Text>
                    <Text style={s.extraMetricValue} maxFontSizeMultiplier={1.3}>
                      {estimate.annualYieldPercent}%
                    </Text>
                    {price?.amount ? (
                      <Text style={s.extraMetricCalc} maxFontSizeMultiplier={1.3}>
                        ({formatNumberWestern(contract.monthlyIncome)} × 12 ÷ {formatNumberWestern(price.amount)})
                      </Text>
                    ) : null}
                  </View>
                ) : null}

                {estimate.paybackMonths !== null ? (
                  <View style={s.extraMetricBox}>
                    <Text style={s.extraMetricLabel} maxFontSizeMultiplier={1.3}>مدة السداد*</Text>
                    <Text style={s.extraMetricValue} maxFontSizeMultiplier={1.3}>
                      {formatNumberWestern(estimate.paybackMonths)} شهر
                    </Text>
                    {price?.amount ? (
                      <Text style={s.extraMetricCalc} maxFontSizeMultiplier={1.3}>
                        ({formatNumberWestern(price.amount)} ÷ {formatNumberWestern(contract.monthlyIncome)})
                      </Text>
                    ) : null}
                  </View>
                ) : null}
              </View>

              <Text style={s.footnoteText} maxFontSizeMultiplier={1.3}>
                * بافتراض تجديد العقد بنفس الدخل الشهري.
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}
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
    marginBottom: Spacing.space3,
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
  termsList: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.space2,
    gap: Spacing.space1,
  },
  termRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
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
  metricsGrid: {
    flexDirection: 'row',
    gap: Spacing.space2,
    marginTop: Spacing.space3,
  },
  metricBox: {
    flex: 1,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.md,
    padding: Spacing.space3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  metricLabel: {
    ...RTLText,
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  metricValue: {
    ...RTLText,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  metricUnit: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  metricSub: {
    ...RTLText,
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
  },
  progressSection: {
    marginTop: Spacing.space3,
    paddingTop: Spacing.space2,
  },
  progressLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressDateText: {
    ...RTLText,
    fontSize: 11,
    color: Colors.textMuted,
  },
  progressPercentText: {
    ...RTLText,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  progressTrack: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: Radius.pill,
  },
  disclaimerText: {
    ...RTLText,
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.space3,
    lineHeight: 16,
  },
  accordionWrapper: {
    marginTop: Spacing.space3,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.space3,
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.space1,
  },
  accordionHeaderText: {
    ...RTLText,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  accordionBody: {
    marginTop: Spacing.space2,
    paddingTop: Spacing.space2,
  },
  extraMetricsGrid: {
    flexDirection: 'row',
    gap: Spacing.space2,
  },
  extraMetricBox: {
    flex: 1,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.md,
    padding: Spacing.space2 + 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  extraMetricLabel: {
    ...RTLText,
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: 4,
    textAlign: 'center',
  },
  extraMetricValue: {
    ...RTLText,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  extraMetricCalc: {
    ...RTLText,
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 3,
    textAlign: 'center',
  },
  footnoteText: {
    ...RTLText,
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.space2,
  },
})
