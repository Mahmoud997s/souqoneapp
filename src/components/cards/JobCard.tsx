import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform, Share } from 'react-native'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'
import { DriverJob } from '../../types/jobs.types'
import { StatusPill } from '../jobs/StatusPill'
import { JobBadge } from '../jobs/JobBadge'
import { LicenseChips } from '../jobs/LicenseChips'
import RatingBadges from '../jobs/RatingBadges'
import { formatDate, formatSalary, getInitials, getAvatarColor } from '../../utils/format'
import { formatLocation } from '../../utils/mappers'
import { STRINGS } from '../../constants/jobs'

interface JobCardProps {
  job: DriverJob
  onPress?: () => void
  maxChips?: number
}

export function JobCard({ job, onPress, maxChips }: JobCardProps) {
  const [isFav, setIsFav] = useState(false)

  if (!job) return null

  const isHiring = job.jobType?.toUpperCase() === 'HIRING'
  const poster = isHiring
    ? (job.employerProfile?.companyName ?? job.user?.displayName ?? job.user?.username ?? '')
    : (job.driverProfile?.user?.displayName ?? job.user?.displayName ?? job.user?.username ?? '')

  const avatarColor = getAvatarColor(job.userId ?? '')
  const initials = getInitials(poster)

  // Aesthetic colors based on job type
  const iconConfig = isHiring
    ? { icon: 'briefcase-outline' as any, color: '#3b82f6', bg: '#eff6ff' }
    : { icon: 'account-hard-hat' as any, color: '#8b5cf6', bg: '#f5f3ff' }

  const handleShare = async () => {
    try {
      await Share.share({
        message: `اطلع على وظيفة: ${job.title}\nعبر تطبيق سوق ون`,
      })
    } catch (error) {
      console.log('Error sharing:', error)
    }
  }

  const handleFavorite = () => setIsFav(!isFav)

  const viewCount = job.viewCount || 0
  const applicationsCount = job._count?.applications || 0

  return (
    <TouchableOpacity style={s.card} activeOpacity={0.8} onPress={onPress}>
      {/* Header: Icon, Title, Date, Actions, Status */}
      <View style={s.header}>
        <View style={s.titleRow}>
          <View style={[s.iconBox, { backgroundColor: iconConfig.bg }]}>
            <MaterialCommunityIcons name={iconConfig.icon} size={22} color={iconConfig.color} />
          </View>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={s.serviceTitle} numberOfLines={1}>{job.title}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
              {job.jobType && <JobBadge type={job.jobType} />}
              <Text style={[s.timeText, { marginTop: 0 }]}>{formatDate(job.createdAt)}</Text>
            </View>
          </View>
        </View>

        <View style={s.headerRight}>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {job.status && <StatusPill status={job.status} />}
          </View>
          <View style={s.actionsRow}>
            <TouchableOpacity onPress={handleShare} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="share-social-outline" size={20} color="#64748b" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleFavorite} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name={isFav ? "heart" : "heart-outline"} size={20} color={isFav ? '#ef4444' : '#64748b'} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Poster & Location Row */}
      <View style={s.posterRow}>
        <View style={s.posterInner}>
          {job.user?.avatarUrl ? (
            <Image source={{ uri: job.user.avatarUrl }} style={s.avatar} />
          ) : (
            <View style={[s.avatar, s.initialsAvatar, { backgroundColor: avatarColor }]}>
              <Text style={s.initialsText}>{initials}</Text>
            </View>
          )}
          <Text style={s.posterName} numberOfLines={1}>{poster}</Text>
        </View>
        
        <View style={s.locationInner}>
          <Ionicons name="location-outline" size={14} color="#64748b" />
          <Text style={s.locationText} numberOfLines={1}>{formatLocation(job)}</Text>
        </View>
      </View>

      {/* Description Box (Always rendered with fixed height of 2 lines to maintain card size) */}
      <View style={s.descBox}>
        <Text style={[s.descText, { minHeight: 40 }]} numberOfLines={2}>
          {job.description || 'لا يوجد وصف'}
        </Text>
      </View>

      {/* Divider */}
      <View style={s.divider} />

      {/* Details List (Pills) */}
      <View style={s.detailsList}>
        {(() => {
          const pills = []
          if (job.employmentType) pills.push(
            <View key="emp" style={[s.detailPill, s.pillNeutral]}>
              <MaterialCommunityIcons name="clock-time-four-outline" size={14} color="#64748b" />
              <Text style={s.detailText}>
                {job.employmentType === 'FULL_TIME' ? 'دوام كامل' : job.employmentType === 'PART_TIME' ? 'دوام جزئي' : job.employmentType === 'CONTRACT' ? 'عقد' : 'عمل حر'}
              </Text>
            </View>
          )
          if (job.experienceYears != null) pills.push(
            <View key="exp" style={[s.detailPill, s.pillNeutral]}>
              <MaterialCommunityIcons name="star-outline" size={14} color="#64748b" />
              <Text style={s.detailText}>خبرة {job.experienceYears} سنوات</Text>
            </View>
          )
          if (viewCount >= 0) pills.push(
            <View key="view" style={[s.detailPill, s.pillNeutral]}>
              <Ionicons name="eye-outline" size={14} color="#64748b" />
              <Text style={s.detailText}>{viewCount}</Text>
            </View>
          )
          return pills.slice(0, maxChips ?? pills.length)
        })()}
      </View>

      {/* License Chips embedded (Invisible placeholder ensures 100% accurate height) */}
      <View style={{ marginBottom: 12 }}>
        {job.licenseTypes && job.licenseTypes.length > 0 ? (
          <LicenseChips licenseTypes={job.licenseTypes} limit={3} />
        ) : (
          <View style={{ opacity: 0 }} pointerEvents="none">
            <LicenseChips licenseTypes={['PRIVATE' as any]} limit={1} />
          </View>
        )}
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

      <View style={[s.divider, { marginTop: 0 }]} />

      {/* Footer Row (Salary and Applications) */}
      <View style={s.footerRow}>
        <View style={[s.detailPill, s.pillGreen, { flex: 1, paddingVertical: 10 }]}>
          <Ionicons name="wallet-outline" size={18} color="#059669" />
          <Text style={[s.budgetValText, { color: '#059669' }]} numberOfLines={1}>
             {job.salary ? formatSalary(job.salary, job.salaryPeriod, job.currency) : 'الراتب غير محدد'}
          </Text>
        </View>
        
        {applicationsCount >= 0 && (
          <View style={[s.detailPill, applicationsCount > 0 ? s.pillOrange : s.pillNeutral, { paddingVertical: 10 }]}>
            <Ionicons name={applicationsCount > 0 ? "people" : "people-outline"} size={16} color={applicationsCount > 0 ? '#ea580c' : '#64748b'} />
            <Text style={[s.detailText, applicationsCount > 0 && { color: '#ea580c', fontFamily: 'Almarai_700Bold' }]}>
              {applicationsCount} طلب
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  )
}

const softShadow = Platform.select({
  ios: { shadowColor: '#0f172a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
  android: { elevation: 3 },
});

const s = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    ...softShadow,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerRight: {
    alignItems: 'center',
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceTitle: {
    fontSize: 15,
    fontFamily: 'Almarai_800ExtraBold',
    color: '#0f172a',
    writingDirection: 'rtl',
    lineHeight: 22,
  },
  timeText: {
    fontSize: 11,
    fontFamily: 'Almarai_400Regular',
    color: Colors.textMuted,
    marginTop: 2,
    writingDirection: 'rtl',
  },
  posterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  posterInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  locationInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  initialsAvatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    color: Colors.white,
    fontSize: 10,
    fontFamily: 'Almarai_700Bold',  paddingTop: 4, paddingBottom: 4, 
  },
  posterName: {
    fontFamily: 'Almarai_700Bold',  paddingTop: 4, paddingBottom: 4, fontSize: 12,
    color: '#1e293b',
    writingDirection: 'rtl',
    flexShrink: 1,
  },
  locationText: {
    fontFamily: 'Almarai_400Regular',  paddingTop: 4, paddingBottom: 4, fontSize: 11,
    color: '#64748b',
    writingDirection: 'rtl',
    flexShrink: 1,
  },
  descBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 12,
  },
  descText: {
    fontSize: 12,
    fontFamily: 'Almarai_400Regular',
    color: '#475569',
    lineHeight: 20,
    writingDirection: 'rtl',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginBottom: 12,
  },
  detailsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  detailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  pillNeutral: {
    backgroundColor: '#f8fafc',
  },
  pillGreen: {
    backgroundColor: '#ecfdf5',
  },
  pillOrange: {
    backgroundColor: '#fff7ed',
  },
  detailText: {
    fontSize: 12,
    fontFamily: 'Almarai_700Bold',
    color: '#475569',
  },
  budgetValText: {
    fontSize: 13,
    fontFamily: 'Almarai_800ExtraBold',
    color: '#64748b',
    flexShrink: 1,
  },
  ratingWrap: {
    marginBottom: 12,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
  },
})

