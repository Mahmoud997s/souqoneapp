import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../../constants/colors'
import { Spacing } from '../../../constants/spacing'
import { Radius } from '../../../constants/radius'
import { Shadows } from '../../../constants/shadows'
import type { ServiceScheduleViewModel } from '../../../types/serviceDetailViewModel.types'

export interface ServiceScheduleCardProps {
  schedule: ServiceScheduleViewModel
  isHomeService?: boolean
}

/**
 * ServiceScheduleCard
 * Renders working days in Arabic chips, working hours open/close,
 * and an optional home/mobile service badge.
 */
export function ServiceScheduleCard({
  schedule,
  isHomeService,
}: ServiceScheduleCardProps) {
  if (!schedule.hasSchedule && !isHomeService) {
    return null
  }

  return (
    <View style={s.card} testID="service-schedule-card">
      <View style={s.headerRow}>
        <View style={s.iconCircle}>
          <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
        </View>
        <Text style={s.title}>أوقات وجدول العمل</Text>
      </View>

      {/* Summary / Working Days */}
      {schedule.workingDays.length > 0 && (
        <View style={s.section}>
          <View style={s.labelRow}>
            <Ionicons name="time-outline" size={15} color={Colors.textMuted} />
            <Text style={s.sectionLabel}>أيام العمل:</Text>
            <Text style={s.summaryText}>{schedule.workingDaysSummary}</Text>
          </View>

          <View style={s.chipsWrap}>
            {schedule.workingDays.map((day, idx) => (
              <View key={idx} style={s.dayChip}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={13}
                  color={Colors.primary}
                />
                <Text style={s.dayChipText}>{day}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Working Hours */}
      {Boolean(schedule.workingHoursLabel) && (
        <View style={s.hoursRow}>
          <Ionicons name="alarm-outline" size={15} color={Colors.primary} />
          <Text style={s.hoursLabel}>ساعات العمل:</Text>
          <Text style={s.hoursVal}>{schedule.workingHoursLabel}</Text>
        </View>
      )}

      {/* Home / Mobile Service Badge */}
      {Boolean(isHomeService) && (
        <View style={s.homeServiceBadge}>
          <Ionicons name="home-outline" size={16} color={Colors.success} />
          <Text style={s.homeServiceText}>
            خدمة منزلية / متنقلة متاحة عند الطلب
          </Text>
        </View>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.space4,
    marginHorizontal: Spacing.space4,
    marginVertical: Spacing.space2,
    gap: Spacing.space3,
    ...Shadows.card,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space2,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    backgroundColor: Colors.paleMint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'Almarai_700Bold',
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  section: {
    gap: Spacing.space2,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space1,
    flexWrap: 'wrap',
  },
  sectionLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'Almarai_700Bold',
    color: Colors.textMuted,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  summaryText: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'Almarai_700Bold',
    color: Colors.primary,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.space2,
    marginTop: Spacing.space1,
  },
  dayChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space1,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.space2,
    paddingVertical: 5,
    borderRadius: Radius.pill,
  },
  dayChipText: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'Almarai_700Bold',
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space2,
    backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: Spacing.space3,
    paddingVertical: Spacing.space2,
    borderRadius: Radius.md,
  },
  hoursLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'Almarai_700Bold',
    color: Colors.textMuted,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  hoursVal: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'Almarai_700Bold',
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  homeServiceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space2,
    backgroundColor: Colors.paleMint,
    paddingHorizontal: Spacing.space3,
    paddingVertical: Spacing.space2,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
  },
  homeServiceText: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'Almarai_700Bold',
    color: Colors.success,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
})
