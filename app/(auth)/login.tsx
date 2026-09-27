import { useState, useRef } from 'react'
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
} from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { router, useLocalSearchParams } from 'expo-router'
import { useAuthStore } from '../../src/store/authStore'
import { authApi } from '../../src/api/auth'
import { AppInput } from '../../src/components/ui/AppInput'
import { AppButton } from '../../src/components/ui/AppButton'
import { dialogService } from '../../src/store/dialogStore'
import { resolveRedirect } from '../../src/utils/listing-detail/safeRedirect'

export default function LoginScreen() {
  const { redirect } = useLocalSearchParams<{ redirect?: string }>()
  const { setAuth } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [generalError, setGeneralError] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const pwRef = useRef<TextInput>(null)

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

  return (
    <View style={s.root}>
      <KeyboardAvoidingView
        style={s.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero */}
          <LinearGradient colors={Gradients.hero as any} style={s.hero}>
            <Image
              source={require('../../assets/icon.png')}
              style={s.logoImg}
              contentFit="contain"
            />
          </LinearGradient>

          {/* Card */}
          <View style={s.card}>
            <View style={s.cardHeader}>
              <Text style={s.cardTitle}>أهلاً بك 👋</Text>
              <Text style={s.cardSub}>سجّل دخولك للمتابعة</Text>
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
                  onPress={() => dialogService.alert('تنبيه', 'تسجيل الدخول عبر Google غير مفعل حالياً')}
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
  root: { flex: 1, backgroundColor: Colors.primary },
  scroll: { flexGrow: 1, paddingBottom: 40 },

  // Stitch: header bg-gradient-to-b from-[#0B2447] to-[#004ac6] pt-16 pb-32
  hero: {
    paddingTop: 64,
    paddingBottom: 128,
    paddingHorizontal: Spacing.space5,
    alignItems: 'center',
    gap: Spacing.space4,
  },
  logoImg: {
    width: 180,
    height: 120,
    marginTop: 30,
    marginBottom: Spacing.space1,
  },
  tagline: {
    fontFamily: 'Almarai_400Regular',  fontSize: 16,
    lineHeight: 24,
    color: 'rgba(255,255,255,0.8)',
  },

  // Stitch: rounded-[28px] shadow-[0_8px_30px_rgb(11,36,71,0.12)] p-6
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    marginHorizontal: Spacing.space5,
    marginTop: -96,
    padding: Spacing.space6,
    ...Shadows.card,
    gap: Spacing.space6,
  },
  cardHeader: { alignItems: 'center', gap: Spacing.space2 },
  cardTitle: {
    fontFamily: 'Almarai_700Bold',  fontSize: 24,
    lineHeight: 32,
    color: Colors.text,
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
