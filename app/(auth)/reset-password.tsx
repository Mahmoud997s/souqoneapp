import { useState } from 'react'
import { Spacing } from '../../src/constants/spacing'
import { Shadows } from '../../src/constants/shadows'
import { Radius } from '../../src/constants/radius'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { authApi } from '../../src/api/auth'
import { AppHeader } from '../../src/components/ui/AppHeader'
import { AppInput } from '../../src/components/ui/AppInput'
import { AppButton } from '../../src/components/ui/AppButton'
import { Gradients } from '../../src/constants/gradients'
import { Colors } from '../../src/constants/colors'

export default function ResetPasswordScreen() {
  const insets = useSafeAreaInsets()
  const { token } = useLocalSearchParams<{ token?: string }>()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showCPw, setShowCPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const hasMinLength = password.length >= 8
  const hasUpperAndDigit = /[A-Z]/.test(password) && /[0-9]/.test(password)

  const handleReset = async () => {
    if (!password || !confirm) {
      setError('يرجى ملء جميع الحقول')
      return
    }
    if (password !== confirm) {
      setError('كلمتا المرور غير متطابقتين')
      return
    }
    if (!hasMinLength) {
      setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل')
      return
    }
    setError('')
    setLoading(true)
    try {
      await authApi.resetPassword(token || '', password)
      setSuccess(true)
    } catch (e: any) {
      setError(e?.response?.data?.message || 'حدث خطأ، يرجى المحاولة مجدداً')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <View style={[s.successRoot, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={Gradients.hero as any}
          locations={[0, 0.6, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={s.successGrad}
        >
          <View style={s.successIcon}>
            <Ionicons name="checkmark-circle" size={80} color="#ffffff" />
          </View>
          <Text style={s.successTitle}>تم التحديث!</Text>
          <Text style={s.successDesc}>
            تم تغيير كلمة المرور بنجاح.{'\n'}يمكنك الآن تسجيل الدخول.
          </Text>
          <TouchableOpacity
            style={s.successBtn}
            onPress={() => router.replace('/(auth)/login')}
            activeOpacity={0.9}
          >
            <Text style={s.successBtnTxt}>تسجيل الدخول</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    )
  }

  return (
    <View style={s.root}>
      <AppHeader title="تغيير كلمة المرور" showBack />

      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Page title */}
          <View style={s.pageTitleWrap}>
            <Text style={s.pageTitle}>تعيين كلمة مرور جديدة</Text>
            <Text style={s.pageSubtitle}>
              أدخل كلمة المرور الجديدة أدناه لتأمين حسابك في سوق وان.
            </Text>
          </View>

          {/* Form card */}
          <View style={s.card}>
            {/* New password */}
            <View style={s.fieldGroup}>
              <AppInput
                label="كلمة المرور الجديدة"
                iconRight="lock-closed-outline"
                iconLeft={showPw ? 'eye' : 'eye-off'}
                onIconLeftPress={() => setShowPw(v => !v)}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry={!showPw}
                returnKeyType="next"
              />

              {/* Validation hints */}
              <View style={s.hints}>
                <View style={s.hintRow}>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={14}
                    color={hasMinLength ? '#16a34a' : '#c3c6d6'}
                  />
                  <Text style={[s.hintTxt, hasMinLength && s.hintOk]}>
                    ٨ أحرف على الأقل
                  </Text>
                </View>
                <View style={s.hintRow}>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={14}
                    color={hasUpperAndDigit ? '#16a34a' : '#c3c6d6'}
                  />
                  <Text style={[s.hintTxt, hasUpperAndDigit && s.hintOk]}>
                    حرف واحد كبير ورقم واحد على الأقل
                  </Text>
                </View>
              </View>
            </View>

            <View style={s.divider} />

            {/* Confirm password */}
            <AppInput
              label="تأكيد كلمة المرور الجديدة"
              iconRight="lock-open-outline"
              iconLeft={showCPw ? 'eye' : 'eye-off'}
              onIconLeftPress={() => setShowCPw(v => !v)}
              value={confirm}
              onChangeText={setConfirm}
              placeholder="••••••••"
              secureTextEntry={!showCPw}
              returnKeyType="done"
              onSubmitEditing={handleReset}
            />

            {error ? <Text style={s.errorTxt}>{error}</Text> : null}
          </View>
        </ScrollView>

        {/* Fixed bottom bar */}
        <View
          style={[
            s.bottomBar,
            { paddingBottom: insets.bottom + 20 },
          ]}
        >
          <AppButton
            title="تحديث كلمة المرور"
            onPress={handleReset}
            loading={loading}
            icon="checkmark-circle-outline"
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0B2447' },
  flex: { flex: 1, backgroundColor: '#f7f9fc' },
  scroll: { padding: Spacing.space5, gap: Spacing.space4, paddingBottom: Spacing.space6 },
  pageTitleWrap: { gap: Spacing.space2 },
  pageTitle: {
    fontFamily: 'Almarai_800ExtraBold',  fontSize: 28,
    lineHeight: 36,
    color: '#111827',
    writingDirection: 'rtl',
  },
  pageSubtitle: {
    fontFamily: 'Almarai_400Regular',  fontSize: 14,
    lineHeight: 20,
    color: '#4B5563',
    writingDirection: 'rtl',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: Radius.lg,
    padding: Spacing.space5,
    gap: Spacing.space4,
    ...Shadows.card,
  },
  fieldGroup: { gap: Spacing.space2 },
  hints: { gap: Spacing.space1, marginTop: Spacing.space1 },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  hintTxt: {
    fontFamily: 'Almarai_400Regular',  fontSize: 12,
    lineHeight: 16,
    color: '#4B5563',
    writingDirection: 'rtl',
  },
  hintOk: { color: '#16a34a' },
  divider: { height: 1, backgroundColor: '#E2E6EC' },
  errorTxt: {
    fontFamily: 'Almarai_400Regular',  fontSize: 13,
    color: '#dc2626',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  bottomBar: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: 'rgba(226,230,236,0.5)',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingHorizontal: Spacing.space5,
    paddingTop: Spacing.space4,
    ...Shadows.card,
  },
  successRoot: { flex: 1 },
  successGrad: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.space8,
    gap: Spacing.space4,
  },
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.space2,
  },
  successTitle: {
    fontFamily: 'Almarai_800ExtraBold',  fontSize: 28,
    lineHeight: 36,
    color: '#ffffff',
    writingDirection: 'rtl',
  },
  successDesc: {
    fontFamily: 'Almarai_400Regular',  fontSize: 16,
    lineHeight: 24,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  successBtn: {
    marginTop: Spacing.space4,
    backgroundColor: '#ffffff',
    borderRadius: Radius.md,
    height: 52,
    paddingHorizontal: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successBtnTxt: {
    fontFamily: 'Almarai_700Bold',  fontSize: 18,
    lineHeight: 26,
    color: Colors.primary,
    writingDirection: 'rtl',
  },
})
