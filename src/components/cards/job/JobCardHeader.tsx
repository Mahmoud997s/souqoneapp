import React from 'react'
import { View, Text, StyleSheet, Image } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { CardSystem } from '../../../constants/cardSystem'
import { VerificationBadge } from '../../jobs/VerificationBadge'
import { ParsedJobCardData } from './jobCard.types'

export interface JobCardHeaderProps {
  data: ParsedJobCardData
  actionMenu?: React.ReactNode
}

export function JobCardHeader({ data, actionMenu }: JobCardHeaderProps) {
  return (
    <View style={s.topRow}>
      {/* Avatar Container */}
      <View style={s.avatarContainer}>
        {data.avatarUrl ? (
          <Image source={{ uri: data.avatarUrl }} style={s.avatar} />
        ) : (
          <View style={[s.avatar, s.initialsAvatar, { backgroundColor: data.avatarColor }]}>
            <Text style={s.initialsText}>{data.initials}</Text>
          </View>
        )}
        {/* Availability Status Dot */}
        <View style={[s.statusDot, data.isAvailable ? s.dotAvailable : s.dotBusy]} />
      </View>

      {/* Info Column */}
      <View style={s.infoContainer}>
        <View style={s.nameRow}>
          <Text style={s.nameText} numberOfLines={1}>
            {data.posterName}
          </Text>
          {data.isVerified && <VerificationBadge size={14} />}
        </View>

        <View style={s.locationRow}>
          <Ionicons name="location-outline" size={12} color="#64748b" />
          <Text style={s.locationText} numberOfLines={1}>
            {data.locationDisplay}
          </Text>
        </View>
      </View>

      {/* Action Menu or Rating Badge */}
      {actionMenu ? (
        <View style={s.actionMenuWrap}>{actionMenu}</View>
      ) : (
        <View style={s.badgeWrap}>
          {data.rating ? (
            <View style={s.ratingBadge}>
              <Ionicons name="star" size={11} color="#f59e0b" />
              <Text style={s.ratingText}>{String(data.rating)}</Text>
            </View>
          ) : (
            <View style={s.typeTag}>
              <Text style={s.typeTagText}>{data.isHiring ? 'توظيف' : 'سائق متاح'}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  )
}

const s = StyleSheet.create({
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
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: '#f8fafc',
  },
  initialsAvatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    color: '#ffffff',
    fontSize: 15,
    fontFamily: 'Almarai_800ExtraBold',
    lineHeight: 20,
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  dotAvailable: { backgroundColor: '#10b981' },
  dotBusy: { backgroundColor: '#3b82f6' },

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
    lineHeight: 18,
    writingDirection: 'rtl',
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
    writingDirection: 'rtl',
  },

  badgeWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionMenuWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: CardSystem.radius.badge,
    gap: 3,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  ratingText: {
    ...CardSystem.typography.badgeText,
    fontSize: 10.5,
    color: '#d97706',
    lineHeight: 14,
  },
  typeTag: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  typeTagText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 10.5,
    color: '#2563eb',
    lineHeight: 14,
  },
})
