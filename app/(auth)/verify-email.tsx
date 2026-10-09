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
  StatusBar,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '../../src/store/authStore'
import { authApi } from '../../src/api/auth'
import { AppButton } from '../../src/components/ui/AppButton'
import { Colors } from '../../src/constants/colors'
import { resolveRedirect } from '../../src/utils/listing-detail/safeRedirect'
import { validateOtp } from '../../src/utils/authValidation'

const OTP_LENGTH = 6

export default function VerifyEmailScreen() {
  const insets = useSafeAreaInsets()
  const { email, redirect } = useLocalSearchParams<{ email?: string; redirect?: string }>()
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
    if (error) setError('')
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
    const valResult = validateOtp(code)
    if (!valResult.isValid) {
      setError(valResult.errors.code || valResult.errors.otp || 'يرجى إدخال الكود كاملاً (6 أرقام)')
      return
    }

    setError('')
    setLoading(true)
    try {
      await authApi.verifyEmail(code)
      useAuthStore.getState().updateUser({ isVerified: true })
      router.replace(resolveRedirect(redirect) as any)
    } catch (e: any) {
      let msg = e?.response?.data?.message
      if (Array.isArray(msg)) msg = msg[0]
      setError(msg || e?.message || 'رمز التحقق غير صحيح أو منتهي الصلاحية')
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
      setError('')
    } catch (e: any) {
      let msg = e?.response?.data?.message
      if (Array.isArray(msg)) msg = msg[0]
      setError(msg || 'تعذر إرسال رمز جديد، حاول لاحقاً')
    } finally {
      setResendLoading(false)
    }
  }

  const timerStr = `${String(Math.floor(timer / 60)).padStart(2, '0')}:${String(timer % 60).padStart(2, '0')}`

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
        <Text style={s.topHeaderTitle}>تأكيد البريد الإلكتروني</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Card */}
        <View style={s.card}>
          <View style={s.cardHero}>
            <View style={s.iconWrap}>
              <Ionicons name="mail-open-outline" size={32} color={Colors.primary} />
            </View>
            <Text style={s.cardTitle}>تحقق من بريدك الإلكتروني</Text>
            <Text style={s.cardSubtitle}>
              أرسلنا رمز تحقق مكون من 6 أرقام إلى{'\n'}
              <Text style={s.emailHighlight}>{email || 'بريدك الإلكتروني'}</Text>
            </Text>
          </View>

          <Text style={s.label}>أدخل الرمز المكون من 6 أرقام</Text>

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
            title="تأكيد الرمز"
            onPress={handleVerify}
            loading={loading}
            icon="checkmark-circle-outline"
            style={{ width: '100%' } as any}
          />

          {/* Resend */}
          <Text style={s.notReceivedTxt}>لم تستلم الرمز؟</Text>

          <View style={s.resendBox}>
            {!canResend && (
              <View style={s.timerBadge}>
                <Ionicons name="time-outline" size={14} color="#D97706" />
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
                  <Ionicons name="refresh-outline" size={18} color={canResend ? Colors.primary : '#94A3B8'} />
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
          <Ionicons name="create-outline" size={16} color={Colors.text2} />
          <Text style={s.changeEmailTxt}>تغيير البريد الإلكتروني</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surfaceAlt },
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
    flexGrow: 1,
    paddingHorizontal: Spacing.space5,
    paddingTop: Spacing.space2,
    paddingBottom: Spacing.space8,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.space6,
    ...Shadows.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    gap: Spacing.space4,
  },
  cardHero: {
    alignItems: 'center',
    gap: Spacing.space2,
    marginBottom: Spacing.space1,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.paleMint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.space1,
  },
  cardTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 20,
    lineHeight: 28,
    color: Colors.text,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  cardSubtitle: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 13,
    lineHeight: 20,
    color: Colors.text2,
    textAlign: 'center',
    maxWidth: 290,
    writingDirection: 'rtl',
  },
  emailHighlight: {
    fontFamily: 'Almarai_700Bold',
    color: Colors.primary,
  },
  label: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    lineHeight: 18,
    color: Colors.text,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  otpRow: {
    flexDirection: 'row-reverse',
    gap: Spacing.space2,
    justifyContent: 'center',
  },
  otpInput: {
    width: 44,
    height: 52,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    textAlign: 'center',
    fontFamily: 'Almarai_700Bold',
    fontSize: 20,
    lineHeight: 28,
    color: Colors.primary,
  },
  otpFilled: {
    borderColor: Colors.primary,
    backgroundColor: Colors.paleMint,
  },
  errorTxt: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: Colors.error,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  notReceivedTxt: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: Colors.text2,
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
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space1,
  },
  resendTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 14,
    lineHeight: 20,
    color: Colors.primary,
    writingDirection: 'rtl',
  },
  resendDisabled: { color: '#94A3B8' },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space1,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: Spacing.space2,
    paddingVertical: Spacing.space1,
    borderRadius: 6,
  },
  timerTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: 16,
    color: '#D97706',
  },
  changeEmailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.space1,
    marginTop: Spacing.space6,
    paddingVertical: Spacing.space3,
  },
  changeEmailTxt: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 13.5,
    lineHeight: 20,
    color: Colors.text2,
    writingDirection: 'rtl',
  },
})
