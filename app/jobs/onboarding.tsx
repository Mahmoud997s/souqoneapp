import React, { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView
} from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AppHeader } from '../../src/components/ui/AppHeader'
import { AppButton } from '../../src/components/ui/AppButton'
import { Colors } from '../../src/constants/colors'
import { Spacing } from '../../src/constants/spacing'
import { Radius } from '../../src/constants/radius'
import { Role } from '../../src/constants/jobs'
import { useJobProfileStore } from '../../src/store/jobProfileStore'
import { DriverOnboardingForm } from '../../src/components/jobs/DriverOnboardingForm'
import { EmployerOnboardingForm } from '../../src/components/jobs/EmployerOnboardingForm'

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets()
  const { activeRole } = useJobProfileStore()

  useEffect(() => {
    if (activeRole) {
      router.replace('/jobs/dashboard')
    }
  }, [activeRole])

  const [step, setStep] = useState<1 | 2>(1)
  const [role, setRole] = useState<Role | null>(null)

  const handleStep1Continue = () => {
    if (!role) return
    setStep(2)
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[s.root, { paddingBottom: insets.bottom }]}>
        <AppHeader title="إنشاء بروفايل" showBack variant="jobs" />

        {/* Pro Progress Indicator */}
        <View style={s.progressContainer}>
          <View style={s.dotsRow}>
            <View style={[s.dot, step >= 1 ? s.dotActive : s.dotInactive]} />
            <View style={[s.dotLine, step >= 2 ? s.dotLineActive : s.dotLineInactive]} />
            <View style={[s.dot, step >= 2 ? s.dotActive : s.dotInactive]} />
          </View>
          <Text style={s.progressTitle}>{step === 1 ? 'اختيار الدور' : 'إكمال البيانات'}</Text>
        </View>

        {/* ── STEP 1: Role Selection ── */}
        {step === 1 && (
          <>
            <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
              <Text style={s.pageTitle}>ما دورك في سوق ون؟</Text>
              <Text style={s.pageDesc}>اختر دورك لتخصيص تجربتك بشكل أفضل</Text>

              <View style={s.rolesCol}>
                {/* Driver Card */}
                <TouchableOpacity
                  style={[s.proCard, role === Role.DRIVER && s.proCardActive]}
                  onPress={() => setRole(Role.DRIVER)}
                  activeOpacity={0.8}
                >
                  <View style={s.proCardContent}>
                    <View style={[s.proIconWrap, role === Role.DRIVER && s.proIconWrapActive]}>
                      <Text style={s.proEmoji}>🚗</Text>
                    </View>
                    <View style={s.proTextWrap}>
                      <Text style={[s.proTitle, role === Role.DRIVER && s.proTitleActive]}>سائق</Text>
                      <Text style={[s.proDesc, role === Role.DRIVER && s.proDescActive]}>ابحث عن عمل أو أعلن عن خدماتك</Text>
                    </View>
                  </View>
                  <View style={[s.proRadio, role === Role.DRIVER && s.proRadioActive]}>
                    {role === Role.DRIVER && <View style={s.proRadioInner} />}
                  </View>
                </TouchableOpacity>

                {/* Employer Card */}
                <TouchableOpacity
                  style={[s.proCard, role === Role.EMPLOYER && s.proCardActive]}
                  onPress={() => setRole(Role.EMPLOYER)}
                  activeOpacity={0.8}
                >
                  <View style={s.proCardContent}>
                    <View style={[s.proIconWrap, role === Role.EMPLOYER && s.proIconWrapActive]}>
                      <Text style={s.proEmoji}>🏢</Text>
                    </View>
                    <View style={s.proTextWrap}>
                      <Text style={[s.proTitle, role === Role.EMPLOYER && s.proTitleActive]}>صاحب عمل</Text>
                      <Text style={[s.proDesc, role === Role.EMPLOYER && s.proDescActive]}>ابحث عن سائقين وانشر إعلانات</Text>
                    </View>
                  </View>
                  <View style={[s.proRadio, role === Role.EMPLOYER && s.proRadioActive]}>
                    {role === Role.EMPLOYER && <View style={s.proRadioInner} />}
                  </View>
                </TouchableOpacity>
              </View>
            </ScrollView>

            {/* Sticky Footer */}
            <View style={s.stickyFooter}>
              <AppButton title="متابعة" onPress={handleStep1Continue} disabled={!role} />
            </View>
          </>
        )}

        {/* ── STEP 2: Forms ── */}
        {step === 2 && role === Role.DRIVER && <DriverOnboardingForm />}
        {step === 2 && role === Role.EMPLOYER && <EmployerOnboardingForm />}

      </View>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F9FA' },
  progressContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.space4,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.03)',
  },
  dotsRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  dotActive: { backgroundColor: Colors.primary },
  dotInactive: { backgroundColor: '#E2E8F0' },
  dotLine: { width: 40, height: 2, borderRadius: 1 },
  dotLineActive: { backgroundColor: Colors.primary },
  dotLineInactive: { backgroundColor: '#E2E8F0' },
  progressTitle: {
    fontFamily: 'Almarai_700Bold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 13, color: Colors.text, writingDirection: 'rtl',
  },
  content: { padding: Spacing.space4, paddingBottom: 40 },
  pageTitle: {
    fontFamily: 'Almarai_800ExtraBold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 26,
    color: Colors.text, writingDirection: 'rtl',
    marginBottom: 6,
  },
  pageDesc: {
    fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 15,
    color: Colors.textMuted, writingDirection: 'rtl',
    lineHeight: 22, marginBottom: Spacing.space6,
  },
  rolesCol: { gap: Spacing.space4 },
  proCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.space5,
    borderWidth: 1.5,
    borderColor: 'transparent',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  proCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '08',
  },
  proCardContent: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.space4, flex: 1,
  },
  proIconWrap: {
    width: 56, height: 56, borderRadius: Radius.xl,
    backgroundColor: '#F4F6F8', alignItems: 'center', justifyContent: 'center',
  },
  proIconWrapActive: {
    backgroundColor: Colors.white,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 1,
  },
  proEmoji: { fontSize: 26 },
  proTextWrap: { flex: 1, paddingEnd: Spacing.space3 },
  proTitle: {
    fontFamily: 'Almarai_700Bold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 17, color: Colors.text, writingDirection: 'rtl', marginBottom: 4,
  },
  proTitleActive: { color: Colors.primary },
  proDesc: {
    fontFamily: 'Almarai_400Regular', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 13, color: Colors.textMuted, writingDirection: 'rtl', lineHeight: 20,
  },
  proDescActive: { color: Colors.text },
  proRadio: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#CBD5E1',
    alignItems: 'center', justifyContent: 'center',
  },
  proRadioActive: { borderColor: Colors.primary },
  proRadioInner: {
    width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.primary,
  },
  stickyFooter: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.space4,
    paddingTop: Spacing.space4,
    paddingBottom: Spacing.space3,
    borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 10,
  },
})
