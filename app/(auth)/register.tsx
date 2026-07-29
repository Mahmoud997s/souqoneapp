import { useState } from 'react'
import { Colors } from '../../src/constants/colors'
import { Gradients } from '../../src/constants/gradients'
import { Spacing } from '../../src/constants/spacing'
import { Shadows } from '../../src/constants/shadows'
import { Radius } from '../../src/constants/radius'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '../../src/store/authStore'
import { authApi } from '../../src/api/auth'
import { AppInput } from '../../src/components/ui/AppInput'
import { AppButton } from '../../src/components/ui/AppButton'
import { BackButton } from '../../src/components/ui/BackButton'
import { LocationPicker } from '../../src/components/ui/LocationPicker'

const GOVERNORATES = [
  { label: 'مسقط', value: 'muscat' },
  { label: 'ظفار', value: 'dhofar' },
  { label: 'مسندم', value: 'musandam' },
  { label: 'البريمي', value: 'buraimi' },
  { label: 'الداخلية', value: 'dakhiliyah' },
  { label: 'شمال الباطنة', value: 'batinah_north' },
  { label: 'جنوب الباطنة', value: 'batinah_south' },
  { label: 'شمال الشرقية', value: 'sharqiyah_north' },
  { label: 'جنوب الشرقية', value: 'sharqiyah_south' },
  { label: 'الظاهرة', value: 'dhahirah' },
  { label: 'الوسطى', value: 'wusta' },
]

export default function RegisterScreen() {
  const insets = useSafeAreaInsets()
  const { setAuth } = useAuthStore()

  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [governorate, setGovernorate] = useState('')
  const [govLabel, setGovLabel] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showCPw, setShowCPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRegister = async () => {
    if (!displayName.trim() || !username.trim() || !phone.trim() || !password) {
      setError('يرجى ملء الحقول المطلوبة')
      return
    }
    if (password !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين')
      return
    }
    if (password.length < 8) {
      setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await authApi.register({
        displayName: displayName.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        phone: `+968${phone.trim()}`,
        governorate: governorate || undefined,
        country: 'OM',
        password,
      })
      await setAuth(res.data.user, res.data.accessToken, res.data.refreshToken)
      setTimeout(() => {
        if (res.data.requiresVerification) {
          router.replace(`/(auth)/verify-email?email=${encodeURIComponent(email.trim())}`)
        } else {
          router.replace('/(tabs)')
        }
      }, 100)
    } catch (e: any) {
      console.error('[Register Error]', JSON.stringify(e?.response?.data), e?.message)
      let msg = e?.response?.data?.message
      if (Array.isArray(msg)) msg = msg[0]
      setError(msg || e?.message || 'حدث خطأ، يرجى المحاولة مجدداً')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={s.root}>
      {/* Header */}
      <LinearGradient
        colors={Gradients.hero as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[s.header, { paddingTop: insets.top }]}
      >
        <View style={s.navRow}>
          <BackButton style={s.backBtn} />
          <Text style={s.headerTitle}>إنشاء حساب</Text>
        </View>
        {/* Progress bar */}
        <View style={s.progressBar}>
          <View style={[s.progressSeg, { backgroundColor: Colors.accent }]} />
          <View style={[s.progressSeg, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={s.card}>
            <Text style={s.sectionTitle}>معلوماتك الأساسية</Text>
            <Text style={s.sectionSubtitle}>يرجى إدخال بياناتك للمتابعة للخطوة التالية.</Text>

            {error ? <Text style={s.errorTxt}>{error}</Text> : null}

            {/* الاسم الكامل */}
            <AppInput
              iconRight="person-outline"
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="الاسم الكامل"
              returnKeyType="next"
            />

            {/* اسم المستخدم */}
            <AppInput
              iconRight="id-card-outline"
              value={username}
              onChangeText={setUsername}
              placeholder="اسم المستخدم"
              autoCapitalize="none"
              returnKeyType="next"
            />

            {/* البريد الإلكتروني - اختياري */}
            <AppInput
              iconRight="mail-outline"
              value={email}
              onChangeText={setEmail}
              placeholder="البريد الإلكتروني (اختياري)"
              keyboardType="email-address"
              textContentType="emailAddress"
              autoCapitalize="none"
              returnKeyType="next"
            />

            {/* رقم الهاتف */}
            <View style={s.phoneWrap}>
              <TextInput
                style={s.phoneInput}
                value={phone}
                onChangeText={setPhone}
                placeholder="رقم الهاتف"
                placeholderTextColor={Colors.textMuted}
                keyboardType="phone-pad"
              />
              <View style={s.phonePrefix}>
                <Text style={s.phonePrefixTxt}>+968</Text>
              </View>
            </View>

            {/* المحافظة */}
            <LocationPicker 
              governorate={governorate}
              onGovernorateChange={(val) => {
                const selected = GOVERNORATES.find(g => g.label === val)
                if(selected) {
                  setGovernorate(selected.value)
                  setGovLabel(selected.label)
                } else {
                  setGovernorate(val)
                  setGovLabel(val)
                }
              }}
              showCity={false}
            />

            {/* كلمة المرور */}
            <AppInput
              iconRight="lock-closed-outline"
              iconLeft={showPw ? 'eye' : 'eye-off'}
              onIconLeftPress={() => setShowPw(v => !v)}
              value={password}
              onChangeText={setPassword}
              placeholder="كلمة المرور"
              secureTextEntry={!showPw}
              returnKeyType="next"
              style={{ marginTop: Spacing.space2 } as any}
            />

            {/* تأكيد كلمة المرور */}
            <AppInput
              iconRight="lock-open-outline"
              iconLeft={showCPw ? 'eye' : 'eye-off'}
              onIconLeftPress={() => setShowCPw(v => !v)}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="تأكيد كلمة المرور"
              secureTextEntry={!showCPw}
              returnKeyType="done"
              onSubmitEditing={handleRegister}
            />
          </View>
        </ScrollView>

        {/* Bottom action */}
        <View style={[s.bottomBar, { paddingBottom: insets.bottom + 20 }]}>
          <AppButton
            title="إنشاء الحساب"
            onPress={handleRegister}
            loading={loading}
          />
        </View>
      </KeyboardAvoidingView>


    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface },
  flex: { flex: 1 },
  header: { paddingHorizontal: Spacing.space5 },
  navRow: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtn: {
    position: 'absolute',
    start: 0,
    top: 0,
    bottom: 0,
    width: Spacing.touch,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Almarai_700Bold',  fontSize: 18,
    lineHeight: 26,
    color: Colors.white,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  progressBar: {
    flexDirection: 'row',
    gap: Spacing.space1,
    paddingBottom: Spacing.space3,
  },
  progressSeg: { flex: 1, height: 6, borderRadius: 3 },
  scroll: { padding: Spacing.space5, paddingBottom: Spacing.space2, gap: 0 },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.space5,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.space3,
    ...Shadows.card,
  },
  sectionTitle: {
    fontFamily: 'Almarai_700Bold',  fontSize: 18,
    lineHeight: 26,
    color: Colors.primary,
    writingDirection: 'rtl',
  },
  sectionSubtitle: {
    fontFamily: 'Almarai_400Regular',  fontSize: 14,
    lineHeight: 20,
    color: Colors.text2,
    writingDirection: 'rtl',
  },
  errorTxt: {
    fontFamily: 'Almarai_400Regular',  fontSize: 13,
    color: Colors.error,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  govInputWrap: {
    height: 52,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  govIconRight: {
    position: 'absolute',
    start: 0,
    top: 0,
    bottom: 0,
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  govIconLeft: {
    position: 'absolute',
    end: 0,
    top: 0,
    bottom: 0,
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectInner: { flex: 1, paddingStart: 48, paddingEnd: 48, justifyContent: 'center' },
  selectTxt: {
    fontFamily: 'Almarai_400Regular',  fontSize: 14,
    lineHeight: 20,
    color: Colors.text,
    writingDirection: 'rtl',
  },
  placeholderTxt: { color: Colors.textMuted },
  phoneWrap: {
    height: 52,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  phonePrefix: {
    position: 'absolute',
    end: 0,
    top: 0,
    bottom: 0,
    paddingHorizontal: Spacing.space4,
    backgroundColor: Colors.surfaceAlt,
    borderStartWidth: 1,
    borderStartColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phonePrefixTxt: {
    fontFamily: 'Almarai_700Bold',  fontSize: 14,
    color: Colors.text2,
  },
  phoneInput: {
    height: 52,
    paddingEnd: 80,
    paddingStart: Spacing.space4,
    fontFamily: 'Almarai_400Regular',  fontSize: 14,
    color: Colors.text,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  bottomBar: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: Spacing.space5,
    paddingTop: Spacing.space4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.space5,
    paddingVertical: Spacing.space4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontFamily: 'Almarai_700Bold',  fontSize: 18,
    lineHeight: 26,
    color: Colors.text,
    writingDirection: 'rtl',
  },
  govItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.space5,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surface,
  },
  govItemActive: { backgroundColor: Colors.surface },
  govItemTxt: {
    fontFamily: 'Almarai_400Regular',  fontSize: 16,
    lineHeight: 24,
    color: Colors.text,
    writingDirection: 'rtl',
  },
  govItemTxtActive: { fontFamily: 'Almarai_700Bold',  color: Colors.primary },
})
