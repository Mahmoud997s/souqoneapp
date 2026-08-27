import React, { useState } from 'react'
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
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { Colors } from '../../src/constants/colors'
import { useAuthStore } from '../../src/store/authStore'
import { dialogService } from '../../src/store/dialogStore'
import { usersApi } from '../../src/api/users'
import { SupportHelpButton } from '../../src/components/ui/SupportHelpButton'
import { GlassNavBar } from '../../src/components/ui/GlassNavBar'

export default function SettingsScreen() {
  const insets = useSafeAreaInsets()
  const { logout, user } = useAuthStore()
  const [msgNotif, setMsgNotif] = useState((user as any)?.preferences?.msgNotif ?? true)
  const [adNotif, setAdNotif] = useState((user as any)?.preferences?.adNotif ?? true)

  const handleToggleMsg = async (val: boolean) => {
    setMsgNotif(val)
    try {
      await usersApi.updateProfile({ preferences: { msgNotif: val, adNotif } } as any)
    } catch {}
  }

  const handleToggleAd = async (val: boolean) => {
    setAdNotif(val)
    try {
      await usersApi.updateProfile({ preferences: { msgNotif, adNotif: val } } as any)
    } catch {}
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
  }) => (
    <TouchableOpacity
      style={s.optionRow}
      disabled={hasSwitch}
      onPress={onPress}
      activeOpacity={0.6}
    >
      <View style={s.optionRight}>
        <View style={s.optionIconWrap}>
          <Ionicons name={icon} size={18} color={iconColor} />
        </View>
        <Text style={s.optionTitle} numberOfLines={1}>
          {title}
        </Text>
      </View>

      {hasSwitch ? (
        <Switch
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
            <SettingItem
              icon="lock-closed-outline"
              iconColor="#2563EB"
              title="تغيير كلمة المرور"
              onPress={() => router.push('/profile/change-password' as any)}
            />
            <SettingItem
              icon="shield-checkmark-outline"
              iconColor="#059669"
              title="التحقق من الهوية"
              onPress={() => dialogService.alert('قريباً', 'ميزة التحقق من الهوية ستكون متاحة قريباً', 'info')}
              isLast
            />
          </View>
        </View>

        {/* ── Section 2: Notifications ── */}
        <View style={s.sectionWrap}>
          <Text style={s.sectionHeaderTitle}>تفضيلات الإشعارات</Text>
          <View style={s.cardGroup}>
            <SettingItem
              icon="chatbubble-outline"
              iconColor="#7C3AED"
              title="إشعارات الرسائل والمحادثات"
              hasSwitch
              switchVal={msgNotif}
              onSwitch={handleToggleMsg}
            />
            <SettingItem
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
              onPress={() => Linking.openURL('mailto:support@souqone.com').catch(() => {})}
            />
            <SettingItem
              icon="document-text-outline"
              iconColor="#64748B"
              title="سياسة الخصوصية"
              onPress={() => Linking.openURL('https://souqone.com/privacy').catch(() => {})}
            />
            <SettingItem
              icon="information-circle-outline"
              iconColor="#64748B"
              title="شروط الاستخدام"
              onPress={() => Linking.openURL('https://souqone.com/terms').catch(() => {})}
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
  optionTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13.5,
    lineHeight: 19,
    color: '#1E293B',
    textAlign: 'left',
    writingDirection: 'rtl',
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

