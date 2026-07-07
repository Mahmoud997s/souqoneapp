import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Linking } from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
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

const JOB_TYPE: Record<string, string> = {
  FULL_TIME: 'دوام كامل', PART_TIME: 'دوام جزئي', CONTRACT: 'عقد',
  FREELANCE: 'مستقل', 'full-time': 'دوام كامل', 'part-time': 'دوام جزئي',
}

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuthStore()
  const insets = useSafeAreaInsets()
  const { data: item, isLoading, isError } = useJob(id)

  if (isLoading) {
    return <View style={[s.root, s.center]}><ActivityIndicator size="large" color={Colors.primary} /></View>
  }

  if (isError || !item) {
    return (
      <View style={[s.root, s.center]}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
        <Text style={s.errorTxt}>تعذّر تحميل الوظيفة</Text>
        <TouchableOpacity style={s.retryBtn} onPress={() => router.back()}>
          <Text style={s.retryTxt}>رجوع</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const raw = item as any
  const salary = parseFloat(raw.price) || 0
  const employer = raw.seller ?? raw.user

  const handleChat = async () => {
    if (!user) {
      router.push('/(auth)/login' as any)
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
      router.push(`/chat/${conversationId}` as any)
    } catch (e) {
      Alert.alert('خطأ', 'تعذر فتح المحادثة')
    }
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <TouchableOpacity style={[s.backBtn, { top: insets.top + 8 }]} onPress={() => router.back()}>
        <Ionicons name="arrow-forward" size={22} color={Colors.white} />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 90 }} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={Gradients.hero as any} style={s.banner}>
          <Ionicons name="briefcase" size={56} color="rgba(255,255,255,0.3)" />
          <View style={s.bannerBadge}>
            <Text style={s.bannerBadgeTxt}>وظيفة</Text>
          </View>
        </LinearGradient>

        <View style={s.body}>
          <Text style={s.title}>{raw.title}</Text>

          <View style={s.priceRow}>
            <View>
              <Text style={s.salaryLbl}>الراتب</Text>
              <Text style={s.salary}>
                {formatSalary(raw.salary, raw.salaryPeriod, raw.currency)}
              </Text>
            </View>
            {(raw.city || raw.governorate) && (
              <View style={s.locationPill}>
                <Ionicons name="location-outline" size={14} color={Colors.primary} />
                <Text style={s.locationTxt}>{formatLocation(raw)}</Text>
              </View>
            )}
          </View>

          <View style={s.tagsRow}>
            {raw.jobType && (
              <View style={s.tag}>
                <Ionicons name="time-outline" size={14} color={Colors.primary} />
                <Text style={s.tagTxt}>{JOB_TYPE[raw.jobType] ?? raw.jobType}</Text>
              </View>
            )}
            {raw.experience && (
              <View style={s.tag}>
                <Ionicons name="school-outline" size={14} color={Colors.primary} />
                <Text style={s.tagTxt}>{raw.experience}</Text>
              </View>
            )}
          </View>

          <View style={s.divider} />

          {raw.requirements && (
            <>
              <Text style={s.sectionTitle}>المتطلبات</Text>
              <Text style={s.desc}>{raw.requirements}</Text>
              <View style={s.divider} />
            </>
          )}

          {raw.description && (
            <>
              <Text style={s.sectionTitle}>الوصف الوظيفي</Text>
              <Text style={s.desc}>{raw.description}</Text>
              <View style={s.divider} />
            </>
          )}

          {/* تفاصيل إضافية: الرخص، اللغات، المركبة */}
          {(raw.licenseTypes?.length > 0 || raw.languages?.length > 0 || raw.hasOwnVehicle || raw.employmentType) && (
            <>
              <Text style={s.sectionTitle}>تفاصيل إضافية</Text>
              <View style={s.detailsGrid}>
                {raw.employmentType && (
                  <View style={s.detailItem}>
                    <View style={s.detailIconBox}>
                      <Ionicons name="time-outline" size={16} color={Colors.primary} />
                    </View>
                    <View>
                      <Text style={s.detailLabel}>نوع الدوام</Text>
                      <Text style={s.detailValue}>{EMPLOYMENT_TYPE_LABELS[raw.employmentType] ?? raw.employmentType}</Text>
                    </View>
                  </View>
                )}
                {raw.licenseTypes?.length > 0 && (
                  <View style={s.detailItem}>
                    <View style={s.detailIconBox}>
                      <Ionicons name="id-card-outline" size={16} color={Colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.detailLabel}>الرخص المطلوبة</Text>
                      <View style={s.chipRow}>
                        {raw.licenseTypes.map((lt: string) => (
                          <View key={lt} style={s.chip}>
                            <Text style={s.chipTxt}>{LICENSE_TYPE_LABELS[lt] ?? lt}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>
                )}
                {raw.languages?.length > 0 && (
                  <View style={s.detailItem}>
                    <View style={s.detailIconBox}>
                      <Ionicons name="language-outline" size={16} color={Colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.detailLabel}>اللغات المطلوبة</Text>
                      <View style={s.chipRow}>
                        {raw.languages.map((lang: string) => (
                          <View key={lang} style={s.chip}>
                            <Text style={s.chipTxt}>{lang}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>
                )}
                {raw.hasOwnVehicle && (
                  <View style={s.detailItem}>
                    <View style={[s.detailIconBox, { backgroundColor: '#fef3c7' }]}>
                      <Ionicons name="car-outline" size={16} color="#d97706" />
                    </View>
                    <View>
                      <Text style={s.detailLabel}>المركبة</Text>
                      <Text style={s.detailValue}>يجب امتلاك مركبة خاصة</Text>
                    </View>
                  </View>
                )}
              </View>
              <View style={s.divider} />
            </>
          )}

          {employer && (
            <>
              <Text style={s.sectionTitle}>صاحب العمل</Text>
              <View style={s.sellerCard}>
                <View style={s.sellerInfo}>
                  {employer.avatarUrl ? (
                    <Image source={{ uri: employer.avatarUrl }} style={s.avatar} contentFit="cover" />
                  ) : (
                    <View style={[s.avatar, s.avatarFallback]}>
                      <Ionicons name="business" size={24} color={Colors.textMuted} />
                    </View>
                  )}
                  <View style={s.sellerTexts}>
                    <View style={s.sellerNameRow}>
                      <Text style={s.sellerName}>{employer.displayName ?? employer.username}</Text>
                      {employer.isVerified && <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />}
                    </View>
                    {employer.governorate && <Text style={s.sellerGov}>{formatLocation(employer)}</Text>}
                  </View>
                </View>
                <TouchableOpacity
                  style={s.sellerProfileBtn}
                  onPress={() => router.push(`/profile/${employer.id}` as any)}
                >
                  <Text style={s.sellerProfileTxt}>الملف الشخصي</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      <View style={[s.contactBar, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity style={s.chatBtn} onPress={handleChat}>
          <Ionicons name="chatbubble-ellipses-outline" size={20} color={Colors.primary} />
          <Text style={s.chatTxt}>محادثة</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.applyBtn} onPress={() => router.push(`/jobs/apply/${id}` as any)}>
          <Ionicons name="send-outline" size={20} color={Colors.white} />
          <Text style={s.applyTxt}>التقدم للوظيفة</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface },
  center: { alignItems: 'center', justifyContent: 'center' },
  errorTxt: { fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, color: Colors.error, marginTop: 12, fontSize: 16 },
  retryBtn: { marginTop: 16, backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12 },
  retryTxt: { fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, color: Colors.white },
  backBtn: {
    position: 'absolute', start: 16, zIndex: 10,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  banner: {
    height: 200,
    alignItems: 'center', justifyContent: 'center',
  },
  bannerBadge: {
    position: 'absolute', top: 16, end: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 4,
  },
  bannerBadgeTxt: { fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, color: Colors.white, fontSize: 12 },
  body: {
    backgroundColor: Colors.white, borderTopStartRadius: 20, borderTopEndRadius: 20,
    marginTop: -16, padding: 20, gap: 14,
  },
  title: { fontFamily: 'Almarai_800ExtraBold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 20, color: Colors.text, textAlign: 'right', lineHeight: 30 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  salaryLbl: { fontFamily: 'Almarai_400Regular', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 11, color: Colors.textMuted, textAlign: 'right', marginBottom: 2 },
  salary: { fontFamily: 'Almarai_800ExtraBold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 24, color: Colors.accent, textAlign: 'right' },
  locationPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primary + '0A', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 4 },
  locationTxt: { fontFamily: 'Almarai_700Bold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 12, color: Colors.primary },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.primary + '0A', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4 },
  tagTxt: { fontFamily: 'Almarai_700Bold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 12, color: Colors.primary },
  divider: { height: 1, backgroundColor: Colors.border },
  sectionTitle: { fontFamily: 'Almarai_800ExtraBold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 16, color: Colors.text, textAlign: 'right' },
  desc: { fontFamily: 'Almarai_400Regular', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 14, color: Colors.text2, textAlign: 'right', lineHeight: 24 },
  detailsGrid: { gap: 14 },
  detailItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  detailIconBox: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: Colors.primary + '12',
    alignItems: 'center', justifyContent: 'center',
  },
  detailLabel: { fontFamily: 'Almarai_400Regular', includeFontPadding: false, paddingTop: 2, paddingBottom: 2, fontSize: 11, color: Colors.textMuted, textAlign: 'right' },
  detailValue: { fontFamily: 'Almarai_700Bold', includeFontPadding: false, paddingTop: 2, paddingBottom: 2, fontSize: 14, color: Colors.text, textAlign: 'right' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  chip: { backgroundColor: Colors.primary + '0A', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  chipTxt: { fontFamily: 'Almarai_700Bold', includeFontPadding: false, paddingTop: 2, paddingBottom: 2, fontSize: 12, color: Colors.primary },
  sellerCard: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: Colors.border,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  sellerInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  avatarFallback: { backgroundColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  sellerTexts: { gap: 3 },
  sellerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  sellerName: { fontFamily: 'Almarai_700Bold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 15, color: Colors.text },
  sellerGov: { fontFamily: 'Almarai_400Regular', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 12, color: Colors.textMuted },
  sellerProfileBtn: { backgroundColor: Colors.primary + '0A', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  sellerProfileTxt: { fontFamily: 'Almarai_700Bold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 12, color: Colors.primary },
  contactBar: {
    position: 'absolute', bottom: 0, start: 0, end: 0,
    backgroundColor: Colors.white, paddingHorizontal: 16, paddingTop: 12,
    flexDirection: 'row', gap: 10,
    borderTopWidth: 1, borderTopColor: Colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 6,
  },
  chatBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, height: 48, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.primary,
    backgroundColor: Colors.primary + '0A',
  },
  chatTxt: { fontFamily: 'Almarai_700Bold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 14, color: Colors.primary },
  applyBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, height: 48, borderRadius: 12, backgroundColor: Colors.accent,
  },
  applyTxt: { fontFamily: 'Almarai_700Bold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 14, color: Colors.white },
})
