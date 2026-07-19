import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'
import { CarrierProfile } from '../../types/transport.types'
import { VerificationBadge } from '../jobs/VerificationBadge'
import RatingBadges from '../jobs/RatingBadges'
import { getInitials, getAvatarColor } from '../../utils/format'
import { getPostGovLabel, getPostCityLabel } from '../../constants/locations'
import { getServiceLabel } from '../../constants/transport'

interface CarrierCardProps {
  carrier: CarrierProfile & { user?: any } 
  onPress?: () => void
  compact?: boolean
}

export function CarrierCard({ carrier, onPress, compact = false }: CarrierCardProps) {
  const name = carrier.companyName || carrier.user?.displayName || carrier.user?.username || 'ناقل في سوق ون'
  const initials = getInitials(name)
  const avatarColor = getAvatarColor(carrier.userId)
  const isVerified = carrier.user?.isVerified || carrier.isVerified || false;

  const govLabel = carrier.governorate ? getPostGovLabel(carrier.governorate) : '';
  const cityLabel = carrier.governorate && carrier.city ? getPostCityLabel(carrier.governorate, carrier.city) : carrier.city;

  return (
    <TouchableOpacity style={s.card} activeOpacity={0.8} onPress={onPress}>
      
      {/* Top Section: Avatar & Basic Info */}
      <View style={s.topRow}>
        <View style={s.avatarContainer}>
          {carrier.user?.avatarUrl ? (
            <Image source={{ uri: carrier.user.avatarUrl }} style={s.avatar} />
          ) : (
            <View style={[s.avatar, s.initialsAvatar, { backgroundColor: avatarColor }]}>
              <Text style={s.initialsText}>{initials}</Text>
            </View>
          )}
          {/* Availability Status Dot */}
          <View style={[s.statusDot, carrier.isAvailable ? s.dotAvailable : s.dotBusy]} />
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
          <Text style={s.ratingText}>{carrier.averageRating || 'جديد'}</Text>
        </View>
      </View>

      {/* Services Area */}
      {!compact && carrier.serviceTypes && carrier.serviceTypes.length > 0 && (
        <View style={s.servicesWrap}>
           <View style={s.chipsRow}>
            {carrier.serviceTypes.slice(0, 3).map((svc, i) => (
              <View key={i} style={s.chip}>
                <Text style={s.chipText}>{getServiceLabel(svc)}</Text>
              </View>
            ))}
            {carrier.serviceTypes.length > 3 && (
              <View style={s.chipExtra}>
                <Text style={s.chipExtraText}>+{carrier.serviceTypes.length - 3}</Text>
              </View>
            )}
           </View>
        </View>
      )}

      {/* Footer / CTA Area */}
      <View style={s.footerDivider} />
      <View style={s.footerRow}>
        <View style={s.statsRow}>
          <Ionicons name="cube-outline" size={14} color="#94a3b8" />
          <Text style={s.statsText}>{carrier.totalTrips || 0} رحلة ناجحة</Text>
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
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
  },
  chipText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    color: '#475569',
    lineHeight: 16,
  },
  chipExtra: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
  },
  chipExtraText: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 11,
    color: '#334155',
    lineHeight: 16,
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
