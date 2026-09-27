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
import { router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '../../src/store/authStore'
import { authApi } from '../../src/api/auth'
import { GlassNavBar } from '../../src/components/ui/GlassNavBar'
import { AppButton } from '../../src/components/ui/AppButton'
import { Colors } from '../../src/constants/colors'
import { resolveRedirect } from '../../src/utils/listing-detail/safeRedirect'

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
    if (code.length < OTP_LENGTH) {
      setError('يرجى إدخال الكود كاملاً (6 أرقام)')
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
      {/* Top Glass Navigation Bar like Profile Screen */}
      <GlassNavBar
        title="تأكيد البريد الإلكتروني"
        paddingTop={insets.top}
        onBackPress={() => router.back()}
      />

      <ScrollView
        contentContainerStyle={[
          s.scroll,
          { paddingTop: insets.top + 64 },
        ]}
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
          <Ionicons name="create-outline" size={16} color="#64748B" />
          <Text style={s.changeEmailTxt}>تغيير البريد الإلكتروني</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { flexGrow: 1, paddingBottom: 40 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    marginHorizontal: Spacing.space5,
    marginTop: Spacing.space4,
    padding: Spacing.space6,
    ...Shadows.card,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.space1,
  },
  cardTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 20,
    lineHeight: 28,
    color: '#0F172A',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  cardSubtitle: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 13,
    lineHeight: 20,
    color: '#64748B',
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
    color: '#334155',
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
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    textAlign: 'center',
    fontFamily: 'Almarai_700Bold',
    fontSize: 20,
    lineHeight: 28,
    color: Colors.primary,
  },
  otpFilled: { borderColor: Colors.primary, backgroundColor: '#EFF6FF' },
  errorTxt: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 13,
    color: '#DC2626',
    textAlign: 'center',
  },
  notReceivedTxt: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: '#64748B',
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
    backgroundColor: '#F1F5F9',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space1,
  },
  resendTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 15,
    lineHeight: 22,
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
    fontSize: 14,
    lineHeight: 20,
    color: '#64748B',
    writingDirection: 'rtl',
  },
})
