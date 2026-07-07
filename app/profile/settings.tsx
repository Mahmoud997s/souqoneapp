import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Linking, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { AppHeader } from '../../src/components/ui/AppHeader'
import { Colors } from '../../src/constants/colors'
import { Spacing } from '../../src/constants/spacing'
import { Radius } from '../../src/constants/radius'
import { useAuthStore } from '../../src/store/authStore'
import { Alert } from 'react-native'
import { router } from 'expo-router'
import { usersApi } from '../../src/api/users'

export default function SettingsScreen() {
  const { logout, user } = useAuthStore()
  const [msgNotif, setMsgNotif] = useState((user as any)?.preferences?.msgNotif ?? true)
  const [adNotif, setAdNotif] = useState((user as any)?.preferences?.adNotif ?? true)

  const handleToggleMsg = async (val: boolean) => {
    setMsgNotif(val)
    try { await usersApi.updateProfile({ preferences: { msgNotif: val, adNotif } } as any) } catch {}
  }

  const handleToggleAd = async (val: boolean) => {
    setAdNotif(val)
    try { await usersApi.updateProfile({ preferences: { msgNotif, adNotif: val } } as any) } catch {}
  }

  const Item = ({ icon, title, value, hasSwitch, switchVal, onSwitch, onPress, isLast }: any) => (
    <TouchableOpacity style={s.optionRow} disabled={hasSwitch} onPress={onPress} activeOpacity={0.6}>
      <View style={s.optionRight}>
        <View style={s.optionIconWrap}>
          <Ionicons name={icon} size={20} color={Colors.text2} />
        </View>
        <Text style={s.optionTitle} numberOfLines={1}>{title}</Text>
      </View>

      {hasSwitch ? (
        <Switch value={switchVal} onValueChange={onSwitch} trackColor={{ true: Colors.primary }} />
      ) : value ? (
        <View style={s.valRow}>
          <Text style={s.valTxt}>{value}</Text>
          <Ionicons name="chevron-back" size={16} color={Colors.borderStrong} />
        </View>
      ) : (
        <Ionicons name="chevron-back" size={16} color={Colors.borderStrong} />
      )}
      
      {!isLast && <View style={s.optionDivider} />}
    </TouchableOpacity>
  )

  return (
    <View style={s.root}>
      <AppHeader title="الإعدادات" showBack />
      <ScrollView contentContainerStyle={s.content}>
        
        <Text style={s.sectionTitle}>الحساب</Text>
        <View style={s.optionsGroup}>
          <Item icon="person-outline" title="تعديل الملف الشخصي" onPress={() => router.push('/profile/edit-profile' as any)} />
          <Item icon="lock-closed-outline" title="تغيير كلمة المرور" onPress={() => router.push('/profile/change-password' as any)} />
          <Item icon="checkmark-circle-outline" title="التحقق من الهوية" onPress={() => Alert.alert('قريباً', 'التحقق من الهوية قريباً')} isLast />
        </View>

        <Text style={s.sectionTitle}>الإشعارات</Text>
        <View style={s.optionsGroup}>
          <Item icon="chatbubble-outline" title="إشعارات الرسائل" hasSwitch switchVal={msgNotif} onSwitch={handleToggleMsg} />
          <Item icon="megaphone-outline" title="إشعارات الإعلانات" hasSwitch switchVal={adNotif} onSwitch={handleToggleAd} isLast />
        </View>

        <Text style={s.sectionTitle}>التطبيق</Text>
        <View style={s.optionsGroup}>
          <Item icon="globe-outline" title="اللغة" value="العربية" onPress={() => Alert.alert('اللغة', 'التطبيق متاح باللغة العربية فقط')} />
          <Item icon="headset-outline" title="الدعم الفني" onPress={() => Linking.openURL('mailto:support@souqone.com')} />
          <Item icon="document-text-outline" title="سياسة الخصوصية" onPress={() => Linking.openURL('https://souqone.com/privacy')} />
          <Item icon="shield-checkmark-outline" title="شروط الاستخدام" onPress={() => Linking.openURL('https://souqone.com/terms')} isLast />
        </View>

        <TouchableOpacity style={s.logoutBtn} onPress={() => {
          Alert.alert('تسجيل الخروج', 'هل أنت متأكد؟', [
            { text: 'إلغاء', style: 'cancel' },
            { text: 'تسجيل الخروج', style: 'destructive', onPress: async () => {
              await logout()
              router.replace('/(auth)/login')
            }},
          ])
        }}>
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          <Text style={s.logoutTxt}>تسجيل الخروج</Text>
        </TouchableOpacity>
        <Text style={s.version}>الإصدار: v1.0.0</Text>

      </ScrollView>
    </View>
  )
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f7f9fc' },
  content: { padding: Spacing.space4, paddingBottom: 100 },
  sectionTitle: {
    fontFamily: 'Almarai_700Bold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 18,
    color: Colors.primary,
    marginBottom: Spacing.space3,
    writingDirection: 'rtl',
    textAlign: 'right',
    paddingHorizontal: 8,
  },
  optionsGroup: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    marginBottom: 24,
    paddingVertical: 4,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  optionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTitle: {
    fontFamily: 'Almarai_700Bold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 14,
    color: Colors.text,
    textAlign: 'right',
  },
  optionDivider: {
    position: 'absolute',
    bottom: 0,
    right: 60,
    left: 16,
    height: 1,
    backgroundColor: Colors.border,
  },
  valRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  valTxt: { fontFamily: 'Almarai_700Bold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 13, color: Colors.textMuted },
  logoutBtn: {
    height: 52,
    borderRadius: Radius.xl,
    backgroundColor: 'rgba(220, 38, 38, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.space2,
    marginBottom: Spacing.space4,
  },
  logoutTxt: { fontFamily: 'Almarai_700Bold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 14, color: Colors.error },
  version: { fontFamily: 'Almarai_400Regular', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 12, color: Colors.borderStrong, textAlign: 'center' }
})
