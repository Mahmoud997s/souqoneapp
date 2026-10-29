import React, { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Alert
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
import { Stepper } from '../../src/components/ui/Stepper'
import { InlineError } from '../../src/components/ui/InlineError'
import { AppSelect } from '../../src/components/ui/AppSelect'
import { normalizeJobType } from '../../src/utils/normalizeJobType'
import {
  LICENSE_TYPE_LABELS,
  EMPLOYMENT_TYPE_LABELS,
  SALARY_PERIOD_LABELS,
  LANGUAGE_OPTIONS,
  NATIONALITY_LABELS,
} from '../../src/constants/jobs'
import { EmploymentType, SalaryPeriod, LicenseType } from '../../src/types/jobs.types'

const TOTAL_STEPS = 4

const EMP_TYPES = Object.keys(EMPLOYMENT_TYPE_LABELS) as EmploymentType[]
const SAL_PERIODS = Object.keys(SALARY_PERIOD_LABELS) as SalaryPeriod[]
const LIC_TYPES = Object.keys(LICENSE_TYPE_LABELS) as LicenseType[]
const NAT_TYPES = ['OMANI', 'EXPAT', 'ANY']

const EXPERIENCE_OPTIONS = [
  { label: 'بدون خبرة', value: '0' },
  { label: 'سنة واحدة', value: '1' },
  { label: 'سنتان', value: '2' },
  ...Array.from({ length: 18 }, (_, i) => ({ label: `${i + 3} سنوات`, value: String(i + 3) }))
]

const AGE_OPTIONS = Array.from({ length: 43 }, (_, i) => ({ label: `${i + 18} سنة`, value: String(i + 18) }))

export default function CreateStep2() {
  const insets = useSafeAreaInsets()
  const {
    jobType, employmentType, salary, salaryPeriod,
    licenseTypes, experienceYears, minAge, maxAge, nationality, languages, hasOwnVehicle, set
  } = useJobPostStore()

  const isHiring = normalizeJobType(jobType) === 'HIRING'

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

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleNext = () => {
    const nextErrors: Record<string, string> = {}
    if (!employmentType) nextErrors.employmentType = 'الرجاء تحديد نوع الدوام'
    if (licenseTypes.length === 0) nextErrors.licenseTypes = 'الرجاء تحديد نوع الرخصة المطلوبة'
    if (!salary && salaryPeriod !== 'NEGOTIABLE') nextErrors.salary = 'الرجاء إدخال الراتب أو اختيار قابل للتفاوض'
    if (languages.length === 0) nextErrors.languages = 'الرجاء تحديد لغة واحدة على الأقل'
    if (experienceYears === undefined) nextErrors.experienceYears = 'الرجاء تحديد سنوات الخبرة'
    if (minAge === undefined) nextErrors.minAge = isHiring ? 'الرجاء تحديد العمر الأدنى' : 'الرجاء إدخال عمرك'
    if (isHiring && maxAge === undefined) nextErrors.maxAge = 'الرجاء تحديد العمر الأقصى'
    if (!nationality) nextErrors.nationality = 'الرجاء تحديد الجنسية'

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }
    setErrors({})
    router.push('/jobs/create-step3')
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[s.root, { paddingBottom: insets.bottom }]}>
        <AppHeader title="نشر إعلان" showBack variant="jobs" />

        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <Stepper currentStep={2} totalSteps={TOTAL_STEPS} title={isHiring ? "متطلبات الوظيفة" : "التفاصيل الشخصية"} />
          <Text style={s.pageDesc}>{isHiring ? "حدد نوع الدوام والراتب ومتطلبات الرخصة والخبرة" : "حدد تفاصيل رخصتك وخبرتك وراتبك المتوقع"}</Text>

          {/* Employment Type */}
          <Text style={s.sectionTitle}>{isHiring ? "نوع الدوام المطلوب *" : "نوع الدوام المفضل *"}</Text>
          <View style={s.chipsWrap}>
            {EMP_TYPES.map(et => (
              <TouchableOpacity
                key={et}
                style={[s.periodChip, employmentType === et && s.periodChipActive]}
                onPress={() => set({ employmentType: et })}
                activeOpacity={0.8}
              >
                <View style={[s.radioCircle, employmentType === et && s.radioCircleActive]}>
                  {employmentType === et && <View style={s.radioDot} />}
                </View>
                <Text style={[s.periodText, employmentType === et && s.periodTextActive]}>
                  {EMPLOYMENT_TYPE_LABELS[et]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <InlineError message={errors.employmentType} />

          {/* Salary */}
          <Text style={s.sectionTitle}>{isHiring ? "الراتب / الأجر" : "الراتب المتوقع"}</Text>
          <View style={s.salaryContainer}>
            <TextInput
              style={[s.input, isNegotiable && s.inputDisabled, { marginBottom: Spacing.space2 }]}
              value={salary ? salary.toString() : ''}
              onChangeText={v => set({ salary: v ? parseFloat(v) : undefined })}
              placeholder="المبلغ (ر.ع)"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
              editable={!isNegotiable}
            />
            <View style={s.periodWrap}>
              {SAL_PERIODS.map(sp => (
                <TouchableOpacity
                  key={sp}
                  style={[s.periodChip, salaryPeriod === sp && s.periodChipActive]}
                  onPress={() => set({ salaryPeriod: sp })}
                  activeOpacity={0.8}
                >
                  <View style={[s.radioCircle, salaryPeriod === sp && s.radioCircleActive]}>
                    {salaryPeriod === sp && <View style={s.radioDot} />}
                  </View>
                  <Text style={[s.periodText, salaryPeriod === sp && s.periodTextActive]}>
                    {SALARY_PERIOD_LABELS[sp]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <InlineError message={errors.salary} />

          {/* License Types */}
          <Text style={s.sectionTitle}>{isHiring ? "أنواع الرخص المطلوبة *" : "الرخص التي تمتلكها *"}</Text>
          <View style={s.chipsWrap}>
            {LIC_TYPES.map(lt => (
              <TouchableOpacity
                key={lt}
                style={[s.periodChip, licenseTypes.includes(lt) && s.periodChipActive]}
                onPress={() => toggleLicense(lt)}
                activeOpacity={0.8}
              >
                <View style={[s.checkboxSmall, licenseTypes.includes(lt) && s.checkboxSmallActive]}>
                  {licenseTypes.includes(lt) && <Ionicons name="checkmark" size={10} color="#fff" />}
                </View>
                <Text style={[s.periodText, licenseTypes.includes(lt) && s.periodTextActive]}>
                  {LICENSE_TYPE_LABELS[lt]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <InlineError message={errors.licenseTypes} />

          {/* Experience */}
          <Text style={s.sectionTitle}>{isHiring ? "سنوات الخبرة المطلوبة *" : "سنوات خبرتك *"}</Text>
          <AppSelect
            value={experienceYears !== undefined ? experienceYears.toString() : ''}
            onValueChange={v => set({ experienceYears: parseInt(v) })}
            items={EXPERIENCE_OPTIONS}
            placeholder="اختر سنوات الخبرة..."
          />
          <InlineError message={errors.experienceYears} />

          {/* Age Range */}
          <Text style={s.sectionTitle}>{isHiring ? "العمر المطلوب *" : "عمرك *"}</Text>
          <View style={{ flexDirection: 'row', gap: Spacing.space3, marginBottom: Spacing.space3 }}>
            <View style={{ flex: 1 }}>
              <AppSelect
                value={minAge !== undefined ? minAge.toString() : ''}
                onValueChange={v => set({ minAge: parseInt(v) })}
                items={AGE_OPTIONS}
                placeholder={isHiring ? "من عمر..." : "اختر عمرك..."}
              />
            </View>
            {isHiring && (
              <View style={{ flex: 1 }}>
                <AppSelect
                  value={maxAge !== undefined ? maxAge.toString() : ''}
                  onValueChange={v => set({ maxAge: parseInt(v) })}
                  items={AGE_OPTIONS}
                  placeholder="إلى عمر..."
                />
              </View>
            )}
          </View>
          {(errors.minAge || errors.maxAge) && (
            <InlineError message={errors.minAge || errors.maxAge} />
          )}

          {/* Nationality */}
          <Text style={s.sectionTitle}>{isHiring ? "الجنسية المطلوبة *" : "جنسيتك *"}</Text>
          <View style={s.chipsWrap}>
            {NAT_TYPES.map(nat => (
              <TouchableOpacity
                key={nat}
                style={[s.periodChip, nationality === nat && s.periodChipActive]}
                onPress={() => set({ nationality: nationality === nat ? undefined : nat })}
                activeOpacity={0.8}
              >
                <View style={[s.radioCircle, nationality === nat && s.radioCircleActive]}>
                  {nationality === nat && <View style={s.radioDot} />}
                </View>
                <Text style={[s.periodText, nationality === nat && s.periodTextActive]}>
                  {NATIONALITY_LABELS[nat]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <InlineError message={errors.nationality} />

          {/* Own Vehicle */}
          <TouchableOpacity
            style={s.checkRow}
            onPress={() => set({ hasOwnVehicle: !hasOwnVehicle })}
            activeOpacity={0.8}
          >
            <View style={[s.checkbox, hasOwnVehicle && s.checkboxActive]}>
              {hasOwnVehicle && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
            <Text style={s.checkLabel}>{isHiring ? "يجب أن يمتلك السائق مركبته الخاصة" : "أمتلك مركبة خاصة للتوصيل"}</Text>
          </TouchableOpacity>

          {/* Languages */}
          <Text style={[s.sectionTitle, { marginTop: Spacing.space4 }]}>{isHiring ? "اللغات المطلوبة (اختياري)" : "اللغات التي تتقنها (اختياري)"}</Text>
          <View style={s.chipsWrap}>
            {LANGUAGE_OPTIONS.map(lang => (
              <TouchableOpacity
                key={lang}
                style={[s.periodChip, languages.includes(lang) && s.periodChipActive]}
                onPress={() => toggleLanguage(lang)}
                activeOpacity={0.8}
              >
                <View style={[s.checkboxSmall, languages.includes(lang) && s.checkboxSmallActive]}>
                  {languages.includes(lang) && <Ionicons name="checkmark" size={10} color="#fff" />}
                </View>
                <Text style={[s.periodText, languages.includes(lang) && s.periodTextActive]}>
                  {lang}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <InlineError message={errors.languages} />

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
              title="التالي"
              size="sm"
              onPress={handleNext}
              style={{ flex: 1 }}
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
  sectionTitle: {
    fontFamily: 'Almarai_700Bold',  fontSize: 16,
    color: Colors.text, writingDirection: 'rtl',
    marginBottom: 10,
  },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.space2, marginBottom: Spacing.space5 },
  chip: {
    paddingVertical: 7, paddingHorizontal: 14,
    borderRadius: Radius.pill, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  chipActive: { borderColor: Colors.primary, backgroundColor: '#EFF6FF' },
  chipText: { fontFamily: 'Almarai_700Bold',  fontSize: 13, color: Colors.text2 },
  chipTextActive: { color: Colors.primary },
  salaryContainer: {
    marginBottom: Spacing.space5,
  },
  periodWrap: {
    flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.space3,
    marginTop: Spacing.space1,
  },
  periodChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 6, paddingHorizontal: 10,
    backgroundColor: Colors.white, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  periodChipActive: { borderColor: Colors.primary, backgroundColor: '#EFF6FF' },
  radioCircle: {
    width: 14, height: 14, borderRadius: 7,
    borderWidth: 1.5, borderColor: Colors.textMuted,
    alignItems: 'center', justifyContent: 'center',
  },
  radioCircleActive: { borderColor: Colors.primary },
  radioDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primary },
  checkboxSmall: {
    width: 14, height: 14, borderRadius: 4,
    borderWidth: 1.5, borderColor: Colors.textMuted,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxSmallActive: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  periodText: {
    fontFamily: 'Almarai_700Bold',  fontSize: 12,
    color: Colors.text2, writingDirection: 'rtl',
  },
  periodTextActive: { color: Colors.primary },
  input: {
    backgroundColor: Colors.white,
    borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.space4, minHeight: 56, paddingVertical: 14,
    fontFamily: 'Almarai_400Regular',  fontSize: 15, color: Colors.text,
    marginBottom: Spacing.space4, textAlign: 'right', writingDirection: 'rtl',
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
    fontFamily: 'Almarai_700Bold',  fontSize: 14, color: Colors.text,
  },
  footer: {
    position: 'absolute', bottom: 0, start: 0, end: 0,
    backgroundColor: Colors.white, paddingHorizontal: Spacing.space4, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  footerBtns: { flexDirection: 'row', gap: Spacing.space3 },
})
