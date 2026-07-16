import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Colors } from '../../constants/colors'
import { Radius } from '../../constants/radius'
import { STRINGS } from '../../constants/jobs'
import { JobType } from '../../types/jobs.types'

interface JobBadgeProps {
  type: JobType
}

export function JobBadge({ type }: JobBadgeProps) {
  const isHiring = type?.toUpperCase() === 'HIRING'
  return (
    <View style={[s.badge, isHiring ? s.hiring : s.offering]}>
      <Text style={s.text}>
        {isHiring ? STRINGS.HIRING : STRINGS.OFFERING}
      </Text>
    </View>
  )
}

const s = StyleSheet.create({
  badge: {
    borderRadius: Radius.pill,
    paddingVertical: 3,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hiring: {
    backgroundColor: Colors.primaryDark, // #0B2447
  },
  offering: {
    backgroundColor: Colors.accent, // #E8781E
  },
  text: {
    color: '#ffffff',
    fontSize: 11,
    fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, },
})
