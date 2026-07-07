import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert, Dimensions, Platform } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Colors } from '../../../src/constants/colors'
import { useOperatorItem } from '../../../src/hooks/useEquipment'
import { SkeletonCard } from '../../../src/components/ui/SkeletonCard'
import { Ionicons } from '@expo/vector-icons'
import { mapOperatorToCard } from '../../../src/utils/mappers'
import { useAuthStore } from '../../../src/store/authStore'
import { chatApi } from '../../../src/api/chat'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Defs, Pattern, Path, Rect } from 'react-native-svg'

const OPERATOR_TYPE_LABELS: Record<string, string> = {
  DRIVER: 'سائق',
  OPERATOR: 'مشغل معدات',
  TECHNICIAN: 'فني',
  MAINTENANCE: 'صيانة',
}

const EQUIPMENT_TYPE_LABELS: Record<string, string> = {
  EXCAVATOR: 'حفار',
  BULLDOZER: 'جرافة',
  CRANE: 'رافعة',
  LOADER: 'لودر',
  BACKHOE: 'حفار خلفي',
  GRADER: 'ممهدة',
  COMPACTOR: 'مدحلة',
  TRACTOR: 'جرار',
  DUMP_TRUCK: 'شاحنة تفريغ',
  FORKLIFT: 'رافعة شوكية',
  CONCRETE_MIXER: 'خلاطة خرسانة',
  PAVER: 'رصافة',
  TRENCHER: 'حفار خنادق',
  SKID_STEER: 'جرافة صغيرة',
  GENERATOR: 'مولد كهربائي',
  COMPRESSOR: 'ضاغط هواء',
  SCAFFOLDING: 'سقالات',
  WELDING_MACHINE: 'ماكينة لحام',
  TRUCK: 'شاحنة',
  WATER_TANKER: 'صهريج مياه',
  LIGHT_EQUIPMENT: 'معدات خفيفة',
  OTHER_EQUIPMENT: 'معدات أخرى',
  OTHER: 'أخرى',
}

const { width: SW } = Dimensions.get('window')

export default function OperatorDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuthStore()
  const insets = useSafeAreaInsets()
  
  const { data: operator, isLoading } = useOperatorItem(id as string)
  const [isDescExpanded, setIsDescExpanded] = useState(false)

  if (isLoading) {
    return (
      <View style={[s.root, s.center]}>
        <SkeletonCard />
      </View>
    )
  }

  if (!operator) {
    return (
      <View style={[s.root, s.center]}>
        <Ionicons name="alert-circle-outline" size={56} color={Colors.error} />
        <Text style={s.errorTxt}>المشغل غير موجود</Text>
        <TouchableOpacity style={s.retryBtn} onPress={() => router.back()}>
          <Text style={s.retryTxt}>العودة للخلف</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const cardData = mapOperatorToCard(operator)
  const sellerId = operator.userId || (operator as any).raw?.user?.id
  const sellerPhone = operator.contactPhone || (operator as any).raw?.user?.phone || (operator as any).phone
  const raw = operator as any
  const avatarUrl = operator.user?.avatarUrl || operator.user?.avatar || raw.user?.avatarUrl || raw.avatarUrl
  const isVerified = operator.user?.isVerified || raw.user?.isVerified || raw.isVerified
  const isOwner = user?.id === sellerId

  const handleCall = () => {
    if (sellerPhone) {
      Linking.openURL(`tel:${sellerPhone}`)
    } else {
      Alert.alert('تنبيه', 'رقم الهاتف غير متوفر')
    }
  }

  const handleWhatsApp = () => {
    if (sellerPhone) {
      const msg = encodeURIComponent(`مرحباً، بخصوص إعلان المشغل: ${cardData.title}`)
      Linking.openURL(`whatsapp://send?phone=${sellerPhone.replace('+', '')}&text=${msg}`)
    } else {
      Alert.alert('تنبيه', 'رقم الواتساب غير متوفر')
    }
  }

  const handleChat = async () => {
    if (!user) {
      router.push('/(auth)/login')
      return
    }
    if (user.id === sellerId) {
      Alert.alert('تنبيه', 'لا يمكنك مراسلة نفسك')
      return
    }
    try {
      const res = await chatApi.createRoom({
        entityType: 'OPERATOR',
        entityId: operator.id,
        receiverId: sellerId,
      })
      if (res.data?.id) {
        router.push(`/chat/${res.data.id}`)
      }
    } catch (e) {
      Alert.alert('خطأ', 'تعذر فتح المحادثة')
    }
  }

  const formatCurrency = (val: string) => val === 'OMR' || val === 'ر.ع.' ? 'ر.ع' : val;
  const currency = formatCurrency(operator.currency || 'ر.ع');

  const detailsTable = [
    { label: 'نوع المشغل', value: operator.operatorType ? (OPERATOR_TYPE_LABELS[operator.operatorType] || operator.operatorType) : 'غير محدد' },
    { label: 'سنوات الخبرة', value: operator.experienceYears ? `${operator.experienceYears} سنة` : 'غير محدد' },
    operator.isNegotiable != null && { label: 'التفاوض', value: operator.isNegotiable ? 'قابل للتفاوض' : 'غير قابل للتفاوض' },
    operator.dailyRate > 0 && { label: 'الأجر اليومي', value: `${operator.dailyRate} ${currency} / يوم` },
    operator.hourlyRate > 0 && { label: 'الأجر بالساعة', value: `${operator.hourlyRate} ${currency} / ساعة` },
  ].filter(Boolean) as { label: string; value: string }[]

  return (
    <View style={s.root}>
      {/* ── BACK BUTTON ── */}
      <TouchableOpacity style={[s.backBtn, { top: insets.top + 12 }]} onPress={() => router.back()} activeOpacity={0.8}>
        <Ionicons name="arrow-forward" size={24} color="#000" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 100 }} showsVerticalScrollIndicator={false} bounces={false}>

        {/* ── COVER ── */}
        <View style={s.coverBox}>
          <LinearGradient 
            colors={['#0B2447', '#1a3a6b', '#0d3060']}
            locations={[0, 0.6, 1]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill} 
          />
          {/* Grid Overlay */}
          <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]} pointerEvents="none">
            <Svg width="100%" height="100%">
              <Defs>
                <Pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <Path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                </Pattern>
              </Defs>
              <Rect width="100%" height="100%" fill="url(#grid)" />
            </Svg>
          </View>
        </View>

        {/* ── BODY ── */}
        <View style={s.body}>
          
          {/* Avatar Wrapper */}
          <View style={s.avatarWrapper}>
            <View style={s.avatarCircle}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
              ) : (
                <Ionicons name="person" size={50} color={Colors.textMuted} />
              )}
            </View>
            {isVerified && (
              <View style={s.verifiedBadgeTop}>
                <Ionicons name="checkmark" size={16} color="#fff" />
              </View>
            )}
          </View>

          {/* Header Area */}
          <View style={s.headerArea}>
            <Text style={s.title}>{cardData.title}</Text>

            <View style={s.metaRow}>
              {operator.operatorType && (
                <View style={s.typeBadgeInline}>
                  <Text style={s.typeBadgeTxtInline}>{OPERATOR_TYPE_LABELS[operator.operatorType] || operator.operatorType}</Text>
                </View>
              )}
              {operator.experienceYears > 0 && (
                <View style={s.condBadge}>
                  <Text style={s.condTxt}>خبرة {operator.experienceYears} سنة</Text>
                </View>
              )}
              <View style={s.locationWrap}>
                <Ionicons name="location-outline" size={14} color="#475569" />
                <Text style={s.locationTxtMeta}>{cardData.governorate}</Text>
              </View>
            </View>
          </View>

          {/* Price Card */}
          <View style={s.priceCard}>
            <View style={s.priceRight}>
              <View style={s.iconBgWrap}>
                 <Ionicons name="wallet-outline" size={20} color={Colors.primary} />
              </View>
              <View style={s.priceLabelWrap}>
                <Text style={s.priceLabelTxt}>{cardData.priceLabel ? `الأجر بـ ال${cardData.priceLabel}` : 'الأجر'}</Text>
                {operator.isNegotiable && (
                  <Text style={s.negotiable}>قابل للتفاوض</Text>
                )}
              </View>
            </View>
            <View style={s.priceLeft}>
              {(cardData.price ?? 0) > 0 ? (
                <Text style={s.price}>
                  {cardData.price} <Text style={s.currency}>{currency}{cardData.priceLabel ? ` / ${cardData.priceLabel}` : ''}</Text>
                </Text>
              ) : (
                <Text style={s.priceContact}>تواصل للسعر</Text>
              )}
            </View>
          </View>

          {/* ── DESCRIPTION ── */}
          {operator.description && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>نبذة عني</Text>
              <View style={s.descContainer}>
                <Text 
                  style={s.desc} 
                  numberOfLines={isDescExpanded ? undefined : 5}
                >
                  {operator.description}
                </Text>
                {(operator.description.length > 200 || operator.description.split('\n').length > 5) && (
                  <TouchableOpacity 
                    style={s.showMoreBtn} 
                    onPress={() => setIsDescExpanded(!isDescExpanded)}
                    activeOpacity={0.8}
                  >
                    <Text style={s.showMoreTxt}>{isDescExpanded ? 'عرض أقل' : 'قراءة المزيد'}</Text>
                    <Ionicons name={isDescExpanded ? "chevron-up" : "chevron-down"} size={14} color={Colors.primary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* ── DETAILS TABLE ── */}
          {detailsTable.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>المعلومات والتخصص</Text>
              <View style={s.detailsTable}>
                {detailsTable.map((row, i, arr) => (
                  <View key={i} style={[
                    s.detailsRow, 
                    i % 2 !== 0 && s.detailsRowAlt, 
                    i === arr.length - 1 && s.detailsRowLast
                  ]}>
                    <Text style={s.detailsRowLbl}>{row.label}</Text>
                    <Text style={s.detailsRowVal}>{row.value}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ── CERTIFIED EQUIPMENT CHIPS ── */}
          {operator.equipmentTypes?.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>المعدات المعتمدة</Text>
              <View style={s.chipRow}>
                {operator.equipmentTypes.map((t: string) => (
                  <View key={t} style={s.chip}>
                    <Text style={s.chipTxt}>{EQUIPMENT_TYPE_LABELS[t] || t}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

        </View>
      </ScrollView>

      {/* ── FIXED CONTACT BAR ── */}
      <View style={[s.contactBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {isOwner ? (
          <TouchableOpacity
            style={s.chatWideBtn}
            onPress={() => router.push(`/equipment/operators/edit/${operator.id}`)}
            activeOpacity={0.9}
          >
            <Ionicons name="create-outline" size={22} color="#fff" />
            <Text style={s.chatWideTxt}>تعديل الإعلان</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={{ position: 'relative' }}
              onPress={() => {
                if (sellerId) router.push(`/profile/${sellerId}`)
              }}
              activeOpacity={0.9}
            >
              <View style={[s.iconBtn, { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden' }]}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                ) : (
                  <Ionicons name="person" size={22} color={Colors.textMuted} />
                )}
              </View>
              {isVerified && (
                <View style={s.verifiedBadgeContact}>
                  <Ionicons name="checkmark" size={10} color="#fff" />
                </View>
              )}
            </TouchableOpacity>

            {sellerPhone && (
              <TouchableOpacity
                style={s.callCircleBtn}
                onPress={handleCall}
                activeOpacity={0.9}
              >
                <Ionicons name="call" size={22} color={Colors.primary} />
              </TouchableOpacity>
            )}
            
            {sellerPhone && (
              <TouchableOpacity
                style={s.waBtn}
                onPress={handleWhatsApp}
                activeOpacity={0.9}
              >
                <Ionicons name="logo-whatsapp" size={22} color="#fff" />
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={s.chatWideBtn}
              onPress={handleChat}
              activeOpacity={0.9}
            >
              <Ionicons name="chatbubble-ellipses" size={22} color="#fff" />
              <Text style={s.chatWideTxt}>مراسلة</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },
  center: { alignItems: 'center', justifyContent: 'center' },
  errorTxt: { fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, color: Colors.error, marginTop: 16, fontSize: 18 },
  retryBtn: { marginTop: 20, backgroundColor: Colors.primary, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 100 },
  retryTxt: { fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, color: '#fff', fontSize: 15 },

  backBtn: {
    position: 'absolute', start: 16, zIndex: 10,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#ffffff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
  },

  coverBox: { width: SW, height: 160, backgroundColor: '#E8EBF0', position: 'relative' },

  body: { 
    backgroundColor: '#f8fafc', 
    borderTopStartRadius: 32, borderTopEndRadius: 32, 
    marginTop: -28, 
    paddingTop: 0, paddingHorizontal: 20, 
    gap: 24 
  },

  avatarWrapper: {
    alignSelf: 'center',
    marginTop: -50,
    marginBottom: 8,
    position: 'relative',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5,
  },
  avatarCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#ffffff',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 4, borderColor: '#f8fafc',
    overflow: 'hidden',
  },
  verifiedBadgeTop: {
    position: 'absolute', bottom: 4, right: 4,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#1877F2',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#ffffff',
  },

  headerArea: { gap: 12, alignItems: 'center' },
  title: { fontFamily: 'Almarai_800ExtraBold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 24, color: '#0f172a', writingDirection: 'rtl', lineHeight: 34, textAlign: 'center' },
  
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 8 },
  typeBadgeInline: { backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  typeBadgeTxtInline: { fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 13, color: '#ffffff' },
  condBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: '#e0f2fe' },
  condTxt: { fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 13, color: '#0369a1' },
  locationWrap: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  locationTxtMeta: { fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 13, color: '#475569' },

  priceCard: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#ffffff', 
    borderRadius: 16, 
    paddingHorizontal: 16, paddingVertical: 12,
    shadowColor: '#64748b', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 3,
    borderWidth: 1, borderColor: '#f1f5f9'
  },
  priceRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  priceLeft: { alignItems: 'flex-start' },
  priceLabelWrap: { alignItems: 'flex-start' },
  priceLabelTxt: { fontFamily: 'Almarai_700Bold', includeFontPadding: false, fontSize: 15, color: '#64748b', writingDirection: 'rtl' },
  negotiable: { fontFamily: 'Almarai_700Bold', paddingTop: 2, paddingBottom: 0, includeFontPadding: false, fontSize: 11, color: Colors.success, writingDirection: 'rtl' },
  price: { fontFamily: 'Almarai_800ExtraBold', paddingTop: 0, paddingBottom: 0, includeFontPadding: false, fontSize: 22, color: '#0f172a', writingDirection: 'rtl' },
  priceContact: { fontFamily: 'Almarai_800ExtraBold', paddingTop: 0, paddingBottom: 0, includeFontPadding: false, fontSize: 16, color: '#0f172a', writingDirection: 'rtl' },
  currency: { fontFamily: 'Almarai_700Bold', paddingTop: 0, paddingBottom: 0, includeFontPadding: false, fontSize: 13, color: '#0f172a' },
  iconBgWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },

  section: { gap: 16 },
  sectionTitle: { fontFamily: 'Almarai_800ExtraBold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 18, color: '#0f172a', writingDirection: 'rtl', textAlign: 'left' },

  detailsTable: { backgroundColor: '#ffffff', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#64748b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 },
  detailsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  detailsRowAlt: { backgroundColor: '#f8fafc' },
  detailsRowLast: { borderBottomWidth: 0 },
  detailsRowLbl: { fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 14, color: '#64748b' },
  detailsRowVal: { fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 14, color: '#0f172a' },

  descContainer: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#64748b', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 },
  desc: { fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 14, color: '#334155', writingDirection: 'rtl', lineHeight: 26, textAlign: 'left' },
  showMoreBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  showMoreTxt: { fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 13, color: Colors.primary },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4, justifyContent: 'flex-start' },
  chip: { backgroundColor: '#e2e8f0', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  chipTxt: { fontFamily: 'Almarai_700Bold', includeFontPadding: false, fontSize: 14, color: '#0f172a' },

  contactBar: {
    position: 'absolute', bottom: 0, start: 0, end: 0,
    backgroundColor: '#ffffff',
    paddingHorizontal: 20, paddingTop: 16,
    flexDirection: 'row', gap: 12,
    borderTopWidth: 1, borderTopColor: '#f1f5f9',
    shadowColor: '#000', shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 16,
  },
  iconBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  verifiedBadgeContact: { position: 'absolute', bottom: 0, right: 0, width: 20, height: 20, borderRadius: 10, backgroundColor: '#1877F2', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#ffffff' },
  callCircleBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  waBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#25D366', alignItems: 'center', justifyContent: 'center', shadowColor: '#25D366', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4, flexShrink: 0 },
  chatWideBtn: { flex: 1, height: 56, backgroundColor: Colors.primary, borderRadius: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  chatWideTxt: { fontFamily: 'Almarai_800ExtraBold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, color: '#fff', fontSize: 16 },
})
