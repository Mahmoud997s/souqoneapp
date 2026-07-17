import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Text,
} from 'react-native'
import { router } from 'expo-router'
import { AppHeader } from '../../src/components/ui/AppHeader'
import { AppInput } from '../../src/components/ui/AppInput'
import { AppButton } from '../../src/components/ui/AppButton'
import { Colors } from '../../src/constants/colors'
import { Spacing } from '../../src/constants/spacing'
import { Radius } from '../../src/constants/radius'
import { usersApi } from '../../src/api/users'

export default function ChangePasswordScreen() {
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      return Alert.alert('تنبيه', 'يرجى ملء جميع الحقول')
    }
    if (newPassword !== confirmPassword) {
      return Alert.alert('تنبيه', 'كلمة المرور الجديدة غير متطابقة مع التأكيد')
    }
    if (newPassword.length < 6) {
      return Alert.alert('تنبيه', 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل')
    }

    try {
      setLoading(true)
      await usersApi.changePassword({
        oldPassword,
        newPassword,
      })

      Alert.alert('نجاح', 'تم تغيير كلمة المرور بنجاح!', [
        { text: 'حسناً', onPress: () => router.back() }
      ])
    } catch (err: any) {
      const msg = err.response?.data?.message || 'كلمة المرور الحالية غير صحيحة أو حدث خطأ'
      Alert.alert('خطأ', typeof msg === 'string' ? msg : msg[0])
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={s.root}>
        <AppHeader title="تغيير كلمة المرور" showBack />
        <ScrollView
          contentContainerStyle={s.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={s.sectionTitle}>بيانات الأمان</Text>
          <View style={s.card}>
            <View style={s.form}>
              <AppInput
                label="كلمة المرور الحالية"
                placeholder="أدخل كلمة المرور القديمة"
                value={oldPassword}
                onChangeText={setOldPassword}
                iconRight="lock-closed-outline"
                iconLeft={showOld ? "eye-off-outline" : "eye-outline"}
                onIconLeftPress={() => setShowOld(!showOld)}
                secureTextEntry={!showOld}
              />

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

        <View style={s.footer}>
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

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f7f9fc',
  },
  content: {
    padding: Spacing.space4,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: Spacing.space4,
    marginBottom: 24,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  sectionTitle: {
    fontFamily: 'Almarai_700Bold',  fontSize: 18,
    color: Colors.primary,
    marginBottom: Spacing.space3,
    writingDirection: 'rtl',
    textAlign: 'left',
    paddingHorizontal: 8,
  },
  form: {
    gap: Spacing.space4,
  },
  footer: {
    padding: Spacing.space4,
    paddingBottom: Platform.OS === 'ios' ? Spacing.space6 : Spacing.space4,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
})
