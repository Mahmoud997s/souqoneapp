import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Linking,
  Platform,
  StatusBar,
  AppState,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import * as Notifications from 'expo-notifications'
import { Colors } from '../../src/constants/colors'
import { useAuthStore } from '../../src/store/authStore'
import { dialogService } from '../../src/store/dialogStore'
import { SupportHelpButton } from '../../src/components/ui/SupportHelpButton'
import { GlassNavBar } from '../../src/components/ui/GlassNavBar'
import { DeletionScheduledBanner } from '../../src/components/profile/DeletionScheduledBanner'
import { SUPPORT_MAILTO } from '../../src/constants/support'
import { PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL } from '../../src/constants/legal'
import {
  DEFAULT_NOTIFICATION_PREFS,
  loadNotificationPrefs,
  saveNotificationPrefs,
} from '../../src/utils/notificationPrefsStorage'
import { logWarn } from '../../src/utils/safeLog'
import type { User } from '../../src/types/auth.types'

export function resolveHasPassword(user: User | null | undefined): boolean {
  if (!user) return false
  if (typeof user.hasPassword === 'boolean') return user.hasPassword
  return user.deletionReauthMethod !== 'google' && user.deletionReauthMethod !== 'apple'
}

function getOAuthAccountNoteMeta(user: User): {
  iconName: keyof typeof Ionicons.glyphMap
  iconColor: string
  title: string
} {
  const hasGoogle = Boolean(user.hasGoogle || user.deletionReauthMethod === 'google')
  const hasApple = Boolean(user.hasApple || user.deletionReauthMethod === 'apple')
  if (hasGoogle && hasApple) {
    return {
      iconName: 'shield-checkmark-outline',
      iconColor: Colors.primary,
      title: 'حسابك مرتبط بـ Google و Apple',
    }
  }
  if (hasGoogle) {
    return {
      iconName: 'logo-google',
      iconColor: Colors.primary,
      title: 'حسابك مرتبط بـ Google',
    }
  }
  if (hasApple) {
    return {
      iconName: 'logo-apple',
      iconColor: Colors.text,
      title: 'حسابك مرتبط بـ Apple',
    }
  }
  return {
    iconName: 'shield-checkmark-outline',
    iconColor: Colors.primary,
    title: 'حسابك مرتبط بتسجيل دخول سريع',
  }
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets()
  const { logout, user, isGuest } = useAuthStore()
  const [msgNotif, setMsgNotif] = useState(DEFAULT_NOTIFICATION_PREFS.msgNotif)
  const [adNotif, setAdNotif] = useState(DEFAULT_NOTIFICATION_PREFS.adNotif)
  const [osNotifDenied, setOsNotifDenied] = useState(false)

  const checkOsNotificationPermission = useCallback(async () => {
    try {
      const permission = await Notifications.getPermissionsAsync()
      setOsNotifDenied(permission.status !== 'granted')
    } catch (error) {
      logWarn('SettingsScreen:CheckOsNotifPermission', error)
    }
  }, [])

  useEffect(() => {
    let mounted = true
    loadNotificationPrefs(user?.id).then((prefs) => {
      if (mounted) {
        setMsgNotif(prefs.msgNotif)
        setAdNotif(prefs.adNotif)
      }
    })
    return () => {
      mounted = false
    }
  }, [user?.id])

  useEffect(() => {
    checkOsNotificationPermission()
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        checkOsNotificationPermission()
      }
    })
    return () => {
      subscription.remove()
    }
  }, [checkOsNotificationPermission])

  const handleToggleMsg = async (val: boolean) => {
    const prevVal = msgNotif
    setMsgNotif(val)
    if (!user?.id) return
    try {
      await saveNotificationPrefs(user.id, { msgNotif: val, adNotif })
    } catch (error) {
      logWarn('SettingsScreen:SaveMsgNotif', error)
      setMsgNotif(prevVal)
      dialogService.alert('خطأ', 'تعذر حفظ تفضيلات الإشعارات على الجهاز. حاول مرة أخرى.', 'error')
    }
  }

  const handleToggleAd = async (val: boolean) => {
    const prevVal = adNotif
    setAdNotif(val)
    if (!user?.id) return
    try {
      await saveNotificationPrefs(user.id, { msgNotif, adNotif: val })
    } catch (error) {
      logWarn('SettingsScreen:SaveAdNotif', error)
      setAdNotif(prevVal)
      dialogService.alert('خطأ', 'تعذر حفظ تفضيلات الإشعارات على الجهاز. حاول مرة أخرى.', 'error')
    }
  }

  const handleLogout = () => {
    dialogService.confirm(
      'تسجيل الخروج',
      'هل أنت متأكد من تسجيل الخروج؟',
      async () => {
        await logout()
        router.replace('/(auth)/login')
      },
      'تسجيل الخروج',
      'إلغاء',
      true
    )
  }

  const SettingItem = ({
    icon,
    iconColor = '#334155',
    title,
    value,
    hasSwitch,
    switchVal,
    onSwitch,
    onPress,
    isLast,
    danger,
    accessibilityLabel,
    testID,
    switchTestID,
  }: {
    icon: keyof typeof Ionicons.glyphMap
    iconColor?: string
    title: string
    value?: string
    hasSwitch?: boolean
    switchVal?: boolean
    onSwitch?: (val: boolean) => void
    onPress?: () => void
    isLast?: boolean
    danger?: boolean
    accessibilityLabel?: string
    testID?: string
    switchTestID?: string
  }) => {
    const finalIconColor = danger ? '#DC2626' : iconColor
    return (
      <TouchableOpacity
        testID={testID}
        style={s.optionRow}
        disabled={hasSwitch}
        onPress={onPress}
        activeOpacity={0.6}
        accessibilityRole={hasSwitch ? undefined : 'button'}
        accessibilityLabel={accessibilityLabel || title}
      >
        <View style={s.optionRight}>
          <View style={[s.optionIconWrap, danger && s.optionIconWrapDanger]}>
            <Ionicons name={icon} size={18} color={finalIconColor} />
          </View>
          <Text style={[s.optionTitle, danger && s.optionTitleDanger]} numberOfLines={1}>
            {title}
          </Text>
        </View>

        {hasSwitch ? (
          <Switch
            testID={switchTestID}
            value={switchVal}
            onValueChange={onSwitch}
            trackColor={{ false: '#CBD5E1', true: Colors.primary }}
            thumbColor={Platform.OS === 'android' ? (switchVal ? Colors.white : '#F1F5F9') : undefined}
          />
        ) : value ? (
          <View style={s.valRow}>
            <View style={s.badgePill}>
              <Text style={s.badgeText}>{value}</Text>
            </View>
            <Ionicons name="chevron-back" size={15} color="#94A3B8" />
          </View>
        ) : (
          <Ionicons name="chevron-back" size={15} color="#94A3B8" />
        )}

        {!isLast && <View style={s.optionDivider} />}
      </TouchableOpacity>
    )
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" />

      {/* ── Fixed Top Navigation Bar ── */}
      <GlassNavBar
        title="إعدادات الحساب"
        paddingTop={insets.top}
        onBackPress={() => router.back()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          s.content,
          {
            paddingTop: insets.top + 66,
            paddingBottom: Math.max(insets.bottom, 16) + 17,
          },
        ]}
      >
        {/* ── Scheduled Deletion Banner ── */}
        <DeletionScheduledBanner />

        {/* ── Section 1: Account ── */}
        <View style={s.sectionWrap}>
          <Text style={s.sectionHeaderTitle}>الحساب والأمان</Text>
          <View style={s.cardGroup}>
            <SettingItem
              icon="person-outline"
              iconColor={Colors.primary}
              title="تعديل الملف الشخصي"
              onPress={() => router.push('/profile/edit-profile' as any)}
            />
            {!isGuest && user && resolveHasPassword(user) && (
              <SettingItem
                testID="settings-change-password-row"
                icon="lock-closed-outline"
                iconColor="#2563EB"
                title="تغيير كلمة المرور"
                onPress={() => router.push('/profile/change-password' as any)}
              />
            )}
            {!isGuest && user && !resolveHasPassword(user) && (() => {
              const noteMeta = getOAuthAccountNoteMeta(user)
              return (
                <View testID="settings-oauth-account-note" style={s.optionRow}>
                  <View style={s.optionRight}>
                    <View style={s.optionIconWrap}>
                      <Ionicons name={noteMeta.iconName} size={17} color={noteMeta.iconColor} />
                    </View>
                    <View style={s.oauthTextBlock}>
                      <Text style={s.optionTitle}>{noteMeta.title}</Text>
                      <Text style={s.oauthSubtitle}>
                        تسجيل الدخول يتم عبر مزود الحساب دون كلمة مرور
                      </Text>
                    </View>
                  </View>
                  <View style={s.oauthBadgePill}>
                    <Text style={s.oauthBadgeText}>متصل</Text>
                  </View>
                  <View style={s.optionDivider} />
                </View>
              )
            })()}
            <SettingItem
              icon="shield-checkmark-outline"
              iconColor="#059669"
              title="التحقق من الهوية"
              onPress={() => dialogService.alert('قريباً', 'ميزة التحقق من الهوية ستكون متاحة قريباً', 'info')}
              isLast={isGuest || !user}
            />
            {!isGuest && user && (
              <SettingItem
                icon="trash-outline"
                title="حذف الحساب"
                danger
                onPress={() => router.push('/profile/delete-account' as any)}
                isLast
                accessibilityLabel="حذف الحساب"
              />
            )}
          </View>
        </View>

        {/* ── Section 2: Notifications ── */}
        <View style={s.sectionWrap}>
          <Text style={s.sectionHeaderTitle}>تفضيلات الإشعارات</Text>
          <View style={s.cardGroup}>
            {osNotifDenied && (
              <View testID="settings-os-notif-banner" style={s.osBannerRow}>
                <View style={s.optionRight}>
                  <View style={s.osBannerIconWrap}>
                    <Ionicons name="notifications-off-outline" size={18} color={Colors.warning} />
                  </View>
                  <Text style={s.osBannerText}>الإشعارات متوقفة من إعدادات الجهاز</Text>
                </View>
                <TouchableOpacity
                  testID="settings-open-os-settings-btn"
                  style={s.osBannerBtn}
                  onPress={() => {
                    Linking.openSettings().catch((err) => logWarn('SettingsScreen:OpenOsSettings', err))
                  }}
                  activeOpacity={0.75}
                >
                  <Text style={s.osBannerBtnText}>فتح الإعدادات</Text>
                </TouchableOpacity>
                <View style={s.optionDivider} />
              </View>
            )}
            <SettingItem
              switchTestID="settings-msg-notif-switch"
              icon="chatbubble-outline"
              iconColor="#7C3AED"
              title="إشعارات الرسائل والمحادثات"
              hasSwitch
              switchVal={msgNotif}
              onSwitch={handleToggleMsg}
            />
            <SettingItem
              switchTestID="settings-ad-notif-switch"
              icon="notifications-outline"
              iconColor="#D97706"
              title="إشعارات الإعلانات والعروض"
              hasSwitch
              switchVal={adNotif}
              onSwitch={handleToggleAd}
              isLast
            />
          </View>
        </View>

        {/* ── Section 3: App & Legal ── */}
        <View style={s.sectionWrap}>
          <Text style={s.sectionHeaderTitle}>معلومات التطبيق والدعم</Text>
          <View style={s.cardGroup}>
            <SettingItem
              icon="globe-outline"
              iconColor="#0284C7"
              title="اللغة"
              value="العربية"
              onPress={() => dialogService.alert('اللغة', 'التطبيق متاح باللغة العربية حالياً', 'info')}
            />
            <SettingItem
              icon="headset-outline"
              iconColor="#059669"
              title="الدعم الفني والمساعدة"
              onPress={() => Linking.openURL(SUPPORT_MAILTO).catch(() => {})}
            />
            <SettingItem
              icon="document-text-outline"
              iconColor="#64748B"
              title="سياسة الخصوصية"
              onPress={() => Linking.openURL(PRIVACY_POLICY_URL).catch(() => {})}
            />
            <SettingItem
              icon="information-circle-outline"
              iconColor="#64748B"
              title="شروط الاستخدام"
              onPress={() => Linking.openURL(TERMS_OF_SERVICE_URL).catch(() => {})}
              isLast
            />
          </View>
        </View>

        {/* ── Support & Help Button ── */}
        <SupportHelpButton style={{ marginHorizontal: 0, marginTop: 4, marginBottom: 10 }} />

        {/* ── Logout Button ── */}
        <View style={s.logoutWrap}>
          <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.75}>
            <Ionicons name="log-out-outline" size={19} color="#DC2626" style={{ marginEnd: 8 }} />
            <Text style={s.logoutTxt}>تسجيل الخروج</Text>
          </TouchableOpacity>
        </View>

        {/* ── Version Info ── */}
        <Text style={s.version}>سوق ون © الإصدار 1.0.0</Text>
      </ScrollView>
    </View>
  )
}

const softShadow = Platform.select({
  ios: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  android: { elevation: 1.5 },
})

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    paddingHorizontal: 16,
  },

  /* Section Styles */
  sectionWrap: {
    marginBottom: 14,
  },
  sectionHeaderTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12.5,
    lineHeight: 17,
    color: '#64748B',
    marginBottom: 7,
    paddingHorizontal: 4,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  cardGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...softShadow,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  optionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  optionIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconWrapDanger: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  optionTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13.5,
    lineHeight: 19,
    color: '#1E293B',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  optionTitleDanger: {
    color: '#DC2626',
  },
  optionDivider: {
    position: 'absolute',
    bottom: 0,
    end: 14,
    start: 60,
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  valRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgePill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  badgeText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: 15,
    color: '#334155',
    writingDirection: 'rtl',
  },
  oauthTextBlock: {
    flex: 1,
    alignItems: 'flex-start',
  },
  oauthSubtitle: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11.5,
    lineHeight: 16,
    color: Colors.textMuted,
    marginTop: 2,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  oauthBadgePill: {
    backgroundColor: Colors.paleMint,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  oauthBadgeText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: 15,
    color: Colors.primary,
    writingDirection: 'rtl',
  },
  osBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    paddingHorizontal: 14,
    gap: 10,
  },
  osBannerIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  osBannerText: {
    flex: 1,
    fontFamily: 'Almarai_700Bold',
    fontSize: 12.5,
    lineHeight: 17,
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  osBannerBtn: {
    backgroundColor: Colors.paleMint,
    borderColor: Colors.primary,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  osBannerBtnText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11.5,
    lineHeight: 16,
    color: Colors.primary,
    writingDirection: 'rtl',
  },

  /* Logout */
  logoutWrap: {
    marginTop: 2,
    marginBottom: 10,
  },
  logoutBtn: {
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  logoutTxt: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 14,
    lineHeight: 20,
    color: '#DC2626',
    textAlign: 'center',
    writingDirection: 'rtl',
  },

  /* Version */
  version: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    lineHeight: 15,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 4,
    writingDirection: 'rtl',
  },
})

