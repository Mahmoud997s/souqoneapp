import { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Platform, KeyboardAvoidingView } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors } from '../../src/constants/colors'
import { Radius } from '../../src/constants/radius'
import { transportApi } from '../../src/api/transport'
import { useAuthStore } from '../../src/store/authStore'
import { AppHeader } from '../../src/components/ui/AppHeader'

// ─── Constants ───────────────────────────────────────────────────────────────

const VEHICLE_TYPES = [
  { key: 'PICKUP', label: 'بيك أب', icon: 'car-sport-outline' },
  { key: 'VAN', label: 'فان', icon: 'bus-outline' },
  { key: 'TRUCK_SMALL', label: 'شاحنة صغيرة', icon: 'car-outline' },
  { key: 'TRUCK_LARGE', label: 'شاحنة كبيرة', icon: 'bus-outline' },
  { key: 'TRAILER', label: 'تريلر', icon: 'train-outline' },
  { key: 'EXCAVATOR', label: 'حفّار', icon: 'construct-outline' },
  { key: 'TIPPER', label: 'قلّاب', icon: 'cube-outline' },
  { key: 'CRANE', label: 'رافعة', icon: 'arrow-up-outline' },
  { key: 'OTHER', label: 'أخرى', icon: 'ellipsis-horizontal-outline' },
]

const SERVICE_TYPES = [
  { key: 'GOODS', label: 'بضائع عامة' },
  { key: 'FURNITURE', label: 'أثاث ومنزليات' },
  { key: 'CONSTRUCTION', label: 'مواد البناء' },
  { key: 'HEAVY', label: 'شحن ثقيل' },
  { key: 'BACKLOAD', label: 'عودة فارغة' },
  { key: 'EQUIPMENT', label: 'معدات وآليات' },
]

const GOVERNORATES = [
  'مسقط', 'ظفار', 'مسندم', 'البريمي', 'الداخلية',
  'شمال الباطنة', 'جنوب الباطنة', 'شمال الشرقية', 'جنوب الشرقية', 'الظاهرة', 'الوسطى',
]

// ─── Component ───────────────────────────────────────────────────────────────

export default function CarrierRegisterScreen() {
  const insets = useSafeAreaInsets()
  const { user } = useAuthStore()

  const [companyName, setCompanyName] = useState('')
  const [bio, setBio] = useState('')
  const [vehicleTypes, setVehicleTypes] = useState<string[]>([])
  const [serviceTypes, setServiceTypes] = useState<string[]>([])
  const [governorate, setGovernorate] = useState('')
  const [city, setCity] = useState('')
  const [contactPhone, setContactPhone] = useState(user?.phone ?? '')
  const [whatsapp, setWhatsapp] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const toggleItem = (arr: string[], setArr: (v: string[]) => void, item: string) => {
    setArr(arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item])
  }

  const canSubmit = vehicleTypes.length > 0 && serviceTypes.length > 0 && governorate

  const handleSubmit = async () => {
    if (!user) { router.push('/(auth)/login' as any); return }
    if (!canSubmit) { Alert.alert('بيانات ناقصة', 'اختر نوع المركبة والخدمة والمحافظة على الأقل'); return }
    setSubmitting(true)
    try {
      await transportApi.createCarrierProfile({
        companyName: companyName || undefined,
        bio: bio || undefined,
        vehicleTypes,
        serviceTypes,
        governorate,
        city: city || undefined,
        contactPhone: contactPhone || undefined,
        whatsapp: whatsapp || undefined,
      })
      Alert.alert('تم بنجاح', 'تم تسجيلك كناقل', [
        { text: 'حسناً', onPress: () => router.back() },
      ])
    } catch (e: any) {
      Alert.alert('خطأ', e?.response?.data?.message ?? 'حدث خطأ أثناء التسجيل')
    } finally { setSubmitting(false) }
  }

  return (
    <View style={s.root}>
      {/* Header */}
      <AppHeader title="التسجيل كناقل" showBack />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>

          {/* Company info */}
          <Text style={s.sectionTitle}>معلومات الشركة / الناقل</Text>
          <TextInput style={s.input} placeholder="اسم الشركة (اختياري)" placeholderTextColor={Colors.textMuted} value={companyName} onChangeText={setCompanyName} />
          <TextInput style={[s.input, s.textArea]} placeholder="نبذة عنك (اختياري)" placeholderTextColor={Colors.textMuted} value={bio} onChangeText={setBio} multiline textAlignVertical="top" />

          {/* Vehicle types */}
          <Text style={s.sectionTitle}>أنواع المركبات *</Text>
          <View style={s.chipsWrap}>
            {VEHICLE_TYPES.map(v => (
              <TouchableOpacity
                key={v.key}
                style={[s.chip, vehicleTypes.includes(v.key) && s.chipActive]}
                onPress={() => toggleItem(vehicleTypes, setVehicleTypes, v.key)}
              >
                <Ionicons name={v.icon as any} size={14} color={vehicleTypes.includes(v.key) ? Colors.primary : Colors.text2} />
                <Text style={[s.chipText, vehicleTypes.includes(v.key) && s.chipTextActive]}>{v.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Service types */}
          <Text style={s.sectionTitle}>أنواع الخدمات *</Text>
          <View style={s.chipsWrap}>
            {SERVICE_TYPES.map(st => (
              <TouchableOpacity
                key={st.key}
                style={[s.chip, serviceTypes.includes(st.key) && s.chipActive]}
                onPress={() => toggleItem(serviceTypes, setServiceTypes, st.key)}
              >
                <Text style={[s.chipText, serviceTypes.includes(st.key) && s.chipTextActive]}>{st.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Location */}
          <Text style={s.sectionTitle}>الموقع *</Text>
          <View style={s.chipsWrap}>
            {GOVERNORATES.map(g => (
              <TouchableOpacity
                key={g}
                style={[s.chip, governorate === g && s.chipActive]}
                onPress={() => setGovernorate(g)}
              >
                <Text style={[s.chipText, governorate === g && s.chipTextActive]}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput style={s.input} placeholder="المدينة/الولاية (اختياري)" placeholderTextColor={Colors.textMuted} value={city} onChangeText={setCity} />

          {/* Contact */}
          <Text style={s.sectionTitle}>التواصل</Text>
          <TextInput style={s.input} placeholder="رقم الهاتف" placeholderTextColor={Colors.textMuted} value={contactPhone} onChangeText={setContactPhone} keyboardType="phone-pad" />
          <TextInput style={s.input} placeholder="واتساب (اختياري)" placeholderTextColor={Colors.textMuted} value={whatsapp} onChangeText={setWhatsapp} keyboardType="phone-pad" />

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Submit */}
      <View style={[s.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={[s.submitBtn, (!canSubmit || submitting) && s.disabledBtn]}
          onPress={handleSubmit}
          disabled={!canSubmit || submitting}
        >
          {submitting ? <ActivityIndicator color="#fff" size="small" /> : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={s.submitBtnText}>تسجيل كناقل</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f5f7fa' },
  body: { padding: 20, paddingBottom: 120, gap: 12 },

  sectionTitle: { fontFamily: 'Almarai_800ExtraBold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 14, color: Colors.text, writingDirection: 'rtl', marginTop: 8 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, height: 48, paddingHorizontal: 14, fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 14, color: Colors.text, textAlign: 'right', writingDirection: 'rtl' },
  textArea: { height: 90, paddingTop: 12 },

  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100, backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.primary + '12', borderColor: Colors.primary },
  chipText: { fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 12, color: Colors.text2 },
  chipTextActive: { fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, color: Colors.primary },

  bottomBar: { position: 'absolute', bottom: 0, start: 0, end: 0, backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50, borderRadius: Radius.md, backgroundColor: Colors.primary },
  submitBtnText: { fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 15, color: '#fff' },
  disabledBtn: { opacity: 0.5 },
})
