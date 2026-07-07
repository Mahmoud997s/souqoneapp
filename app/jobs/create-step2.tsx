import React from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, KeyboardAvoidingView, Platform
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
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
  LANGUAGE_OPTIONS,
} from '../../src/constants/jobs'
import { EmploymentType, SalaryPeriod, LicenseType } from '../../src/types/jobs.types'

const TOTAL_STEPS = 4

const EMP_TYPES = Object.keys(EMPLOYMENT_TYPE_LABELS) as EmploymentType[]
const SAL_PERIODS = Object.keys(SALARY_PERIOD_LABELS) as SalaryPeriod[]
const LIC_TYPES = Object.keys(LICENSE_TYPE_LABELS) as LicenseType[]

export default function CreateStep2() {
  const insets = useSafeAreaInsets()
  const {
    employmentType, salary, salaryPeriod,
    licenseTypes, experienceYears, languages, hasOwnVehicle, set
  } = useJobPostStore()

  const toggleLicense = (lt: LicenseType) => {
    if (licenseTypes.includes(lt)) {
      set({ licenseTypes: licenseTypes.filter(x => x !== lt) })
    } else {
      set({ licenseTypes: [...licenseTypes, lt] })
    }
  }

  const toggleLanguage = (lang: string) => {
    if (languages.includes(lang)) {
      set({ languages: languages.filter(x => x !== lang) })
    } else {
      set({ languages: [...languages, lang] })
    }
  }

  const isNegotiable = salaryPeriod === 'NEGOTIABLE'

  const canNext = employmentType && licenseTypes.length > 0

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[s.root, { paddingBottom: insets.bottom }]}>
        <AppHeader title="نشر إعلان" showBack variant="jobs" />
        <WizardProgress current={2} total={TOTAL_STEPS} />

        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <Text style={s.stepLabel}>الخطوة 2 من {TOTAL_STEPS}</Text>
          <Text style={s.pageTitle}>متطلبات الوظيفة</Text>
          <Text style={s.pageDesc}>حدد نوع الدوام والراتب ومتطلبات الرخصة والخبرة</Text>

          {/* Employment Type */}
          <Text style={s.sectionTitle}>نوع الدوام *</Text>
          <View style={s.chipsWrap}>
            {EMP_TYPES.map(et => (
              <TouchableOpacity
                key={et}
                style={[s.chip, employmentType === et && s.chipActive]}
                onPress={() => set({ employmentType: et })}
                activeOpacity={0.8}
              >
                <Text style={[s.chipText, employmentType === et && s.chipTextActive]}>
                  {EMPLOYMENT_TYPE_LABELS[et]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Salary */}
          <Text style={s.sectionTitle}>الراتب / الأجر</Text>
          <View style={s.salaryRow}>
            <View style={{ flex: 2 }}>
              <TextInput
                style={[s.input, isNegotiable && s.inputDisabled]}
                value={salary ? salary.toString() : ''}
                onChangeText={v => set({ salary: v ? parseFloat(v) : undefined })}
                placeholder="المبلغ (ر.ع)"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
                textAlign="right"
                editable={!isNegotiable}
              />
            </View>
            <View style={{ flex: 3 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: Spacing.space2 }}>
                  {SAL_PERIODS.map(sp => (
                    <TouchableOpacity
                      key={sp}
                      style={[s.chip, salaryPeriod === sp && s.chipActive]}
                      onPress={() => set({ salaryPeriod: sp })}
                      activeOpacity={0.8}
                    >
                      <Text style={[s.chipText, salaryPeriod === sp && s.chipTextActive]}>
                        {SALARY_PERIOD_LABELS[sp]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>

          {/* License Types */}
          <Text style={s.sectionTitle}>أنواع الرخص المطلوبة *</Text>
          <View style={s.chipsWrap}>
            {LIC_TYPES.map(lt => (
              <TouchableOpacity
                key={lt}
                style={[s.chip, licenseTypes.includes(lt) && s.chipActive]}
                onPress={() => toggleLicense(lt)}
                activeOpacity={0.8}
              >
                <Text style={[s.chipText, licenseTypes.includes(lt) && s.chipTextActive]}>
                  🪪 {LICENSE_TYPE_LABELS[lt]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Experience */}
          <Text style={s.sectionTitle}>سنوات الخبرة المطلوبة (اختياري)</Text>
          <TextInput
            style={s.input}
            value={experienceYears ? experienceYears.toString() : ''}
            onChangeText={v => set({ experienceYears: v ? parseInt(v) : undefined })}
            placeholder="مثال: 2"
            placeholderTextColor={Colors.textMuted}
            keyboardType="numeric"
            textAlign="right"
          />

          {/* Own Vehicle */}
          <TouchableOpacity
            style={s.checkRow}
            onPress={() => set({ hasOwnVehicle: !hasOwnVehicle })}
            activeOpacity={0.8}
          >
            <View style={[s.checkbox, hasOwnVehicle && s.checkboxActive]}>
              {hasOwnVehicle && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
            <Text style={s.checkLabel}>يجب أن يمتلك السائق مركبته الخاصة</Text>
          </TouchableOpacity>

          {/* Languages */}
          <Text style={[s.sectionTitle, { marginTop: Spacing.space4 }]}>اللغات المطلوبة (اختياري)</Text>
          <View style={s.chipsWrap}>
            {LANGUAGE_OPTIONS.map(lang => (
              <TouchableOpacity
                key={lang}
                style={[s.chip, languages.includes(lang) && s.chipActive]}
                onPress={() => toggleLanguage(lang)}
                activeOpacity={0.8}
              >
                <Text style={[s.chipText, languages.includes(lang) && s.chipTextActive]}>
                  {lang}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

        </ScrollView>

        <View style={[s.footer, { paddingBottom: insets.bottom + 8 }]}>
          <View style={s.footerBtns}>
            <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={20} color={Colors.text2} />
              <Text style={s.backBtnText}>السابق</Text>
            </TouchableOpacity>
            <AppButton
              title="التالي ←"
              onPress={() => router.push('/jobs/create-step3')}
              disabled={!canNext}
              style={s.nextBtn}
            />
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

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
  sectionTitle: {
    fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 16,
    color: Colors.text, textAlign: 'right',
    marginBottom: 10,
  },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.space2, marginBottom: Spacing.space5 },
  chip: {
    paddingVertical: 7, paddingHorizontal: 14,
    borderRadius: Radius.pill, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  chipActive: { borderColor: Colors.primary, backgroundColor: '#EFF6FF' },
  chipText: { fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 13, color: Colors.text2 },
  chipTextActive: { color: Colors.primary },
  salaryRow: {
    flexDirection: 'row', gap: 10,
    marginBottom: Spacing.space5, alignItems: 'center',
  },
  input: {
    backgroundColor: Colors.white, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.border,
    paddingHorizontal: Spacing.space4, height: 52,
    fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 15, color: Colors.text,
    marginBottom: Spacing.space4,
  },
  inputDisabled: { backgroundColor: Colors.surface, color: Colors.textMuted },
  checkRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 10, marginBottom: Spacing.space3,
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.white,
  },
  checkboxActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkLabel: {
    fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 14, color: Colors.text,
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
  nextBtn: { flex: 1 },
})
