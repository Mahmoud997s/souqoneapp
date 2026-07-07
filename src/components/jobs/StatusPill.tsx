import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Colors } from '../../constants/colors'
import { Radius } from '../../constants/radius'
import { Spacing } from '../../constants/spacing'
import {
  JOB_STATUS_LABELS,
  JOB_STATUS_COLORS,
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_COLORS
} from '../../constants/jobs'
import { JobStatus, ApplicationStatus } from '../../types/jobs.types'

interface StatusPillProps {
  status: JobStatus | ApplicationStatus
}

export function StatusPill({ status }: StatusPillProps) {
  const isJobStatus = status === 'ACTIVE' || status === 'CLOSED' || status === 'EXPIRED'
  
  const label = isJobStatus 
    ? (JOB_STATUS_LABELS[status] ?? status)
    : (APPLICATION_STATUS_LABELS[status as ApplicationStatus] ?? status)

  const dotColor = isJobStatus
    ? (JOB_STATUS_COLORS[status] ?? '#9ca3af')
    : (APPLICATION_STATUS_COLORS[status as ApplicationStatus] ?? '#9ca3af')

  return (
    <View style={s.pill}>
      <View style={[s.dot, { backgroundColor: dotColor }]} />
      <Text style={s.text}>{label}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  pill: {
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: Radius.pill,
    paddingVertical: Spacing.space1,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    color: Colors.text, // #111827
    fontSize: 11,
    fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, },
})
