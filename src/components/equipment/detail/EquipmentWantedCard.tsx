import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../../constants/colors'
import { Spacing } from '../../../constants/spacing'
import { Radius } from '../../../constants/radius'
import { RTLText } from '../../../constants/rtl'
import { lineHeightFor } from '../../../constants/typography'
import type { EquipmentWantedView } from '../../../types/equipmentDetailViewModel.types'

export interface EquipmentWantedCardProps {
  wanted: EquipmentWantedView | null
}

interface WantedRowProps {
  label: string
  value: string
  isLast?: boolean
  testID?: string
}

function WantedRow({ label, value, isLast, testID }: WantedRowProps) {
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
 * Safely formats an ISO date string into YYYY/MM/DD.
 * Returns undefined for invalid, non-string, or empty dates, never leaking "Invalid Date".
 */
export function formatCalendarDate(isoDate?: string | null): string | undefined {
  if (!isoDate || typeof isoDate !== 'string') return undefined
  const trimmed = isoDate.trim()
  if (!trimmed) return undefined
  const date = new Date(trimmed)
  if (isNaN(date.getTime())) return undefined
  const year = date.getUTCFullYear()
  const month = date.getUTCMonth() + 1
  const day = date.getUTCDate()
  const mm = month < 10 ? `0${month}` : `${month}`
  const dd = day < 10 ? `0${day}` : `${day}`
  return `${year}/${mm}/${dd}`
}

/**
 * EquipmentWantedCard
 * Displays request/wanted parameters for equipment wanted listings:
 * - Budget range (الميزانية)
 * - Rental duration (مدة الإيجار)
 * - Quantity (الكمية)
 * - Start & End dates (formatted safely, hidden when invalid)
 * - Site details (تفاصيل الموقع)
 * - Returns null if wanted is null or if all fields are missing.
 */
export function EquipmentWantedCard({ wanted }: EquipmentWantedCardProps) {
  if (!wanted) {
    return null
  }

  const rows: { key: string; label: string; value: string; testID: string }[] = []

  if (wanted.budgetRangeFormatted?.trim()) {
    rows.push({
      key: 'budget',
      label: 'الميزانية',
      value: wanted.budgetRangeFormatted.trim(),
      testID: 'wanted-row-budget',
    })
  }

  if (wanted.rentalDurationLabel?.trim()) {
    rows.push({
      key: 'duration',
      label: 'مدة الإيجار',
      value: wanted.rentalDurationLabel.trim(),
      testID: 'wanted-row-duration',
    })
  }

  if (wanted.quantityFormatted?.trim()) {
    rows.push({
      key: 'quantity',
      label: 'الكمية',
      value: wanted.quantityFormatted.trim(),
      testID: 'wanted-row-quantity',
    })
  }

  const startDateFormatted = formatCalendarDate(wanted.startDate)
  if (startDateFormatted) {
    rows.push({
      key: 'startDate',
      label: 'تاريخ البدء',
      value: startDateFormatted,
      testID: 'wanted-row-start-date',
    })
  }

  const endDateFormatted = formatCalendarDate(wanted.endDate)
  if (endDateFormatted) {
    rows.push({
      key: 'endDate',
      label: 'تاريخ الانتهاء',
      value: endDateFormatted,
      testID: 'wanted-row-end-date',
    })
  }

  if (wanted.siteDetails?.trim()) {
    rows.push({
      key: 'siteDetails',
      label: 'تفاصيل الموقع',
      value: wanted.siteDetails.trim(),
      testID: 'wanted-row-site-details',
    })
  }

  // If every field is missing, render nothing
  if (rows.length === 0) {
    return null
  }

  return (
    <View style={s.card} testID="equipment-wanted-card">
      <View style={s.headerRow}>
        <Ionicons name="clipboard-outline" size={20} color={Colors.primary} />
        <Text style={s.cardTitle} maxFontSizeMultiplier={1.3}>
          تفاصيل الطلب
        </Text>
      </View>

      <View style={s.rowsContainer}>
        {rows.map((r, idx) => (
          <WantedRow
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
    flexShrink: 1,
    paddingStart: Spacing.space2,
  },
})
