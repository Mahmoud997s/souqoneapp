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

  // Equipment & Certification tags
  const equipmentTags = (raw?.equipmentTypes && raw.equipmentTypes.length > 0)
    ? raw.equipmentTypes.map((t: string) => getEquipmentTypeLabel(t))
    : ['معدات ثقيلة']

  const hasCertifications = Boolean(raw?.certifications && raw.certifications.length > 0)

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
      {/* ── Top Row: Scaled Avatar (+2px) + Title & Badges ── */}
      <View style={s.topRow}>
        <View style={s.avatarContainer}>
          {userAvatar ? (
            <Image source={{ uri: userAvatar }} style={s.avatar} contentFit="cover" />
          ) : (
            <View style={s.avatarPlaceholder}>
              <MaterialCommunityIcons name="hard-hat" size={24} color={Colors.primary} />
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

          {/* Role & Experience Pills (Soft & Balanced) */}
          <View style={s.badgesRow}>
            {operatorType ? (
              <View style={[s.detailPill, s.pillBlue]}>
                <Ionicons name="person-outline" size={10.5} color="#3B82F6" />
                <Text style={[s.detailText, { color: '#2563EB' }]} numberOfLines={1}>
                  {operatorType}
                </Text>
              </View>
            ) : null}

            {experienceText ? (
              <View style={[s.detailPill, s.pillGreen]}>
                <Ionicons name="shield-checkmark-outline" size={10.5} color="#10B981" />
                <Text style={[s.detailText, { color: '#059669' }]} numberOfLines={1}>
                  {experienceText}
                </Text>
              </View>
            ) : null}
          </View>

        </View>
      </View>

      {/* ── Description Container: Balanced Full Width under Avatar & Title ── */}
      {description ? (
        <View style={s.descContainer}>
          <Text style={s.descText} numberOfLines={2}>
            {description}
          </Text>
        </View>
      ) : null}

      {/* ── Details List: Equipment & Certification Badge ── */}
      {((displayTags && displayTags.length > 0) || hasCertifications) && (
        <View style={s.detailsList}>
          {displayTags.map((tag: string, i: number) => (
            <View key={`eq-${i}`} style={[s.detailPill, s.pillNeutral]}>
              <Ionicons name="construct-outline" size={10.5} color="#64748B" />
              <Text style={s.detailText} numberOfLines={1}>{tag}</Text>
            </View>
          ))}
          {hasCertifications && (
            <View style={[s.detailPill, s.pillAmber]}>
              <Ionicons name="ribbon-outline" size={10.5} color="#D97706" />
              <Text style={[s.detailText, { color: '#B45309', fontFamily: 'Almarai_700Bold' }]} numberOfLines={1}>
                شهادة معتمدة
              </Text>
            </View>
          )}
          {extraCount > 0 && (
            <View style={[s.detailPill, s.pillNeutral, { paddingHorizontal: 4.5, flexShrink: 0 }]}>
              <Text style={[s.detailText, { fontFamily: 'Almarai_700Bold', color: '#64748B', fontSize: 9.5 }]}>
                +{extraCount}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* ── Footer: Location & Price ── */}
      <View style={s.footer}>
        <View style={s.locationRow}>
          <Ionicons name="location-outline" size={12} color="#94A3B8" />
          <Text style={s.locationTxt} numberOfLines={1}>
            {governorate || 'سلطنة عمان'}
          </Text>
        </View>

        {displayPrice ? (
          <View style={[s.detailPill, s.pillOrange]}>
            <Ionicons name="wallet-outline" size={11} color="#EA580C" />
            <Text style={[s.detailText, { color: '#C2410C', fontFamily: 'Almarai_800ExtraBold' }]}>
              {displayPrice}
            </Text>
          </View>
        ) : (
          <View style={[s.detailPill, s.pillNeutral]}>
            <Text style={[s.detailText, { color: '#64748B', fontFamily: 'Almarai_700Bold' }]}>
              قابل للتفاوض
            </Text>
          </View>
        )}
      </View>

      {/* ── Quick Actions Row ── */}
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
    borderWidth: 1,
    borderColor: '#EEF2F6',
    width: '100%',
    marginBottom: Spacing.space3,
    ...Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: {
        elevation: 1.5,
      },
    }),
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: Spacing.space2,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  avatarPlaceholder: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#F0F7FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0EDFD',
  },
  verifiedIconBadge: {
    position: 'absolute',
    bottom: -1,
    end: -1,
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
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 13.5,
    lineHeight: 18.5,
    color: '#0F172A',
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
  descContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    paddingHorizontal: 9,
    paddingVertical: 5.5,
    marginBottom: Spacing.space2,
  },
  descText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    lineHeight: 16.5,
    color: '#475569',
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
  pillNeutral: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  pillBlue: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  pillGreen: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  pillOrange: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  pillAmber: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
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
    borderTopColor: '#F8FAFC',
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
    color: '#94A3B8',
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
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
