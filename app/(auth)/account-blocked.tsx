import React, { useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Linking,
  BackHandler,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../src/constants/colors'
import { Spacing } from '../../src/constants/spacing'
import { Radius } from '../../src/constants/radius'
import { Shadows } from '../../src/constants/shadows'
import { AppButton } from '../../src/components/ui/AppButton'
import { useBlockedStore } from '../../src/store/blockedStore'
import { useAuthStore } from '../../src/store/authStore'
import { formatSuspensionDate } from '../../src/utils/formatSuspensionDate'

const SUPPORT_EMAIL = 'support@souqone.com'

export default function AccountBlockedScreen() {
  const insets = useSafeAreaInsets()
  const { code, suspendedUntil, clear } = useBlockedStore()
  const logout = useAuthStore((state) => state.logout)

  const isSuspended = code === 'ACCOUNT_SUSPENDED'

  const handleReturnToLogin = useCallback(() => {
    clear()
    logout().catch(() => {})
    router.replace('/(auth)/login')
  }, [clear, logout])

  // Android hardware back button handler
  useEffect(() => {
    const onBackPress = () => {
      handleReturnToLogin()
      return true // Consume event
    }

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress)
    return () => subscription.remove()
  }, [handleReturnToLogin])

  const handleSupportPress = () => {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}`).catch(() => {})
  }

  // Determine copy and colors
  const title = isSuspended ? 'الحساب موقوف مؤقتاً' : 'تم حظر الحساب'
  const iconName = isSuspended ? 'time-outline' : 'ban-outline'
  const iconColor = isSuspended ? Colors.warning : Colors.error

  let subtitle = 'تم حظر حسابك لمخالفة شروط الاستخدام.'
  if (isSuspended) {
    const formatted = formatSuspensionDate(suspendedUntil)
    if (formatted === 'حتى إشعار آخر') {
      subtitle = 'تم إيقاف حسابك مؤقتاً حتى إشعار آخر.'
    } else {
      subtitle = `تم إيقاف حسابك مؤقتاً حتى ${formatted}.`
    }
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" />

      {/* Floating Header with Circular Back Button */}
      <View style={[s.topRow, { paddingTop: insets.top + Spacing.space2 }]}>
        <TouchableOpacity
          testID="account-blocked-back-btn"
          style={s.floatingBackBtn}
          onPress={handleReturnToLogin}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-forward" size={18} color={Colors.text} />
        </TouchableOpacity>
        <Text style={s.topHeaderTitle}>{title}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.card}>
          <View style={s.cardHero}>
            <View style={s.iconWrap}>
              <Ionicons testID="account-blocked-icon" name={iconName} size={36} color={iconColor} />
            </View>
            <Text style={s.cardTitle}>{title}</Text>
            <Text style={s.cardSubtitle}>{subtitle}</Text>
          </View>

          {/* Support Information Box */}
          <View style={s.infoBox}>
            <Ionicons name="mail-outline" size={20} color={Colors.primary} />
            <View style={s.infoTextWrap}>
              <Text style={s.infoText}>
                للمساعدة أو الاستفسار، يمكنك التواصل مع فريق الدعم عبر:
              </Text>
              <TouchableOpacity onPress={handleSupportPress} activeOpacity={0.7}>
                <Text style={s.emailHighlight}>{SUPPORT_EMAIL}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Action Button */}
          <View style={{ marginTop: Spacing.space2 }}>
            <AppButton
              testID="account-blocked-return-btn"
              title="العودة لتسجيل الدخول"
              onPress={handleReturnToLogin}
              variant="primary"
            />
          </View>
        </View>
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
    paddingTop: Spacing.space4,
    paddingBottom: Spacing.space8,
    justifyContent: 'center',
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
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
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
  infoTextWrap: {
    flex: 1,
    gap: 2,
  },
  infoText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    lineHeight: 18,
    color: Colors.text2,
    writingDirection: 'rtl',
    textAlign: 'left',
  },
  emailHighlight: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12.5,
    color: Colors.primary,
    textAlign: 'left',
  },
})
