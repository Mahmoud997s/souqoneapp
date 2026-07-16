import { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Defs, Pattern, Path, Rect } from 'react-native-svg'
import { useLocalSearchParams, router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useJob } from '../../src/hooks/useJobs'
import { Colors } from '../../src/constants/colors'
import { Gradients } from '../../src/constants/gradients'
import { chatApi } from '../../src/api/chat'
import { useAuthStore } from '../../src/store/authStore'
import { formatLocation } from '../../src/utils/mappers'
import { formatSalary } from '../../src/utils/format'
import { LICENSE_TYPE_LABELS, EMPLOYMENT_TYPE_LABELS } from '../../src/constants/jobs'
import { Alert } from 'react-native'

const { width: SW } = Dimensions.get('window')


export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuthStore()
  const insets = useSafeAreaInsets()
  const { data: item, isLoading, isError } = useJob(id)

  const [isDescExpanded, setIsDescExpanded] = useState(false)

  if (isLoading) {
    return <View style={[s.root, s.center]}><ActivityIndicator size="large" color={Colors.primary} /></View>
  }

  if (isError || !item) {
    return (
      <View style={[s.root, s.center]}>
        <Ionicons name="alert-circle-outline" size={56} color={Colors.error} />
        <Text style={s.errorTxt}>تعذّر تحميل الوظيفة</Text>
        <TouchableOpacity style={s.retryBtn} onPress={() => router.back()}>
          <Text style={s.retryTxt}>العودة للخلف</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const raw = item as any
  const employer = raw.seller ?? raw.user
  const isOwner = user?.id === employer?.id

  const handleChat = async () => {
    if (!user) {
      router.push('/(auth)/login' as any)
      return
    }
    if (user.id === employer?.id) {
      Alert.alert('تنبيه', 'لا يمكنك محادثة نفسك')
      return
    }
    try {
      const sellerId = employer?.id
      const res = await chatApi.createRoom({
        entityType: 'JOB',
        entityId: id as string,
        receiverId: sellerId,
      })
      const conversationId = res.data?.id
      if (conversationId) {
        const initialText = encodeURIComponent(`مرحباً، بخصوص إعلان الوظيفة: ${raw.title}`)
        router.push(`/chat/${conversationId}?initialText=${initialText}` as any)
      } else {
        Alert.alert('خطأ', 'لم يتم إرجاع المحادثة من الخادم')
      }
    } catch (e: any) {
      const errorMsg = e?.response?.data?.message
      const parsedMsg = Array.isArray(errorMsg) ? errorMsg.join('\n') : (typeof errorMsg === 'string' ? errorMsg : 'تعذر فتح المحادثة')
      Alert.alert('خطأ', parsedMsg)
    }
  }

  // Build quick specs
  const quickSpecs = [
    raw.experience && { icon: 'school-outline', label: 'الخبرة', value: raw.experience },
    raw.jobType && { icon: 'briefcase-outline', label: 'نوع الإعلان', value: raw.jobType?.toUpperCase() === 'HIRING' ? 'طلب توظيف' : raw.jobType?.toUpperCase() === 'OFFERING' ? 'عرض خدمة' : raw.jobType?.toUpperCase() === 'SEEKING' ? 'بحث عن عمل' : raw.jobType },
    raw.employmentType && { icon: 'time-outline', label: 'الدوام', value: EMPLOYMENT_TYPE_LABELS[raw.employmentType] ?? raw.employmentType },
    raw.licenseTypes?.length > 0 && { icon: 'id-card-outline', label: 'الرخصة', value: `${LICENSE_TYPE_LABELS[raw.licenseTypes[0]] ?? raw.licenseTypes[0]} ${raw.licenseTypes.length > 1 ? '+' : ''}` },
    raw.languages?.length > 0 && { icon: 'language-outline', label: 'اللغة', value: raw.languages.join('، ') },
    raw.hasOwnVehicle && { icon: 'car-outline', label: 'مركبة', value: 'مطلوب مركبة' },
  ].filter(Boolean) as { icon: string; label: string; value: string }[]

  return (
    <View style={s.root}>
        {/* ── STICKY HEADER ── */}
        <LinearGradient colors={Gradients.hero as any} style={[s.stickyHeader, { paddingTop: insets.top + 12, paddingBottom: 24 }]}>
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

          <View style={s.headerContentRow}>
            <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
              <Ionicons name="arrow-forward-outline" size={24} color="#ffffff" />
            </TouchableOpacity>

            <View style={s.headerCenterBlock}>
              <Ionicons name="briefcase" size={36} color="rgba(255,255,255,0.3)" />
              <Text style={s.headerTitle} numberOfLines={2}>{raw.title}</Text>
            </View>

            <View style={{ width: 44 }} />
          </View>
        </LinearGradient>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }} showsVerticalScrollIndicator={false} bounces={false}>

        {/* ── BODY ── */}
        <View style={s.body}>
          
          {/* Header Area */}
          <View style={s.headerArea}>
            
            <View style={s.metaRow}>
              {/* Type Badge */}
              <View style={s.typeBadgeInline}>
                <Text style={s.typeBadgeTxtInline}>وظيفة</Text>
              </View>

              {/* Employment Type Badge */}
              {raw.employmentType && (
                <View style={[s.condBadge, { backgroundColor: '#d1fae5' }]}>
                  <Text style={[s.condTxt, { color: '#065f46' }]}>
                    {EMPLOYMENT_TYPE_LABELS[raw.employmentType] || raw.employmentType}
                  </Text>
                </View>
              )}

              {/* Location Badge */}
              {(raw.city || raw.governorate) && (
                <View style={s.locationWrap}>
                  <Ionicons name="location-outline" size={14} color="#475569" />
                  <Text style={s.locationTxtMeta}>{formatLocation(raw)}</Text>
                </View>
              )}
            </View>
          </View>

          {/* ── SELLER ── */}
          {employer && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>صاحب العمل</Text>
              <TouchableOpacity
                style={s.sellerCard}
                onPress={() => router.push(`/profile/${employer.id}` as any)}
                activeOpacity={0.8}
              >
                <View style={s.sellerInfo}>
                  {employer.avatarUrl ? (
                    <Image source={{ uri: employer.avatarUrl }} style={s.avatar} />
                  ) : (
                    <View style={[s.avatar, s.avatarFallback]}>
                      <Ionicons name="business" size={24} color={Colors.textMuted} />
                    </View>
                  )}
                  <View style={s.sellerTexts}>
                    <View style={s.sellerNameRow}>
                      <Text style={s.sellerName} numberOfLines={1}>{employer.displayName || employer.username || 'صاحب عمل'}</Text>
                      {employer.isVerified && <Ionicons name="checkmark-circle" size={16} color="#1877F2" />}
                    </View>
                    {employer.governorate && <Text style={s.sellerGov}>{formatLocation(employer)}</Text>}
                  </View>
                </View>
                <Ionicons name="chevron-back" size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
          )}

          {/* ── DESCRIPTION & REQUIREMENTS ── */}
          {(raw.requirements || raw.description) && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>التفاصيل والمتطلبات</Text>
              <View style={s.descContainer}>
                {raw.requirements && (
                  <Text style={[s.desc, { color: Colors.primary, marginBottom: 8 }]}>
                    متطلبات: {raw.requirements}
                  </Text>
                )}
                {raw.description && (
                  <Text 
                    style={s.desc} 
                    numberOfLines={isDescExpanded ? undefined : 5}
                  >
                    {raw.description}
                  </Text>
                )}
                {raw.description && (raw.description.length > 200 || raw.description.split('\n').length > 5) && (
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

          {/* ── SPECS TABLE ── */}
          {quickSpecs.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>مواصفات الوظيفة</Text>
              <View style={s.detailsTable}>
                {quickSpecs.map((row, i, arr) => (
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

          {/* Price Card */}
          <View style={s.priceCard}>
            <View style={s.priceRight}>
              <View style={s.iconBgWrap}>
                 <Ionicons name="cash-outline" size={20} color={Colors.primary} />
              </View>
              <View style={s.priceLabelWrap}>
                <Text style={s.priceLabelTxt}>الراتب الأساسي</Text>
              </View>
            </View>
            <View style={s.priceLeft}>
                <Text style={s.price}>
                  {formatSalary(raw.salary, raw.salaryPeriod || 'MONTHLY', raw.currency)}
                </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ── FIXED CONTACT BAR ── */}
      <View style={[s.contactBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {isOwner ? (
          <TouchableOpacity
            style={s.callWideBtn}
            onPress={() => Alert.alert('تنبيه', 'تعديل الإعلان غير مدعوم حالياً')}
            activeOpacity={0.9}
          >
            <Ionicons name="create-outline" size={22} color={Colors.primary} />
            <Text style={s.callWideTxt}>تعديل الإعلان</Text>
          </TouchableOpacity>
        ) : (
          <>
            {employer && (
              <TouchableOpacity
                style={{ position: 'relative' }}
                onPress={() => router.push(`/profile/${employer.id}` as any)}
                activeOpacity={0.9}
              >
                <View style={[s.iconBtn, { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden' }]}>
                  {employer.avatarUrl ? (
                    <Image source={{ uri: employer.avatarUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                  ) : (
                    <Ionicons name="person" size={22} color={Colors.textMuted} />
                  )}
                </View>
                {employer.isVerified && (
                  <View style={s.verifiedBadgeContact}>
                    <Ionicons name="checkmark" size={10} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={s.chatIconBtn}
              onPress={handleChat}
              activeOpacity={0.9}
            >
              <Ionicons name="chatbubble-ellipses" size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.callWideBtn, { backgroundColor: Colors.accent }]}
              onPress={() => router.push(`/jobs/apply/${id}` as any)}
              activeOpacity={0.9}
            >
              <Ionicons name="send-outline" size={22} color={Colors.white} />
              <Text style={[s.callWideTxt, { color: Colors.white }]}>التقدم للوظيفة</Text>
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
  errorTxt: { fontFamily: 'Almarai_700Bold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, color: Colors.error, marginTop: 16, fontSize: 18 },
  retryBtn: { marginTop: 20, backgroundColor: Colors.primary, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 100 },
  retryTxt: { fontFamily: 'Almarai_700Bold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, color: '#fff', fontSize: 15 },

  stickyHeader: {
    width: SW, position: 'relative',
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
    zIndex: 10, elevation: 5
  },
  headerContentRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16
  },
  headerCenterBlock: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4,
    paddingHorizontal: 12
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontFamily: 'Almarai_700Bold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 20, color: '#ffffff', writingDirection: 'rtl', textAlign: 'center', lineHeight: 28 },
  
  // Body
  body: { 
    backgroundColor: '#f8fafc', 
    paddingTop: 16, paddingHorizontal: 20, 
    gap: 24 
  },

  headerArea: { gap: 12 },
  
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  typeBadgeInline: { backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  typeBadgeTxtInline: { fontFamily: 'Almarai_700Bold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 12, color: '#ffffff' },
  condBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  condTxt: { fontFamily: 'Almarai_700Bold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 12 },
  locationWrap: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  locationTxtMeta: { fontFamily: 'Almarai_700Bold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 12, color: '#475569' },

  // Price Card
  priceCard: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#ffffff', 
    borderRadius: 16, 
    paddingHorizontal: 16, paddingVertical: 14,
    shadowColor: '#64748b', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 3,
    borderWidth: 1, borderColor: '#f1f5f9'
  },
  priceRight: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  priceLeft: { alignItems: 'flex-end', flex: 1.5 },
  priceLabelWrap: { alignItems: 'flex-start', flex: 1 },
  priceLabelTxt: { fontFamily: 'Almarai_700Bold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 13, color: '#64748b', writingDirection: 'rtl', textAlign: 'left' },
  negotiable: { fontFamily: 'Almarai_700Bold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 11, color: Colors.success, writingDirection: 'rtl', textAlign: 'left', marginTop: 2 },
  price: { fontFamily: 'Almarai_700Bold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 18, color: '#0f172a', writingDirection: 'rtl', textAlign: 'right' },
  iconBgWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },

  section: { gap: 16 },
  sectionTitle: { fontFamily: 'Almarai_800ExtraBold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 16, color: '#0f172a', writingDirection: 'rtl', textAlign: 'left' },

  // Details Table
  detailsTable: { backgroundColor: '#ffffff', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#64748b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 },
  detailsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  detailsRowAlt: { backgroundColor: '#f8fafc' },
  detailsRowLast: { borderBottomWidth: 0 },
  detailsRowLbl: { fontFamily: 'Almarai_700Bold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 14, color: '#64748b' },
  detailsRowVal: { fontFamily: 'Almarai_700Bold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 14, color: '#0f172a' },

  // Description
  descContainer: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#64748b', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 },
  desc: { fontFamily: 'Almarai_700Bold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 14, color: '#334155', writingDirection: 'rtl', lineHeight: 26, textAlign: 'left' },
  showMoreBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  showMoreTxt: { fontFamily: 'Almarai_700Bold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 13, color: Colors.primary },

  // Seller
  sellerCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#f1f5f9', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#64748b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 },
  sellerInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f1f5f9' },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  sellerTexts: { gap: 2, alignItems: 'flex-start', flex: 1 },
  sellerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sellerName: { fontFamily: 'Almarai_700Bold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 14, color: '#0f172a', writingDirection: 'rtl', textAlign: 'left', flexShrink: 1 },
  sellerGov: { fontFamily: 'Almarai_700Bold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 12, color: '#64748b', writingDirection: 'rtl', textAlign: 'left' },

  // Contact bar
  contactBar: {
    position: 'absolute', bottom: 0, start: 0, end: 0,
    backgroundColor: '#ffffff',
    paddingHorizontal: 20, paddingTop: 16,
    flexDirection: 'row', gap: 12,
    borderTopWidth: 1, borderTopColor: '#f1f5f9',
    shadowColor: '#000', shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 16 },
  iconBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  verifiedBadgeContact: { position: 'absolute', bottom: 0, right: 0, width: 20, height: 20, borderRadius: 10, backgroundColor: '#1877F2', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#ffffff' },
  chatIconBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4, flexShrink: 0 },
  callWideBtn: { flex: 1, height: 56, backgroundColor: '#EFF6FF', borderRadius: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  callWideTxt: { fontFamily: 'Almarai_700Bold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, color: Colors.primary, fontSize: 16 },
})
