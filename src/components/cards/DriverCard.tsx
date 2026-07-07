import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'
import { DriverProfile } from '../../types/jobs.types'
import { VerificationBadge } from '../jobs/VerificationBadge'
import { LicenseChips } from '../jobs/LicenseChips'
import RatingBadges from '../jobs/RatingBadges'
import { getInitials, getAvatarColor } from '../../utils/format'

interface DriverCardProps {
  driver: DriverProfile
  onPress?: () => void
}

export function DriverCard({ driver, onPress }: DriverCardProps) {
  const name = driver.user.displayName ?? driver.user.username
  const initials = getInitials(name)
  const avatarColor = getAvatarColor(driver.userId)

  return (
    <TouchableOpacity style={s.card} activeOpacity={0.8} onPress={onPress}>
      {/* Top row: Avatar + Name + Available Badge */}
      <View style={s.topRow}>
        <View style={s.profileInfo}>
          {driver.user.avatarUrl ? (
            <Image source={{ uri: driver.user.avatarUrl }} style={s.avatar} />
          ) : (
            <View style={[s.avatar, s.initialsAvatar, { backgroundColor: avatarColor }]}>
              <Text style={s.initialsText}>{initials}</Text>
            </View>
          )}
          <View style={s.nameBox}>
            <View style={s.nameRow}>
              <Text style={s.nameText} numberOfLines={1}>{name}</Text>
              {driver.isVerified && <VerificationBadge size={14} />}
            </View>
            <View style={s.locationRow}>
              <Ionicons name="location-outline" size={12} color={Colors.text2} />
              <Text style={s.locationText} numberOfLines={1}>
                {driver.governorate}{driver.city ? ` · ${driver.city}` : ''}
              </Text>
            </View>
          </View>
        </View>

        {/* Availability Badge */}
        <View style={[s.availBadge, driver.isAvailable ? s.availGreen : s.availGray]}>
          <View style={[s.availDot, driver.isAvailable ? s.dotGreen : s.dotGray]} />
          <Text style={[s.availText, driver.isAvailable ? s.txtGreen : s.txtGray]}>
            {driver.isAvailable ? 'متاح الآن' : 'غير متاح'}
          </Text>
        </View>
      </View>

      {/* Rating badges */}
      <View style={s.ratingsWrap}>
        <RatingBadges
          rating={driver.averageRating}
          completionRate={driver.completionRate}
          responseTime={driver.responseTimeHours}
          completedJobs={driver.completedJobs}
          size="sm"
        />
      </View>

      {/* License chips */}
      {driver.licenseTypes.length > 0 && (
        <View style={s.licensesWrap}>
          <LicenseChips licenseTypes={driver.licenseTypes} />
        </View>
      )}

      {/* CTA Button */}
      <View style={s.ctaButton}>
        <Text style={s.ctaText}>عرض الملف الشخصي</Text>
      </View>
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,          // 16
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.space4,          // 16
    marginBottom: Spacing.space4,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.space3,     // 12
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.space3,              // 12
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: Radius.pill,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  initialsAvatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'Almarai_700Bold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, },
  nameBox: {
    flex: 1,
    gap: Spacing.space1,              // 4
    alignItems: 'flex-start',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space1,              // 4
  },
  nameText: {
    fontFamily: 'Almarai_700Bold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 14,
    color: Colors.text,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space1,              // 4
  },
  locationText: {
    fontFamily: 'Almarai_400Regular', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 12,
    color: Colors.text2,
  },
  availBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space1,              // 4
    paddingVertical: Spacing.space1,  // 4
    paddingHorizontal: Spacing.space2,// 8
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  availGreen: {
    backgroundColor: Colors.success + '1A',
    borderColor: Colors.success + '40',
  },
  availGray: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
  },
  availDot: {
    width: 6,
    height: 6,
    borderRadius: Radius.pill,
  },
  dotGreen:  { backgroundColor: Colors.success },
  dotGray:   { backgroundColor: Colors.textMuted },
  availText: { fontSize: 11, fontFamily: 'Almarai_700Bold' },
  txtGreen:  { color: Colors.success },
  txtGray:   { color: Colors.text2 },
  ratingsWrap: {
    marginBottom: Spacing.space3,     // 12
  },
  licensesWrap: {
    marginBottom: Spacing.space3,     // 12
  },
  ctaButton: {
    backgroundColor: Colors.primary + '0A',
    borderWidth: 1,
    borderColor: Colors.primary + '1A',
    borderRadius: Radius.md,          // 12
    paddingVertical: Spacing.space2,  // 8
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    color: Colors.primary,
    fontFamily: 'Almarai_700Bold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 13,
  },
})

