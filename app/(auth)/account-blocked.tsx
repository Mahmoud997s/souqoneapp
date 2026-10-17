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
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from '../../src/constants/support'
import { AppButton } from '../../src/components/ui/AppButton'
import { useBlockedStore } from '../../src/store/blockedStore'
import { useAuthStore } from '../../src/store/authStore'
import { formatSuspensionDate } from '../../src/utils/formatSuspensionDate'

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
    Linking.openURL(SUPPORT_MAILTO).catch(() => {})
  }

  // Determine copy and colors
  const title = isSuspended ? 'الحساب موقوف مؤقتاً' : 'تم حظر الحساب'
  const iconName = isSuspended ? 'time-outline' : 'ban-outline'
  const iconColor = isSuspended ? Colors.warning : Colors.error

  let subtitle = 'تم حظر حسابك لمخالفة شروط الاستخدام.'
  let formattedSuspendedDate: string | null = null

  if (isSuspended) {
    const formatted = formatSuspensionDate(suspendedUntil)
    if (formatted === 'حتى إشعار آخر') {
      subtitle = 'تم إيقاف حسابك مؤقتاً حتى إشعار آخر.'
    } else {
      subtitle = 'تم إيقاف حسابك مؤقتاً. سيُعاد تفعيله تلقائياً في:'
      formattedSuspendedDate = formatted
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
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.card}>
          <View style={s.cardHero}>
            <View style={s.iconWrap}>
              <Ionicons testID="account-blocked-icon" name={iconName} size={40} color={iconColor} />
            </View>
            <Text style={s.cardTitle}>{title}</Text>
            <Text style={s.cardSubtitle}>{subtitle}</Text>
            {formattedSuspendedDate ? (
              <Text testID="account-blocked-suspended-date" style={s.suspendedDateText}>
                {formattedSuspendedDate}
              </Text>
            ) : null}
          </View>

          {/* Support Information Box */}
          <View style={s.infoBox}>
            <Ionicons name="mail-outline" size={24} color={Colors.primary} />
            <Text style={s.infoText}>
              للمساعدة أو الاستفسار، يمكنك التواصل مع فريق الدعم عبر:
            </Text>
            <TouchableOpacity
              onPress={handleSupportPress}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}
            >
              <Text style={s.emailHighlight}>{SUPPORT_EMAIL}</Text>
            </TouchableOpacity>
          </View>

          {/* Action Button */}
          <View style={s.actionWrap}>
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
    paddingHorizontal: Spacing.space5,
    paddingBottom: Spacing.space2,
    alignItems: 'flex-start',
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
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.space1,
  },
  cardTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 22,
    lineHeight: 30,
    color: Colors.text,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  cardSubtitle: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 15,
    lineHeight: 24,
    color: Colors.text2,
    textAlign: 'center',
    writingDirection: 'rtl',
    paddingHorizontal: Spacing.space1,
  },
  suspendedDateText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 16,
    lineHeight: 24,
    color: Colors.warning,
    textAlign: 'center',
    writingDirection: 'rtl',
    marginTop: Spacing.space1,
  },
  infoBox: {
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.space4,
    paddingHorizontal: Spacing.space3,
    gap: Spacing.space2,
  },
  infoText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 14,
    lineHeight: 22,
    color: Colors.text2,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  emailHighlight: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 15,
    lineHeight: 22,
    color: Colors.primary,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  actionWrap: {
    width: '100%',
    marginTop: Spacing.space2,
  },
})
