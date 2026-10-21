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
import { lineHeightFor } from '../../../constants/typography'
import { BusContractView } from '../../../types/busDetailViewModel.types'
import { PriceView } from '../../../types/listingDetail.types'
import { BusListingType } from '../../../types/bus.types'
import { formatNumberWestern } from '../../../utils/listing-detail/formatters'
import { computeBusContractEstimate } from '../../../utils/listing-detail/computeBusContractEstimate'
import { useAppReducedMotion } from '../../../utils/listing-detail/useAppReducedMotion'
import { BusContractLockedCard } from './BusContractLockedCard'
import { ContractPercentRing } from './ContractPercentRing'

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
  const shouldReduceMotion = useAppReducedMotion()
  const animatedProgress = useSharedValue(0)

  const visibleContract = contract.access === 'visible' ? contract : undefined
  const referenceNow = now ?? new Date()
  const estimate = computeBusContractEstimate(
    {
      busListingType,
      price: price?.amount,
      monthlyIncome: visibleContract?.monthlyIncome ?? 0,
      durationMonths: visibleContract?.durationMonths,
      expiryIso: visibleContract?.expiryIso,
    },
    referenceNow
  )

  useEffect(() => {
    const target = contract.access === 'visible' ? estimate.progressPercent ?? 0 : 0
    if (shouldReduceMotion) {
      animatedProgress.value = target
    } else {
      animatedProgress.value = withTiming(target, { duration: 750 })
    }
  }, [contract.access, estimate.progressPercent, shouldReduceMotion])

  const progressFillAnimatedStyle = useAnimatedStyle(() => ({
    width: `${animatedProgress.value}%`,
  }))

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
  const formattedExpiry = formatExpiryDate(contract.expiryIso)
  const hasExtraCalculations =
    estimate.annualYieldPercent !== null || estimate.paybackMonths !== null
  const isSaleType =
    busListingType === 'BUS_SALE' || busListingType === 'BUS_SALE_WITH_CONTRACT'
  const showRecoveryRing = isSaleType && estimate.recoveryPercent !== null

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
        <View style={s.metricBox} testID="contract-metric-monthly">
          <View style={s.metricVisualRow}>
            <View
              style={s.metricIconBadge}
              testID="contract-icon-monthly"
              accessible={false}
              importantForAccessibility="no"
            >
              <Ionicons
                name="cash-outline"
                size={18}
                color={Colors.primary}
                accessible={false}
                importantForAccessibility="no"
              />
            </View>
          </View>
          <Text style={s.metricLabel} maxFontSizeMultiplier={1.3}>الدخل الشهري</Text>
          <Text style={s.metricValue} maxFontSizeMultiplier={1.3}>
            {formatNumberWestern(contract.monthlyIncome)} <Text style={s.metricUnit}>ر.ع</Text>
          </Text>
          <Text style={s.metricSub} maxFontSizeMultiplier={1.3}>عقد تشغيلي معتمد</Text>
        </View>

        <View style={s.metricBox} testID="contract-metric-remaining">
          <View style={s.metricVisualRow}>
            <View
              style={s.metricIconBadge}
              testID="contract-icon-remaining"
              accessible={false}
              importantForAccessibility="no"
            >
              <Ionicons
                name="hourglass-outline"
                size={18}
                color={Colors.primary}
                accessible={false}
                importantForAccessibility="no"
              />
            </View>
            {showRecoveryRing && estimate.recoveryPercent !== null ? (
              <ContractPercentRing percent={estimate.recoveryPercent} size={32} />
            ) : null}
          </View>
          <Text style={s.metricLabel} maxFontSizeMultiplier={1.3}>الدخل المتبقي من العقد</Text>
          <Text style={s.metricValue} maxFontSizeMultiplier={1.3}>
            {estimate.remainingIncome !== null ? (
              <>
                {formatNumberWestern(estimate.remainingIncome)} <Text style={s.metricUnit}>ر.ع</Text>
              </>
            ) : (
              '—'
            )}
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
            <View style={s.progressDateRow}>
              <Ionicons
                name="calendar-outline"
                size={14}
                color={Colors.textMuted}
                accessible={false}
                importantForAccessibility="no"
              />
              <Text style={s.progressDateText} maxFontSizeMultiplier={1.3}>
                المدة المنقضية من العقد (ينتهي {formattedExpiry})
              </Text>
            </View>
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
                    <View
                      style={s.metricIconBadge}
                      testID="contract-icon-yield"
                      accessible={false}
                      importantForAccessibility="no"
                    >
                      <Ionicons
                        name="trending-up-outline"
                        size={18}
                        color={Colors.primary}
                        accessible={false}
                        importantForAccessibility="no"
                      />
                    </View>
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
                    <View
                      style={s.metricIconBadge}
                      testID="contract-icon-payback"
                      accessible={false}
                      importantForAccessibility="no"
                    >
                      <Ionicons
                        name="calendar-outline"
                        size={18}
                        color={Colors.primary}
                        accessible={false}
                        importantForAccessibility="no"
                      />
                    </View>
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
    fontFamily: 'Almarai_700Bold',
    fontSize: 16,
    lineHeight: lineHeightFor(16),
    color: Colors.text,
  },
  cardSub: {
    ...RTLText,
    fontFamily: 'Almarai_400Regular',
    fontSize: 13,
    lineHeight: lineHeightFor(13),
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
    fontFamily: 'Almarai_400Regular',
    fontSize: 13,
    lineHeight: lineHeightFor(13),
    color: Colors.textMuted,
  },
  termValue: {
    ...RTLText,
    fontFamily: 'Almarai_400Regular',
    fontSize: 13,
    lineHeight: lineHeightFor(13),
    color: Colors.text,
  },
  metricsGrid: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: Spacing.space2,
    marginTop: Spacing.space3,
  },
  metricBox: {
    flex: 1,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.md,
    padding: Spacing.space3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  metricVisualRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.space2,
    marginBottom: Spacing.space1,
    minHeight: 32,
  },
  metricIconBadge: {
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    backgroundColor: Colors.paleMint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricLabel: {
    ...RTLText,
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    lineHeight: lineHeightFor(12),
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 4,
  },
  metricValue: {
    ...RTLText,
    fontFamily: 'Almarai_700Bold',
    fontSize: 16,
    lineHeight: lineHeightFor(16),
    color: Colors.primary,
    textAlign: 'center',
  },
  metricUnit: {
    ...RTLText,
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: lineHeightFor(12),
    color: Colors.primary,
    textAlign: 'center',
  },
  metricSub: {
    ...RTLText,
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    lineHeight: lineHeightFor(11),
    color: Colors.textMuted,
    textAlign: 'center',
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
  progressDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space1,
    flex: 1,
  },
  progressDateText: {
    ...RTLText,
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    lineHeight: lineHeightFor(11),
    color: Colors.textMuted,
  },
  progressPercentText: {
    ...RTLText,
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: lineHeightFor(12),
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
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    lineHeight: lineHeightFor(11),
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.space3,
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
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    lineHeight: lineHeightFor(13),
    color: Colors.primary,
  },
  accordionBody: {
    marginTop: Spacing.space2,
    paddingTop: Spacing.space2,
  },
  extraMetricsGrid: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: Spacing.space2,
  },
  extraMetricBox: {
    flex: 1,
    alignSelf: 'stretch',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.md,
    padding: Spacing.space2 + 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 2,
  },
  extraMetricLabel: {
    ...RTLText,
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    lineHeight: lineHeightFor(11),
    color: Colors.textMuted,
    marginTop: 2,
    marginBottom: 2,
    textAlign: 'center',
  },
  extraMetricValue: {
    ...RTLText,
    fontFamily: 'Almarai_700Bold',
    fontSize: 15,
    lineHeight: lineHeightFor(15),
    color: Colors.text,
    textAlign: 'center',
  },
  extraMetricCalc: {
    ...RTLText,
    fontFamily: 'Almarai_400Regular',
    fontSize: 10,
    lineHeight: lineHeightFor(10),
    color: Colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  footnoteText: {
    ...RTLText,
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    lineHeight: lineHeightFor(11),
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.space2,
  },
})
