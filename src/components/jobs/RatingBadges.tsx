import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { STRINGS } from '../../constants/jobs'

interface RatingBadgesProps {
  rating?: number
  completionRate?: number
  responseTime?: number
  completedJobs?: number
  size?: 'sm' | 'md'
}

export default function RatingBadges({
  rating = 0,
  completionRate,
  responseTime,
  completedJobs,
  size = 'sm',
}: RatingBadgesProps) {
  return (
    <View style={s.container}>
      {rating > 0 && (
        <View style={s.badge}>
          <Text style={s.text}>⭐ {rating.toFixed(1)}</Text>
        </View>
      )}

      {completionRate !== undefined && completionRate > 0 && (
        <View style={s.badge}>
          <Text style={s.text}>🎯 {completionRate}% {STRINGS.COMPLETION_RATE}</Text>
        </View>
      )}

      {responseTime !== undefined && responseTime > 0 && (
        <View style={s.badge}>
          <Text style={s.text}>
            ⚡ {STRINGS.RESPONSE_TIME_PREFIX} {responseTime}{' '}
            {responseTime === 1 ? STRINGS.RESPONSE_TIME_HOUR : STRINGS.RESPONSE_TIME_HOURS}
          </Text>
        </View>
      )}

      {completedJobs !== undefined && completedJobs > 0 && (
        <View style={s.badge}>
          <Text style={s.text}>
            ✅ {completedJobs} {STRINGS.COMPLETED_JOBS}
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
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space1,
    backgroundColor: Colors.surface, // #F5F7FA
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  text: {
    color: Colors.text2, // #4B5563
    fontSize: 11,
    fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, },
})
