import React, { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native'
import { router } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { AppHeader } from '../../src/components/ui/AppHeader'
import { AppButton } from '../../src/components/ui/AppButton'
import { Colors } from '../../src/constants/colors'
import { Spacing } from '../../src/constants/spacing'
import { Radius } from '../../src/constants/radius'
import { LicenseType } from '../../src/types/jobs.types'
import {
  LICENSE_TYPE_LABELS,
  LANGUAGE_OPTIONS,
  VEHICLE_TYPE_OPTIONS,
  OMAN_GOVERNORATES,
} from '../../src/constants/jobs'
import { useCreateDriverProfile } from '../../src/hooks/useDriverProfile'
import { useCreateEmployerProfile } from '../../src/hooks/useEmployerProfile'
import { useJobProfileStore } from '../../src/store/jobProfileStore'
import { LocationPicker } from '../../src/components/ui/LocationPicker'

type Role = 'driver' | 'employer'

const LICENSE_KEYS = Object.keys(LICENSE_TYPE_LABELS) as LicenseType[]

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets()
  const { activeRole, setActiveRole } = useJobProfileStore()

  useEffect(() => {
    if (activeRole) {
      router.replace('/jobs/dashboard')
    }
  }, [activeRole])

  const [step, setStep] = useState<1 | 2>(1)
  const [role, setRole] = useState<Role | null>(null)

  // Driver fields
  const [licenseTypes, setLicenseTypes] = useState<LicenseType[]>([])
  const [experienceYears, setExperienceYears] = useState('')
  const [hasOwnVehicle, setHasOwnVehicle] = useState(false)
  const [vehicleTypes, setVehicleTypes] = useState<string[]>([])
  const [languages, setLanguages] = useState<string[]>([])
  const [governorate, setGovernorate] = useState('')
  const [bio, setBio] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [whatsapp, setWhatsapp] = useState('')

  // Employer fields
  const [companyName, setCompanyName] = useState('')
  const [industry, setIndustry] = useState('')
  const [empGov, setEmpGov] = useState('')
  const [empBio, setEmpBio] = useState('')
  const [empPhone, setEmpPhone] = useState('')

  const createDriver = useCreateDriverProfile()
  const createEmployer = useCreateEmployerProfile()
  const loading = createDriver.isPending || createEmployer.isPending

  const toggleItem = <T,>(arr: T[], setArr: (v: T[]) => void, item: T) => {
    setArr(arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item])
  }

  const handleStep1Continue = () => {
    if (!role) {
      Alert.alert('اختر دورك', 'يرجى اختيار دور قبل المتابعة')
      return
    }
    setStep(2)
  }

  const handleSubmitDriver = async () => {
    if (!governorate) {
      Alert.alert('الموقع مطلوب', 'يرجى اختيار المحافظة')
      return
    }
    if (licenseTypes.length === 0) {
      Alert.alert('رخصة القيادة مطلوبة', 'يرجى اختيار نوع رخصة القيادة على الأقل')
      return
    }
    try {
      await createDriver.mutateAsync({
        licenseTypes,
        experienceYears: experienceYears ? parseInt(experienceYears) : undefined,
        hasOwnVehicle,
        vehicleTypes,
        languages,
        governorate,
        bio: bio || undefined,
        contactPhone: contactPhone || undefined,
        whatsapp: whatsapp || undefined,
      })
      setActiveRole('driver')
      router.replace('/jobs/dashboard')
    } catch (e: any) {
      Alert.alert('خطأ', e?.response?.data?.message ?? 'حدث خطأ، حاول مرة أخرى')
    }
  }

  const handleSubmitEmployer = async () => {
    if (!empGov) {
      Alert.alert('الموقع مطلوب', 'يرجى اختيار المحافظة')
      return
    }
    try {
      await createEmployer.mutateAsync({
        companyName: companyName || undefined,
        industry: industry || undefined,
        governorate: empGov,
        bio: empBio || undefined,
        contactPhone: empPhone || undefined,
      })
      setActiveRole('employer')
      router.replace('/jobs/dashboard')
    } catch (e: any) {
      Alert.alert('خطأ', e?.response?.data?.message ?? 'حدث خطأ، حاول مرة أخرى')
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[s.root, { paddingBottom: insets.bottom }]}>
        <AppHeader title="إنشاء بروفايل" showBack variant="jobs" />

        {/* Progress */}
        <View style={s.progressBar}>
          <View style={[s.progressFill, { width: step === 1 ? '50%' : '100%' }]} />
        </View>

        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

          {/* ── STEP 1: Role Selection ── */}
          {step === 1 && (
            <View>
              <Text style={s.pageTitle}>ما دورك في سوق ون؟</Text>
              <Text style={s.pageDesc}>اختر دورك لنتمكن من تخصيص تجربتك</Text>

              <View style={s.rolesRow}>
                {/* Driver Card */}
                <TouchableOpacity
                  style={[s.roleCardWrap]}
                  onPress={() => setRole('driver')}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={role === 'driver' ? ['#065F46', '#059669'] : ['#ffffff', '#ffffff']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={[s.roleCard, role === 'driver' && s.roleCardActiveGrad]}
                  >
                    <View style={[s.roleIcon, role === 'driver' && s.roleIconActiveGrad]}>
                      <Text style={s.roleEmoji}>🚗</Text>
                    </View>
                    <Text style={[s.roleTitle, role === 'driver' && s.roleTitleActiveGrad]}>سائق</Text>
                    <Text style={[s.roleDesc, role === 'driver' && s.roleDescActiveGrad]}>
                      ابحث عن عمل أو أعلن عن خدماتك
                    </Text>
                    {role === 'driver' && (
                      <Ionicons name="checkmark-circle" size={24} color="#ffffff" style={s.roleCheck} />
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Employer Card */}
                <TouchableOpacity
                  style={[s.roleCardWrap]}
                  onPress={() => setRole('employer')}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={role === 'employer' ? ['#0B2447', '#1a3a6b'] : ['#ffffff', '#ffffff']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={[s.roleCard, role === 'employer' && s.roleCardActiveGrad]}
                  >
                    <View style={[s.roleIcon, role === 'employer' && s.roleIconActiveGrad]}>
                      <Text style={s.roleEmoji}>🏢</Text>
                    </View>
                    <Text style={[s.roleTitle, role === 'employer' && s.roleTitleActiveGrad]}>صاحب عمل</Text>
                    <Text style={[s.roleDesc, role === 'employer' && s.roleDescActiveGrad]}>
                      ابحث عن سائقين وانشر إعلانات
                    </Text>
                    {role === 'employer' && (
                      <Ionicons name="checkmark-circle" size={24} color="#ffffff" style={s.roleCheck} />
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              <AppButton title="التالي" onPress={handleStep1Continue} style={s.mainBtn} />
            </View>
          )}

          {/* ── STEP 2A: Driver Form ── */}
          {step === 2 && role === 'driver' && (
            <View>
              <Text style={s.pageTitle}>بروفايل السائق</Text>
              <Text style={s.pageDesc}>أكمل بياناتك لتظهر للمعلنين وأصحاب العمل</Text>

              {/* License Types */}
              <View style={s.section}>
                <Text style={s.sectionTitle}>أنواع رخص القيادة *</Text>
                <View style={s.chipsWrap}>
                  {LICENSE_KEYS.map(lt => (
                    <TouchableOpacity
                      key={lt}
                      style={[s.chip, licenseTypes.includes(lt) && s.chipActive]}
                      onPress={() => toggleItem(licenseTypes, setLicenseTypes, lt)}
                      activeOpacity={0.8}
                    >
                      <Text style={[s.chipText, licenseTypes.includes(lt) && s.chipTextActive]}>
                        🪪 {LICENSE_TYPE_LABELS[lt]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Experience + Own Vehicle */}
              <View style={s.section}>
                <Text style={s.sectionTitle}>سنوات الخبرة</Text>
                <TextInput
                  style={s.input}
                  value={experienceYears}
                  onChangeText={setExperienceYears}
                  placeholder="مثال: 3"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                  textAlign="right"
                />
                <TouchableOpacity
                  style={s.checkRow}
                  onPress={() => setHasOwnVehicle(!hasOwnVehicle)}
                  activeOpacity={0.8}
                >
                  <View style={[s.checkbox, hasOwnVehicle && s.checkboxActive]}>
                    {hasOwnVehicle && <Ionicons name="checkmark" size={14} color="#fff" />}
                  </View>
                  <Text style={s.checkLabel}>أمتلك مركبة خاصة</Text>
                </TouchableOpacity>
              </View>

              {/* Languages */}
              <View style={s.section}>
                <Text style={s.sectionTitle}>اللغات</Text>
                <View style={s.chipsWrap}>
                  {LANGUAGE_OPTIONS.map(lang => (
                    <TouchableOpacity
                      key={lang}
                      style={[s.chip, languages.includes(lang) && s.chipActive]}
                      onPress={() => toggleItem(languages, setLanguages, lang)}
                      activeOpacity={0.8}
                    >
                      <Text style={[s.chipText, languages.includes(lang) && s.chipTextActive]}>
                        {lang}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Governorate */}
              <View style={s.section}>
                <LocationPicker
                  governorate={governorate}
                  onGovernorateChange={setGovernorate}
                  showCity={false}
                />
              </View>

              {/* Bio */}
              <View style={s.section}>
                <Text style={s.sectionTitle}>نبذة تعريفية (اختياري)</Text>
                <TextInput
                  style={[s.input, s.textArea]}
                  value={bio}
                  onChangeText={setBio}
                  placeholder="أخبر أصحاب العمل عن خبرتك..."
                  placeholderTextColor={Colors.textMuted}
                  multiline
                  numberOfLines={3}
                  textAlign="right"
                  textAlignVertical="top"
                />
              </View>

              {/* Contact */}
              <View style={s.section}>
                <Text style={s.sectionTitle}>رقم الهاتف (اختياري)</Text>
                <TextInput
                  style={s.input}
                  value={contactPhone}
                  onChangeText={setContactPhone}
                  placeholder="+968 XXXX XXXX"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="phone-pad"
                  textAlign="right"
                />
                <Text style={[s.sectionTitle, { marginTop: Spacing.space3 }]}>واتساب (اختياري)</Text>
                <TextInput
                  style={s.input}
                  value={whatsapp}
                  onChangeText={setWhatsapp}
                  placeholder="+968 XXXX XXXX"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="phone-pad"
                  textAlign="right"
                />
              </View>

              <AppButton
                title={loading ? 'جاري الإنشاء...' : 'إنشاء بروفايل السائق'}
                onPress={handleSubmitDriver}
                style={s.mainBtn}
                disabled={loading}
              />
            </View>
          )}

          {/* ── STEP 2B: Employer Form ── */}
          {step === 2 && role === 'employer' && (
            <View>
              <Text style={s.pageTitle}>بروفايل صاحب العمل</Text>
              <Text style={s.pageDesc}>أكمل بياناتك لتستطيع نشر إعلانات التوظيف</Text>

              <View style={s.section}>
                <Text style={s.sectionTitle}>اسم الشركة / المنشأة (اختياري)</Text>
                <TextInput
                  style={s.input}
                  value={companyName}
                  onChangeText={setCompanyName}
                  placeholder="مثال: شركة النقل الأمثل"
                  placeholderTextColor={Colors.textMuted}
                  textAlign="right"
                />
              </View>

              <View style={s.section}>
                <Text style={s.sectionTitle}>القطاع / النشاط التجاري (اختياري)</Text>
                <TextInput
                  style={s.input}
                  value={industry}
                  onChangeText={setIndustry}
                  placeholder="مثال: نقل وخدمات لوجستية"
                  placeholderTextColor={Colors.textMuted}
                  textAlign="right"
                />
              </View>

              <View style={s.section}>
                <LocationPicker
                  governorate={empGov}
                  onGovernorateChange={setEmpGov}
                  showCity={false}
                />
              </View>

              <View style={s.section}>
                <Text style={s.sectionTitle}>نبذة عن المنشأة (اختياري)</Text>
                <TextInput
                  style={[s.input, s.textArea]}
                  value={empBio}
                  onChangeText={setEmpBio}
                  placeholder="أخبر السائقين عن شركتك ونشاطها..."
                  placeholderTextColor={Colors.textMuted}
                  multiline
                  numberOfLines={3}
                  textAlign="right"
                  textAlignVertical="top"
                />
              </View>

              <View style={s.section}>
                <Text style={s.sectionTitle}>رقم التواصل (اختياري)</Text>
                <TextInput
                  style={s.input}
                  value={empPhone}
                  onChangeText={setEmpPhone}
                  placeholder="+968 XXXX XXXX"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="phone-pad"
                  textAlign="right"
                />
              </View>

              <AppButton
                title={loading ? 'جاري الإنشاء...' : 'إنشاء بروفايل صاحب العمل'}
                onPress={handleSubmitEmployer}
                style={s.mainBtn}
                disabled={loading}
              />
            </View>
          )}

        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F9FA' },
  progressBar: {
    height: 4, backgroundColor: Colors.border,
    marginHorizontal: Spacing.space4,
  },
  progressFill: {
    height: '100%', backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  content: { padding: Spacing.space4, paddingBottom: 100 },
  pageTitle: {
    fontFamily: 'Almarai_800ExtraBold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 24,
    color: Colors.text, textAlign: 'right', writingDirection: 'rtl',
    marginBottom: 8,
  },
  pageDesc: {
    fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 15,
    color: Colors.text2, textAlign: 'right', writingDirection: 'rtl',
    lineHeight: 22,
  },
  rolesRow: {
    flexDirection: 'row', gap: Spacing.space3,
    marginBottom: Spacing.space6,
  },
  roleCardWrap: { flex: 1 },
  roleCard: {
    flex: 1, borderRadius: Radius.xl,
    padding: Spacing.space4, borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3,
  },
  roleCardActiveGrad: { borderColor: 'transparent', shadowOpacity: 0.2 },
  roleIcon: {
    width: 56, height: 56, borderRadius: Radius.xl,
    backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.space2,
  },
  roleIconActiveGrad: { backgroundColor: 'rgba(255,255,255,0.2)' },
  roleEmoji: { fontSize: 24 },
  roleTitle: {
    fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 16,
    color: Colors.text, textAlign: 'center', writingDirection: 'rtl',
    marginBottom: 4,
  },
  roleTitleActiveGrad: { color: Colors.white },
  roleDesc: {
    fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 12,
    color: Colors.text2, textAlign: 'center', writingDirection: 'rtl', lineHeight: 18,
  },
  roleDescActiveGrad: { color: 'rgba(255,255,255,0.85)' },
  roleCheck: { position: 'absolute', top: 12, right: 12 },
  mainBtn: { marginTop: Spacing.space4 },
  section: { marginBottom: Spacing.space5 },
  sectionTitle: {
    fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 14,
    color: Colors.text, textAlign: 'right', writingDirection: 'rtl',
    marginBottom: 10,
  },
  input: {
    height: 54, backgroundColor: '#F8FAFC',
    borderRadius: Radius.lg, borderWidth: 1, borderColor: '#E2E8F0',
    paddingHorizontal: Spacing.space4,
    fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 15, color: Colors.text,
    textAlign: 'right', writingDirection: 'rtl',
  },
  textArea: { height: 100, paddingTop: 14, paddingBottom: 14 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.space2 },
  govRow: { flexDirection: 'row', gap: Spacing.space2, paddingVertical: Spacing.space1 },
  chip: {
    paddingVertical: 8, paddingHorizontal: Spacing.space4,
    borderRadius: Radius.pill, borderWidth: 1, borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  govChip: {
    paddingVertical: 8, paddingHorizontal: Spacing.space4,
    borderRadius: Radius.pill, borderWidth: 1, borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  chipActive: { borderColor: Colors.primary, backgroundColor: '#EFF6FF', borderWidth: 1.5 },
  chipText: {
    fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 12,
    color: Colors.text2, writingDirection: 'rtl',
  },
  chipTextActive: { color: Colors.primary },
  checkRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12, marginTop: Spacing.space3,
  },
  checkbox: {
    width: 24, height: 24, borderRadius: 6,
    borderWidth: 1.5, borderColor: '#CBD5E1',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  checkboxActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkLabel: {
    fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 14,
    color: Colors.text, textAlign: 'right', writingDirection: 'rtl',
  },
})
