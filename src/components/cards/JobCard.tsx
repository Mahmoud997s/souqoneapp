import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'
import { DriverJob } from '../../types/jobs.types'
import { JobBadge } from '../jobs/JobBadge'
import { StatusPill } from '../jobs/StatusPill'
import { LicenseChips } from '../jobs/LicenseChips'
import RatingBadges from '../jobs/RatingBadges'
import { formatDate, formatSalary, getInitials, getAvatarColor } from '../../utils/format'
import { formatLocation } from '../../utils/mappers'
import { STRINGS } from '../../constants/jobs'

interface JobCardProps {
  job: DriverJob
  onPress?: () => void
}

export function JobCard({ job, onPress }: JobCardProps) {
  if (!job) return null

  const isHiring = job.jobType?.toUpperCase() === 'HIRING'
  const poster = isHiring
    ? (job.employerProfile?.companyName ?? job.user?.displayName ?? job.user?.username ?? '')
    : (job.driverProfile?.user?.displayName ?? job.user?.displayName ?? job.user?.username ?? '')

  const avatarColor = getAvatarColor(job.userId ?? '')
  const initials = getInitials(poster)

  return (
    <TouchableOpacity style={s.card} activeOpacity={0.8} onPress={onPress}>
      {/* Top Row: Type Badge + Status Pill */}
      <View style={s.topRow}>
        <JobBadge type={job.jobType} />
        <StatusPill status={job.status} />
      </View>

      {/* Title */}
      <View>
        <Text style={s.title} numberOfLines={2}>
          {job.title}
        </Text>
      </View>

      {/* Poster + Location Row */}
      <View style={s.posterRow}>
        {job.user?.avatarUrl ? (
          <Image source={{ uri: job.user.avatarUrl }} style={s.avatar} />
        ) : (
          <View style={[s.avatar, s.initialsAvatar, { backgroundColor: avatarColor }]}>
            <Text style={s.initialsText}>{initials}</Text>
          </View>
        )}
        <Text style={s.posterName} numberOfLines={1}>
          {poster}
        </Text>
        <Text style={s.dot}>·</Text>
        <Ionicons name="location-outline" size={13} color={Colors.text2} style={s.locationIcon} />
        <Text style={s.locationText} numberOfLines={1}>
          {formatLocation(job)}
        </Text>
      </View>

      {/* Rating Badges for Driver Offering (Service Offer) */}
      {!isHiring && job.driverProfile && (
        <View style={s.ratingWrap}>
          <RatingBadges
            rating={job.driverProfile.averageRating}
            completionRate={job.driverProfile.completionRate}
            responseTime={job.driverProfile.responseTimeHours}
            completedJobs={job.driverProfile.completedJobs}
            size="sm"
          />
        </View>
      )}

      {/* Description Preview */}
      <View>
        <Text style={s.description} numberOfLines={2}>
          {job.description}
        </Text>
      </View>

      {/* Divider */}
      <View style={s.divider} />

      {/* Tags (License requirements, Employment type, Nationality) */}
      <View style={s.tagsWrap}>
        <LicenseChips
          licenseTypes={job.licenseTypes}
          employmentType={job.employmentType}
          nationality={job.nationality}
          limit={2}
        />
      </View>

      {/* Divider */}
      <View style={s.divider} />

      {/* Bottom Row: Stats + Salary */}
      <View style={s.bottomRow}>
        <View style={s.statsRow}>
          <View style={s.statItem}>
            <Ionicons name="people-outline" size={12} color={Colors.textMuted} />
            <Text style={s.statText}>
              {STRINGS.APPLICATIONS_COUNT(job._count?.applications ?? 0)}
            </Text>
          </View>
          <View style={s.statItem}>
            <Ionicons name="eye-outline" size={12} color={Colors.textMuted} />
            <Text style={s.statText}>{job.viewCount ?? 0}</Text>
          </View>
          <Text style={s.timeText}>{formatDate(job.createdAt)}</Text>
        </View>

        <Text style={s.salaryText} numberOfLines={1}>
          {formatSalary(job.salary, job.salaryPeriod, job.currency)}
        </Text>
      </View>
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,       // 16
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.space4,       // 16
    marginBottom: Spacing.space4,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.space3,  // 12
  },
  title: {
    fontFamily: 'Almarai_700Bold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 16,
    color: Colors.text,
    writingDirection: 'rtl',
    marginBottom: Spacing.space1,  // 4
    lineHeight: 24,
  },
  posterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space1,           // 4
    marginBottom: Spacing.space2,  // 8
  },
  avatar: {
    width: 20,
    height: 20,
    borderRadius: Radius.pill,
  },
  initialsAvatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    color: Colors.white,
    fontSize: 9,
    fontFamily: 'Almarai_700Bold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, },
  posterName: {
    fontFamily: 'Almarai_700Bold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 13,
    color: Colors.text,
    writingDirection: 'rtl',
    maxWidth: '40%',
  },
  dot: {
    color: Colors.textMuted,
    marginHorizontal: Spacing.space1, // 4
  },
  locationIcon: {
    marginEnd: 2,
  },
  locationText: {
    fontFamily: 'Almarai_400Regular', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 12,
    color: Colors.text2,
    writingDirection: 'rtl',
    maxWidth: '40%',
  },
  ratingWrap: {
    marginBottom: Spacing.space2,  // 8
  },
  description: {
    fontFamily: 'Almarai_400Regular', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 13,
    color: Colors.text2,
    writingDirection: 'rtl',
    lineHeight: 20,
    marginBottom: Spacing.space3,  // 12
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: Spacing.space3,  // 12
  },
  tagsWrap: {
    marginBottom: Spacing.space3,  // 12
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space2,           // 8
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space1,           // 4
  },
  statText: {
    fontFamily: 'Almarai_400Regular', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 11,
    color: Colors.textMuted,
  },
  timeText: {
    fontFamily: 'Almarai_400Regular', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 11,
    color: Colors.textMuted,
  },
  salaryText: {
    fontFamily: 'Almarai_700Bold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 15,
    color: Colors.accent,
  },
})

