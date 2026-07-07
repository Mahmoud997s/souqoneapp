import { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Platform, KeyboardAvoidingView } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors } from '../../src/constants/colors'
import { Spacing } from '../../src/constants/spacing'
import { Radius } from '../../src/constants/radius'
import { transportApi } from '../../src/api/transport'
import { useAuthStore } from '../../src/store/authStore'
import { AppHeader } from '../../src/components/ui/AppHeader'

// ─── Constants ───────────────────────────────────────────────────────────────

const SERVICE_TYPES = [
  { key: 'GOODS', label: 'بضائع عامة', icon: 'cube-outline', color: '#2563eb' },
  { key: 'FURNITURE', label: 'أثاث ومنزليات', icon: 'home-outline', color: '#7c3aed' },
  { key: 'CONSTRUCTION', label: 'مواد البناء', icon: 'hammer-outline', color: '#d97706' },
  { key: 'HEAVY', label: 'شحن ثقيل', icon: 'car-outline', color: '#dc2626' },
  { key: 'BACKLOAD', label: 'عودة فارغة', icon: 'swap-horizontal-outline', color: '#16a34a' },
  { key: 'EQUIPMENT', label: 'معدات وآليات', icon: 'construct-outline', color: '#0891b2' },
]

const GOVERNORATES = [
  { value: 'OM_MUS', label: 'مسقط' },
  { value: 'OM_DHL', label: 'ظفار' },
  { value: 'OM_BAT', label: 'شمال الباطنة' },
  { value: 'OM_BSS', label: 'جنوب الباطنة' },
  { value: 'OM_DAK', label: 'الداخلية' },
  { value: 'OM_SHA', label: 'شمال الشرقية' },
  { value: 'OM_SHS', label: 'جنوب الشرقية' },
  { value: 'OM_ZAH', label: 'الظاهرة' },
  { value: 'OM_BUR', label: 'البريمي' },
  { value: 'OM_WUS', label: 'الوسطى' },
  { value: 'OM_MSN', label: 'مسندم' },
]

const STEPS = ['نوع الشحن', 'المسار', 'البضاعة', 'الموعد', 'مراجعة']

// ─── Form State ──────────────────────────────────────────────────────────────

interface FormData {
  serviceType: string
  fromGovernorate: string
  fromCity: string
  toGovernorate: string
  toCity: string
  cargoDescription: string
  weightTons: string
  requiresHelper: boolean
  notes: string
  scheduledAt: string
  isFlexible: boolean
  budgetMin: string
  budgetMax: string
}

const INITIAL: FormData = {
  serviceType: '',
  fromGovernorate: '',
  fromCity: '',
  toGovernorate: '',
  toCity: '',
  cargoDescription: '',
  weightTons: '',
  requiresHelper: false,
  notes: '',
  scheduledAt: '',
  isFlexible: true,
  budgetMin: '',
  budgetMax: '',
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function NewTransportRequest() {
  const insets = useSafeAreaInsets()
  const { user } = useAuthStore()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormData>(INITIAL)
  const [submitting, setSubmitting] = useState(false)

  const set = (key: keyof FormData, val: any) => setForm(prev => ({ ...prev, [key]: val }))

  const canNext = () => {
    switch (step) {
      case 0: return !!form.serviceType
      case 1: return !!form.fromGovernorate && !!form.toGovernorate
      case 2: return form.cargoDescription.trim().length >= 5
      case 3: return true
      default: return true
    }
  }

  const handleSubmit = async () => {
    if (!user) { router.push('/(auth)/login' as any); return }
    setSubmitting(true)
    try {
      const payload: any = {
        serviceType: form.serviceType,
        fromGovernorate: form.fromGovernorate,
        fromCity: form.fromCity || undefined,
        toGovernorate: form.toGovernorate,
        toCity: form.toCity || undefined,
        cargoDescription: form.cargoDescription,
        weightTons: form.weightTons ? parseFloat(form.weightTons) : undefined,
        requiresHelper: form.requiresHelper,
        notes: form.notes || undefined,
        scheduledAt: form.scheduledAt || undefined,
        isFlexible: form.isFlexible,
        budgetMin: form.budgetMin ? parseFloat(form.budgetMin) : undefined,
        budgetMax: form.budgetMax ? parseFloat(form.budgetMax) : undefined,
      }
      await transportApi.create(payload)
      Alert.alert('تم بنجاح', 'تم إنشاء طلب النقل', [
        { text: 'حسناً', onPress: () => router.replace('/transport' as any) },
      ])
    } catch (e: any) {
      Alert.alert('خطأ', e?.response?.data?.message ?? 'حدث خطأ أثناء إنشاء الطلب')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View style={s.root}>
      {/* Header */}
      <AppHeader 
        title="طلب نقل جديد" 
        showBack 
        onLeftPress={() => step > 0 ? setStep(step - 1) : router.back()} 
      />

      {/* Progress */}
      <View style={s.progress}>
        {STEPS.map((label, i) => (
          <View key={i} style={s.stepItem}>
            <View style={[s.stepDot, i <= step && s.stepDotActive]}>
              {i < step ? (
                <Ionicons name="checkmark" size={12} color="#fff" />
              ) : (
                <Text style={[s.stepNum, i <= step && s.stepNumActive]}>{i + 1}</Text>
              )}
            </View>
            <Text style={[s.stepLabel, i <= step && s.stepLabelActive]}>{label}</Text>
          </View>
        ))}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>

          {/* Step 0: Service Type */}
          {step === 0 && (
            <View style={s.stepContent}>
              <Text style={s.stepTitle}>اختر نوع الشحن</Text>
              <View style={s.grid}>
                {SERVICE_TYPES.map(st => (
                  <TouchableOpacity
                    key={st.key}
                    style={[s.typeCard, form.serviceType === st.key && { borderColor: st.color, borderWidth: 2 }]}
                    onPress={() => set('serviceType', st.key)}
                    activeOpacity={0.8}
                  >
                    <View style={[s.typeIcon, { backgroundColor: st.color + '15' }]}>
                      <Ionicons name={st.icon as any} size={24} color={st.color} />
                    </View>
                    <Text style={s.typeLabel}>{st.label}</Text>
                    {form.serviceType === st.key && (
                      <View style={[s.typeCheck, { backgroundColor: st.color }]}>
                        <Ionicons name="checkmark" size={12} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Step 1: Route */}
          {step === 1 && (
            <View style={s.stepContent}>
              <Text style={s.stepTitle}>حدد المسار</Text>

              <Text style={s.fieldLabel}>من (المحافظة) *</Text>
              <View style={s.optionsWrap}>
                {GOVERNORATES.map(g => (
                  <TouchableOpacity
                    key={g.value}
                    style={[s.optionChip, form.fromGovernorate === g.value && s.optionChipActive]}
                    onPress={() => set('fromGovernorate', g.value)}
                  >
                    <Text style={[s.optionText, form.fromGovernorate === g.value && s.optionTextActive]}>{g.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={s.input}
                placeholder="المدينة/الولاية (اختياري)"
                placeholderTextColor={Colors.textMuted}
                value={form.fromCity}
                onChangeText={v => set('fromCity', v)}
              />

              <Text style={[s.fieldLabel, { marginTop: 16 }]}>إلى (المحافظة) *</Text>
              <View style={s.optionsWrap}>
                {GOVERNORATES.map(g => (
                  <TouchableOpacity
                    key={g.value}
                    style={[s.optionChip, form.toGovernorate === g.value && s.optionChipActive]}
                    onPress={() => set('toGovernorate', g.value)}
                  >
                    <Text style={[s.optionText, form.toGovernorate === g.value && s.optionTextActive]}>{g.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={s.input}
                placeholder="المدينة/الولاية (اختياري)"
                placeholderTextColor={Colors.textMuted}
                value={form.toCity}
                onChangeText={v => set('toCity', v)}
              />
            </View>
          )}

          {/* Step 2: Cargo */}
          {step === 2 && (
            <View style={s.stepContent}>
              <Text style={s.stepTitle}>وصف البضاعة</Text>

              <Text style={s.fieldLabel}>وصف الشحنة *</Text>
              <TextInput
                style={[s.input, s.textArea]}
                placeholder="صِف البضاعة المراد نقلها..."
                placeholderTextColor={Colors.textMuted}
                value={form.cargoDescription}
                onChangeText={v => set('cargoDescription', v)}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              <Text style={s.fieldLabel}>الوزن التقريبي (طن)</Text>
              <TextInput
                style={s.input}
                placeholder="مثال: 2.5"
                placeholderTextColor={Colors.textMuted}
                value={form.weightTons}
                onChangeText={v => set('weightTons', v)}
                keyboardType="decimal-pad"
              />

              <TouchableOpacity
                style={s.toggle}
                onPress={() => set('requiresHelper', !form.requiresHelper)}
              >
                <Ionicons
                  name={form.requiresHelper ? 'checkbox' : 'square-outline'}
                  size={22}
                  color={form.requiresHelper ? Colors.primary : Colors.textMuted}
                />
                <Text style={s.toggleText}>أحتاج مساعد للتحميل/التنزيل</Text>
              </TouchableOpacity>

              <Text style={s.fieldLabel}>ملاحظات إضافية</Text>
              <TextInput
                style={[s.input, s.textArea]}
                placeholder="أي تعليمات خاصة..."
                placeholderTextColor={Colors.textMuted}
                value={form.notes}
                onChangeText={v => set('notes', v)}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          )}

          {/* Step 3: Timing & Budget */}
          {step === 3 && (
            <View style={s.stepContent}>
              <Text style={s.stepTitle}>الموعد والميزانية</Text>

              <TouchableOpacity
                style={s.toggle}
                onPress={() => set('isFlexible', !form.isFlexible)}
              >
                <Ionicons
                  name={form.isFlexible ? 'checkbox' : 'square-outline'}
                  size={22}
                  color={form.isFlexible ? Colors.primary : Colors.textMuted}
                />
                <Text style={s.toggleText}>الموعد مرن</Text>
              </TouchableOpacity>

              {!form.isFlexible && (
                <>
                  <Text style={s.fieldLabel}>التاريخ المطلوب</Text>
                  <TextInput
                    style={s.input}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={Colors.textMuted}
                    value={form.scheduledAt}
                    onChangeText={v => set('scheduledAt', v)}
                  />
                </>
              )}

              <Text style={[s.fieldLabel, { marginTop: 16 }]}>الميزانية (ر.ع.)</Text>
              <View style={s.budgetRow}>
                <TextInput
                  style={[s.input, { flex: 1 }]}
                  placeholder="من"
                  placeholderTextColor={Colors.textMuted}
                  value={form.budgetMin}
                  onChangeText={v => set('budgetMin', v)}
                  keyboardType="decimal-pad"
                />
                <Text style={s.budgetDash}>—</Text>
                <TextInput
                  style={[s.input, { flex: 1 }]}
                  placeholder="إلى"
                  placeholderTextColor={Colors.textMuted}
                  value={form.budgetMax}
                  onChangeText={v => set('budgetMax', v)}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <View style={s.stepContent}>
              <Text style={s.stepTitle}>مراجعة الطلب</Text>

              <View style={s.reviewCard}>
                <ReviewRow label="نوع الشحن" value={SERVICE_TYPES.find(t => t.key === form.serviceType)?.label ?? '-'} />
                <ReviewRow label="من" value={GOVERNORATES.find(g => g.value === form.fromGovernorate)?.label + (form.fromCity ? ` — ${form.fromCity}` : '') || '-'} />
                <ReviewRow label="إلى" value={GOVERNORATES.find(g => g.value === form.toGovernorate)?.label + (form.toCity ? ` — ${form.toCity}` : '') || '-'} />
                <ReviewRow label="البضاعة" value={form.cargoDescription || '-'} />
                {form.weightTons ? <ReviewRow label="الوزن" value={`${form.weightTons} طن`} /> : null}
                <ReviewRow label="مساعد" value={form.requiresHelper ? 'مطلوب' : 'غير مطلوب'} />
                <ReviewRow label="الموعد" value={form.isFlexible ? 'مرن' : (form.scheduledAt || 'غير محدد')} />
                <ReviewRow label="الميزانية" value={
                  form.budgetMin && form.budgetMax ? `${form.budgetMin} - ${form.budgetMax} ر.ع.` :
                  form.budgetMax ? `حتى ${form.budgetMax} ر.ع.` :
                  form.budgetMin ? `من ${form.budgetMin} ر.ع.` : 'تواصل للسعر'
                } />
                {form.notes ? <ReviewRow label="ملاحظات" value={form.notes} /> : null}
              </View>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom buttons */}
      <View style={[s.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        {step < 4 ? (
          <TouchableOpacity
            style={[s.nextBtn, !canNext() && s.disabledBtn]}
            onPress={() => canNext() && setStep(step + 1)}
            disabled={!canNext()}
          >
            <Text style={s.nextBtnText}>التالي</Text>
            <Ionicons name="arrow-back" size={18} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[s.submitBtn, submitting && s.disabledBtn]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                <Text style={s.submitBtnText}>إرسال الطلب</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

// ─── Review Row ──────────────────────────────────────────────────────────────

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.reviewRow}>
      <Text style={s.reviewLabel}>{label}</Text>
      <Text style={s.reviewValue}>{value}</Text>
    </View>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f5f7fa' },

  // Progress
  progress: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#fff' },
  stepItem: { alignItems: 'center', gap: 4 },
  stepDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  stepDotActive: { backgroundColor: Colors.primary },
  stepNum: { fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 11, color: Colors.textMuted },
  stepNumActive: { color: '#fff' },
  stepLabel: { fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 10, color: Colors.textMuted },
  stepLabelActive: { fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, color: Colors.primary },

  // Body
  body: { padding: 20, paddingBottom: 120 },
  stepContent: { gap: 14 },
  stepTitle: { fontFamily: 'Almarai_800ExtraBold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 18, color: Colors.text, writingDirection: 'rtl' },

  // Type grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  typeCard: {
    width: '47%' as any,
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    padding: 16,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }, android: { elevation: 2 } }),
  },
  typeIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  typeLabel: { fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 13, color: Colors.text, textAlign: 'center' },
  typeCheck: { position: 'absolute', top: 8, left: 8, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  // Fields
  fieldLabel: { fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 13, color: Colors.text, writingDirection: 'rtl' },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    height: 48,
    paddingHorizontal: 14,
    fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 14,
    color: Colors.text,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  textArea: { height: 100, paddingTop: 12 },

  // Options chips
  optionsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100, backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.border },
  optionChipActive: { backgroundColor: Colors.primary + '12', borderColor: Colors.primary },
  optionText: { fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 12, color: Colors.text2 },
  optionTextActive: { fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, color: Colors.primary },

  // Toggle
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  toggleText: { fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 14, color: Colors.text, writingDirection: 'rtl' },

  // Budget
  budgetRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  budgetDash: { fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 16, color: Colors.textMuted },

  // Review
  reviewCard: { backgroundColor: '#fff', borderRadius: Radius.lg, padding: 16, gap: 12, borderWidth: 1, borderColor: Colors.border },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  reviewLabel: { fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 12, color: Colors.text2, writingDirection: 'rtl' },
  reviewValue: { fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 13, color: Colors.text, writingDirection: 'rtl', flex: 1, textAlign: 'left' },

  // Bottom bar
  bottomBar: { position: 'absolute', bottom: 0, start: 0, end: 0, backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border },
  nextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50, borderRadius: Radius.md, backgroundColor: Colors.primary },
  nextBtnText: { fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 15, color: '#fff' },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50, borderRadius: Radius.md, backgroundColor: '#16a34a' },
  submitBtnText: { fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 15, color: '#fff' },
  disabledBtn: { opacity: 0.5 },
})
