import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { DriverProfile } from '../../types/jobs.types'
import { VerificationBadge } from '../jobs/VerificationBadge'
import { LicenseChips } from '../jobs/LicenseChips'
import { getInitials, getAvatarColor } from '../../utils/format'
import { getPostGovLabel, getPostCityLabel } from '../../constants/locations'

interface DriverCardProps {
  driver: DriverProfile
  onPress?: () => void
  compact?: boolean
}

export function DriverCard({ driver, onPress, compact = false }: DriverCardProps) {
  const name = driver.user?.displayName ?? driver.user?.username ?? 'سائق في سوق ون'
  const initials = getInitials(name)
  const avatarColor = getAvatarColor(driver.userId)
  const isVerified = driver.isVerified || driver.user?.isVerified || false

  const govLabel = driver.governorate ? getPostGovLabel(driver.governorate) : ''
  const cityLabel = driver.governorate && driver.city ? getPostCityLabel(driver.governorate, driver.city) : driver.city

  return (
    <TouchableOpacity style={s.card} activeOpacity={0.8} onPress={onPress}>
      
      {/* Top Section: Avatar & Basic Info */}
      <View style={s.topRow}>
        <View style={s.avatarContainer}>
          {driver.user?.avatarUrl ? (
            <Image source={{ uri: driver.user.avatarUrl }} style={s.avatar} />
          ) : (
            <View style={[s.avatar, s.initialsAvatar, { backgroundColor: avatarColor }]}>
              <Text style={s.initialsText}>{initials}</Text>
            </View>
          )}
          {/* Availability Status Dot */}
          <View style={[s.statusDot, driver.isAvailable ? s.dotAvailable : s.dotBusy]} />
        </View>

        <View style={s.infoContainer}>
          <View style={s.nameRow}>
            <Text style={s.nameText} numberOfLines={1}>{name}</Text>
            {isVerified && <VerificationBadge size={14} />}
          </View>
          
          <View style={s.locationRow}>
            <Ionicons name="location" size={12} color="#64748b" />
            <Text style={s.locationText} numberOfLines={1}>
              {govLabel}{cityLabel ? `، ${cityLabel}` : ''}
              {(!govLabel && !cityLabel) && 'موقع غير محدد'}
            </Text>
          </View>
        </View>

        <View style={s.ratingBadge}>
          <Ionicons name="star" size={12} color="#f59e0b" />
          <Text style={s.ratingText}>{driver.averageRating || 'جديد'}</Text>
        </View>
      </View>

      {/* Licenses Area */}
      {!compact && driver.licenseTypes && driver.licenseTypes.length > 0 && (
        <View style={s.servicesWrap}>
          <LicenseChips licenseTypes={driver.licenseTypes} limit={3} />
        </View>
      )}

      {/* Footer / CTA Area */}
      <View style={s.footerDivider} />
      <View style={s.footerRow}>
        <View style={s.statsRow}>
          <Ionicons name="checkmark-circle-outline" size={14} color="#94a3b8" />
          <Text style={s.statsText}>{driver.completedJobs || 0} مهمة منجزة</Text>
        </View>
        
        <View style={s.ctaWrap}>
          <Text style={s.ctaText}>عرض الملف</Text>
          <Ionicons name="chevron-back" size={14} color={Colors.primary} />
        </View>
      </View>

    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 16,
    ...Platform.select({
      ios: { shadowColor: '#1e293b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12 },
      android: { elevation: 3 },
    }),
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#f8fafc',
  },
  initialsAvatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    color: '#ffffff',
    fontSize: 20,
    fontFamily: 'Almarai_800ExtraBold',
    lineHeight: 28,
  },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  dotAvailable: { backgroundColor: '#10b981' },
  dotBusy: { backgroundColor: '#ef4444' },
  
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  nameText: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 16,
    color: '#0f172a',
    textAlign: 'left',
    lineHeight: 24,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 13,
    color: '#64748b',
    textAlign: 'left',
    lineHeight: 20,
    flexShrink: 1,
  },
  
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  ratingText: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 12,
    color: '#d97706',
    lineHeight: 18,
  },

  servicesWrap: {
    marginBottom: 16,
  },

  footerDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginBottom: 12,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statsText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18,
  },
  ctaWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ctaText: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 13,
    color: Colors.primary,
    lineHeight: 18,
  },
})

