import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native'
import { Image } from 'expo-image'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'
import { CardSystem } from '../../constants/cardSystem'
import { UnifiedCardItem } from './UnifiedCard'
import { getOperatorTypeLabel, getEquipmentTypeLabel } from '../../utils/equipment-mappers'
import { dialogService } from '../../store/dialogStore'

interface Props {
  item: UnifiedCardItem
  onPress: () => void
}

export function OperatorCard({ item, onPress }: Props) {
  const { title, price, priceText, priceLabel, currency, governorate, raw } = item
  const isVerified = (item as any).isVerified ?? raw?.user?.isVerified ?? false
  const userAvatar = (item as any).avatar || raw?.user?.avatarUrl || raw?.user?.avatar
  const contactPhone = raw?.contactPhone || raw?.user?.phone || (item as any).phone
  const whatsapp = raw?.whatsapp || contactPhone

  // Extract data from raw
  const operatorType = getOperatorTypeLabel(raw?.operatorType)
  const experienceYears = raw?.experienceYears
  const experienceText = experienceYears ? `${experienceYears} سنوات خبرة` : null

  // Equipment tags
  const equipmentTags = (raw?.equipmentTypes && raw.equipmentTypes.length > 0)
    ? raw.equipmentTypes.map((t: string) => getEquipmentTypeLabel(t))
    : ['معدات ثقيلة']

  const displayTags = equipmentTags.slice(0, 3)
  const extraCount = equipmentTags.length - 3

  const description = item.description || raw?.description

  // Format price
  let displayPrice = ''
  const displayCurrency = currency === 'USD' ? '$' : 'ر.ع.'
  if (price && price > 0) {
    displayPrice = `${price} ${displayCurrency}` + (priceLabel ? ` / ${priceLabel}` : '')
  } else if (priceText) {
    displayPrice = priceText
  }

  const handleCall = (e: any) => {
    e.stopPropagation?.()
    if (contactPhone) {
      Linking.openURL(`tel:${contactPhone}`)
    } else {
      dialogService.alert('تنبيه', 'رقم الهاتف غير متوفر لهذا المشغل')
    }
  }

  const handleWhatsApp = (e: any) => {
    e.stopPropagation?.()
    const targetPhone = whatsapp || contactPhone
    if (targetPhone) {
      const cleanPhone = targetPhone.replace(/[^0-9+]/g, '')
      const msg = encodeURIComponent(`مرحباً، بخصوص إعلانك كمشغل: ${title}`)
      Linking.openURL(`whatsapp://send?phone=${cleanPhone}&text=${msg}`)
    } else {
      dialogService.alert('تنبيه', 'رقم الواتساب غير متوفر')
    }
  }

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.88}>
      {/* ── Top Row: Compact Avatar + Title & Badges ── */}
      <View style={s.topRow}>
        <View style={s.avatarContainer}>
          {userAvatar ? (
            <Image source={{ uri: userAvatar }} style={s.avatar} contentFit="cover" />
          ) : (
            <View style={s.avatarPlaceholder}>
              <MaterialCommunityIcons name="hard-hat" size={22} color={Colors.primary} />
            </View>
          )}
          {isVerified && (
            <View style={s.verifiedIconBadge}>
              <Ionicons name="checkmark-circle" size={13} color="#1877F2" />
            </View>
          )}
        </View>

        <View style={s.textContainer}>
          <View style={s.titleRow}>
            <Text style={s.title} numberOfLines={1}>{title}</Text>
          </View>

          {/* Role & Experience Pills (CarCard style) */}
          <View style={s.badgesRow}>
            {operatorType ? (
              <View style={[s.detailPill, s.pillBlue]}>
                <Ionicons name="person-outline" size={11} color="#2563eb" />
                <Text style={[s.detailText, { color: '#2563eb' }]} numberOfLines={1}>
                  {operatorType}
                </Text>
              </View>
            ) : null}

            {experienceText ? (
              <View style={[s.detailPill, s.pillGreen]}>
                <Ionicons name="shield-checkmark-outline" size={11} color="#059669" />
                <Text style={[s.detailText, { color: '#059669' }]} numberOfLines={1}>
                  {experienceText}
                </Text>
              </View>
            ) : null}
          </View>

          {description ? (
            <Text style={s.subtitle} numberOfLines={2}>{description}</Text>
          ) : null}
        </View>
      </View>

      {/* ── Details List: Equipment Pills (CarCard Style) ── */}
      {displayTags && displayTags.length > 0 && (
        <View style={s.detailsList}>
          {displayTags.map((tag: string, i: number) => (
            <View key={i} style={[s.detailPill, s.pillNeutral]}>
              <Ionicons name="construct-outline" size={11} color="#64748b" />
              <Text style={s.detailText} numberOfLines={1}>{tag}</Text>
            </View>
          ))}
          {extraCount > 0 && (
            <View style={[s.detailPill, s.pillNeutral, { paddingHorizontal: 4.5, flexShrink: 0 }]}>
              <Text style={[s.detailText, { fontFamily: 'Almarai_700Bold', color: '#64748b', fontSize: 9.5 }]}>
                +{extraCount}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* ── Footer: Location & Price ── */}
      <View style={s.footer}>
        <View style={s.locationRow}>
          <Ionicons name="location-outline" size={12} color={Colors.textMuted} />
          <Text style={s.locationTxt} numberOfLines={1}>
            {governorate || 'سلطنة عمان'}
          </Text>
        </View>

        {displayPrice ? (
          <View style={[s.detailPill, s.pillOrange]}>
            <Ionicons name="wallet-outline" size={12} color="#ea580c" />
            <Text style={[s.detailText, { color: '#ea580c', fontFamily: 'Almarai_800ExtraBold' }]}>
              {displayPrice}
            </Text>
          </View>
        ) : (
          <View style={[s.detailPill, s.pillNeutral]}>
            <Text style={[s.detailText, { color: '#64748b', fontFamily: 'Almarai_700Bold' }]}>
              قابل للتفاوض
            </Text>
          </View>
        )}
      </View>

      {/* ── Quick Actions Row (Compact) ── */}
      <View style={s.actionRow}>
        <TouchableOpacity style={s.callBtn} onPress={handleCall} activeOpacity={0.8}>
          <Ionicons name="call" size={12} color={Colors.primary} />
          <Text style={s.callBtnTxt}>اتصال</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.whatsappBtn} onPress={handleWhatsApp} activeOpacity={0.8}>
          <Ionicons name="logo-whatsapp" size={13} color="#16A34A" />
          <Text style={s.whatsappBtnTxt}>واتساب</Text>
        </TouchableOpacity>
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
    width: '100%',
    marginBottom: Spacing.space3,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.space3,
    marginBottom: Spacing.space2,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  verifiedIconBadge: {
    position: 'absolute',
    bottom: -2,
    end: -2,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  textContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  title: {
    ...CardSystem.typography.title,
    color: '#0f172a',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 4,
  },
  subtitle: {
    ...CardSystem.typography.subtitle,
    color: Colors.textMuted,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  detailsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.space2,
  },
  detailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: CardSystem.radius.inner,
    flexShrink: 1,
  },
  pillNeutral: CardSystem.styles.pillNeutral,
  pillBlue: CardSystem.styles.pillBlue,
  pillAmber: CardSystem.styles.pillAmber,
  pillGreen: CardSystem.styles.pillGreen,
  pillOrange: CardSystem.styles.pillOrange,
  detailText: {
    ...CardSystem.typography.pillText,
    color: '#475569',
    writingDirection: 'rtl',
    flexShrink: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.space2,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginBottom: Spacing.space2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flex: 1,
  },
  locationTxt: {
    ...CardSystem.typography.subtitle,
    color: Colors.textMuted,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.space2,
    paddingTop: 2,
  },
  callBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    paddingVertical: 6,
    borderRadius: Radius.md,
  },
  callBtnTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11.5,
    lineHeight: 16,
    color: Colors.primary,
  },
  whatsappBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    paddingVertical: 6,
    borderRadius: Radius.md,
  },
  whatsappBtnTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11.5,
    lineHeight: 16,
    color: '#16A34A',
  },
})
