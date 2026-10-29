import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Colors } from '../../constants/colors'
import { Radius } from '../../constants/radius'
import { Spacing } from '../../constants/spacing'
import { LICENSE_TYPE_LABELS, EMPLOYMENT_TYPE_LABELS, NATIONALITY_LABELS } from '../../constants/jobs'
import { LicenseType, EmploymentType } from '../../types/jobs.types'
import { Ionicons } from '@expo/vector-icons'

interface LicenseChipsProps {
  licenseTypes?: LicenseType[]
  employmentType?: EmploymentType
  nationality?: string
  limit?: number
}

export function LicenseChips({
  licenseTypes = [],
  employmentType,
  nationality,
  limit,
}: LicenseChipsProps) {
  const licensesToRender = limit ? licenseTypes.slice(0, limit) : licenseTypes

  return (
    <View style={s.container}>
      {licensesToRender.map((lt) => (
        <View key={`license-${lt}`} style={s.licenseChip}>
          <Text style={s.licenseText}>🪪 {LICENSE_TYPE_LABELS[lt] ?? lt}</Text>
        </View>
      ))}

      {employmentType && (
        <View style={s.employmentChip}>
          <Ionicons name="time-outline" size={10} color={Colors.text2} />
          <Text style={s.employmentText}>
            {EMPLOYMENT_TYPE_LABELS[employmentType] ?? employmentType}
          </Text>
        </View>
      )}

      {nationality && (
        <View style={s.employmentChip}>
          <Text style={s.employmentText}>
            🌍 {NATIONALITY_LABELS[nationality] ?? nationality}
          </Text>
        </View>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  licenseChip: {
    backgroundColor: '#F0F2F6', // surface container
    borderRadius: Radius.pill,
    paddingVertical: 2,
    paddingHorizontal: Spacing.space2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  licenseText: {
    color: Colors.primary, // Colors.primary
    fontSize: 11,
    fontFamily: 'Almarai_700Bold',  },
  employmentChip: {
    backgroundColor: Colors.surface, // #F5F7FA
    borderRadius: Radius.pill,
    paddingVertical: 2,
    paddingHorizontal: Spacing.space2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space1,
    justifyContent: 'center',
  },
  employmentText: {
    color: Colors.text2, // #4B5563
    fontSize: 11,
    fontFamily: 'Almarai_700Bold',  },
})
