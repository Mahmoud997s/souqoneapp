import React from 'react'
import { View, Text, StyleSheet, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'

const STEPS = [
  {
    num: '1',
    icon: 'barcode-outline',
    title: 'ابحث برقم القطعة أو الماركة',
    desc: 'ابحث بسهولة بالاسم، رقم القطعة، الموديل أو تصفح الأقسام للعثور على القطعة المطابقة.',
    color: '#ea580c',
    bg: '#ffedd5',
  },
  {
    num: '2',
    icon: 'shield-checkmark-outline',
    title: 'تأكد من الأصالة والمطابقة',
    desc: 'راجع تفاصيل القطعة (أصلية وكالة، تجارية، أو سكراب) وتأكد من توافقها مع سنة وموديل سيارتك.',
    color: '#2563eb',
    bg: '#dbeafe',
  },
  {
    num: '3',
    icon: 'chatbubbles-outline',
    title: 'تواصل مباشرة واستلم قطعتك',
    desc: 'تواصل فوراً مع البائع أو السكراب عبر الاتصال أو الواتساب واستلم قطعتك بأفضل سعر.',
    color: '#16a34a',
    bg: '#dcfce7',
  },
]

export const PartsHowItWorks = () => {
  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>كيف يعمل سوق قطع الغيار؟</Text>
        <Text style={s.subTitle}>3 خطوات بسيطة للحصول على قطعة الغيار المناسبة لسيارتك</Text>
      </View>

      <View style={s.stepsContainer}>
        {STEPS.map((step, idx) => (
          <View key={idx} style={s.stepItem}>
            <View style={[s.stepIconBox, { backgroundColor: step.bg }]}>
              <Ionicons name={step.icon as any} size={24} color={step.color} />
              <View style={[s.stepNumberBadge, { backgroundColor: step.color }]}>
                <Text style={s.stepNumberTxt}>{step.num}</Text>
              </View>
            </View>
            <View style={s.stepTextContent}>
              <Text style={s.stepTitle}>{step.title}</Text>
              <Text style={s.stepDesc}>{step.desc}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container: {},
  header: {
    marginBottom: Spacing.space4,
  },
  title: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 18,
    color: Colors.text,
    textAlign: 'left',
    lineHeight: 26,
    writingDirection: 'rtl',
    marginBottom: 4,
  },
  subTitle: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 12.5,
    color: Colors.textMuted,
    textAlign: 'left',
    lineHeight: 18,
    writingDirection: 'rtl',
  },
  stepsContainer: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.space4,
    gap: Spacing.space4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.space3,
  },
  stepIconBox: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  stepNumberBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  stepNumberTxt: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 10,
    color: Colors.white,
    lineHeight: 12,
    paddingTop: 1,
  },
  stepTextContent: {
    flex: 1,
  },
  stepTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 14,
    color: Colors.text,
    textAlign: 'left',
    lineHeight: 20,
    writingDirection: 'rtl',
    marginBottom: 4,
  },
  stepDesc: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'left',
    lineHeight: 18,
    writingDirection: 'rtl',
  },
})
