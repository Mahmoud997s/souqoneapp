import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform, ScrollView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'
import { CarrierProfile } from '../../types/transport.types'
import { VerificationBadge } from '../jobs/VerificationBadge'
import RatingBadges from '../jobs/RatingBadges'
import { getInitials, getAvatarColor } from '../../utils/format'
import { formatLocation } from '../../utils/mappers'
import { getServiceLabel } from '../../constants/transport'
import { CardSystem } from '../../constants/cardSystem'

interface CarrierCardProps {
  carrier: CarrierProfile & { user?: any } 
  onPress?: () => void
  compact?: boolean
  maxChips?: number
}

export function CarrierCard({ carrier, onPress, compact = false, maxChips = 3 }: CarrierCardProps) {
  const name = carrier.companyName || carrier.user?.displayName || carrier.user?.username || 'ناقل في سوق ون'
  const initials = getInitials(name)
  const avatarColor = getAvatarColor(carrier.userId)
  const isVerified = carrier.user?.isVerified || carrier.isVerified || false;

  const locationDisplay = formatLocation(carrier as any) || 'موقع غير محدد';

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
            <Text style={s.locationText} numberOfLines={1}>{locationDisplay}</Text>
          </View>
        </View>

        <View style={s.ratingBadge}>
          <Ionicons name="star" size={12} color="#f59e0b" />
          <Text style={s.ratingText}>{carrier.averageRating || 'جديد'}</Text>
        </View>
      </View>

      {/* Services Area (Configurable maxChips with +N remainder) */}
      {!compact && carrier.serviceTypes && carrier.serviceTypes.length > 0 && (
        <View style={s.servicesWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.chipsRow}
          >
            {carrier.serviceTypes.slice(0, maxChips).map((svc, i) => (
              <View key={i} style={s.chip}>
                <Text style={s.chipText} numberOfLines={1}>{getServiceLabel(svc)}</Text>
              </View>
            ))}
            {carrier.serviceTypes.length > maxChips && (
              <View style={s.chipExtra}>
                <Text style={s.chipExtraText}>+{carrier.serviceTypes.length - maxChips}</Text>
              </View>
            )}
          </ScrollView>
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
    borderRadius: CardSystem.radius.outer,
    padding: CardSystem.padding.dense,
    ...CardSystem.styles.border,
    ...CardSystem.styles.softShadow,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#f8fafc',
  },
  initialsAvatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Almarai_800ExtraBold',
    lineHeight: 22,
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
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
    gap: 4,
    marginBottom: 2,
  },
  nameText: {
    ...CardSystem.typography.title,
    fontSize: 13.5,
    color: '#0f172a',
    textAlign: 'left',
    lineHeight: 19,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  locationText: {
    ...CardSystem.typography.subtitle,
    fontSize: 10.5,
    color: '#64748b',
    textAlign: 'left',
    lineHeight: 15,
  },
  
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: CardSystem.radius.badge,
    gap: 3,
  },
  ratingText: {
    ...CardSystem.typography.badgeText,
    fontSize: 10.5,
    color: '#d97706',
    lineHeight: 14,
  },

  servicesWrap: {
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: CardSystem.gap.secondary,
    height: 22,
    overflow: 'hidden',
  },
  chip: {
    paddingVertical: 3.5,
    paddingHorizontal: 7,
    backgroundColor: '#f1f5f9',
    borderRadius: CardSystem.radius.inner,
  },
  chipText: {
    ...CardSystem.typography.pillText,
    fontSize: 10,
    color: '#475569',
    lineHeight: 14,
  },
  chipExtra: {
    paddingVertical: 3.5,
    paddingHorizontal: 7,
    backgroundColor: '#e2e8f0',
    borderRadius: CardSystem.radius.inner,
  },
  chipExtraText: {
    ...CardSystem.typography.pillText,
    fontSize: 10,
    color: '#334155',
    lineHeight: 14,
  },

  footerDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginBottom: 8,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statsText: {
    ...CardSystem.typography.subtitle,
    fontSize: 11,
    color: '#64748b',
    lineHeight: 16,
  },
  ctaWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ctaText: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 11.5,
    color: Colors.primary,
    lineHeight: 16,
  },
});

