import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Colors } from '../../../constants/colors'
import { Spacing } from '../../../constants/spacing'
import { Radius } from '../../../constants/radius'
import { RTLText } from '../../../constants/rtl'
import { BusContractEstimate } from '../../../utils/listing-detail/computeBusContractEstimate'
import { formatNumberWestern } from '../../../utils/listing-detail/formatters'

export interface BusContractMetricsGridProps {
  estimate: BusContractEstimate
}

export function BusContractMetricsGrid({ estimate }: BusContractMetricsGridProps) {
  if (
    estimate.remainingIncome === null &&
    estimate.annualYieldPercent === null &&
    estimate.paybackMonths === null
  ) {
    return null
  }

  return (
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
  )
}

const s = StyleSheet.create({
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
})
