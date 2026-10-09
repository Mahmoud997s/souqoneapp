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
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { authApi } from '../../src/api/auth'
import { AppInput } from '../../src/components/ui/AppInput'
import { AppButton } from '../../src/components/ui/AppButton'
import { Colors } from '../../src/constants/colors'
import { validateForgotPassword } from '../../src/utils/authValidation'

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async () => {
    const valResult = validateForgotPassword(email)
    if (!valResult.isValid) {
      setError(valResult.errors.email || 'يرجى إدخال البريد الإلكتروني')
      return
    }

    const cleanEmail = email.trim().toLowerCase()
    setError('')
    setLoading(true)
    try {
      await authApi.forgotPassword(cleanEmail)
      setSuccess(true)
    } catch (e: any) {
      let msg = e?.response?.data?.message
      if (Array.isArray(msg)) msg = msg[0]
      setError(msg || e?.message || 'حدث خطأ، يرجى المحاولة مجدداً')
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
            onPress={() => router.back()}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-forward" size={18} color={Colors.text} />
          </TouchableOpacity>
          <Text style={s.topHeaderTitle}>تم إرسال الرمز</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={s.card}>
            <View style={s.cardHero}>
              <View style={[s.iconWrap, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="checkmark-circle-outline" size={36} color="#059669" />
              </View>
              <Text style={s.cardTitle}>تحقق من بريدك الإلكتروني</Text>
              <Text style={s.cardSubtitle}>
                تم إرسال رمز التحقق المكون من 6 أرقام إلى{'\n'}
                <Text style={s.emailHighlight}>{email}</Text>
              </Text>
            </View>

            <View style={s.infoBox}>
              <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
              <Text style={s.infoText}>
                تحقق من صندوق الوارد أو مجلد الرسائل غير المرغوب فيها (Spam)، الرمز صالح لمدة 15 دقيقة.
              </Text>
            </View>

            <View style={{ gap: Spacing.space3, marginTop: Spacing.space2 }}>
              <AppButton
                title="إدخال الرمز وتعيين كلمة المرور"
                onPress={() =>
                  router.replace({
                    pathname: '/(auth)/reset-password',
                    params: { email: email.trim().toLowerCase() },
                  } as any)
                }
                icon="key-outline"
              />
              <AppButton
                title="العودة لتسجيل الدخول"
                variant="outline"
                onPress={() => router.replace('/(auth)/login')}
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
        <Text style={s.topHeaderTitle}>استعادة الحساب</Text>
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
          {/* Card */}
          <View style={s.card}>
            <View style={s.cardHero}>
              <View style={s.iconWrap}>
                <Ionicons name="key-outline" size={32} color={Colors.primary} />
              </View>
              <Text style={s.cardTitle}>استعادة كلمة المرور</Text>
              <Text style={s.cardSubtitle}>
                أدخل بريدك الإلكتروني وسنرسل لك رمز تحقق مكون من 6 أرقام لإعادة تعيين كلمة المرور.
              </Text>
            </View>

            <AppInput
              label="البريد الإلكتروني"
              iconRight="mail-outline"
              value={email}
              onChangeText={(v) => {
                setEmail(v)
                if (error) setError('')
              }}
              placeholder="أدخل بريدك الإلكتروني المسجل لدينا"
              keyboardType="email-address"
              textContentType="emailAddress"
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
              error={error}
            />

            <AppButton
              title="إرسال رمز التحقق"
              onPress={handleSubmit}
              loading={loading}
              icon="send-outline"
            />

            <View style={s.loginRow}>
              <Text style={s.loginTxt}>
                تذكرت كلمة المرور؟{'  '}
                <Text
                  style={s.loginLink}
                  onPress={() => router.replace('/(auth)/login')}
                >
                  تسجيل الدخول
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
    flexGrow: 1,
    paddingHorizontal: Spacing.space5,
    paddingTop: Spacing.space2,
    paddingBottom: Spacing.space8,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.space6,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.space4,
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
  emailHighlight: {
    fontFamily: 'Almarai_700Bold',
    color: Colors.primary,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.space3,
    gap: Spacing.space2,
  },
  infoText: {
    flex: 1,
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    lineHeight: 18,
    color: Colors.text2,
    writingDirection: 'rtl',
    textAlign: 'left',
  },
  loginRow: { alignItems: 'center', marginTop: Spacing.space2 },
  loginTxt: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 13,
    lineHeight: 19,
    color: Colors.text2,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  loginLink: {
    fontFamily: 'Almarai_700Bold',
    color: Colors.primary,
  },
})
