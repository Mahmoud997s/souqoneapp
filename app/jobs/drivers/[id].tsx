import React from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Image, ActivityIndicator,
  Linking, Alert
} from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { AppHeader } from '../../../src/components/ui/AppHeader'
import { AppButton } from '../../../src/components/ui/AppButton'
import { VerificationBadge } from '../../../src/components/jobs/VerificationBadge'
import { LicenseChips } from '../../../src/components/jobs/LicenseChips'
import RatingBadges from '../../../src/components/jobs/RatingBadges'
import { Colors } from '../../../src/constants/colors'
import { Spacing } from '../../../src/constants/spacing'
import { Radius } from '../../../src/constants/radius'
import { useDriver } from '../../../src/hooks/useDrivers'
import { getInitials, getAvatarColor } from '../../../src/utils/format'
import { LANGUAGE_LABELS, VEHICLE_TYPE_OPTIONS } from '../../../src/constants/jobs'

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={r.row}>
      <View style={r.iconBox}>
        <Ionicons name={icon as any} size={16} color={Colors.primary} />
      </View>
      <View style={r.rowContent}>
        <Text style={r.rowLabel}>{label}</Text>
        <Text style={r.rowValue}>{value}</Text>
      </View>
    </View>
  )
}

export default function DriverProfileScreen() {
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { data: driver, isLoading, isError } = useDriver(id ?? '')

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
        <AppHeader title="ملف السائق" showBack variant="jobs" />
        <Ionicons name="alert-circle-outline" size={56} color={Colors.textMuted} />
        <Text style={s.errorTitle}>تعذّر التحميل</Text>
        <Text style={s.errorDesc}>تحقق من الاتصال وحاول مرة أخرى</Text>
        <AppButton title="رجوع" onPress={() => router.back()} style={{ marginTop: 16 }} />
      </View>
    )
  }

  const name = driver.user?.displayName ?? driver.user?.username ?? '...'
  const initials = getInitials(name)
  const avatarColor = getAvatarColor(driver.userId)

  const openPhone = (number: string) => {
    Linking.openURL(`tel:${number}`).catch(() =>
      Alert.alert('خطأ', 'لا يمكن فتح التطبيق الهاتفي')
    )
  }

  const openWhatsApp = (number: string) => {
    const clean = number.replace(/[^0-9]/g, '')
    Linking.openURL(`https://wa.me/${clean}`).catch(() =>
      Alert.alert('خطأ', 'تأكد من تثبيت واتساب')
    )
  }

  return (
    <View style={[s.root, { paddingBottom: insets.bottom }]}>
      <AppHeader title="ملف السائق" showBack variant="jobs" />

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* Hero Card */}
        <View style={s.heroCard}>
          {/* Avatar */}
          {driver.user?.avatarUrl ? (
            <Image source={{ uri: driver.user.avatarUrl }} style={s.avatar} />
          ) : (
            <View style={[s.avatar, s.avatarInitials, { backgroundColor: avatarColor }]}>
              <Text style={s.initialsText}>{initials}</Text>
            </View>
          )}

          {/* Name + Verification */}
          <View style={s.nameRow}>
            <Text style={s.name}>{name}</Text>
            {driver.isVerified && <VerificationBadge size={18} />}
          </View>

          {/* Location */}
          <View style={s.locationRow}>
            <Ionicons name="location-outline" size={14} color={Colors.text2} />
            <Text style={s.location}>
              {[driver.governorate, driver.city].filter(Boolean).join(' · ')}
            </Text>
          </View>

          {/* Availability */}
          <View style={[s.availBadge, driver.isAvailable ? s.availGreen : s.availGray]}>
            <View style={[s.availDot, driver.isAvailable ? s.dotGreen : s.dotGray]} />
            <Text style={[s.availText, driver.isAvailable ? s.txtGreen : s.txtGray]}>
              {driver.isAvailable ? 'متاح الآن للعمل' : 'غير متاح حالياً'}
            </Text>
          </View>

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
        </View>

        {/* Bio */}
        {driver.bio ? (
          <View style={s.section}>
            <Text style={s.sectionTitle}>نبذة تعريفية</Text>
            <Text style={s.bioText}>{driver.bio}</Text>
          </View>
        ) : null}

        {/* License */}
        {driver.licenseTypes?.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>رخص القيادة</Text>
            <LicenseChips licenseTypes={driver.licenseTypes} />
          </View>
        )}

        {/* Info Grid */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>بيانات إضافية</Text>
          <View style={s.infoGrid}>
            {driver.experienceYears ? (
              <InfoRow
                icon="time-outline"
                label="سنوات الخبرة"
                value={`${driver.experienceYears} سنوات`}
              />
            ) : null}
            {driver.hasOwnVehicle && (
              <InfoRow icon="car-outline" label="المركبة" value="يمتلك مركبة خاصة" />
            )}
            {driver.languages?.length > 0 && (
              <InfoRow
                icon="chatbubble-outline"
                label="اللغات"
                value={driver.languages.join('، ')}
              />
            )}
            {driver.nationality && (
              <InfoRow icon="flag-outline" label="الجنسية" value={driver.nationality} />
            )}
            {driver.vehicleTypes?.length > 0 && (
              <InfoRow
                icon="bus-outline"
                label="أنواع المركبات"
                value={driver.vehicleTypes.join('، ')}
              />
            )}
          </View>
        </View>

        {/* Contact */}
        {(driver.contactPhone || driver.whatsapp) && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>وسائل التواصل</Text>
            <View style={s.contactBtns}>
              {driver.contactPhone && (
                <TouchableOpacity
                  style={s.contactBtn}
                  onPress={() => openPhone(driver.contactPhone!)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="call-outline" size={18} color={Colors.primary} />
                  <Text style={s.contactBtnText}>اتصال</Text>
                </TouchableOpacity>
              )}
              {driver.whatsapp && (
                <TouchableOpacity
                  style={[s.contactBtn, s.whatsappBtn]}
                  onPress={() => openWhatsApp(driver.whatsapp!)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="logo-whatsapp" size={18} color="#fff" />
                  <Text style={s.waText}>واتساب</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* CTA for employers */}
        <View style={s.ctaSection}>
          <AppButton
            title="عرض الوظائف المناسبة"
            onPress={() => router.push('/jobs')}
          />
        </View>

      </ScrollView>
    </View>
  )
}

const r = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.space2,
    paddingVertical: Spacing.space2, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  iconBox: {
    width: 34, height: 34, borderRadius: Radius.sm,
    backgroundColor: Colors.primary + '12',
    alignItems: 'center', justifyContent: 'center',
  },
  rowContent: { flex: 1 },
  rowLabel: {
    fontFamily: 'Almarai_400Regular', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 11,
    color: Colors.textMuted, marginBottom: 2,
  },
  rowValue: {
    fontFamily: 'Almarai_700Bold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 14, color: Colors.text,
  },
})

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: Colors.surface },
  centered:{ alignItems: 'center', justifyContent: 'center' },
  content: { padding: Spacing.space4, paddingBottom: 100 },

  heroCard: {
    backgroundColor: Colors.white, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.space5, alignItems: 'center',
    marginBottom: Spacing.space4,
  },
  avatar: {
    width: 80, height: 80, borderRadius: Radius.pill,
    marginBottom: Spacing.space3,
    borderWidth: 3, borderColor: Colors.border,
  },
  avatarInitials: { alignItems: 'center', justifyContent: 'center' },
  initialsText: { color: Colors.white, fontSize: 28, fontFamily: 'Almarai_700Bold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4 },
  nameRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: Spacing.space1, marginBottom: Spacing.space1,
  },
  name: { fontFamily: 'Almarai_800ExtraBold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 20, color: Colors.text },
  locationRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: Spacing.space1, marginBottom: Spacing.space3,
  },
  location: { fontFamily: 'Almarai_400Regular', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 13, color: Colors.text2 },
  availBadge: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.space1,
    paddingVertical: Spacing.space1, paddingHorizontal: Spacing.space3,
    borderRadius: Radius.pill, borderWidth: 1, marginBottom: Spacing.space3,
  },
  availGreen: { backgroundColor: Colors.success + '1A', borderColor: Colors.success + '40' },
  availGray:  { backgroundColor: Colors.surface, borderColor: Colors.border },
  availDot:   { width: 7, height: 7, borderRadius: Radius.pill },
  dotGreen:   { backgroundColor: Colors.success },
  dotGray:    { backgroundColor: Colors.textMuted },
  availText:  { fontFamily: 'Almarai_700Bold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 12 },
  txtGreen:   { color: Colors.success },
  txtGray:    { color: Colors.text2 },
  ratingsWrap:{ alignItems: 'center' },

  section: {
    backgroundColor: Colors.white, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.space4, marginBottom: Spacing.space3,
  },
  sectionTitle: {
    fontFamily: 'Almarai_700Bold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 15,
    color: Colors.text, marginBottom: Spacing.space3,
    textAlign: 'right', writingDirection: 'rtl',
  },
  bioText: {
    fontFamily: 'Almarai_400Regular', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 14,
    color: Colors.text2, lineHeight: 22,
    textAlign: 'right', writingDirection: 'rtl',
  },
  infoGrid: {},
  contactBtns: { flexDirection: 'row', gap: Spacing.space2 },
  contactBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: Spacing.space1,
    paddingVertical: Spacing.space3, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.primary,
    backgroundColor: Colors.primary + '0A',
  },
  contactBtnText: { fontFamily: 'Almarai_700Bold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 14, color: Colors.primary },
  whatsappBtn: { backgroundColor: '#25D366', borderColor: '#25D366' },
  waText:      { fontFamily: 'Almarai_700Bold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 14, color: Colors.white },
  ctaSection:  { marginTop: Spacing.space2 },
  errorTitle: {
    fontFamily: 'Almarai_700Bold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 18, color: Colors.text,
    marginTop: Spacing.space3, textAlign: 'center',
  },
  errorDesc: {
    fontFamily: 'Almarai_400Regular', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 14, color: Colors.text2,
    marginTop: Spacing.space1, textAlign: 'center',
  },
})

