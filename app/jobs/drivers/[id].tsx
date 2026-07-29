import React from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Image, ActivityIndicator,
  Linking, Dimensions
} from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Defs, Pattern, Path, Rect } from 'react-native-svg'

import { AppButton } from '../../../src/components/ui/AppButton'
import { VerificationBadge } from '../../../src/components/jobs/VerificationBadge'
import { LicenseChips } from '../../../src/components/jobs/LicenseChips'
import RatingBadges from '../../../src/components/jobs/RatingBadges'
import { Colors } from '../../../src/constants/colors'
import { Gradients } from '../../../src/constants/gradients'
import { Spacing } from '../../../src/constants/spacing'
import { Radius } from '../../../src/constants/radius'
import { useDriver } from '../../../src/hooks/useDrivers'
import { getInitials, getAvatarColor } from '../../../src/utils/format'
import { chatApi } from '../../../src/api/chat'
import { useAuthStore } from '../../../src/store/authStore'
import { dialogService } from '../../../src/store/dialogStore'

const SW = Dimensions.get('window').width

export default function DriverProfileScreen() {
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { data: driver, isLoading, isError } = useDriver(id ?? '')
  const [isChatting, setIsChatting] = React.useState(false)
  const { user } = useAuthStore()

  const handleChat = async () => {
    if (!user) {
      router.push('/(auth)/login' as any)
      return
    }
    if (!driver?.userId) return
    if (user.id === driver.userId) {
      dialogService.alert('تنبيه', 'لا يمكنك محادثة نفسك')
      return
    }
    try {
      setIsChatting(true)
      const res = await chatApi.createRoom({
        entityType: 'DRIVER_PROFILE',
        entityId: driver.id,
      })
      const conversationId = res.data?.id ?? (res.data as any)?._id ?? (res.data as any)?.conversationId
      if (conversationId) {
        router.push(`/chat/${conversationId}` as any)
      } else {
        dialogService.alert('خطأ', 'لم يتم العثور على معرّف المحادثة')
      }
    } catch (error: any) {
      dialogService.alert('خطأ', 'حدث خطأ أثناء فتح المحادثة: ' + (error?.response?.data?.message || error?.message || ''))
      console.log('Chat Error:', error?.response?.data || error)
    } finally {
      setIsChatting(false)
    }
  }

  if (isLoading) {
    return (
      <View style={[s.root, s.centered, { paddingBottom: insets.bottom }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    )
  }

  if (isError || !driver) {
    return (
      <View style={[s.root, s.centered, { paddingBottom: insets.bottom }]}>
        <Ionicons name="alert-circle-outline" size={56} color={Colors.textMuted} />
        <Text style={s.errorTitle}>تعذّر التحميل</Text>
        <Text style={s.errorDesc}>تحقق من الاتصال وحاول مرة أخرى</Text>
        <AppButton title="رجوع" onPress={() => router.back()} style={{ marginTop: 16 }} />
      </View>
    )
  }

  const name = driver.user?.displayName ?? driver.user?.username ?? 'سائق'
  const initials = getInitials(name)
  const avatarColor = getAvatarColor(driver.userId)

  const openPhone = (number: string) => {
    Linking.openURL(`tel:${number}`).catch(() =>
      dialogService.alert('خطأ', 'لا يمكن فتح التطبيق الهاتفي')
    )
  }

  const openWhatsApp = (number: string) => {
    const clean = number.replace(/[^0-9]/g, '')
    Linking.openURL(`https://wa.me/${clean}`).catch(() =>
      dialogService.alert('خطأ', 'تأكد من تثبيت واتساب')
    )
  }

  return (
    <View style={s.root}>
      {/* ── STICKY HEADER ── */}
      <LinearGradient colors={Gradients.hero as any} style={[s.stickyHeader, { paddingTop: insets.top + 8, paddingBottom: 20 }]}>
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
          <View style={{ width: 44 }} />
        </View>

        <View style={s.headerCenterBlock}>
          {driver.user?.avatarUrl ? (
            <Image source={{ uri: driver.user.avatarUrl }} style={s.avatarBig} />
          ) : (
            <View style={[s.avatarBig, s.avatarInitials, { backgroundColor: avatarColor }]}>
              <Text style={s.initialsTextBig}>{initials}</Text>
            </View>
          )}

          <View style={s.nameRow}>
            <Text style={s.nameHeader} numberOfLines={1}>{name}</Text>
            {driver.isVerified && <VerificationBadge size={18} />}
          </View>
          
          <View style={s.locationRowHeader}>
            <Ionicons name="location-outline" size={14} color="rgba(255,255,255,0.7)" />
            <Text style={s.locationHeader}>
              {[driver.governorate, driver.city].filter(Boolean).join(' · ')}
            </Text>
          </View>

          {/* Availability Badge Inside Header */}
          <View style={[s.availBadge, driver.isAvailable ? s.availGreen : s.availGray]}>
            <View style={[s.availDot, driver.isAvailable ? s.dotGreen : s.dotGray]} />
            <Text style={[s.availText, driver.isAvailable ? s.txtGreen : s.txtGray]}>
              {driver.isAvailable ? 'متاح الآن للعمل' : 'غير متاح حالياً'}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }} 
        showsVerticalScrollIndicator={false} 
        bounces={false}
      >
        <View style={s.body}>

          {/* Rating row */}
          <View style={s.ratingsWrap}>
            <RatingBadges
              rating={driver.averageRating}
              completionRate={driver.completionRate}
              responseTime={driver.responseTimeHours}
              completedJobs={driver.completedJobs}
              size="md"
            />
          </View>

          {/* Bio */}
          {driver.bio ? (
            <View style={s.descContainer}>
              <Text style={s.sectionTitle}>نبذة تعريفية</Text>
              <Text style={s.bioText}>{driver.bio}</Text>
            </View>
          ) : null}

          {/* License */}
          {driver.licenseTypes?.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>رخص القيادة</Text>
              <View style={s.licenseWrap}>
                <LicenseChips licenseTypes={driver.licenseTypes} />
              </View>
            </View>
          )}

          {/* Info Grid */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>بيانات إضافية</Text>
            <View style={s.detailsTable}>
              {[
                driver.experienceYears ? { icon: 'time-outline', label: 'سنوات الخبرة', value: `${driver.experienceYears} سنوات` } : null,
                driver.hasOwnVehicle ? { icon: 'car-outline', label: 'المركبة', value: 'يمتلك مركبة خاصة' } : null,
                driver.languages?.length > 0 ? { icon: 'chatbubble-outline', label: 'اللغات', value: driver.languages.join('، ') } : null,
                driver.nationality ? { icon: 'flag-outline', label: 'الجنسية', value: driver.nationality } : null,
                driver.vehicleTypes?.length > 0 ? { icon: 'bus-outline', label: 'أنواع المركبات', value: driver.vehicleTypes.join('، ') } : null,
              ].filter(Boolean).map((row: any, i, arr) => (
                <View key={i} style={[
                  s.detailsRow, 
                  i % 2 !== 0 && s.detailsRowAlt, 
                  i === arr.length - 1 && s.detailsRowLast
                ]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name={row.icon as any} size={16} color="#64748b" />
                    <Text style={s.detailsRowLbl}>{row.label}</Text>
                  </View>
                  <Text style={s.detailsRowVal}>{row.value}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* FIXED CONTACT BAR */}
      <View style={[s.contactBar, { paddingBottom: insets.bottom > 0 ? insets.bottom : 12 }]}>
        {driver.whatsapp && (
          <TouchableOpacity
            style={s.chatIconBtn}
            onPress={() => openWhatsApp(driver.whatsapp!)}
            activeOpacity={0.9}
          >
            <Ionicons name="logo-whatsapp" size={24} color="#fff" />
          </TouchableOpacity>
        )}
        
        {driver.userId && (
          <TouchableOpacity
            style={s.appChatBtn}
            onPress={handleChat}
            activeOpacity={0.9}
            disabled={isChatting}
          >
            {isChatting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="chatbubbles" size={20} color="#fff" />
                <Text style={s.appChatTxt}>محادثة</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {driver.contactPhone && (
          <TouchableOpacity
            style={s.callWideBtn}
            onPress={() => openPhone(driver.contactPhone!)}
            activeOpacity={0.9}
          >
            <Ionicons name="call" size={20} color={Colors.primary} />
            <Text style={s.callWideTxt}>اتصال</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },
  centered: { alignItems: 'center', justifyContent: 'center' },
  errorTitle: { fontFamily: 'Almarai_700Bold',  fontSize: 18, color: Colors.text, marginTop: Spacing.space3, textAlign: 'center' },
  errorDesc: { fontFamily: 'Almarai_400Regular',  fontSize: 14, color: Colors.text2, marginTop: Spacing.space1, textAlign: 'center' },

  stickyHeader: {
    width: SW, position: 'relative',
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
    zIndex: 10, elevation: 5
  },
  headerContentRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerCenterBlock: {
    alignItems: 'center', justifyContent: 'center', gap: 4,
    paddingHorizontal: 20, marginTop: 0
  },
  avatarBig: {
    width: 64, height: 64, borderRadius: 32,
    borderWidth: 2, borderColor: '#ffffff',
  },
  avatarInitials: { alignItems: 'center', justifyContent: 'center' },
  initialsTextBig: { color: Colors.white, fontSize: 24, fontFamily: 'Almarai_700Bold',  },
  nameRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 6, marginTop: 4,
  },
  nameHeader: { fontFamily: 'Almarai_800ExtraBold',  fontSize: 18, color: '#ffffff', writingDirection: 'rtl', textAlign: 'center' },
  locationRowHeader: {
    flexDirection: 'row', alignItems: 'center',
    gap: 4, marginBottom: 8,
  },
  locationHeader: { fontFamily: 'Almarai_400Regular',  fontSize: 12, color: 'rgba(255,255,255,0.8)', writingDirection: 'rtl' },

  body: { 
    paddingTop: 16, paddingHorizontal: 16, 
    gap: 12 
  },

  availBadge: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    paddingVertical: 2, paddingHorizontal: 10,
    borderRadius: Radius.pill, borderWidth: 1, 
    alignSelf: 'center',
  },
  availGreen: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  availGray:  { backgroundColor: '#f8fafc', borderColor: '#e2e8f0' },
  availDot:   { width: 6, height: 6, borderRadius: 3 },
  dotGreen:   { backgroundColor: Colors.success },
  dotGray:    { backgroundColor: Colors.textMuted },
  availText:  { fontFamily: 'Almarai_700Bold',  fontSize: 11 },
  txtGreen:   { color: '#166534' },
  txtGray:    { color: '#64748b' },

  ratingsWrap: { alignItems: 'center', marginVertical: 8 },

  descContainer: { backgroundColor: '#ffffff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#64748b', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 },
  sectionTitle: { fontFamily: 'Almarai_800ExtraBold',  fontSize: 15, color: '#0f172a', writingDirection: 'rtl', textAlign: 'left', marginBottom: 8 },
  bioText: { fontFamily: 'Almarai_400Regular',  fontSize: 13, color: '#334155', writingDirection: 'rtl', lineHeight: 22, textAlign: 'left' },

  section: { gap: 10 },
  licenseWrap: { backgroundColor: '#ffffff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#f1f5f9' },

  // Details Table
  detailsTable: { backgroundColor: '#ffffff', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#64748b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 },
  detailsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  detailsRowAlt: { backgroundColor: '#f8fafc' },
  detailsRowLast: { borderBottomWidth: 0 },
  detailsRowLbl: { fontFamily: 'Almarai_700Bold',  fontSize: 14, color: '#64748b', textAlign: 'left', writingDirection: 'rtl' },
  detailsRowVal: { fontFamily: 'Almarai_700Bold',  fontSize: 14, color: '#0f172a', textAlign: 'left', writingDirection: 'rtl' },

  // Contact bar
  contactBar: {
    position: 'absolute', bottom: 0, start: 0, end: 0,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16, paddingTop: 12,
    flexDirection: 'row', gap: 10,
    borderTopWidth: 1, borderTopColor: '#f1f5f9',
    shadowColor: '#000', shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 16 
  },
  chatIconBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#25D366', alignItems: 'center', justifyContent: 'center', shadowColor: '#25D366', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4, flexShrink: 0 },
  appChatBtn: { flex: 1, height: 48, backgroundColor: Colors.primary, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  appChatTxt: { fontFamily: 'Almarai_700Bold',  color: '#ffffff', fontSize: 15 },
  callWideBtn: { flex: 1, height: 48, backgroundColor: '#EFF6FF', borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  callWideTxt: { fontFamily: 'Almarai_700Bold',  color: Colors.primary, fontSize: 15 },
})
