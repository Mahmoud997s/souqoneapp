import { useState, useRef, useEffect } from 'react'
import { Spacing } from '../../src/constants/spacing'
import { Shadows } from '../../src/constants/shadows'
import { Radius } from '../../src/constants/radius'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '../../src/store/authStore'
import { authApi } from '../../src/api/auth'
import { AppHeader } from '../../src/components/ui/AppHeader'
import { AppButton } from '../../src/components/ui/AppButton'
import { Gradients } from '../../src/constants/gradients'
import { Colors } from '../../src/constants/colors'

const OTP_LENGTH = 6

export default function VerifyEmailScreen() {
  const insets = useSafeAreaInsets()
  const { email } = useLocalSearchParams<{ email?: string }>()
  const { setAuth } = useAuthStore()

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendLoading, setResendLoading] = useState(false)
  const [timer, setTimer] = useState(45)
  const [canResend, setCanResend] = useState(false)

  const inputRefs = useRef<(TextInput | null)[]>(Array(OTP_LENGTH).fill(null))

  useEffect(() => {
    if (timer <= 0) { setCanResend(true); return }
    const t = setTimeout(() => setTimer(v => v - 1), 1000)
    return () => clearTimeout(t)
  }, [timer])

  const handleChange = (val: string, idx: number) => {
    const digit = val.replace(/[^0-9]/g, '').slice(-1)
    const next = [...otp]
    next[idx] = digit
    setOtp(next)
    if (digit && idx < OTP_LENGTH - 1) {
      inputRefs.current[idx + 1]?.focus()
    }
  }

  const handleKeyPress = (key: string, idx: number) => {
    if (key === 'Backspace' && !otp[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus()
    }
  }

  const handleVerify = async () => {
    const code = otp.join('')
    if (code.length < OTP_LENGTH) {
      setError('يرجى إدخال الكود كاملاً')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await authApi.verifyEmail(code)
      await setAuth(res.data.user, res.data.accessToken, res.data.refreshToken)
      router.replace('/(tabs)')
    } catch (e: any) {
      setError(e?.response?.data?.message || 'الكود غير صحيح أو منتهي الصلاحية')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!canResend) return
    setResendLoading(true)
    try {
      await authApi.resendVerification()
      setCanResend(false)
      setTimer(45)
    } catch {
      // silent
    } finally {
      setResendLoading(false)
    }
  }

  const timerStr = `${String(Math.floor(timer / 60)).padStart(2, '0')}:${String(timer % 60).padStart(2, '0')}`

  return (
    <View style={s.root}>
      <AppHeader title="SouqOne" showBack />

      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <LinearGradient
          colors={Gradients.hero as any}
          locations={[0, 0.6, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={s.hero}
        >
          <View style={s.heroIcon}>
            <Ionicons name="mail-open-outline" size={40} color="#ffffff" />
          </View>
          <Text style={s.heroTitle}>تحقق من بريدك</Text>
          <Text style={s.heroDesc}>
            أرسلنا كود تحقق يتكون من 6 أرقام إلى
          </Text>
          <Text style={s.heroEmail}>{email || 'بريدك الإلكتروني'}</Text>
        </LinearGradient>

        {/* Form card */}
        <View style={s.card}>
          <Text style={s.label}>أدخل الكود المكون من 6 أرقام</Text>

          {/* OTP inputs — LTR direction */}
          <View style={s.otpRow}>
            {otp.map((digit, i) => (
              <TextInput
                key={i}
                ref={(r) => { inputRefs.current[i] = r }}
                style={[s.otpInput, digit ? s.otpFilled : null]}
                value={digit}
                onChangeText={(v) => handleChange(v, i)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </View>

          {error ? <Text style={s.errorTxt}>{error}</Text> : null}

          {/* Verify button */}
          <AppButton
            title="تأكيد الكود"
            onPress={handleVerify}
            loading={loading}
            icon="checkmark-circle-outline"
            style={{ width: '100%' } as any}
          />

          {/* Resend */}
          <Text style={s.notReceivedTxt}>لم تستلم الكود؟</Text>

          <View style={s.resendBox}>
            {!canResend && (
              <View style={s.timerBadge}>
                <Ionicons name="time-outline" size={14} color="#d97706" />
                <Text style={s.timerTxt}>{timerStr}</Text>
              </View>
            )}

            <TouchableOpacity
              onPress={handleResend}
              activeOpacity={canResend ? 0.7 : 1}
              disabled={!canResend || resendLoading}
              style={s.resendBtn}
            >
              {resendLoading ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <>
                  <Ionicons name="refresh-outline" size={18} color={canResend ? Colors.primary : '#c3c6d6'} />
                  <Text style={[s.resendTxt, !canResend && s.resendDisabled]}>
                    إعادة الإرسال
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Change email — outside card, at bottom */}
        <TouchableOpacity
          style={s.changeEmailBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="create-outline" size={16} color="#4B5563" />
          <Text style={s.changeEmailTxt}>تغيير البريد الإلكتروني</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0B2447' },
  scroll: { flexGrow: 1, paddingBottom: 40, backgroundColor: '#f7f9fc' },
  hero: {
    paddingTop: 48,
    paddingBottom: 96,
    paddingHorizontal: Spacing.space5,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    alignItems: 'center',
    gap: Spacing.space2,
    overflow: 'hidden',
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.space4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  heroTitle: {
    fontFamily: 'Almarai_800ExtraBold',  fontSize: 28,
    lineHeight: 36,
    color: '#ffffff',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  heroDesc: {
    fontFamily: 'Almarai_400Regular',  fontSize: 14,
    lineHeight: 20,
    color: '#b4c5ff',
    textAlign: 'center',
    maxWidth: 280,
    writingDirection: 'rtl',
  },
  heroEmail: {
    fontFamily: 'Almarai_700Bold',  fontSize: 14,
    lineHeight: 20,
    color: '#ffffff',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    marginHorizontal: Spacing.space5,
    marginTop: -48,
    padding: Spacing.space6,
    ...Shadows.card,
    borderWidth: 1,
    borderColor: '#E2E6EC',
    alignItems: 'center',
    gap: Spacing.space4,
  },
  label: {
    fontFamily: 'Almarai_700Bold',  fontSize: 12,
    lineHeight: 16,
    color: '#434654',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  otpRow: {
    flexDirection: 'row-reverse',
    gap: Spacing.space2,
    justifyContent: 'center',
  },
  otpInput: {
    width: 42,
    height: 52,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#c3c6d6',
    backgroundColor: '#f7f9fc',
    textAlign: 'center',
    fontFamily: 'Almarai_700Bold',  fontSize: 20,
    lineHeight: 28,
    color: Colors.primary,
  },
  otpFilled: { borderColor: Colors.primary },
  errorTxt: {
    fontFamily: 'Almarai_400Regular',  fontSize: 13,
    color: '#dc2626',
    textAlign: 'center',
  },
  notReceivedTxt: {
    fontFamily: 'Almarai_400Regular',  fontSize: 14,
    lineHeight: 20,
    color: '#4B5563',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  resendBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: Spacing.space4,
    paddingVertical: Spacing.space3,
    backgroundColor: '#f2f4f7',
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#E2E6EC',
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space1,
  },
  resendTxt: {
    fontFamily: 'Almarai_700Bold',  fontSize: 18,
    lineHeight: 26,
    color: Colors.primary,
    writingDirection: 'rtl',
  },
  resendDisabled: { color: '#c3c6d6' },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space1,
    backgroundColor: 'rgba(217,119,6,0.1)',
    paddingHorizontal: Spacing.space2,
    paddingVertical: Spacing.space1,
    borderRadius: 6,
  },
  timerTxt: {
    fontFamily: 'Almarai_700Bold',  fontSize: 12,
    lineHeight: 16,
    color: '#d97706',
  },
  changeEmailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.space1,
    marginTop: 'auto',
    paddingTop: Spacing.space8,
    paddingBottom: Spacing.space4,
  },
  changeEmailTxt: {
    fontFamily: 'Almarai_400Regular',  fontSize: 14,
    lineHeight: 20,
    color: '#4B5563',
    writingDirection: 'rtl',
  },
})
