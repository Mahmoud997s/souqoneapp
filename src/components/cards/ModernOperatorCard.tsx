import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { CardSystem } from '../../constants/cardSystem'
import { VerificationBadge } from '../jobs/VerificationBadge'
import { getInitials, getAvatarColor } from '../../utils/format'
import { getPostGovLabel, getPostCityLabel } from '../../constants/locations'
import { getOperatorTypeLabel, getEquipmentTypeLabel } from '../../utils/equipment-mappers'
import { OperatorListing } from '../../types/equipment.types'
import { UnifiedCardItem } from './UnifiedCard'

const CARD_WIDTH = Dimensions.get('window').width * 0.6

export interface ModernOperatorCardProps {
  item: OperatorListing | UnifiedCardItem | any
  onPress?: () => void
  fullWidth?: boolean
  maxChips?: number
  actionMenu?: React.ReactNode
  isAvailable?: boolean
}

export function ModernOperatorCard({
  item,
  onPress,
  fullWidth = false,
  maxChips = 3,
  actionMenu,
  isAvailable = true,
}: ModernOperatorCardProps) {
  if (!item) return null

  // Resolve raw data or direct fields
  const raw = item.raw || item
  const user = item.user || raw.user

  const name =
    user?.displayName ||
    user?.username ||
    item.title ||
    raw.title ||
    'مشغل في سوق ون'

  const userId = item.userId || raw.userId || user?.id || item.id || ''
  const initials = getInitials(name)
  const avatarColor = getAvatarColor(userId)
  const avatarUrl = user?.avatarUrl || item.avatarUrl

  const isVerified = Boolean(user?.isVerified || item.isVerified || raw.isVerified)

  // Location resolution
  const gov = item.governorate || raw.governorate || ''
  const city = item.city || raw.city || ''
  const govLabel = gov ? getPostGovLabel(gov) : ''
  const cityLabel = gov && city ? getPostCityLabel(gov, city) : city
  const locationDisplay =
    govLabel || cityLabel
      ? `${govLabel}${cityLabel ? `، ${cityLabel}` : ''}`
      : 'موقع غير محدد'

  // Operator Specs
  const operatorType = raw.operatorType || item.operatorType
  const operatorTypeLabel = operatorType ? getOperatorTypeLabel(operatorType) : 'مشغل معدات'

  const experienceYears = raw.experienceYears ?? item.experienceYears
  const expLabel = experienceYears != null && experienceYears > 0 ? `خبرة ${experienceYears} سنوات` : null

  // Equipment tags
  const rawEquipTypes: string[] = raw.equipmentTypes || item.equipmentTypes || []
  const equipLabels = rawEquipTypes.map((t) => getEquipmentTypeLabel(t))

  // Specializations
  const rawSpecs: string[] = raw.specializations || item.specializations || []

  // Combine tags for chips
  const allChips: Array<{ key: string; label: string; icon: any; iconType: 'ion' | 'mci'; style: any }> = []

  if (operatorTypeLabel) {
    allChips.push({
      key: 'type',
      label: operatorTypeLabel,
      icon: 'account-hard-hat',
      iconType: 'mci',
      style: s.pillBlue,
    })
  }

  if (expLabel) {
    allChips.push({
      key: 'exp',
      label: expLabel,
      icon: 'ribbon-outline',
      iconType: 'ion',
      style: s.pillAmber,
    })
  }

  equipLabels.forEach((lbl, idx) => {
    allChips.push({
      key: `eq-${idx}`,
      label: lbl,
      icon: 'construct-outline',
      iconType: 'ion',
      style: s.pillNeutral,
    })
  })

  rawSpecs.forEach((spec, idx) => {
    allChips.push({
      key: `sp-${idx}`,
      label: spec,
      icon: 'checkmark-circle-outline',
      iconType: 'ion',
      style: s.pillNeutral,
    })
  })

  const visibleChips = allChips.slice(0, maxChips)
  const remainingChips = allChips.length - maxChips

  // Price formatting
  const dailyRate = raw.dailyRate ?? item.dailyRate ?? item.price
  const hourlyRate = raw.hourlyRate ?? item.hourlyRate
  const currencySymbol = (item.currency || raw.currency) === 'USD' ? '$' : 'ر.ع.'

  let displayPrice = 'تواصل للسعر'
  if (dailyRate && Number(dailyRate) > 0) {
    displayPrice = `${dailyRate} ${currencySymbol} / يوم`
  } else if (hourlyRate && Number(hourlyRate) > 0) {
    displayPrice = `${hourlyRate} ${currencySymbol} / ساعة`
  } else if (item.priceText || raw.priceText) {
    displayPrice = item.priceText || raw.priceText
  }

  const rating = item.rating || raw.rating || user?.rating || null

  return (
    <TouchableOpacity
      style={[
        s.card,
        fullWidth ? s.cardFull : s.cardFixed,
      ]}
      activeOpacity={0.85}
      onPress={onPress}
    >
      {/* ── Top Row: Avatar, Name, Verification, Rating / Action Menu ── */}
      <View style={s.topRow}>
        <View style={s.avatarContainer}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={s.avatar} />
          ) : (
            <View style={[s.avatar, s.initialsAvatar, { backgroundColor: avatarColor }]}>
              <Text style={s.initialsText}>{initials}</Text>
            </View>
          )}
          {/* Availability Status Dot */}
          <View style={[s.statusDot, isAvailable ? s.dotAvailable : s.dotBusy]} />
        </View>

        <View style={s.infoContainer}>
          <View style={s.nameRow}>
            <Text style={s.nameText} numberOfLines={1}>
              {name}
            </Text>
            {isVerified && <VerificationBadge size={14} />}
          </View>

          <View style={s.locationRow}>
            <Ionicons name="location-outline" size={12} color="#64748b" />
            <Text style={s.locationText} numberOfLines={1}>
              {locationDisplay}
            </Text>
          </View>
        </View>

        {actionMenu ? (
          <View style={s.actionMenuWrap}>{actionMenu}</View>
        ) : (
          <View style={s.ratingBadge}>
            <Ionicons name="star" size={11} color="#f59e0b" />
            <Text style={s.ratingText}>
              {rating ? String(rating) : 'جديد'}
            </Text>
          </View>
        )}
      </View>

      {/* ── Details List (Pills) Single Row Nowrap ── */}
      {visibleChips.length > 0 && (
        <View style={s.chipsRow}>
          {visibleChips.map((chip) => (
            <View key={chip.key} style={[s.detailPill, chip.style]}>
              {chip.iconType === 'mci' ? (
                <MaterialCommunityIcons name={chip.icon} size={12} color="#475569" />
              ) : (
                <Ionicons name={chip.icon} size={12} color="#475569" />
              )}
              <Text style={s.pillText} numberOfLines={1} ellipsizeMode="tail">
                {chip.label}
              </Text>
            </View>
          ))}

          {remainingChips > 0 && (
            <View style={[s.detailPill, s.pillNeutral, s.extraPill]}>
              <Text style={s.extraPillText}>+{remainingChips}</Text>
            </View>
          )}
        </View>
      )}

      {/* ── Footer Divider ── */}
      <View style={s.divider} />

      {/* ── Footer Row: Price & CTA ── */}
      <View style={s.footerRow}>
        <View style={[s.detailPill, s.pillNeutral, { flex: 1 }]}>
          <Ionicons name="wallet-outline" size={13} color="#64748b" />
          <Text style={s.budgetValText} numberOfLines={1}>
            {displayPrice}
          </Text>
        </View>

        <View style={[s.detailPill, s.ctaPill]}>
          <Text style={s.ctaText}>عرض الملف</Text>
          <Ionicons name="chevron-back" size={12} color={Colors.primary} />
        </View>
      </View>
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: CardSystem.radius.outer,
    padding: CardSystem.padding.dense,
    ...CardSystem.styles.border,
    ...CardSystem.styles.softShadow,
    alignSelf: 'flex-start',
  },
  cardFull: {
    width: '100%',
  },
  cardFixed: {
    width: CARD_WIDTH,
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
  actionMenuWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    gap: 3.5,
    marginBottom: 8,
    overflow: 'hidden',
  },
  detailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 2.5,
    borderRadius: 6,
    flexShrink: 1,
  },
  pillNeutral: {
    backgroundColor: '#f8fafc',
  },
  pillBlue: {
    backgroundColor: '#eff6ff',
  },
  pillAmber: {
    backgroundColor: '#fffbeb',
  },
  pillText: {
    fontSize: 10,
    fontFamily: 'Almarai_700Bold',
    color: '#475569',
    lineHeight: 14,
    writingDirection: 'rtl',
    flexShrink: 1,
  },
  extraPill: {
    paddingHorizontal: 4.5,
    flexShrink: 0,
    backgroundColor: '#f1f5f9',
  },
  extraPillText: {
    fontSize: 9.5,
    fontFamily: 'Almarai_700Bold',
    color: '#64748b',
    lineHeight: 13,
  },

  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginTop: 2,
    marginBottom: 6,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 5,
  },
  budgetValText: {
    fontSize: 11.5,
    fontFamily: 'Almarai_800ExtraBold',
    color: '#64748b',
    lineHeight: 15,
    writingDirection: 'rtl',
    flexShrink: 1,
  },
  ctaPill: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  ctaText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 10.5,
    color: Colors.primary,
    lineHeight: 14,
    writingDirection: 'rtl',
  },
})
