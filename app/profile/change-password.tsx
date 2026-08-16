import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Text,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { AppInput } from '../../src/components/ui/AppInput'
import { AppButton } from '../../src/components/ui/AppButton'
import { usersApi } from '../../src/api/users'
import { dialogService } from '../../src/store/dialogStore'
import { ChangePasswordNavBar } from '../../src/components/profile/ChangePasswordNavBar'
import { SecurityInfoBanner } from '../../src/components/profile/SecurityInfoBanner'
import { PasswordRequirements } from '../../src/components/profile/PasswordRequirements'

export default function ChangePasswordScreen() {
  const insets = useSafeAreaInsets()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      return dialogService.alert('تنبيه', 'يرجى ملء جميع الحقول')
    }
    if (newPassword !== confirmPassword) {
      return dialogService.alert('تنبيه', 'كلمة المرور الجديدة غير متطابقة مع التأكيد')
    }
    if (newPassword.length < 8) {
      return dialogService.alert('تنبيه', 'كلمة المرور الجديدة يجب أن تكون ٨ أحرف على الأقل')
    }
    if (!/[A-Z]/.test(newPassword) || !/\d/.test(newPassword)) {
      return dialogService.alert('تنبيه', 'كلمة المرور يجب أن تحتوي على حرف كبير ورقم على الأقل')
    }

    try {
      setLoading(true)
      await usersApi.changePassword({
        currentPassword,
        newPassword,
      })

      dialogService.alert('نجاح', 'تم تغيير كلمة المرور بنجاح!', 'success')
      router.back()
    } catch (err: any) {
      const msg = err.response?.data?.message || 'كلمة المرور الحالية غير صحيحة أو حدث خطأ'
      dialogService.alert('خطأ', typeof msg === 'string' ? msg : Array.isArray(msg) ? msg[0] : 'حدث خطأ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#F8FAFC' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View style={s.root}>
        {/* ── Fixed Navigation Bar ── */}
        <ChangePasswordNavBar
          paddingTop={insets.top}
          onBackPress={() => router.back()}
        />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            s.content,
            {
              paddingTop: insets.top + 66,
              paddingBottom: 24,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Security Info Banner ── */}
          <SecurityInfoBanner />

          {/* ── Password Fields Form Card ── */}
          <View style={s.sectionWrap}>
            <Text style={s.sectionHeaderTitle}>بيانات كلمة المرور</Text>
            <View style={s.cardGroup}>
              {/* Current Password Field */}
              <AppInput
                label="كلمة المرور الحالية"
                placeholder="أدخل كلمة المرور الحالية"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                iconRight="lock-closed-outline"
                iconLeft={showCurrent ? "eye-off-outline" : "eye-outline"}
                onIconLeftPress={() => setShowCurrent(!showCurrent)}
                secureTextEntry={!showCurrent}
              />

              {/* New Password Field */}
              <AppInput
                label="كلمة المرور الجديدة"
                placeholder="أدخل كلمة المرور الجديدة"
                value={newPassword}
                onChangeText={setNewPassword}
                iconRight="lock-closed-outline"
                iconLeft={showNew ? "eye-off-outline" : "eye-outline"}
                onIconLeftPress={() => setShowNew(!showNew)}
                secureTextEntry={!showNew}
              />

              {/* Password Requirements Indicator */}
              <PasswordRequirements
                newPassword={newPassword}
                confirmPassword={confirmPassword}
              />

              {/* Confirm Password Field */}
              <AppInput
                label="تأكيد كلمة المرور الجديدة"
                placeholder="أعد كتابة كلمة المرور الجديدة"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                iconRight="lock-closed-outline"
                iconLeft={showConfirm ? "eye-off-outline" : "eye-outline"}
                onIconLeftPress={() => setShowConfirm(!showConfirm)}
                secureTextEntry={!showConfirm}
              />
            </View>
          </View>
        </ScrollView>

        {/* ── Fixed Bottom Footer Action Button ── */}
        <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <AppButton
            title="حفظ التغييرات"
            onPress={handleSave}
            loading={loading}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
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
    paddingTop: 12,
  },
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
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 14,
    ...softShadow,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: { elevation: 4 },
    }),
  },
})
