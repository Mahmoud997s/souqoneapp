import { useState } from 'react'
import { Colors } from '../../src/constants/colors'
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
  StatusBar,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '../../src/store/authStore'
import { authApi } from '../../src/api/auth'
import { AppInput } from '../../src/components/ui/AppInput'
import { AppButton } from '../../src/components/ui/AppButton'
import { GovernorateWilayaSelect } from '../../src/components/ui/GovernorateWilayaSelect'
import { resolveRedirect } from '../../src/utils/listing-detail/safeRedirect'
import { validateRegister } from '../../src/utils/authValidation'

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

    const valResult = validateRegister({
      displayName,
      username,
      email,
      phone,
      password,
      confirmPassword,
    })

    if (!valResult.isValid) {
      setErrors(valResult.errors)
      return
    }

    const cleanUsername = username.trim().toLowerCase()
    const cleanPhone = phone.trim().replace(/\D/g, '')

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
      } else if (serverMsg.includes('الهاتف') || serverMsg.toLowerCase().includes('phone')) {
        setErrors((prev) => ({ ...prev, phone: serverMsg }))
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

      {/* Floating Minimal Header */}
      <View style={[s.topRow, { paddingTop: insets.top + Spacing.space2 }]}>
        <TouchableOpacity
          style={s.floatingBackBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-forward" size={18} color={Colors.text} />
        </TouchableOpacity>
        <Text style={s.topHeaderTitle}>إنشاء حساب جديد</Text>
        <View style={{ width: 36 }} />
      </View>

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
            {/* Step and Progress bar */}
            <View style={s.stepRow}>
              <Text style={s.stepBadgeTxt}>البيانات الأساسية للحساب</Text>
              <View style={s.progressBar}>
                <View style={[s.progressSeg, { backgroundColor: Colors.primary }]} />
                <View style={[s.progressSeg, { backgroundColor: Colors.border }]} />
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
              placeholder="أدخل اسمك الكامل الثلاثي"
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
              placeholder="أدخل اسم المستخدم بالإنجليزية (بدون مسافات)"
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
              placeholder="أدخل بريدك الإلكتروني"
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
                  placeholder="أدخل رقم هاتفك (يبدأ بـ 9 أو 7)"
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
                placeholder="أدخل كلمة مرور قوية"
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
              placeholder="أعد إدخال كلمة المرور للتأكيد"
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
  root: { flex: 1, backgroundColor: Colors.surfaceAlt },
  flex: { flex: 1 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.space5,
    paddingBottom: Spacing.space2,
  },
  floatingBackBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  topHeaderTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 16,
    lineHeight: 24,
    color: Colors.text,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  scroll: {
    padding: Spacing.space5,
    paddingTop: Spacing.space2,
    paddingBottom: Spacing.space8,
    gap: 0,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.space5,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.space4,
    ...Shadows.card,
  },
  stepRow: {
    gap: Spacing.space2,
    marginBottom: Spacing.space1,
    paddingBottom: Spacing.space3,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
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
    fontFamily: 'Almarai_700Bold',
    fontSize: 18,
    lineHeight: 26,
    color: Colors.primary,
    writingDirection: 'rtl',
  },
  sectionSubtitle: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 13.5,
    lineHeight: 20,
    color: Colors.text2,
    writingDirection: 'rtl',
  },
  errorTxt: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: Colors.error,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  fieldLabel: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12.5,
    lineHeight: 18,
    color: Colors.text,
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
    backgroundColor: '#FEF2F2',
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
    fontFamily: 'Almarai_700Bold',
    fontSize: 14,
    lineHeight: 20,
    color: Colors.text2,
  },
  phoneInput: {
    height: 52,
    paddingEnd: 80,
    paddingStart: Spacing.space4,
    fontFamily: 'Almarai_400Regular',
    fontSize: 14,
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
})
