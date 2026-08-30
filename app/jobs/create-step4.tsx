import React, { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, KeyboardAvoidingView,
  Platform, ActivityIndicator
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AppHeader } from '../../src/components/ui/AppHeader'
import { AppButton } from '../../src/components/ui/AppButton'
import { Colors } from '../../src/constants/colors'
import { Spacing } from '../../src/constants/spacing'
import { Radius } from '../../src/constants/radius'
import { useJobPostStore } from '../../src/store/jobPostStore'
import { Stepper } from '../../src/components/ui/Stepper'
import {
  LICENSE_TYPE_LABELS,
  EMPLOYMENT_TYPE_LABELS,
  SALARY_PERIOD_LABELS,
  STRINGS,
} from '../../src/constants/jobs'
import { jobsApi } from '../../src/api/jobs'
import { formatSalary } from '../../src/utils/format'
import { normalizeJobType } from '../../src/utils/normalizeJobType'
import { dialogService } from '../../src/store/dialogStore'

const TOTAL_STEPS = 4

function ReviewRow({
  icon, label, value
}: { icon: string; label: string; value?: string | null }) {
  if (!value) return null
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

export default function CreateStep4() {
  const insets = useSafeAreaInsets()
  const qc = useQueryClient()
  const store = useJobPostStore()

  const [contactPhone, setContactPhone] = useState(store.contactPhone)
  const [contactEmail, setContactEmail] = useState(store.contactEmail)
  const [whatsapp, setWhatsapp] = useState(store.whatsapp)

  const publishMutation = useMutation({
    mutationFn: () => {
      store.set({ contactPhone, contactEmail, whatsapp })
      return jobsApi.create({
        jobType: store.jobType,
        title: store.title,
        description: store.description,
        employmentType: store.employmentType,
        salary: store.salary,
        salaryPeriod: store.salaryPeriod,
        licenseTypes: store.licenseTypes,
        experienceYears: store.experienceYears,
        minAge: store.minAge,
        maxAge: store.maxAge,
        nationality: store.nationality,
        languages: store.languages,
        vehicleTypes: store.vehicleTypes,
        hasOwnVehicle: store.hasOwnVehicle,
        governorateId: store.governorateId as number,
        wilayaId: store.wilayaId as number | undefined,
        contactPhone: contactPhone || undefined,
        contactEmail: contactEmail || undefined,
        whatsapp: whatsapp || undefined,
      })
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['jobs'] })
      qc.invalidateQueries({ queryKey: ['myJobs'] })
      store.reset()
      dialogService.show({
        type: 'success',
        title: '🎉 تم النشر!',
        message: 'تم نشر إعلانك بنجاح',
        actions: [
          {
            text: 'عرض الإعلان',
            onPress: () => router.replace(`/jobs/${res.data.id}`),
          },
          {
            text: 'لوحة التحكم',
            onPress: () => router.replace('/jobs/dashboard'),
          },
        ]
      })
    },
    onError: (e: any) => {
      const msg = e?.response?.data?.message
      const errorText = Array.isArray(msg) ? msg[0] : (msg || STRINGS.ERROR_GENERIC)
      dialogService.alert('خطأ', String(errorText))
    },
  })

  const licenseLabel = store.licenseTypes
    .map(lt => LICENSE_TYPE_LABELS[lt])
    .filter(Boolean)
    .join('، ')

  const salaryLabel = store.salaryPeriod === 'NEGOTIABLE'
    ? STRINGS.NEGOTIABLE
    : store.salary
    ? formatSalary(store.salary, store.salaryPeriod)
    : 'غير محدد'

  const isHiring = normalizeJobType(store.jobType) === 'HIRING'

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[s.root, { paddingBottom: insets.bottom }]}>
        <AppHeader title="نشر إعلان" showBack variant="jobs" />

        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <Stepper currentStep={4} totalSteps={TOTAL_STEPS} title="مراجعة ونشر الإعلان" />
          <Text style={s.pageDesc}>راجع تفاصيل إعلانك قبل النشر، ثم أضف معلومات التواصل</Text>

          {/* Summary Card */}
          <View style={s.summaryCard}>
            <View style={s.summaryTopRow}>
              <View style={[s.typeBadge, isHiring ? s.typeBadgeHiring : s.typeBadgeOffering]}>
                <Ionicons
                  name={isHiring ? 'briefcase' : 'car'}
                  size={14}
                  color={isHiring ? Colors.primary : Colors.accent}
                />
                <Text style={[s.typeBadgeText, isHiring ? s.typeTextHiring : s.typeTextOffering]}>
                  {isHiring ? 'طلب سائق' : 'عرض خدمة'}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => router.push('/jobs/create')}
                activeOpacity={0.8}
                style={s.editCircle}
              >
                <Ionicons name="pencil" size={16} color={Colors.text2} />
              </TouchableOpacity>
            </View>

            <Text style={s.summaryTitle}>{store.title}</Text>
            <Text style={s.summaryDesc} numberOfLines={3}>{store.description}</Text>

            <View style={s.divider} />

            <ReviewRow icon="time-outline" label="نوع الدوام" value={EMPLOYMENT_TYPE_LABELS[store.employmentType]} />
            <ReviewRow icon="cash-outline" label="الراتب" value={salaryLabel} />
            <ReviewRow icon="id-card-outline" label={isHiring ? "الرخصة المطلوبة" : "رخصتك"} value={licenseLabel || 'غير محدد'} />
            <ReviewRow
              icon="school-outline"
              label={isHiring ? "الخبرة المطلوبة" : "خبرتك"}
              value={store.experienceYears ? `${store.experienceYears} سنوات` : null}
            />
            <ReviewRow
              icon="location-outline"
              label="الموقع"
              value={[store.governorate, store.city].filter(Boolean).join(' — ')}
            />
            {store.hasOwnVehicle && (
              <ReviewRow icon="car-outline" label="المركبة" value={isHiring ? "يجب امتلاك مركبة خاصة" : "يمتلك مركبة خاصة"} />
            )}
          </View>

          {/* Contact Info */}
          <Text style={s.sectionTitle}>معلومات التواصل *</Text>
          <Text style={s.sectionDesc}>
            أضف طرق تواصل إضافية إلى جانب البريد الإلكتروني الافتراضي لحسابك
          </Text>

          <View style={s.contactCard}>
            <View style={s.contactRowInput}>
              <View style={s.contactIconBoxInput}>
                <Ionicons name="call" size={18} color={Colors.primary} />
              </View>
              <TextInput
                style={s.contactInputInner}
                value={contactPhone}
                onChangeText={setContactPhone}
                placeholder="رقم الهاتف (إجباري) *"
                placeholderTextColor={Colors.textMuted}
                keyboardType="phone-pad"
                autoComplete="tel"
                textContentType="telephoneNumber"
              />
            </View>
            <View style={s.dividerLine} />
            <View style={s.contactRowInput}>
              <View style={s.contactIconBoxInput}>
                <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
              </View>
              <TextInput
                style={s.contactInputInner}
                value={whatsapp}
                onChangeText={setWhatsapp}
                placeholder="رقم واتساب (اختياري)"
                placeholderTextColor={Colors.textMuted}
                keyboardType="phone-pad"
                autoComplete="tel"
                textContentType="telephoneNumber"
              />
            </View>
            <View style={s.dividerLine} />
            <View style={s.contactRowInput}>
              <View style={s.contactIconBoxInput}>
                <Ionicons name="mail" size={18} color={Colors.primary} />
              </View>
              <TextInput
                style={s.contactInputInner}
                value={contactEmail}
                onChangeText={setContactEmail}
                placeholder="البريد الإلكتروني (اختياري)"
                placeholderTextColor={Colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
              />
            </View>
          </View>

          {/* Terms */}
          <View style={s.termsBox}>
            <Ionicons name="information-circle-outline" size={18} color={Colors.textMuted} />
            <Text style={s.termsText}>
              بالنشر، أنت تؤكد أن المحتوى حقيقي ويلتزم بسياسات سوق ون
            </Text>
          </View>

        </ScrollView>

        <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, Spacing.space4) }]}>
          <View style={s.footerBtns}>
            <AppButton
              title="السابق"
              variant="outline"
              size="sm"
              onPress={() => router.back()}
              style={{ flex: 1 }}
            />
            <AppButton
              title="نشر الإعلان"
              size="sm"
              onPress={() => {
                if (!contactPhone || contactPhone.trim() === '') {
                  dialogService.alert('تنبيه', 'الرجاء إدخال رقم الهاتف للتواصل')
                  return
                }
                publishMutation.mutate()
              }}
              disabled={publishMutation.isPending}
              loading={publishMutation.isPending}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const r = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: Spacing.space2,
  },
  iconBox: {
    width: 32, height: 32, borderRadius: Radius.sm,
    backgroundColor: Colors.primary + '12',
    alignItems: 'center', justifyContent: 'center',
  },
  rowContent: { flex: 1, alignItems: 'flex-start' },
  rowLabel: {
    fontFamily: 'Almarai_400Regular',  fontSize: 11,
    color: Colors.textMuted,
  },
  rowValue: {
    fontFamily: 'Almarai_700Bold',  fontSize: 14,
    color: Colors.text,
  },
})

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F9FA' },
  content: { padding: Spacing.space4, paddingBottom: 120 },
  stepLabel: {
    fontFamily: 'Almarai_400Regular',  fontSize: 13,
    color: Colors.textMuted, writingDirection: 'rtl', marginBottom: Spacing.space1,
  },
  pageTitle: {
    fontFamily: 'Almarai_800ExtraBold',  fontSize: 22,
    color: Colors.text, writingDirection: 'rtl', marginBottom: 6,
  },
  pageDesc: {
    fontFamily: 'Almarai_400Regular',  fontSize: 13,
    color: Colors.text2, writingDirection: 'rtl', textAlign: 'center',
    marginBottom: Spacing.space5, lineHeight: 22,
  },
  summaryCard: {
    backgroundColor: Colors.white, borderRadius: Radius.xl,
    padding: Spacing.space4, marginBottom: Spacing.space5,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12 },
      android: { elevation: 3 },
    }),
  },
  summaryTopRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: Spacing.space3,
  },
  typeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 6, paddingHorizontal: 12,
    borderRadius: Radius.pill,
  },
  typeBadgeHiring: { backgroundColor: Colors.primary + '15' },
  typeBadgeOffering: { backgroundColor: Colors.accent + '15' },
  typeBadgeText: {
    fontFamily: 'Almarai_700Bold',  fontSize: 13,
  },
  typeTextHiring: { color: Colors.primary },
  typeTextOffering: { color: Colors.accent },
  editCircle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  summaryTitle: {
    fontFamily: 'Almarai_800ExtraBold',  fontSize: 18,
    color: Colors.text, writingDirection: 'rtl',
    marginBottom: 8,
  },
  summaryDesc: {
    fontFamily: 'Almarai_400Regular',  fontSize: 14,
    color: Colors.text2, writingDirection: 'rtl',
    lineHeight: 22,
  },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 12 },
  editHint: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-end', marginBottom: Spacing.space5,
    paddingVertical: Spacing.space1, paddingHorizontal: 10,
    backgroundColor: Colors.primary + '12', borderRadius: Radius.pill,
  },
  editHintText: {
    fontFamily: 'Almarai_700Bold',  fontSize: 13,
    color: Colors.primary,
  },
  sectionTitle: {
    fontFamily: 'Almarai_700Bold',  fontSize: 16,
    color: Colors.text, writingDirection: 'rtl', marginBottom: 8,
  },
  sectionDesc: {
    fontFamily: 'Almarai_400Regular',  fontSize: 13,
    color: Colors.text2, writingDirection: 'rtl', marginBottom: Spacing.space4, lineHeight: 20,
  },
  input: {
    backgroundColor: Colors.white, borderRadius: Radius.sm,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.space4, minHeight: 56, paddingVertical: 14,
    fontFamily: 'Almarai_400Regular',  fontSize: 15, color: Colors.text,
    textAlign: 'right', writingDirection: 'rtl',
  },
  contactCard: {
    backgroundColor: Colors.white, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    overflow: 'hidden', marginBottom: Spacing.space4,
  },
  contactRowInput: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.space3,
    minHeight: 56,
  },
  contactIconBoxInput: {
    width: 36, height: 36, borderRadius: Radius.sm,
    backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
    marginEnd: Spacing.space3,
  },
  contactInputInner: {
    flex: 1,
    fontFamily: 'Almarai_400Regular',  fontSize: 14, color: Colors.text,
    textAlign: 'right', writingDirection: 'rtl',
    minHeight: 56, paddingVertical: 14,
  },
  dividerLine: { height: 1, backgroundColor: Colors.border, marginHorizontal: Spacing.space3 },
  termsBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.space2,
    backgroundColor: Colors.surface, borderRadius: Radius.sm,
    padding: Spacing.space3, marginTop: Spacing.space1,
  },
  termsText: {
    flex: 1, fontFamily: 'Almarai_400Regular',  fontSize: 12,
    color: Colors.textMuted, writingDirection: 'rtl', lineHeight: 18,
  },
  footer: {
    position: 'absolute', bottom: 0, start: 0, end: 0,
    backgroundColor: Colors.white, paddingHorizontal: Spacing.space4, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  footerBtns: { flexDirection: 'row', gap: Spacing.space3 },
})
