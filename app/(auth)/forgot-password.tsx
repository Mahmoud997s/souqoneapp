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
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { authApi } from '../../src/api/auth'
import { AppInput } from '../../src/components/ui/AppInput'
import { AppButton } from '../../src/components/ui/AppButton'
import { GlassNavBar } from '../../src/components/ui/GlassNavBar'
import { Gradients } from '../../src/constants/gradients'
import { Colors } from '../../src/constants/colors'

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async () => {
    const cleanEmail = email.trim().toLowerCase()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!cleanEmail) {
      setError('يرجى إدخال البريد الإلكتروني')
      return
    }
    if (!emailRegex.test(cleanEmail)) {
      setError('البريد الإلكتروني غير صالح')
      return
    }
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
        <GlassNavBar
          title="تم إرسال الرمز"
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
          <View style={s.card}>
            <View style={s.cardHero}>
              <View style={[s.iconWrap, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="checkmark-circle-outline" size={36} color="#059669" />
              </View>
              <Text style={s.cardTitle}>تحقق من بريدك الإلكتروني</Text>
              <Text style={s.cardSubtitle}>
                تم إرسال رمز التحقق (OTP) المكون من 6 أرقام إلى{'\n'}
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
      {/* Top Glass Navigation Bar like Profile Screen */}
      <GlassNavBar
        title="استعادة الحساب"
        paddingTop={insets.top}
        onBackPress={() => router.back()}
      />

      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
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
              placeholder="name@example.com"
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
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingBottom: 40 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    marginHorizontal: Spacing.space5,
    marginTop: Spacing.space4,
    padding: Spacing.space6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F1F5F9',
    borderRadius: Radius.md,
    padding: Spacing.space3,
    gap: Spacing.space2,
  },
  infoText: {
    flex: 1,
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    lineHeight: 18,
    color: '#475569',
    writingDirection: 'rtl',
    textAlign: 'left',
  },
  loginRow: { alignItems: 'center', marginTop: Spacing.space2 },
  loginTxt: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: '#64748B',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  loginLink: {
    fontFamily: 'Almarai_700Bold',
    color: Colors.primary,
  },
})
