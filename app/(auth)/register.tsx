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
  StatusBar,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '../../src/store/authStore'
import { authApi } from '../../src/api/auth'
import { AppInput } from '../../src/components/ui/AppInput'
import { AppButton } from '../../src/components/ui/AppButton'
import { GlassNavBar } from '../../src/components/ui/GlassNavBar'
import { GovernorateWilayaSelect } from '../../src/components/ui/GovernorateWilayaSelect'
import { resolveRedirect } from '../../src/utils/listing-detail/safeRedirect'

export default function RegisterScreen() {
  const insets = useSafeAreaInsets()
  const { redirect } = useLocalSearchParams<{ redirect?: string }>()
  const { setAuth } = useAuthStore()

  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [governorateId, setGovernorateId] = useState<number | null>(null)
  const [wilayaId, setWilayaId] = useState<number | null>(null)
  const [govLabel, setGovLabel] = useState('')
  const [wilayaLabel, setWilayaLabel] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showCPw, setShowCPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [generalError, setGeneralError] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const hasMinLength = password.length >= 8
  const hasUpper = /[A-Z]/.test(password)
  const hasDigit = /[0-9]/.test(password)
  const isPasswordValid = hasMinLength && hasUpper && hasDigit

  const clearFieldError = (field: string) => {
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
    if (generalError) setGeneralError('')
  }

  const handleRegister = async () => {
    setGeneralError('')
    const newErrors: Record<string, string> = {}

    if (!displayName.trim()) {
      newErrors.displayName = 'يرجى إدخال الاسم الكامل'
    }

    const cleanUsername = username.trim().toLowerCase()
    if (!cleanUsername) {
      newErrors.username = 'يرجى إدخال اسم المستخدم'
    } else if (cleanUsername.length < 3) {
      newErrors.username = 'اسم المستخدم يجب أن يكون ٣ أحرف على الأقل'
    } else if (!/^[a-z0-9_]+$/.test(cleanUsername)) {
      newErrors.username = 'أحرف إنجليزية وأرقام و _ فقط'
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email.trim()) {
      newErrors.email = 'يرجى إدخال البريد الإلكتروني'
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email = 'البريد الإلكتروني غير صالح'
    }

    const cleanPhone = phone.trim().replace(/\D/g, '')
    if (!cleanPhone) {
      newErrors.phone = 'يرجى إدخال رقم الهاتف'
    } else if (!/^(7|9)\d{7}$/.test(cleanPhone)) {
      newErrors.phone = 'رقم عماني غير صحيح (8 أرقام يبدأ بـ 7 أو 9)'
    }

    if (!password) {
      newErrors.password = 'يرجى إدخال كلمة المرور'
    } else if (!isPasswordValid) {
      newErrors.password = 'يرجى استيفاء شروط كلمة المرور أدناه'
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'يرجى تأكيد كلمة المرور'
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'كلمتا المرور غير متطابقتين'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    try {
      const res = await authApi.register({
        displayName: displayName.trim(),
        username: cleanUsername,
        email: email.trim().toLowerCase(),
        phone: `+968${cleanPhone}`,
        governorate: govLabel || undefined,
        city: wilayaLabel || undefined,
        governorateId: governorateId ?? undefined,
        wilayaId: wilayaId ?? undefined,
        country: 'OM',
        password,
      })
      await setAuth(res.data.user, res.data.accessToken, res.data.refreshToken)
      setTimeout(() => {
        if (res.data.requiresVerification) {
          const emailParam = encodeURIComponent(email.trim())
          const redirParam = redirect ? `&redirect=${encodeURIComponent(redirect)}` : ''
          router.replace(`/(auth)/verify-email?email=${emailParam}${redirParam}` as any)
        } else {
          router.replace(resolveRedirect(redirect) as any)
        }
      }, 100)
    } catch (e: any) {
      console.error('[Register Error]', JSON.stringify(e?.response?.data), e?.message)
      let msg = e?.response?.data?.message
      if (Array.isArray(msg)) msg = msg[0]
      const serverMsg = msg || e?.message || 'حدث خطأ، يرجى المحاولة مجدداً'

      if (serverMsg.includes('البريد') || serverMsg.toLowerCase().includes('email')) {
        setErrors((prev) => ({ ...prev, email: serverMsg }))
      } else if (serverMsg.includes('المستخدم') || serverMsg.toLowerCase().includes('username')) {
        setErrors((prev) => ({ ...prev, username: serverMsg }))
      } else if (serverMsg.includes('كلمة المرور') || serverMsg.toLowerCase().includes('password')) {
        setErrors((prev) => ({ ...prev, password: serverMsg }))
      } else {
        setGeneralError(serverMsg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" />
      {/* Top Glass Navigation Bar like Profile Screen */}
      <GlassNavBar
        title="إنشاء حساب"
        paddingTop={insets.top}
        onBackPress={() => router.back()}
      />

      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            s.scroll,
            { paddingTop: insets.top + 64 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={s.card}>
            {/* Step and Progress bar */}
            <View style={s.stepRow}>
              <Text style={s.stepBadgeTxt}>الخطوة الأولى: البيانات الأساسية</Text>
              <View style={s.progressBar}>
                <View style={[s.progressSeg, { backgroundColor: Colors.primary }]} />
                <View style={[s.progressSeg, { backgroundColor: '#E2E8F0' }]} />
              </View>
            </View>

            <Text style={s.sectionTitle}>معلوماتك الأساسية</Text>
            <Text style={s.sectionSubtitle}>يرجى إدخال بياناتك بدقة لإنشاء حسابك وتوثيقه.</Text>

            {generalError ? <Text style={s.errorTxt}>{generalError}</Text> : null}

            {/* الاسم الكامل */}
            <AppInput
              label="الاسم الكامل"
              iconRight="person-outline"
              value={displayName}
              onChangeText={(v) => {
                setDisplayName(v)
                clearFieldError('displayName')
              }}
              placeholder="مثال: محمد العمري"
              returnKeyType="next"
              error={errors.displayName}
            />

            {/* اسم المستخدم */}
            <AppInput
              label="اسم المستخدم"
              iconRight="id-card-outline"
              value={username}
              onChangeText={(v) => {
                setUsername(v)
                clearFieldError('username')
              }}
              placeholder="username (بالإنجليزية)"
              autoCapitalize="none"
              returnKeyType="next"
              error={errors.username}
            />

            {/* البريد الإلكتروني - إجباري */}
            <AppInput
              label="البريد الإلكتروني"
              iconRight="mail-outline"
              value={email}
              onChangeText={(v) => {
                setEmail(v)
                clearFieldError('email')
              }}
              placeholder="name@example.com"
              keyboardType="email-address"
              textContentType="emailAddress"
              autoCapitalize="none"
              returnKeyType="next"
              error={errors.email}
            />

            {/* رقم الهاتف */}
            <View style={s.phoneContainer}>
              <Text style={s.fieldLabel}>رقم الهاتف</Text>
              <View style={[s.phoneWrap, errors.phone ? s.phoneWrapError : null]}>
                <TextInput
                  style={s.phoneInput}
                  value={phone}
                  onChangeText={(v) => {
                    setPhone(v)
                    clearFieldError('phone')
                  }}
                  placeholder="9XXXXXXX أو 7XXXXXXX"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="phone-pad"
                  maxLength={8}
                />
                <View style={s.phonePrefix}>
                  <Text style={s.phonePrefixTxt}>+968</Text>
                </View>
              </View>
              {errors.phone ? <Text style={s.fieldErrorTxt}>{errors.phone}</Text> : null}
            </View>

            {/* المحافظة والولاية */}
            <View style={{ gap: 4 }}>
              <Text style={s.fieldLabel}>الموقع الجغرافي (اختياري)</Text>
              <GovernorateWilayaSelect
                governorateId={governorateId}
                wilayaId={wilayaId}
                onLocationChange={(gId, wId, gName, wName) => {
                  setGovernorateId(gId)
                  setWilayaId(wId)
                  setGovLabel(gName)
                  setWilayaLabel(wName)
                }}
                showCity={true}
              />
            </View>

            {/* كلمة المرور */}
            <View style={{ gap: 4 }}>
              <AppInput
                label="كلمة المرور"
                iconRight="lock-closed-outline"
                iconLeft={showPw ? 'eye' : 'eye-off'}
                onIconLeftPress={() => setShowPw((v) => !v)}
                value={password}
                onChangeText={(v) => {
                  setPassword(v)
                  clearFieldError('password')
                }}
                placeholder="كلمة المرور"
                secureTextEntry={!showPw}
                returnKeyType="next"
                error={errors.password}
              />

              {/* مؤشرات شروط كلمة المرور */}
              <View style={s.pwHints}>
                <View style={s.hintRow}>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={13}
                    color={hasMinLength ? '#16a34a' : '#94A3B8'}
                  />
                  <Text style={[s.hintTxt, hasMinLength && s.hintOk]}>
                    ٨ أحرف على الأقل
                  </Text>
                </View>
                <View style={s.hintRow}>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={13}
                    color={hasUpper && hasDigit ? '#16a34a' : '#94A3B8'}
                  />
                  <Text style={[s.hintTxt, hasUpper && hasDigit && s.hintOk]}>
                    حرف كبير واحد (A-Z) ورقم واحد (0-9) على الأقل
                  </Text>
                </View>
              </View>
            </View>

            {/* تأكيد كلمة المرور */}
            <AppInput
              label="تأكيد كلمة المرور"
              iconRight="lock-open-outline"
              iconLeft={showCPw ? 'eye' : 'eye-off'}
              onIconLeftPress={() => setShowCPw((v) => !v)}
              value={confirmPassword}
              onChangeText={(v) => {
                setConfirmPassword(v)
                clearFieldError('confirmPassword')
              }}
              placeholder="أعد إدخال كلمة المرور"
              secureTextEntry={!showCPw}
              returnKeyType="done"
              onSubmitEditing={handleRegister}
              error={errors.confirmPassword}
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
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  flex: { flex: 1 },
  scroll: { padding: Spacing.space5, paddingBottom: Spacing.space8, gap: 0 },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.space5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: Spacing.space4,
    ...Shadows.card,
  },
  stepRow: {
    gap: Spacing.space2,
    marginBottom: Spacing.space1,
    paddingBottom: Spacing.space3,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  stepBadgeTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12.5,
    lineHeight: 18,
    color: Colors.primary,
    writingDirection: 'rtl',
  },
  progressBar: {
    flexDirection: 'row',
    gap: Spacing.space1,
  },
  progressSeg: { flex: 1, height: 5, borderRadius: 3 },
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
  fieldLabel: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12.5,
    lineHeight: 18,
    color: '#334155',
    writingDirection: 'rtl',
    marginBottom: 2,
  },
  phoneContainer: {
    gap: 4,
    width: '100%',
  },
  phoneWrap: {
    height: 52,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  phoneWrapError: {
    borderColor: Colors.error,
  },
  fieldErrorTxt: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11.5,
    lineHeight: 16,
    color: Colors.error,
    writingDirection: 'rtl',
    marginTop: 2,
  },
  pwHints: {
    gap: Spacing.space1,
    marginTop: 2,
    paddingHorizontal: 2,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hintTxt: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    lineHeight: 16,
    color: '#64748B',
    writingDirection: 'rtl',
  },
  hintOk: {
    color: '#16a34a',
    fontFamily: 'Almarai_700Bold',
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
