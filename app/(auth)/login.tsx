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
  Alert,
} from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { useAuthStore } from '../../src/store/authStore'
import { authApi } from '../../src/api/auth'
import { AppInput } from '../../src/components/ui/AppInput'
import { AppButton } from '../../src/components/ui/AppButton'

export default function LoginScreen() {
  const { setAuth } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const pwRef = useRef<TextInput>(null)

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('يرجى إدخال البريد الإلكتروني وكلمة المرور')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await authApi.login({ email: email.trim().toLowerCase(), password })
      await setAuth(res.data.user, res.data.accessToken, res.data.refreshToken)
      setTimeout(() => {
        if (res.data.requiresVerification) {
          router.replace(`/(auth)/verify-email?email=${encodeURIComponent(email.trim())}`)
        } else {
          router.replace('/(tabs)')
        }
      }, 100)
    } catch (e: any) {
      console.error('[Login Error]', JSON.stringify(e?.response?.data), e?.message)
      setError(e?.response?.data?.message || e?.message || 'بيانات الدخول غير صحيحة')
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
              {error ? <Text style={s.errorTxt}>{error}</Text> : null}

              <AppInput
                iconRight="mail-outline"
                value={email}
                onChangeText={setEmail}
                placeholder="البريد الإلكتروني"
                keyboardType="email-address"
                textContentType="emailAddress"
                autoCapitalize="none"
                returnKeyType="next"
                onSubmitEditing={() => pwRef.current?.focus()}
              />

              <AppInput
                ref={pwRef}
                iconRight="lock-closed-outline"
                iconLeft={showPw ? 'eye' : 'eye-off'}
                onIconLeftPress={() => setShowPw(v => !v)}
                value={password}
                onChangeText={setPassword}
                placeholder="كلمة المرور"
                secureTextEntry={!showPw}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
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
                  onPress={() => Alert.alert('تنبيه', 'تسجيل الدخول عبر Google غير مفعل حالياً')}
                />
              </View>
            </View>

            <View style={s.signupRow}>
              <Text style={s.signupTxt}>
                ليس لديك حساب؟{'  '}
                <Text
                  style={s.signupLink}
                  onPress={() => router.push('/(auth)/register')}
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
