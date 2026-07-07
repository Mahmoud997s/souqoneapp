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
import { BackButton } from '../../src/components/ui/BackButton'
import { Gradients } from '../../src/constants/gradients'
import { Colors } from '../../src/constants/colors'

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError('يرجى إدخال البريد الإلكتروني')
      return
    }
    setError('')
    setLoading(true)
    try {
      await authApi.forgotPassword(email.trim().toLowerCase())
      setSuccess(true)
    } catch (e: any) {
      setError(e?.response?.data?.message || 'حدث خطأ، يرجى المحاولة مجدداً')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <View style={[s.root, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={Gradients.hero as any}
          locations={[0, 0.6, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={s.successHero}
        >
          <View style={s.successIconWrap}>
            <Ionicons name="checkmark-circle" size={64} color="#ffffff" />
          </View>
          <Text style={s.successTitle}>تم الإرسال!</Text>
          <Text style={s.successDesc}>
            تم إرسال رابط إعادة التعيين إلى{'\n'}
            <Text style={s.successEmail}>{email}</Text>
          </Text>
        </LinearGradient>
        <View style={s.successBody}>
          <Text style={s.successNote}>
            تحقق من صندوق الوارد أو مجلد البريد العشوائي.
          </Text>
          <AppButton
            title="العودة لتسجيل الدخول"
            onPress={() => router.replace('/(auth)/login')}
          />
        </View>
      </View>
    )
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <LinearGradient
            colors={Gradients.hero as any}
            locations={[0, 0.6, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={s.header}
          >
            <BackButton style={s.backBtn} />

            <View style={s.lockIconWrap}>
              <Ionicons name="lock-open-outline" size={36} color="#ffffff" />
            </View>

            <Text style={s.headerTitle}>نسيت كلمة المرور؟</Text>
            <Text style={s.headerSubtitle}>
              سنرسل لك رابط إعادة التعيين لبريدك الإلكتروني
            </Text>
          </LinearGradient>

          {/* Card */}
          <View style={s.card}>
            <AppInput
              label="البريد الإلكتروني"
              iconRight="mail-outline"
              value={email}
              onChangeText={setEmail}
              placeholder="أدخل بريدك الإلكتروني"
              keyboardType="email-address"
              textContentType="emailAddress"
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
              error={error}
            />

            <AppButton
              title="إرسال الرابط"
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
  root: { flex: 1, backgroundColor: '#f7f9fc' },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingBottom: 40 },
  header: {
    paddingTop: 48,
    paddingBottom: Spacing.space8,
    paddingHorizontal: Spacing.space5,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    alignItems: 'center',
    gap: Spacing.space2,
    position: 'relative',
    ...Shadows.card,
  },
  backBtn: {
    position: 'absolute',
    top: 48,
    start: Spacing.space4,
    width: Spacing.touch,
    height: Spacing.touch,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  lockIconWrap: {
    marginTop: Spacing.space8,
    marginBottom: Spacing.space2,
    width: 72,
    height: 72,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 24,
    lineHeight: 32,
    color: '#ffffff',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  headerSubtitle: {
    fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    maxWidth: 280,
    writingDirection: 'rtl',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: Radius.md,
    marginHorizontal: Spacing.space5,
    marginTop: -16,
    padding: Spacing.space6,
    borderWidth: 1,
    borderColor: '#E2E6EC',
    gap: Spacing.space3,
    ...Shadows.card,
  },
  loginRow: { alignItems: 'center', marginTop: Spacing.space2 },
  loginTxt: {
    fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 14,
    lineHeight: 20,
    color: '#4B5563',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  loginLink: {
    fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, color: Colors.primary,
  },
  successHero: {
    paddingTop: 64,
    paddingBottom: 48,
    paddingHorizontal: Spacing.space5,
    alignItems: 'center',
    gap: Spacing.space3,
  },
  successIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.space2,
  },
  successTitle: {
    fontFamily: 'Almarai_800ExtraBold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 28,
    lineHeight: 36,
    color: '#ffffff',
    writingDirection: 'rtl',
  },
  successDesc: {
    fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 14,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    maxWidth: 280,
    writingDirection: 'rtl',
  },
  successEmail: {
    fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, color: '#ffffff',
  },
  successBody: {
    flex: 1,
    paddingHorizontal: Spacing.space6,
    paddingTop: Spacing.space8,
    gap: Spacing.space6,
  },
  successNote: {
    fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 14,
    lineHeight: 22,
    color: '#4B5563',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
})
