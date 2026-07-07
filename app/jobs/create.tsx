import React, { useEffect } from 'react'
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
import { JobType } from '../../src/types/jobs.types'

const TOTAL_STEPS = 4

const JOB_TYPES: { id: JobType; label: string; desc: string; icon: string }[] = [
  {
    id: 'HIRING',
    label: 'طلب سائق',
    desc: 'أنت صاحب عمل تبحث عن سائق للتوظيف',
    icon: '🏢',
  },
  {
    id: 'OFFERING',
    label: 'عرض خدمة',
    desc: 'أنت سائق تعلن عن خدماتك لأصحاب العمل',
    icon: '🚗',
  },
]

export default function CreateStep1() {
  const insets = useSafeAreaInsets()
  const { jobType, title, description, set, reset } = useJobPostStore()

  // Reset draft on fresh start (only if title is empty)
  useEffect(() => {
    // intentionally do nothing — preserve draft
  }, [])

  const canNext = jobType && title.trim().length >= 5 && description.trim().length >= 10

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
            {JOB_TYPES.map(t => (
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

          {/* Title */}
          <Text style={s.sectionTitle}>عنوان الإعلان *</Text>
          <TextInput
            style={s.input}
            value={title}
            onChangeText={v => set({ title: v })}
            placeholder="مثال: مطلوب سائق شاحنة ثقيلة في مسقط"
            placeholderTextColor={Colors.textMuted}
            textAlign="right"
            maxLength={100}
          />
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
            textAlign="right"
            textAlignVertical="top"
            maxLength={1000}
          />
          <Text style={s.charCount}>{description.length}/1000</Text>

          {/* Draft hint */}
          {(title || description) ? (
            <View style={s.draftBanner}>
              <Ionicons name="save-outline" size={16} color="#92400e" />
              <Text style={s.draftText}>تم حفظ المسودة تلقائياً</Text>
            </View>
          ) : null}

        </ScrollView>

        <View style={[s.footer, { paddingBottom: insets.bottom + 8 }]}>
          <AppButton
            title="التالي ←"
            onPress={() => router.push('/jobs/create-step2')}
            disabled={!canNext}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

export function WizardProgress({ current, total }: { current: number; total: number }) {
  return (
    <View style={wp.bar}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            wp.segment,
            i < current ? wp.segmentDone : i === current - 1 ? wp.segmentActive : wp.segmentPending,
          ]}
        />
      ))}
    </View>
  )
}

const wp = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    gap: Spacing.space1,
    paddingHorizontal: Spacing.space4,
    paddingVertical: Spacing.space2,
    backgroundColor: Colors.white,
  },
  segment: {
    flex: 1, height: 4, borderRadius: 2,
  },
  segmentDone: { backgroundColor: Colors.primary },
  segmentActive: { backgroundColor: Colors.primary },
  segmentPending: { backgroundColor: Colors.border },
})

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F9FA' },
  content: { padding: Spacing.space4, paddingBottom: 120 },
  stepLabel: {
    fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 13,
    color: Colors.textMuted, textAlign: 'right',
    marginBottom: Spacing.space1,
  },
  pageTitle: {
    fontFamily: 'Almarai_800ExtraBold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 22,
    color: Colors.text, textAlign: 'right',
    marginBottom: 6,
  },
  pageDesc: {
    fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 14,
    color: Colors.text2, textAlign: 'right',
    marginBottom: Spacing.space5, lineHeight: 22,
  },
  sectionTitle: {
    fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 14,
    color: Colors.text, textAlign: 'right',
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
  typeCheck: { position: 'absolute', top: 8, right: 8 },
  input: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border,
    paddingHorizontal: Spacing.space4, paddingVertical: 14,
    fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 15, color: Colors.text,
    marginBottom: Spacing.space1,
  },
  textArea: { height: 130, paddingTop: 14 },
  charCount: {
    fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 12,
    color: Colors.textMuted, textAlign: 'right',
    marginBottom: Spacing.space4,
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
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.white, paddingHorizontal: Spacing.space4,
    paddingTop: 12,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
})
