import React, { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, KeyboardAvoidingView,
  Platform, Alert, ActivityIndicator
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
import { WizardProgress } from '../../src/components/ui/WizardProgress'
import {
  LICENSE_TYPE_LABELS,
  EMPLOYMENT_TYPE_LABELS,
  SALARY_PERIOD_LABELS,
  STRINGS,
} from '../../src/constants/jobs'
import { jobsApi } from '../../src/api/jobs'
import { formatSalary } from '../../src/utils/format'
import { normalizeJobType } from '../../src/utils/normalizeJobType'

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
        languages: store.languages,
        vehicleTypes: store.vehicleTypes,
        hasOwnVehicle: store.hasOwnVehicle,
        governorate: store.governorate,
        city: store.city || undefined,
        contactPhone: contactPhone || undefined,
        contactEmail: contactEmail || undefined,
        whatsapp: whatsapp || undefined,
      })
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['jobs'] })
      qc.invalidateQueries({ queryKey: ['myJobs'] })
      store.reset()
      Alert.alert('🎉 تم النشر!', 'تم نشر إعلانك بنجاح', [
        {
          text: 'عرض الإعلان',
          onPress: () => router.replace(`/jobs/${res.data.id}`),
        },
        {
          text: 'لوحة التحكم',
          onPress: () => router.replace('/jobs/dashboard'),
        },
      ])
    },
    onError: (e: any) => {
      const msg = e?.response?.data?.message
      const errorText = Array.isArray(msg) ? msg[0] : (msg || STRINGS.ERROR_GENERIC)
      Alert.alert('خطأ', String(errorText))
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

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[s.root, { paddingBottom: insets.bottom }]}>
        <AppHeader title="نشر إعلان" showBack variant="jobs" />
        <WizardProgress current={4} total={TOTAL_STEPS} />

        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <Text style={s.stepLabel}>الخطوة 4 من {TOTAL_STEPS}</Text>
          <Text style={s.pageTitle}>مراجعة ونشر الإعلان</Text>
          <Text style={s.pageDesc}>راجع تفاصيل إعلانك قبل النشر، ثم أضف معلومات التواصل</Text>

          {/* Summary Card */}
          <View style={s.summaryCard}>
            <View style={s.summaryHeader}>
              <Ionicons
                name={normalizeJobType(store.jobType) === 'HIRING' ? 'briefcase' : 'car'}
                size={20}
                color={Colors.primary}
              />
              <Text style={s.summaryType}>
                {normalizeJobType(store.jobType) === 'HIRING' ? '🏢 طلب سائق' : '🚗 عرض خدمة'}
              </Text>
            </View>
            <Text style={s.summaryTitle}>{store.title}</Text>
            <Text style={s.summaryDesc} numberOfLines={3}>{store.description}</Text>

            <View style={s.divider} />

            <ReviewRow icon="time-outline" label="نوع الدوام" value={EMPLOYMENT_TYPE_LABELS[store.employmentType]} />
            <ReviewRow icon="cash-outline" label="الراتب" value={salaryLabel} />
            <ReviewRow icon="id-card-outline" label="الرخصة المطلوبة" value={licenseLabel || 'غير محدد'} />
            <ReviewRow
              icon="school-outline"
              label="سنوات الخبرة"
              value={store.experienceYears ? `${store.experienceYears} سنوات` : null}
            />
            <ReviewRow
              icon="location-outline"
              label="الموقع"
              value={[store.governorate, store.city].filter(Boolean).join(' — ')}
            />
            {store.hasOwnVehicle && (
              <ReviewRow icon="car-outline" label="المركبة" value="يجب امتلاك مركبة خاصة" />
            )}
          </View>

          {/* Edit hint */}
          <TouchableOpacity
            style={s.editHint}
            onPress={() => router.push('/jobs/create')}
            activeOpacity={0.8}
          >
            <Ionicons name="create-outline" size={16} color={Colors.primary} />
            <Text style={s.editHintText}>تعديل التفاصيل</Text>
          </TouchableOpacity>

          {/* Contact Info */}
          <Text style={s.sectionTitle}>معلومات التواصل (اختياري)</Text>
          <Text style={s.sectionDesc}>
            أضف طرق تواصل إضافية إلى جانب البريد الإلكتروني الافتراضي لحسابك
          </Text>

          <TextInput
            style={s.input}
            value={contactPhone}
            onChangeText={setContactPhone}
            placeholder="رقم الهاتف (مثال: 96898765432)"
            placeholderTextColor={Colors.textMuted}
            keyboardType="phone-pad"
          />
          <TextInput
            style={s.input}
            value={whatsapp}
            onChangeText={setWhatsapp}
            placeholder="رقم واتساب"
            placeholderTextColor={Colors.textMuted}
            keyboardType="phone-pad"
          />
          <TextInput
            style={s.input}
            value={contactEmail}
            onChangeText={setContactEmail}
            placeholder="بريد إلكتروني للتواصل"
            placeholderTextColor={Colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
          />

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
              onPress={() => publishMutation.mutate()}
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
    fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 11,
    color: Colors.textMuted,
  },
  rowValue: {
    fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 14,
    color: Colors.text,
  },
})

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F9FA' },
  content: { padding: Spacing.space4, paddingBottom: 120 },
  stepLabel: {
    fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 13,
    color: Colors.textMuted, writingDirection: 'rtl', marginBottom: Spacing.space1,
  },
  pageTitle: {
    fontFamily: 'Almarai_800ExtraBold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 22,
    color: Colors.text, writingDirection: 'rtl', marginBottom: 6,
  },
  pageDesc: {
    fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 14,
    color: Colors.text2, writingDirection: 'rtl',
    marginBottom: Spacing.space5, lineHeight: 22,
  },
  summaryCard: {
    backgroundColor: Colors.white, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.space4, marginBottom: Spacing.space2,
  },
  summaryHeader: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.space2,
    marginBottom: Spacing.space2,
  },
  summaryType: {
    fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 13,
    color: Colors.primary,
  },
  summaryTitle: {
    fontFamily: 'Almarai_800ExtraBold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 17,
    color: Colors.text, writingDirection: 'rtl',
    marginBottom: 6,
  },
  summaryDesc: {
    fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 13,
    color: Colors.text2, writingDirection: 'rtl',
    lineHeight: 20,
  },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 12 },
  editHint: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-end', marginBottom: Spacing.space5,
    paddingVertical: Spacing.space1, paddingHorizontal: 10,
    backgroundColor: Colors.primary + '12', borderRadius: Radius.pill,
  },
  editHintText: {
    fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 13,
    color: Colors.primary,
  },
  sectionTitle: {
    fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 16,
    color: Colors.text, writingDirection: 'rtl', marginBottom: 8,
  },
  sectionDesc: {
    fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 13,
    color: Colors.text2, writingDirection: 'rtl', marginBottom: Spacing.space4, lineHeight: 20,
  },
  input: {
    backgroundColor: Colors.white, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.space4, height: 56,
    fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 15, color: Colors.text,
    marginBottom: Spacing.space3, textAlign: 'right', writingDirection: 'rtl',
  },
  termsBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.space2,
    backgroundColor: Colors.surface, borderRadius: Radius.sm,
    padding: Spacing.space3, marginTop: Spacing.space1,
  },
  termsText: {
    flex: 1, fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 12,
    color: Colors.textMuted, writingDirection: 'rtl', lineHeight: 18,
  },
  footer: {
    position: 'absolute', bottom: 0, start: 0, end: 0,
    backgroundColor: Colors.white, paddingHorizontal: Spacing.space4, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  footerBtns: { flexDirection: 'row', gap: Spacing.space3 },
})
