import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Dimensions,
  Platform,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Colors } from '../../../src/constants/colors'
import { Gradients } from '../../../src/constants/gradients'
import { Radius } from '../../../src/constants/radius'
import { Spacing } from '../../../src/constants/spacing'
import { CardSystem } from '../../../src/constants/cardSystem'
import { useOperatorItem } from '../../../src/hooks/useEquipment'
import { SkeletonCard } from '../../../src/components/ui/SkeletonCard'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { mapOperatorToCard } from '../../../src/utils/mappers'
import { useAuthStore } from '../../../src/store/authStore'
import { chatApi } from '../../../src/api/chat'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Defs, Pattern, Path, Rect } from 'react-native-svg'
import { dialogService } from '../../../src/store/dialogStore'
import { getOperatorTypeLabel, getEquipmentTypeLabel } from '../../../src/utils/equipment-mappers'

const { width: SW } = Dimensions.get('window')

export default function OperatorDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuthStore()
  const insets = useSafeAreaInsets()

  const { data: operator, isLoading, isError } = useOperatorItem(id as string)
  const [isDescExpanded, setIsDescExpanded] = useState(false)

  if (isLoading) {
    return (
      <View style={[s.root, s.center, { paddingTop: insets.top + 40, paddingHorizontal: 16 }]}>
        <SkeletonCard />
        <SkeletonCard />
      </View>
    )
  }

  if (isError || !operator) {
    return (
      <View style={[s.root, s.center]}>
        <View style={s.errorIconWrap}>
          <Ionicons name="alert-circle-outline" size={56} color={Colors.error} />
        </View>
        <Text style={s.errorTxt}>تعذّر العثور على ملف المشغل</Text>
        <TouchableOpacity style={s.retryBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
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
  const displayName = operator.user?.displayName || operator.user?.name || raw.user?.displayName || raw.user?.name || 'مشغل معتمد'
  const isVerified = operator.user?.isVerified || raw.user?.isVerified || raw.isVerified || false
  const isOwner = user?.id === sellerId

  const locationText =
    operator.governorateRef?.nameAr && operator.wilayaRef?.nameAr
      ? `${operator.governorateRef.nameAr} - ${operator.wilayaRef.nameAr}`
      : operator.governorate && operator.city
      ? `${operator.governorate} - ${operator.city}`
      : operator.governorate || 'سلطنة عمان'

  const handleCall = () => {
    if (sellerPhone) {
      Linking.openURL(`tel:${sellerPhone}`)
    } else {
      dialogService.alert('تنبيه', 'رقم الهاتف غير متوفر لهذا المشغل')
    }
  }

  const handleWhatsApp = () => {
    if (sellerPhone) {
      const cleanPhone = sellerPhone.replace(/[^0-9+]/g, '')
      const msg = encodeURIComponent(`مرحباً ${displayName}، بخصوص ملفك كمشغل في تطبيق سوق ون: ${cardData.title}`)
      Linking.openURL(`whatsapp://send?phone=${cleanPhone}&text=${msg}`)
    } else {
      dialogService.alert('تنبيه', 'رقم الواتساب غير متوفر')
    }
  }

  const handleChat = async () => {
    if (!user) {
      router.push('/(auth)/login')
      return
    }
    if (user.id === sellerId) {
      dialogService.alert('تنبيه', 'لا يمكنك مراسلة نفسك')
      return
    }
    try {
      const res = await chatApi.createRoom({
        entityType: 'OPERATOR',
        entityId: operator.id,
        receiverId: sellerId,
      })
      if (res.data?.id) {
        router.push(`/chat/${res.data.id}` as any)
      }
    } catch (e) {
      dialogService.alert('خطأ', 'تعذر فتح المحادثة، يرجى المحاولة لاحقاً')
    }
  }

  const currency = operator.currency === 'USD' ? '$' : 'ر.ع.'

  const detailsTable = [
    { label: 'نوع الخدمة', value: getOperatorTypeLabel(operator.operatorType) },
    operator.experienceYears != null && { label: 'سنوات الخبرة', value: `${operator.experienceYears} سنوات` },
    operator.dailyRate != null && operator.dailyRate > 0 && { label: 'الأجر اليومي', value: `${operator.dailyRate} ${currency} / يوم` },
    operator.hourlyRate != null && operator.hourlyRate > 0 && { label: 'الأجر بالساعة', value: `${operator.hourlyRate} ${currency} / ساعة` },
    (operator.isPriceNegotiable != null || operator.isNegotiable != null) && {
      label: 'قابلية التفاوض',
      value: (operator.isPriceNegotiable ?? operator.isNegotiable) ? 'نعم، قابل للتفاوض' : 'سعر نهائي',
    },
    { label: 'الموقع والمنطقة', value: locationText },
  ].filter(Boolean) as { label: string; value: string }[]

  return (
    <View style={s.root}>
      {/* ── BACK BUTTON ── */}
      <TouchableOpacity
        style={[s.backBtn, { top: insets.top + 12 }]}
        onPress={() => router.back()}
        activeOpacity={0.85}
      >
        <Ionicons name="arrow-forward" size={22} color="#ffffff" />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* ── HERO COVER WITH SVG GRID ── */}
        <View style={s.coverBox}>
          <LinearGradient
            colors={Gradients.hero as any}
            locations={[0, 0.6, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]} pointerEvents="none">
            <Svg width="100%" height="100%">
              <Defs>
                <Pattern id="grid-op" width="40" height="40" patternUnits="userSpaceOnUse">
                  <Path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                </Pattern>
              </Defs>
              <Rect width="100%" height="100%" fill="url(#grid-op)" />
            </Svg>
          </View>
        </View>

        {/* ── PROFILE BODY ── */}
        <View style={s.body}>
          {/* Avatar Wrapper */}
          <View style={s.avatarWrapper}>
            <View style={s.avatarCircle}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={s.avatarImg} contentFit="cover" />
              ) : (
                <MaterialCommunityIcons name="hard-hat" size={48} color={Colors.primary} />
              )}
            </View>
            {isVerified && (
              <View style={s.verifiedBadgeTop}>
                <Ionicons name="checkmark-circle" size={20} color="#1877F2" />
              </View>
            )}
          </View>

          {/* Header Title & Badges */}
          <View style={s.headerArea}>
            <Text style={s.title}>{operator.title}</Text>
            <Text style={s.displayNameTxt}>{displayName}</Text>

            <View style={s.metaRow}>
              {operator.operatorType && (
                <View style={s.typeBadgeInline}>
                  <Text style={s.typeBadgeTxtInline}>{getOperatorTypeLabel(operator.operatorType)}</Text>
                </View>
              )}
              {operator.experienceYears != null && operator.experienceYears > 0 && (
                <View style={s.expBadge}>
                  <Ionicons name="shield-checkmark" size={13} color="#059669" />
                  <Text style={s.expTxt}>خبرة {operator.experienceYears} سنوات</Text>
                </View>
              )}
              <View style={s.locationWrap}>
                <Ionicons name="location-sharp" size={14} color={Colors.textMuted} />
                <Text style={s.locationTxtMeta}>{locationText}</Text>
              </View>
            </View>
          </View>

          {/* Pricing Highlight Card */}
          <View style={s.priceCard}>
            <View style={s.priceRight}>
              <View style={s.iconBgWrap}>
                <Ionicons name="wallet" size={20} color={Colors.primary} />
              </View>
              <View style={s.priceLabelWrap}>
                <Text style={s.priceLabelTxt}>
                  {operator.dailyRate ? 'الأجر اليومي الاسترشادي' : operator.hourlyRate ? 'الأجر بالساعة' : 'الأجر والتعاقد'}
                </Text>
                {(operator.isPriceNegotiable ?? operator.isNegotiable) && (
                  <Text style={s.negotiable}>قابل للتفاوض</Text>
                )}
              </View>
            </View>
            <View style={s.priceLeft}>
              {operator.dailyRate ? (
                <Text style={s.price}>
                  {operator.dailyRate} <Text style={s.currency}>{currency} / يوم</Text>
                </Text>
              ) : operator.hourlyRate ? (
                <Text style={s.price}>
                  {operator.hourlyRate} <Text style={s.currency}>{currency} / ساعة</Text>
                </Text>
              ) : (
                <Text style={s.priceContact}>تواصل للاتفاق</Text>
              )}
            </View>
          </View>

          {/* ── DESCRIPTION / BIO ── */}
          {operator.description && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>نبذة عن الخبرة والخدمات</Text>
              <View style={s.descContainer}>
                <Text style={s.desc} numberOfLines={isDescExpanded ? undefined : 5}>
                  {operator.description}
                </Text>
                {operator.description.length > 180 && (
                  <TouchableOpacity
                    style={s.showMoreBtn}
                    onPress={() => setIsDescExpanded(!isDescExpanded)}
                    activeOpacity={0.8}
                  >
                    <Text style={s.showMoreTxt}>{isDescExpanded ? 'عرض أقل' : 'قراءة المزيد'}</Text>
                    <Ionicons name={isDescExpanded ? 'chevron-up' : 'chevron-down'} size={14} color={Colors.primary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* ── CERTIFIED EQUIPMENT CHIPS ── */}
          {operator.equipmentTypes && operator.equipmentTypes.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>المعدات المصرح بقيادتها وتشغيلها</Text>
              <View style={s.chipRow}>
                {operator.equipmentTypes.map((t: string) => (
                  <View key={t} style={s.chip}>
                    <Ionicons name="construct" size={13} color={Colors.primary} style={{ marginEnd: 5 }} />
                    <Text style={s.chipTxt}>{getEquipmentTypeLabel(t)}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ── SPECIALIZATIONS & CERTIFICATIONS ── */}
          {((operator.specializations && operator.specializations.length > 0) ||
            (operator.certifications && operator.certifications.length > 0)) && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>الشهادات والتخصصات الإضافية</Text>
              <View style={s.chipRow}>
                {operator.certifications?.map((c: string, idx: number) => (
                  <View key={`cert-${idx}`} style={[s.chip, s.certChip]}>
                    <Ionicons name="ribbon" size={13} color="#D97706" style={{ marginEnd: 5 }} />
                    <Text style={[s.chipTxt, s.certChipTxt]}>{c}</Text>
                  </View>
                ))}
                {operator.specializations?.map((sp: string, idx: number) => (
                  <View key={`spec-${idx}`} style={[s.chip, s.specChip]}>
                    <Ionicons name="checkmark-done" size={13} color="#2563EB" style={{ marginEnd: 5 }} />
                    <Text style={[s.chipTxt, s.specChipTxt]}>{sp}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ── DETAILS TABLE ── */}
          {detailsTable.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>تفاصيل وبيانات المشغل</Text>
              <View style={s.detailsTable}>
                {detailsTable.map((row, i, arr) => (
                  <View
                    key={i}
                    style={[
                      s.detailsRow,
                      i % 2 !== 0 && s.detailsRowAlt,
                      i === arr.length - 1 && s.detailsRowLast,
                    ]}
                  >
                    <Text style={s.detailsRowLbl}>{row.label}</Text>
                    <Text style={s.detailsRowVal}>{row.value}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── FIXED FLOATING BOTTOM CONTACT BAR ── */}
      <View style={[s.contactBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {isOwner ? (
          <TouchableOpacity
            style={s.editWideBtn}
            onPress={() => router.push(`/equipment/operators/edit/${operator.id}` as any)}
            activeOpacity={0.85}
          >
            <Ionicons name="create-outline" size={20} color="#ffffff" />
            <Text style={s.editWideTxt}>تعديل الملف المهني</Text>
          </TouchableOpacity>
        ) : (
          <View style={s.contactBtnGroup}>
            {sellerPhone ? (
              <TouchableOpacity style={s.callBtn} onPress={handleCall} activeOpacity={0.85}>
                <Ionicons name="call" size={18} color="#ffffff" />
                <Text style={s.callBtnTxt}>اتصال</Text>
              </TouchableOpacity>
            ) : null}

            {sellerPhone ? (
              <TouchableOpacity style={s.whatsappBtn} onPress={handleWhatsApp} activeOpacity={0.85}>
                <Ionicons name="logo-whatsapp" size={18} color="#ffffff" />
                <Text style={s.whatsappBtnTxt}>واتساب</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity style={s.chatBtn} onPress={handleChat} activeOpacity={0.85}>
              <Ionicons name="chatbubble-ellipses" size={18} color={Colors.primary} />
              <Text style={s.chatBtnTxt}>محادثة</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtn: {
    position: 'absolute',
    start: 16,
    zIndex: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  coverBox: {
    width: SW,
    height: 160,
    position: 'relative',
  },
  body: {
    backgroundColor: '#F8F9FA',
    borderTopStartRadius: 28,
    borderTopEndRadius: 28,
    marginTop: -28,
    paddingHorizontal: Spacing.space4,
    paddingTop: 16,
  },
  avatarWrapper: {
    alignSelf: 'center',
    position: 'relative',
    marginTop: -56,
    marginBottom: 10,
  },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFFFFF',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 10 },
      android: { elevation: 6 },
    }),
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  verifiedBadgeTop: {
    position: 'absolute',
    bottom: 2,
    end: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  headerArea: {
    alignItems: 'center',
    marginBottom: Spacing.space4,
  },
  title: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 18,
    color: Colors.text,
    textAlign: 'center',
    writingDirection: 'rtl',
    lineHeight: 26,
    marginBottom: 4,
  },
  displayNameTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12.5,
    lineHeight: 17,
    color: Colors.textMuted,
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeBadgeInline: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: CardSystem.radius.inner,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  typeBadgeTxtInline: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11.5,
    lineHeight: 16,
    color: '#2563EB',
  },
  expBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: CardSystem.radius.inner,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  expTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11.5,
    lineHeight: 16,
    color: '#059669',
  },
  locationWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: CardSystem.radius.inner,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  locationTxtMeta: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11.5,
    lineHeight: 16,
    color: '#475569',
  },
  priceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.space3,
    borderWidth: 1,
    borderColor: '#EEF2F6',
    marginBottom: Spacing.space3,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  priceRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space3,
  },
  iconBgWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceLabelWrap: {},
  priceLabelTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12.5,
    lineHeight: 17,
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  negotiable: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    lineHeight: 15,
    color: '#059669',
    textAlign: 'left',
    writingDirection: 'rtl',
    marginTop: 2,
  },
  priceLeft: {
    alignItems: 'flex-end',
  },
  price: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 17,
    lineHeight: 23,
    color: '#EA580C',
    textAlign: 'right',
  },
  currency: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11.5,
    lineHeight: 16,
    color: Colors.textMuted,
  },
  priceContact: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13.5,
    lineHeight: 18,
    color: Colors.primary,
  },
  section: {
    marginBottom: Spacing.space3,
  },
  sectionTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 14,
    lineHeight: 20,
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
    marginBottom: Spacing.space2,
  },
  descContainer: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.space3,
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  desc: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 12.5,
    lineHeight: 20,
    color: '#334155',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  showMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  showMoreTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11.5,
    lineHeight: 16,
    color: Colors.primary,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: CardSystem.radius.inner,
  },
  chipTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: 15,
    color: '#475569',
  },
  certChip: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  certChipTxt: {
    color: '#92400E',
  },
  specChip: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  specChipTxt: {
    color: '#1E40AF',
  },
  detailsTable: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.space3,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailsRowAlt: {
    backgroundColor: '#F8FAFC',
  },
  detailsRowLast: {
    borderBottomWidth: 0,
  },
  detailsRowLbl: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 12.5,
    lineHeight: 18,
    color: Colors.textMuted,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  detailsRowVal: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12.5,
    lineHeight: 18,
    color: Colors.text,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  contactBar: {
    position: 'absolute',
    bottom: 0,
    start: 0,
    end: 0,
    backgroundColor: Colors.white,
    paddingTop: 10,
    paddingHorizontal: Spacing.space3,
    borderTopWidth: 1,
    borderTopColor: '#EEF2F6',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 10 },
      android: { elevation: 8 },
    }),
  },
  editWideBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: Radius.md,
  },
  editWideTxt: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 13.5,
    lineHeight: 18,
    color: '#ffffff',
  },
  contactBtnGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  callBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: Colors.primary,
    paddingVertical: 11,
    borderRadius: Radius.md,
  },
  callBtnTxt: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 12.5,
    lineHeight: 17,
    color: '#ffffff',
  },
  whatsappBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#16A34A',
    paddingVertical: 11,
    borderRadius: Radius.md,
  },
  whatsappBtnTxt: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 12.5,
    lineHeight: 17,
    color: '#ffffff',
  },
  chatBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    paddingVertical: 11,
    borderRadius: Radius.md,
  },
  chatBtnTxt: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 12.5,
    lineHeight: 17,
    color: Colors.primary,
  },
  errorIconWrap: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  errorTxt: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 15,
    lineHeight: 22,
    color: Colors.text,
    marginBottom: 14,
    textAlign: 'center',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: Radius.md,
  },
  retryTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12.5,
    lineHeight: 17,
    color: '#ffffff',
  },
})
