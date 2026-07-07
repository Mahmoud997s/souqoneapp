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
import { WizardProgress } from './create'
import {
  LICENSE_TYPE_LABELS,
  EMPLOYMENT_TYPE_LABELS,
  SALARY_PERIOD_LABELS,
  STRINGS,
} from '../../src/constants/jobs'
import { jobsApi } from '../../src/api/jobs'
import { formatSalary } from '../../src/utils/format'

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
      Alert.alert('خطأ', e?.response?.data?.message ?? STRINGS.ERROR_GENERIC)
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
                name={store.jobType === 'HIRING' ? 'briefcase' : 'car'}
                size={20}
                color={Colors.primary}
              />
              <Text style={s.summaryType}>
                {store.jobType === 'HIRING' ? '🏢 طلب سائق' : '🚗 عرض خدمة'}
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
            textAlign="right"
          />
          <TextInput
            style={s.input}
            value={whatsapp}
            onChangeText={setWhatsapp}
            placeholder="رقم واتساب"
            placeholderTextColor={Colors.textMuted}
            keyboardType="phone-pad"
            textAlign="right"
          />
          <TextInput
            style={s.input}
            value={contactEmail}
            onChangeText={setContactEmail}
            placeholder="بريد إلكتروني للتواصل"
            placeholderTextColor={Colors.textMuted}
            keyboardType="email-address"
            textAlign="right"
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

        <View style={[s.footer, { paddingBottom: insets.bottom + 8 }]}>
          <View style={s.footerBtns}>
            <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={20} color={Colors.text2} />
              <Text style={s.backBtnText}>السابق</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.publishBtn, publishMutation.isPending && s.publishBtnDisabled]}
              onPress={() => publishMutation.mutate()}
              disabled={publishMutation.isPending}
              activeOpacity={0.85}
            >
              {publishMutation.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="rocket-outline" size={20} color="#fff" />
              )}
              <Text style={s.publishBtnText}>
                {publishMutation.isPending ? 'جاري النشر...' : 'نشر الإعلان'}
              </Text>
            </TouchableOpacity>
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
  rowContent: { flex: 1, alignItems: 'flex-end' },
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
    color: Colors.textMuted, textAlign: 'right', marginBottom: Spacing.space1,
  },
  pageTitle: {
    fontFamily: 'Almarai_800ExtraBold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 22,
    color: Colors.text, textAlign: 'right', marginBottom: 6,
  },
  pageDesc: {
    fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 14,
    color: Colors.text2, textAlign: 'right',
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
    color: Colors.text, textAlign: 'right',
    marginBottom: 6,
  },
  summaryDesc: {
    fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 13,
    color: Colors.text2, textAlign: 'right',
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
    color: Colors.text, textAlign: 'right', marginBottom: 8,
  },
  sectionDesc: {
    fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 13,
    color: Colors.text2, textAlign: 'right', marginBottom: Spacing.space4, lineHeight: 20,
  },
  input: {
    backgroundColor: Colors.white, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.border,
    paddingHorizontal: Spacing.space4, height: 52,
    fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 15, color: Colors.text,
    marginBottom: Spacing.space3,
  },
  termsBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.space2,
    backgroundColor: Colors.surface, borderRadius: Radius.sm,
    padding: Spacing.space3, marginTop: Spacing.space1,
  },
  termsText: {
    flex: 1, fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 12,
    color: Colors.textMuted, textAlign: 'right', lineHeight: 18,
  },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.white, paddingHorizontal: Spacing.space4, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  footerBtns: { flexDirection: 'row', gap: Spacing.space3 },
  backBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: Spacing.space3, paddingHorizontal: Spacing.space4,
    borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  backBtnText: { fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 14, color: Colors.text2 },
  publishBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: Spacing.space2,
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    paddingVertical: 14,
  },
  publishBtnDisabled: { opacity: 0.6 },
  publishBtnText: {
    fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 16, color: '#fff',
  },
})
