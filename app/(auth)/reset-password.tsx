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
  StatusBar,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { authApi } from '../../src/api/auth'
import { AppInput } from '../../src/components/ui/AppInput'
import { AppButton } from '../../src/components/ui/AppButton'
import { Colors } from '../../src/constants/colors'
import { validateResetPassword } from '../../src/utils/authValidation'

export default function ResetPasswordScreen() {
  const insets = useSafeAreaInsets()
  const { email: paramEmail } = useLocalSearchParams<{ email?: string }>()

  const [email, setEmail] = useState(paramEmail ? decodeURIComponent(paramEmail) : '')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showCPw, setShowCPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [generalError, setGeneralError] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState(false)

  const hasMinLength = password.length >= 8
  const hasUpper = /[A-Z]/.test(password)
  const hasDigit = /[0-9]/.test(password)
  const hasUpperAndDigit = hasUpper && hasDigit

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

  const handleReset = async () => {
    setGeneralError('')

    const valResult = validateResetPassword({
      email,
      code,
      password,
      confirmPassword: confirm,
    })

    if (!valResult.isValid) {
      setErrors(valResult.errors)
      return
    }

    const cleanEmail = email.trim().toLowerCase()
    const cleanCode = code.trim()

    setLoading(true)
    try {
      await authApi.resetPassword({
        email: cleanEmail,
        code: cleanCode,
        newPassword: password,
      })
      setSuccess(true)
    } catch (e: any) {
      let msg = e?.response?.data?.message
      if (Array.isArray(msg)) msg = msg[0]
      const serverMsg = msg || e?.message || 'حدث خطأ، يرجى المحاولة مجدداً'

      if (serverMsg.includes('رمز') || serverMsg.toLowerCase().includes('code')) {
        setErrors((prev) => ({ ...prev, code: serverMsg }))
      } else if (serverMsg.includes('البريد') || serverMsg.toLowerCase().includes('email')) {
        setErrors((prev) => ({ ...prev, email: serverMsg }))
      } else if (serverMsg.includes('كلمة المرور') || serverMsg.toLowerCase().includes('password')) {
        setErrors((prev) => ({ ...prev, password: serverMsg }))
      } else {
        setGeneralError(serverMsg)
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <View style={s.root}>
        <StatusBar barStyle="dark-content" />

        {/* Floating Minimal Header */}
        <View style={[s.topRow, { paddingTop: insets.top + Spacing.space2 }]}>
          <TouchableOpacity
            style={s.floatingBackBtn}
            onPress={() => router.replace('/(auth)/login')}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-forward" size={18} color={Colors.text} />
          </TouchableOpacity>
          <Text style={s.topHeaderTitle}>تم التحديث بنجاح</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={s.card}>
            <View style={s.cardHero}>
              <View style={[s.iconWrap, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="checkmark-circle-outline" size={40} color="#059669" />
              </View>
              <Text style={s.cardTitle}>تم تغيير كلمة المرور بنجاح!</Text>
              <Text style={s.cardSubtitle}>
                يمكنك الآن تسجيل الدخول مباشرة باستخدام كلمة المرور الجديدة الخاصة بك.
              </Text>
            </View>

            <View style={{ marginTop: Spacing.space3 }}>
              <AppButton
                title="تسجيل الدخول الآن"
                onPress={() => router.replace('/(auth)/login')}
                icon="log-in-outline"
              />
            </View>
          </View>
        </ScrollView>
      </View>
    )
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
        <Text style={s.topHeaderTitle}>تغيير كلمة المرور</Text>
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
          {/* Page title */}
          <View style={s.pageTitleWrap}>
            <Text style={s.pageTitle}>تعيين كلمة مرور جديدة</Text>
            <Text style={s.pageSubtitle}>
              أدخل رمز التحقق المرسل لبريدك الإلكتروني وكلمة المرور الجديدة.
            </Text>
          </View>

          {/* Form card */}
          <View style={s.card}>
            {generalError ? <Text style={s.errorTxt}>{generalError}</Text> : null}

            {/* Email */}
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

            {/* Verification Code */}
            <AppInput
              label="رمز التحقق (6 أرقام)"
              iconRight="key-outline"
              value={code}
              onChangeText={(v) => {
                setCode(v)
                clearFieldError('code')
              }}
              placeholder="أدخل رمز التحقق (6 أرقام)"
              keyboardType="number-pad"
              maxLength={6}
              returnKeyType="next"
              error={errors.code}
            />

            <View style={s.divider} />

            {/* New password */}
            <View style={s.fieldGroup}>
              <AppInput
                label="كلمة المرور الجديدة"
                iconRight="lock-closed-outline"
                iconLeft={showPw ? 'eye' : 'eye-off'}
                onIconLeftPress={() => setShowPw((v) => !v)}
                value={password}
                onChangeText={(v) => {
                  setPassword(v)
                  clearFieldError('password')
                }}
                placeholder="أدخل كلمة المرور الجديدة"
                secureTextEntry={!showPw}
                returnKeyType="next"
                error={errors.password}
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
                    حرف واحد كبير (A-Z) ورقم واحد (0-9) على الأقل
                  </Text>
                </View>
              </View>
            </View>

            {/* Confirm password */}
            <AppInput
              label="تأكيد كلمة المرور الجديدة"
              iconRight="lock-open-outline"
              iconLeft={showCPw ? 'eye' : 'eye-off'}
              onIconLeftPress={() => setShowCPw((v) => !v)}
              value={confirm}
              onChangeText={(v) => {
                setConfirm(v)
                clearFieldError('confirm')
              }}
              placeholder="أعد إدخال كلمة المرور الجديدة للتأكيد"
              secureTextEntry={!showCPw}
              returnKeyType="done"
              onSubmitEditing={handleReset}
              error={errors.confirm}
            />
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
    paddingHorizontal: Spacing.space5,
    gap: Spacing.space4,
    paddingTop: Spacing.space2,
    paddingBottom: Spacing.space6,
  },
  pageTitleWrap: { gap: Spacing.space1, marginTop: Spacing.space2, alignItems: 'center' },
  pageTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 22,
    lineHeight: 30,
    color: Colors.text,
    writingDirection: 'rtl',
    textAlign: 'center',
  },
  pageSubtitle: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 13,
    lineHeight: 20,
    color: Colors.text2,
    writingDirection: 'rtl',
    textAlign: 'center',
    maxWidth: 300,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.space6,
    gap: Spacing.space4,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  cardHero: {
    alignItems: 'center',
    gap: Spacing.space2,
    marginBottom: Spacing.space2,
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
  fieldGroup: { gap: Spacing.space2 },
  hints: { gap: Spacing.space1, marginTop: Spacing.space1 },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  hintTxt: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.text2,
    writingDirection: 'rtl',
  },
  hintOk: { color: '#16a34a' },
  divider: { height: 1, backgroundColor: Colors.border },
  errorTxt: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: Colors.error,
    textAlign: 'center',
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
