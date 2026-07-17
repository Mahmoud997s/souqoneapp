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
import { OMAN_GOVERNORATES, OMAN_WILAYAT_BY_GOVERNORATE } from '../../src/constants/jobs'
import { LocationPicker } from '../../src/components/ui/LocationPicker'

const TOTAL_STEPS = 4

export default function CreateStep3() {
  const insets = useSafeAreaInsets()
  const { governorate, city, set } = useJobPostStore()

  const wilayat = governorate ? (OMAN_WILAYAT_BY_GOVERNORATE[governorate] ?? []) : []
  const [error, setError] = useState('')

  const handleNext = () => {
    if (governorate.trim().length === 0) {
      setError('الرجاء تحديد المحافظة أولاً')
      return
    }
    if (city.trim().length === 0) {
      setError('الرجاء تحديد الولاية/المدينة')
      return
    }
    setError('')
    router.push('/jobs/create-step4')
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[s.root, { paddingBottom: insets.bottom }]}>
        <AppHeader title="نشر إعلان" showBack variant="jobs" />

        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <Stepper currentStep={3} totalSteps={TOTAL_STEPS} title="الموقع الجغرافي" />
          <Text style={s.pageDesc}>حدد محافظة وولاية الوظيفة لتسهيل البحث</Text>

          {/* Governorate & City */}
          <View style={{ marginBottom: 24 }}>
            <LocationPicker
              governorate={governorate}
              onGovernorateChange={(val) => set({ governorate: val, city: '' })}
              city={city}
              onCityChange={(val) => set({ city: val })}
              showCity={true}
            />
          </View>
          <InlineError message={error} />

          {/* Selected location summary */}
          {governorate && (
            <View style={s.summaryCard}>
              <Ionicons name="map-outline" size={22} color={Colors.primary} />
              <View style={s.summaryContent}>
                <Text style={s.summaryTitle}>الموقع المحدد</Text>
                <Text style={s.summaryValue}>
                  {[governorate, city].filter(Boolean).join(' — ')}
                </Text>
              </View>
            </View>
          )}

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
    fontFamily: 'Almarai_400Regular',  fontSize: 14,
    color: Colors.text2, writingDirection: 'rtl', textAlign: 'center',
    marginBottom: Spacing.space5, lineHeight: 22,
  },
  sectionTitle: {
    fontFamily: 'Almarai_700Bold',  fontSize: 16,
    color: Colors.text, writingDirection: 'rtl',
    marginBottom: 10,
  },
  govGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.space2,
    marginBottom: Spacing.space5,
  },
  govCard: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: Spacing.space2, paddingHorizontal: Spacing.space3,
    backgroundColor: Colors.white, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  govCardActive: { borderColor: Colors.primary, backgroundColor: '#EFF6FF' },
  govText: { fontFamily: 'Almarai_700Bold',  fontSize: 13, color: Colors.text2 },
  govTextActive: { color: Colors.primary },
  wilayatRow: {
    flexDirection: 'row', gap: Spacing.space2, paddingVertical: Spacing.space1,
    marginBottom: Spacing.space5,
  },
  chip: {
    paddingVertical: 7, paddingHorizontal: 14,
    borderRadius: Radius.pill, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  chipActive: { borderColor: Colors.primary, backgroundColor: '#EFF6FF' },
  chipText: { fontFamily: 'Almarai_700Bold',  fontSize: 13, color: Colors.text2 },
  chipTextActive: { color: Colors.primary },
  summaryCard: {
    flexDirection: 'row', gap: Spacing.space3, alignItems: 'center',
    backgroundColor: '#EFF6FF', borderRadius: Radius.lg,
    borderWidth: 1, borderColor: '#DBEAFE', padding: Spacing.space4,
  },
  summaryContent: { flex: 1, alignItems: 'flex-start' },
  summaryTitle: {
    fontFamily: 'Almarai_400Regular',  fontSize: 12,
    color: Colors.primaryLight, marginBottom: 2,
  },
  summaryValue: {
    fontFamily: 'Almarai_700Bold',  fontSize: 15,
    color: Colors.primary,
  },
  footer: {
    position: 'absolute', bottom: 0, start: 0, end: 0,
    backgroundColor: Colors.white, paddingHorizontal: Spacing.space4, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  footerBtns: { flexDirection: 'row', gap: Spacing.space3 },
})
