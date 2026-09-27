import { useState, useRef, useEffect } from 'react'
import { Colors } from '../../src/constants/colors'
import { Gradients } from '../../src/constants/gradients'
import { Spacing } from '../../src/constants/spacing'
import { Shadows } from '../../src/constants/shadows'
import { Radius } from '../../src/constants/radius'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native'
import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuthStore } from '../../src/store/authStore'
import { authApi } from '../../src/api/auth'
import { Ionicons } from '@expo/vector-icons'
import { AppInput } from '../../src/components/ui/AppInput'
import { AppButton } from '../../src/components/ui/AppButton'
import { dialogService } from '../../src/store/dialogStore'
import { resolveRedirect } from '../../src/utils/listing-detail/safeRedirect'
import {
  configureGoogleSignIn,
  GoogleSignin,
  statusCodes,
  isSuccessResponse,
  isErrorWithCode,
} from '../../src/services/googleAuth'

export default function LoginScreen() {
  const insets = useSafeAreaInsets()
  const { redirect } = useLocalSearchParams<{ redirect?: string }>()
  const { setAuth } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [generalError, setGeneralError] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const pwRef = useRef<TextInput>(null)

  useEffect(() => {
    configureGoogleSignIn()
  }, [])

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

  const handleLogin = async () => {
    setGeneralError('')
    const newErrors: Record<string, string> = {}

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email.trim()) {
      newErrors.email = 'يرجى إدخال البريد الإلكتروني'
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email = 'البريد الإلكتروني غير صالح'
    }

    if (!password) {
      newErrors.password = 'يرجى إدخال كلمة المرور'
    } else if (password.length < 6) {
      newErrors.password = 'كلمة المرور يجب أن تكون ٦ أحرف على الأقل'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    try {
      const res = await authApi.login({ email: email.trim().toLowerCase(), password })
      await setAuth(res.data.user, res.data.accessToken, res.data.refreshToken)
      setTimeout(() => {
        if (!res.data.user?.isVerified || res.data.requiresVerification) {
          const emailParam = encodeURIComponent(email.trim())
          const redirParam = redirect ? `&redirect=${encodeURIComponent(redirect)}` : ''
          router.replace(`/(auth)/verify-email?email=${emailParam}${redirParam}` as any)
        } else {
          router.replace(resolveRedirect(redirect) as any)
        }
      }, 100)
    } catch (e: any) {
      console.error('[Login Error]', JSON.stringify(e?.response?.data), e?.message)
      let msg = e?.response?.data?.message
      if (Array.isArray(msg)) msg = msg[0]
      const serverMsg = msg || e?.message || 'بيانات الدخول غير صحيحة'

      if (serverMsg.includes('البريد')) {
        setErrors((prev) => ({ ...prev, email: serverMsg }))
      } else if (serverMsg.includes('كلمة المرور')) {
        setErrors((prev) => ({ ...prev, password: serverMsg }))
      } else {
        setGeneralError(serverMsg)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setGeneralError('')
    setGoogleLoading(true)
    try {
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true })
      }
      const response = await GoogleSignin.signIn()
      if (!isSuccessResponse(response)) {
        return
      }

      const idToken = response.data?.idToken
      if (!idToken) {
        throw new Error('تعذر الحصول على رمز التحقق من Google. يرجى إعادة المحاولة.')
      }

      const res = await authApi.loginGoogle(idToken)
      await setAuth(res.data.user, res.data.accessToken, res.data.refreshToken)

      setTimeout(() => {
        router.replace(resolveRedirect(redirect) as any)
      }, 100)
    } catch (err: any) {
      if (isErrorWithCode(err)) {
        if (err.code === statusCodes.SIGN_IN_CANCELLED) {
          return
        }
        if (err.code === statusCodes.IN_PROGRESS) {
          return
        }
        if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          dialogService.alert('تنبيه', 'خدمات Google Play غير متوفرة على هذا الجهاز.')
          return
        }
      }

      console.error('[Google Login Error]', err?.response?.data || err?.message || err)
      let msg = err?.response?.data?.message || err?.message || 'فشل تسجيل الدخول بواسطة Google'
      if (Array.isArray(msg)) msg = msg[0]
      dialogService.alert('خطأ في تسجيل الدخول', msg)
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" />
      {/* Floating Back / Dismiss Button */}
      <TouchableOpacity
        style={[s.floatingDismissBtn, { top: insets.top + Spacing.space3 }]}
        onPress={() => {
          if (router.canGoBack()) router.back()
          else router.replace('/(tabs)' as any)
        }}
        activeOpacity={0.7}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        accessibilityLabel="رجوع"
        accessibilityRole="button"
      >
        <Ionicons name="close" size={20} color="#334155" />
      </TouchableOpacity>

      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            s.scroll,
            { paddingTop: insets.top + Spacing.space6 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo Brand Header */}
          <View style={s.logoHero}>
            <Image
              source={require('../../assets/icon.png')}
              style={s.logoImg}
              contentFit="contain"
            />
            <Text style={s.brandTitle}>سوق وان</Text>
            <Text style={s.brandSub}>منصتك الأولى للسيارات والخدمات في سلطنة عمان 🇴🇲</Text>
          </View>

          {/* Card */}
          <View style={s.card}>
            <View style={s.cardHeader}>
              <Text style={s.cardTitle}>أهلاً بك مجدداً 👋</Text>
              <Text style={s.cardSub}>سجّل دخولك للمتابعة والوصول لكافة الميزات</Text>
            </View>

            <View style={s.form}>
              {generalError ? <Text style={s.errorTxt}>{generalError}</Text> : null}

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
                onSubmitEditing={() => pwRef.current?.focus()}
                error={errors.email}
              />

              <AppInput
                ref={pwRef}
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
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                error={errors.password}
              />

              <TouchableOpacity
                onPress={() => router.push('/(auth)/forgot-password')}
                activeOpacity={0.7}
                style={s.forgotRow}
              >
                <Text style={s.forgotTxt}>نسيت كلمة المرور؟</Text>
              </TouchableOpacity>

              <View style={s.actions}>
                <AppButton
                  title="تسجيل الدخول"
                  onPress={handleLogin}
                  loading={loading}
                  disabled={googleLoading}
                />

                <View style={s.divider}>
                  <View style={s.dividerLine} />
                  <Text style={s.dividerTxt}>أو</Text>
                  <View style={s.dividerLine} />
                </View>

                <AppButton
                  title="تسجيل بـ Google"
                  variant="outline"
                  icon="logo-google"
                  loading={googleLoading}
                  disabled={loading}
                  onPress={handleGoogleLogin}
                />
              </View>
            </View>

            <View style={s.signupRow}>
              <Text style={s.signupTxt}>
                ليس لديك حساب؟{'  '}
                <Text
                  style={s.signupLink}
                  onPress={() => {
                    const target = redirect
                      ? `/(auth)/register?redirect=${encodeURIComponent(redirect)}`
                      : '/(auth)/register'
                    router.push(target as any)
                  }}
                >
                  إنشاء حساب
                </Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingBottom: 40 },
  floatingDismissBtn: {
    position: 'absolute',
    start: Spacing.space5,
    zIndex: 50,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },

  logoHero: {
    alignItems: 'center',
    gap: Spacing.space1,
    marginTop: Spacing.space2,
    marginBottom: Spacing.space3,
    paddingHorizontal: Spacing.space5,
  },
  logoImg: {
    width: 68,
    height: 68,
    borderRadius: Radius.lg,
    marginBottom: Spacing.space1,
  },
  brandTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 22,
    lineHeight: 28,
    color: '#0F172A',
    textAlign: 'center',
  },
  brandSub: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 280,
    writingDirection: 'rtl',
  },

  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    marginHorizontal: Spacing.space5,
    marginTop: Spacing.space1,
    padding: Spacing.space6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.card,
    gap: Spacing.space5,
  },
  cardHeader: { alignItems: 'center', gap: Spacing.space1 },
  cardTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 20,
    lineHeight: 28,
    color: '#0F172A',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  cardSub: {
    fontFamily: 'Almarai_400Regular',  fontSize: 14,
    lineHeight: 20,
    color: Colors.text2,
    textAlign: 'center',
    writingDirection: 'rtl',
  },

  form: { gap: Spacing.space3 },
  errorTxt: {
    fontFamily: 'Almarai_400Regular',  fontSize: 13,
    color: Colors.error,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  forgotRow: { alignSelf: 'flex-end' },
  forgotTxt: {
    fontFamily: 'Almarai_700Bold',  fontSize: 12,
    lineHeight: 16,
    color: Colors.primary,
    writingDirection: 'rtl',
  },
  actions: { gap: Spacing.space4, marginTop: Spacing.space2 },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space4,
    marginVertical: Spacing.space2,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerTxt: {
    fontFamily: 'Almarai_400Regular',  fontSize: 12,
    lineHeight: 16,
    color: Colors.textMuted,
  },

  signupRow: { alignItems: 'center' },
  signupTxt: {
    fontFamily: 'Almarai_400Regular',  fontSize: 14,
    lineHeight: 20,
    color: Colors.text2,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  signupLink: {
    fontFamily: 'Almarai_700Bold',  fontSize: 18,
    lineHeight: 26,
    color: Colors.primary,
  },
})
