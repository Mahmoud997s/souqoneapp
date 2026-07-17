import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Radius } from '../../constants/radius'
import { Spacing } from '../../constants/spacing'
import { router } from 'expo-router'
import { VerificationStatus } from '../../types/jobs.types'

interface VerificationBannerProps {
  status?: VerificationStatus
  rejectionReason?: string
}

export default function VerificationBanner({ status, rejectionReason }: VerificationBannerProps) {
  const isPending = status?.toUpperCase() === 'PENDING'
  const isRejected = status?.toUpperCase() === 'REJECTED'

  let iconName: keyof typeof Ionicons.glyphMap = 'shield-half-outline'
  let iconColor = '#D97706' // amber-600
  let bgColor = '#FFFBEB'   // amber-50
  let borderColor = '#FDE68A' // amber-200
  let iconBgColor = '#FEF3C7' // amber-100
  let titleColor = '#92400E'  // amber-800
  let descColor = '#B45309'   // amber-700
  let title = 'وثّق حسابك الآن'
  let desc = 'احصل على شارة الموثوقية لزيادة فرصك في الحصول على وظائف وعروض أفضل.'
  let btnText = 'طلب التوثيق'

  if (isPending) {
    iconName = 'time-outline'
    iconColor = '#0284C7' // sky-600
    bgColor = '#F0F9FF'   // sky-50
    borderColor = '#BAE6FD' // sky-200
    iconBgColor = '#E0F2FE' // sky-100
    titleColor = '#075985'  // sky-800
    descColor = '#0369A1'   // sky-700
    title = 'التوثيق قيد المراجعة'
    desc = 'جاري مراجعة طلبك من قبل الإدارة. سيتم إشعارك فور الانتهاء من المراجعة.'
    btnText = 'عرض الطلب'
  } else if (isRejected) {
    iconName = 'close-circle-outline'
    iconColor = '#DC2626' // red-600
    bgColor = '#FEF2F2'   // red-50
    borderColor = '#FECACA' // red-200
    iconBgColor = '#FEE2E2' // red-100
    titleColor = '#991B1B'  // red-800
    descColor = '#B91C1C'   // red-700
    title = 'فشل توثيق الحساب'
    desc = rejectionReason ? `السبب: ${rejectionReason}` : 'نعتذر، لم يتم قبول طلب التوثيق الخاص بك. يرجى مراجعة البيانات والمحاولة مجدداً.'
    btnText = 'إعادة المحاولة'
  }

  return (
    <View style={[s.banner, { backgroundColor: bgColor, borderColor }]}>
      <View style={[s.iconContainer, { backgroundColor: iconBgColor }]}>
        <Ionicons name={iconName} size={24} color={iconColor} />
      </View>
      <View style={s.content}>
        <Text style={[s.title, { color: titleColor }]}>{title}</Text>
        <Text style={[s.desc, { color: descColor }]}>{desc}</Text>
        <TouchableOpacity
          style={[s.button, { backgroundColor: iconColor }]}
          activeOpacity={0.8}
          onPress={() => router.push('/jobs/verification')}
        >
          <Text style={s.buttonText}>{btnText}</Text>
          <Ionicons name="chevron-back" size={14} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.space3,
    marginBottom: Spacing.space4,
    gap: Spacing.space3,
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'flex-start',
  },
  title: {
    fontFamily: 'Almarai_800ExtraBold', fontSize: 15,
    marginBottom: 4,
    textAlign: 'left', writingDirection: 'rtl',
  },
  desc: {
    fontFamily: 'Almarai_400Regular', fontSize: 13,
    lineHeight: 20,
    textAlign: 'left', writingDirection: 'rtl',
    marginBottom: Spacing.space2,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: Radius.pill,
    paddingVertical: 6,
    paddingHorizontal: Spacing.space3,
    alignSelf: 'flex-end', // Aligns to the physical left in RTL
  },
  buttonText: {
    color: '#ffffff',
    fontFamily: 'Almarai_700Bold', fontSize: 12,
  },
})
