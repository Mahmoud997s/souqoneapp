import React, { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, KeyboardAvoidingView, Platform
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { Alert } from 'react-native'
import { AppHeader } from '../../src/components/ui/AppHeader'
import { AppButton } from '../../src/components/ui/AppButton'
import { Colors } from '../../src/constants/colors'
import { Spacing } from '../../src/constants/spacing'
import { Radius } from '../../src/constants/radius'
import { useJobPostStore } from '../../src/store/jobPostStore'
import { JOB_POST_TYPES } from '../../src/constants/jobs'
import { WizardProgress } from '../../src/components/ui/WizardProgress'
import { InlineError } from '../../src/components/ui/InlineError'

const TOTAL_STEPS = 4

export default function CreateStep1() {
  const insets = useSafeAreaInsets()
  const { jobType, title, description, set, reset } = useJobPostStore()

  // Reset draft on fresh start (only if title is empty)
  useEffect(() => {
    // intentionally do nothing — preserve draft
  }, [])

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleNext = () => {
    const nextErrors: Record<string, string> = {}
    if (!jobType) nextErrors.jobType = 'الرجاء اختيار نوع الإعلان أولاً'
    if (title.trim().length < 5) nextErrors.title = 'عنوان الإعلان يجب أن يكون 5 أحرف على الأقل'
    if (description.trim().length < 10) nextErrors.description = 'وصف الإعلان يجب أن يكون 10 أحرف على الأقل'
    
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }
    setErrors({})
    router.push('/jobs/create-step2')
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[s.root, { paddingBottom: insets.bottom }]}>
        <AppHeader title="نشر إعلان" showBack variant="jobs" />

        {/* Progress */}
        <WizardProgress current={1} total={TOTAL_STEPS} />

        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <Text style={s.stepLabel}>الخطوة 1 من {TOTAL_STEPS}</Text>
          <Text style={s.pageTitle}>نوع الإعلان والعنوان</Text>
          <Text style={s.pageDesc}>اختر نوع الإعلان ثم أضف عنواناً وصفاً واضحاً</Text>

          {/* Job Type */}
          <Text style={s.sectionTitle}>نوع الإعلان *</Text>
          <View style={s.typeRow}>
            {JOB_POST_TYPES.map(t => (
              <TouchableOpacity
                key={t.id}
                style={[s.typeCard, jobType === t.id && s.typeCardActive]}
                onPress={() => set({ jobType: t.id })}
                activeOpacity={0.85}
              >
                <Text style={s.typeEmoji}>{t.icon}</Text>
                <Text style={[s.typeLabel, jobType === t.id && s.typeLabelActive]}>
                  {t.label}
                </Text>
                <Text style={[s.typeDesc, jobType === t.id && s.typeDescActive]}>
                  {t.desc}
                </Text>
                {jobType === t.id && (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={Colors.primary}
                    style={s.typeCheck}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
          <InlineError message={errors.jobType} />

          {/* Title */}
          <Text style={s.sectionTitle}>عنوان الإعلان *</Text>
          <TextInput
            style={s.input}
            value={title}
            onChangeText={v => set({ title: v })}
            placeholder="مثال: مطلوب سائق شاحنة ثقيلة في مسقط"
            placeholderTextColor={Colors.textMuted}
            maxLength={100}
          />
          <InlineError message={errors.title} />
          <Text style={s.charCount}>{title.length}/100</Text>

          {/* Description */}
          <Text style={s.sectionTitle}>وصف الإعلان *</Text>
          <TextInput
            style={[s.input, s.textArea]}
            value={description}
            onChangeText={v => set({ description: v })}
            placeholder={`اكتب وصفاً تفصيلياً للوظيفة:\n• المهام المطلوبة\n• ساعات العمل\n• أي متطلبات خاصة`}
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            maxLength={1000}
          />
          <InlineError message={errors.description} />
          <Text style={s.charCount}>{description.length}/1000</Text>

          {/* Draft hint */}
          {(title || description) ? (
            <View style={s.draftBanner}>
              <Ionicons name="save-outline" size={16} color="#92400e" />
              <Text style={s.draftText}>تم حفظ المسودة تلقائياً</Text>
            </View>
          ) : null}

        </ScrollView>

        <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, Spacing.space4) }]}>
          <AppButton
            title="التالي"
            size="sm"
            onPress={handleNext}
          />
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
    color: Colors.textMuted, writingDirection: 'rtl',
    marginBottom: Spacing.space1,
  },
  pageTitle: {
    fontFamily: 'Almarai_800ExtraBold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 22,
    color: Colors.text, writingDirection: 'rtl',
    marginBottom: 6,
  },
  pageDesc: {
    fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 14,
    color: Colors.text2, writingDirection: 'rtl',
    marginBottom: Spacing.space5, lineHeight: 22,
  },
  sectionTitle: {
    fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 14,
    color: Colors.text, writingDirection: 'rtl',
    marginBottom: 10,
  },
  typeRow: {
    flexDirection: 'row', gap: Spacing.space3,
    marginBottom: Spacing.space5,
  },
  typeCard: {
    flex: 1, backgroundColor: Colors.white,
    borderRadius: Radius.lg, padding: Spacing.space4,
    borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', position: 'relative',
  },
  typeCardActive: { borderColor: Colors.primary, backgroundColor: '#EFF6FF' },
  typeEmoji: { fontSize: 28, marginBottom: Spacing.space2 },
  typeLabel: {
    fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 14,
    color: Colors.text, marginBottom: Spacing.space1, textAlign: 'center',
  },
  typeLabelActive: { color: Colors.primary },
  typeDesc: {
    fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 12,
    color: Colors.text2, textAlign: 'center', lineHeight: 18,
  },
  typeDescActive: { color: Colors.primaryLight },
  typeCheck: { position: 'absolute', top: 8, end: 8 },
  input: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.space4, minHeight: 56, paddingVertical: 14,
    fontFamily: 'Almarai_400Regular', includeFontPadding: false, fontSize: 15, color: Colors.text,
    marginBottom: Spacing.space1, textAlign: 'right', writingDirection: 'rtl',
  },
  textArea: { height: 130, paddingTop: 16, paddingBottom: 16, textAlignVertical: 'top' },
  charCount: {
    fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 12,
    color: Colors.textMuted, alignSelf: 'flex-start',
  },
  draftBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FEF3C7', borderRadius: Radius.sm,
    paddingVertical: Spacing.space2, paddingHorizontal: Spacing.space3,
  },
  draftText: {
    fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 12,
    color: '#92400e',
  },
  footer: {
    position: 'absolute', bottom: 0, start: 0, end: 0,
    backgroundColor: Colors.white, paddingHorizontal: Spacing.space4,
    paddingTop: 12,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
})
