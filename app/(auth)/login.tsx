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
  ActivityIndicator,
} from 'react-native'
import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuthStore } from '../../src/store/authStore'
import { authApi } from '../../src/api/auth'
import { Ionicons } from '@expo/vector-icons'
import { AppInput } from '../../src/components/ui/AppInput'
import { AppButton } from '../../src/components/ui/AppButton'
import { GoogleIcon } from '../../src/components/ui/GoogleIcon'
import { BlurView } from 'expo-blur'
import { validateLogin } from '../../src/utils/authValidation'
import { dialogService } from '../../src/store/dialogStore'
import { resolveRedirect } from '../../src/utils/listing-detail/safeRedirect'
import {
  configureGoogleSignIn,
  GoogleSignin,
  statusCodes,
  isSuccessResponse,
  isErrorWithCode,
  isGoogleSignInAvailable,
} from '../../src/services/googleAuth'

export default function LoginScreen() {
  const insets = useSafeAreaInsets()
  const { redirect } = useLocalSearchParams<{ redirect?: string }>()
  const { setAuth, setGuest } = useAuthStore()
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
    const result = validateLogin({ email, password })

    if (!result.isValid) {
      setErrors(result.errors)
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
    if (!isGoogleSignInAvailable() || !GoogleSignin) {
      dialogService.alert(
        'تنبيه',
        'تسجيل الدخول عبر Google الأصلي يتطلب Development Build ولا يعمل داخل تطبيق Expo Go.\n\nيرجى تشغيل التطبيق بنسخة Development Build (npx expo run:ios أو npx expo run:android).'
      )
      return
    }

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
            {/* Unified Brand Lockup */}
            <View style={s.brandLockup} accessible={true} accessibilityRole="header" accessibilityLabel="سوق ون">
              <Image
                source={require('../../assets/logo.png')}
                style={s.logoImg}
                contentFit="contain"
              />
              <Text style={s.brandTitle}>
                <Text style={s.brandTitleTurquoise}>سوق </Text>
                <Text style={s.brandTitleOrange}>ون</Text>
              </Text>
            </View>
            <Text style={s.brandSub}>منصتك الأولى للسيارات والخدمات في سلطنة عمان 🇴🇲</Text>
          </View>

          {/* Glassmorphism Card */}
          <BlurView
            intensity={Platform.OS === 'ios' ? 70 : 85}
            tint="light"
            blurMethod="dimezisBlurView"
            style={s.card}
          >
            <View style={s.glassWash} pointerEvents="none" />
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
                placeholder="أدخل بريدك الإلكتروني"
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
                placeholder="أدخل كلمة المرور"
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

                {/* Google Sign In Button */}
                <TouchableOpacity
                  style={s.googleBtn}
                  onPress={handleGoogleLogin}
                  disabled={loading || googleLoading}
                  activeOpacity={0.8}
                >
                  {googleLoading ? (
                    <ActivityIndicator size="small" color="#3C4043" />
                  ) : (
                    <>
                      <GoogleIcon size={18} />
                      <Text style={s.googleBtnTxt}>متابعة باستخدام Google</Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* Continue as Guest Button */}
                <TouchableOpacity
                  style={s.guestBtn}
                  onPress={() => {
                    setGuest(true)
                    router.replace('/(tabs)')
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="compass-outline" size={17} color={Colors.primary} />
                  <Text style={s.guestBtnTxt}>المتابعة كزائر واستكشاف التطبيق</Text>
                </TouchableOpacity>
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
          </BlurView>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surfaceAlt },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingBottom: 40 },

  logoHero: {
    alignItems: 'center',
    gap: 3,
    marginTop: Spacing.space2,
    marginBottom: Spacing.space2,
    paddingHorizontal: Spacing.space5,
  },
  brandLockup: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
  },
  logoImg: {
    width: 150,
    height: 150,
    backgroundColor: 'transparent',
    marginBottom: 0,
  },
  brandTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 25,
    lineHeight: 32,
    textAlign: 'center',
    writingDirection: 'rtl',
    marginTop: -25,
    marginBottom: 3.5,
  },
  brandTitleTurquoise: {
    color: Colors.primary,
  },
  brandTitleOrange: {
    color: '#F18B29',
  },
  brandSub: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 12.5,
    lineHeight: 18,
    color: Colors.textMuted,
    textAlign: 'center',
    maxWidth: 260,
    writingDirection: 'rtl',
  },

  card: {
    overflow: 'hidden',
    backgroundColor: Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.72)' : 'rgba(255, 255, 255, 0.88)',
    borderRadius: Radius.lg,
    marginHorizontal: Spacing.space4,
    marginTop: 4,
    padding: Spacing.space4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    ...Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.05,
        shadowRadius: 16,
      },
      android: { elevation: 2 },
    }),
    gap: 12,
  },
  glassWash: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },

  form: { gap: 10 },
  errorTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: 17,
    color: Colors.error,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  forgotRow: { alignSelf: 'flex-end', marginTop: 1 },
  forgotTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.primary,
    writingDirection: 'rtl',
  },
  actions: { gap: 8, marginTop: 2 },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space2,
    marginVertical: 1,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerTxt: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    lineHeight: 15,
    color: Colors.textMuted,
  },

  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DADCE0',
    gap: 8,
    ...Shadows.sm,
  },
  googleBtnTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    lineHeight: 18,
    color: '#3C4043',
  },

  guestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.border,
    gap: 6,
    marginTop: 1,
  },
  guestBtnTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.text,
  },

  signupRow: { alignItems: 'center', marginTop: 2 },
  signupTxt: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 13,
    lineHeight: 19,
    color: Colors.textMuted,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  signupLink: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    lineHeight: 19,
    color: Colors.primary,
  },
})
