import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { CardSystem } from '../../../constants/cardSystem'

export interface JobCardFooterProps {
  formattedSalary: string
  applicationsCount: number
}

export function JobCardFooter({
  formattedSalary,
  applicationsCount,
}: JobCardFooterProps) {
  const hasApplications = applicationsCount > 0

  return (
    <>
      <View style={s.divider} />
      <View style={s.footerRow}>
        {/* Salary Pill (Exact same scale, style, and pill structure as CarCard) */}
        <View style={[s.detailPill, s.pillNeutral, { flex: 1 }]}>
          <Ionicons name="wallet-outline" size={13} color="#64748b" />
          <Text style={s.budgetValText} numberOfLines={1}>
            {formattedSalary}
          </Text>
        </View>

        {/* Applications Pill (Secondary pill identical to CarCard) */}
        <View style={[s.detailPill, hasApplications ? s.pillOrange : s.pillNeutral]}>
          <Ionicons
            name={hasApplications ? 'people' : 'people-outline'}
            size={12}
            color={hasApplications ? '#ea580c' : '#64748b'}
          />
          <Text
            style={[
              s.detailText,
              hasApplications && { color: '#ea580c', fontFamily: 'Almarai_700Bold' },
            ]}
            numberOfLines={1}
          >
            {applicationsCount} {applicationsCount === 1 ? 'طلب' : applicationsCount === 2 ? 'طلبان' : applicationsCount <= 10 ? 'طلبات' : 'طلب'}
          </Text>
        </View>
      </View>
    </>
  )
}

const s = StyleSheet.create({
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginTop: 2,
    marginBottom: 6,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 5,
  },
  detailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 2.5,
    borderRadius: CardSystem.radius.inner,
    flexShrink: 1,
  },
  pillNeutral: CardSystem.styles.pillNeutral,
  pillOrange: CardSystem.styles.pillOrange,
  pillGreen: CardSystem.styles.pillGreen,
  budgetValText: {
    fontSize: 11.5,
    fontFamily: 'Almarai_800ExtraBold',
    color: '#64748b',
    lineHeight: 15,
    writingDirection: 'rtl',
    flexShrink: 1,
  },
  detailText: {
    ...CardSystem.typography.pillText,
    color: '#475569',
    writingDirection: 'rtl',
    flexShrink: 1,
  },
})
