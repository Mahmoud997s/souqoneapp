import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Radius } from '../../constants/radius'
import { Spacing } from '../../constants/spacing'
import { router } from 'expo-router'

export default function VerificationBanner() {
  return (
    <View style={s.banner}>
      <Ionicons name="warning-outline" size={20} color="#D97706" style={s.icon} />
      <View style={s.content}>
        <Text style={s.title}>حسابك غير موثق بعد</Text>
        <Text style={s.desc}>وثق حسابك للحصول على شارة موثق وجذب أصحاب الأعمال لإعلاناتك وعروضك.</Text>
        <TouchableOpacity
          style={s.button}
          activeOpacity={0.8}
          onPress={() => router.push('/jobs/verification')}
        >
          <Text style={s.buttonText}>طلب التوثيق الآن</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    backgroundColor: '#FFFBEB', // amber-50
    borderWidth: 1,
    borderColor: '#FDE68A', // amber-200
    borderRadius: Radius.lg,
    padding: Spacing.space4,
    marginBottom: Spacing.space4,
  },
  icon: {
    marginLeft: 12,
    marginTop: 2,
  },
  content: {
    flex: 1,
    alignItems: 'flex-end',
  },
  title: {
    fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 14,
    color: '#92400E', // amber-800
    marginBottom: Spacing.space1,
    textAlign: 'right',
  },
  desc: {
    fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 12,
    color: '#B45309', // amber-700
    lineHeight: 18,
    textAlign: 'right',
    marginBottom: Spacing.space3,
  },
  button: {
    backgroundColor: '#D97706', // amber-600
    borderRadius: Radius.sm,
    paddingVertical: 6,
    paddingHorizontal: Spacing.space3,
  },
  buttonText: {
    color: '#ffffff',
    fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 12,
  },
})
