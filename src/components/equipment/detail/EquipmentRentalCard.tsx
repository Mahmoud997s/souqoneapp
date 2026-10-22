import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../../constants/colors'
import { Spacing } from '../../../constants/spacing'
import { Radius } from '../../../constants/radius'
import { RTLText } from '../../../constants/rtl'
import { lineHeightFor } from '../../../constants/typography'
import type { EquipmentRentalView } from '../../../types/equipmentDetailViewModel.types'

export interface EquipmentRentalCardProps {
  rental: EquipmentRentalView | null
}

interface RentalRowProps {
  label: string
  value: string
  isLast?: boolean
  testID?: string
}

function RentalRow({ label, value, isLast, testID }: RentalRowProps) {
  return (
    <View style={[s.row, !isLast && s.rowBorder]} testID={testID}>
      <Text style={s.rowLabel} maxFontSizeMultiplier={1.3}>
        {label}
      </Text>
      <Text style={s.rowValue} maxFontSizeMultiplier={1.3}>
        {value}
      </Text>
    </View>
  )
}

/**
 * EquipmentRentalCard
 * Displays rental conditions and rates for equipment listings.
 * - Daily & Monthly rates (hidden when missing)
 * - Operator availability (مع مشغّل / بدون مشغّل)
 * - Delivery availability (متاح / غير متاح)
 * - null: renders nothing
 */
export function EquipmentRentalCard({ rental }: EquipmentRentalCardProps) {
  if (!rental) {
    return null
  }

  const rows: { key: string; label: string; value: string; testID: string }[] = []

  if (rental.dailyPriceFormatted) {
    rows.push({
      key: 'dailyPrice',
      label: 'الأجر اليومي',
      value: rental.dailyPriceFormatted,
      testID: 'rental-row-daily-price',
    })
  }

  if (rental.monthlyPriceFormatted) {
    rows.push({
      key: 'monthlyPrice',
      label: 'الأجر الشهري',
      value: rental.monthlyPriceFormatted,
      testID: 'rental-row-monthly-price',
    })
  }

  rows.push({
    key: 'operator',
    label: 'المشغّل',
    value: rental.withOperator ? 'مع مشغّل' : 'بدون مشغّل',
    testID: 'rental-row-operator',
  })

  rows.push({
    key: 'delivery',
    label: 'التوصيل لموقع العمل',
    value: rental.deliveryAvailable ? 'متاح' : 'غير متاح',
    testID: 'rental-row-delivery',
  })

  return (
    <View style={s.card} testID="equipment-rental-card">
      <View style={s.headerRow}>
        <Ionicons name="document-text-outline" size={20} color={Colors.primary} />
        <Text style={s.cardTitle} maxFontSizeMultiplier={1.3}>
          شروط الإيجار
        </Text>
      </View>

      <View style={s.rowsContainer}>
        {rows.map((r, idx) => (
          <RentalRow
            key={r.key}
            label={r.label}
            value={r.value}
            isLast={idx === rows.length - 1}
            testID={r.testID}
          />
        ))}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.lg,
    padding: Spacing.space4,
    marginHorizontal: Spacing.space4,
    marginVertical: Spacing.space2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space2,
    marginBottom: Spacing.space3,
  },
  cardTitle: {
    ...RTLText,
    fontFamily: 'Almarai_700Bold',
    fontSize: 15,
    lineHeight: lineHeightFor(15),
    color: Colors.text,
    textAlign: 'left',
  },
  rowsContainer: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.space3,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.space3,
    minHeight: Spacing.touch,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  rowLabel: {
    ...RTLText,
    fontFamily: 'Almarai_400Regular',
    fontSize: 13,
    lineHeight: lineHeightFor(13),
    color: Colors.textMuted,
    textAlign: 'left',
  },
  rowValue: {
    ...RTLText,
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    lineHeight: lineHeightFor(13),
    color: Colors.primaryDeep,
    textAlign: 'left',
  },
})
