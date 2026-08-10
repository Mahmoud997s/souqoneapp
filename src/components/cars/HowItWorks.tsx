import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'

export const HowItWorks = () => {
  return (
    <View style={s.container}>
      <View style={[s.sectionHeader, { marginBottom: Spacing.space4 }]}>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[s.sectionTitleHeader, { textAlign: 'center' }]}>كيف تستخدم سوق وان للسيارات؟</Text>
          <Text style={[s.sectionSubHeader, { textAlign: 'center' }]}>3 خطوات بسيطة لبيع وشراء سيارتك</Text>
        </View>
      </View>

      <View style={s.stepsContainer}>
        <View style={s.stepItem}>
          <View style={s.stepIconBox}>
            <Ionicons name="search" size={24} color={Colors.primary} />
            <View style={s.stepNumberBadge}><Text style={s.stepNumberTxt}>1</Text></View>
          </View>
          <View style={s.stepTextContent}>
            <Text style={s.stepTitle}>ابحث وقارن</Text>
            <Text style={s.stepDesc}>تصفح آلاف السيارات المتاحة واستخدم الفلاتر للوصول لسيارتك المفضلة.</Text>
          </View>
        </View>

        <View style={s.stepItem}>
          <View style={s.stepIconBox}>
            <Ionicons name="shield-checkmark" size={24} color={Colors.primary} />
            <View style={s.stepNumberBadge}><Text style={s.stepNumberTxt}>2</Text></View>
          </View>
          <View style={s.stepTextContent}>
            <Text style={s.stepTitle}>افحص وتأكد</Text>
            <Text style={s.stepDesc}>اطلب تقرير الفحص الفني الشامل لضمان سلامة وجودة السيارة قبل شرائها.</Text>
          </View>
        </View>

        <View style={s.stepItem}>
          <View style={s.stepIconBox}>
            <Ionicons name="key" size={24} color={Colors.primary} />
            <View style={s.stepNumberBadge}><Text style={s.stepNumberTxt}>3</Text></View>
          </View>
          <View style={s.stepTextContent}>
            <Text style={s.stepTitle}>تواصل وامتلك</Text>
            <Text style={s.stepDesc}>تواصل مع البائع مباشرة وقم بإنهاء إجراءات البيع بأمان وسهولة.</Text>
          </View>
        </View>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container: {},
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  sectionTitleHeader: { 
    fontFamily: 'Almarai_800ExtraBold',  
    fontSize: 15, 
    color: Colors.text,
    lineHeight: 24,
    paddingTop: 4,
    writingDirection: 'rtl'
  },
  sectionSubHeader: { 
    fontFamily: 'Almarai_400Regular',  
    fontSize: 13, 
    color: Colors.textMuted,
    lineHeight: 20,
    paddingTop: 2,
    writingDirection: 'rtl'
  },
  stepsContainer: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.space4,
    gap: Spacing.space4,
    borderWidth: 1, borderColor: Colors.border,
  },
  stepItem: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.space3,
  },
  stepIconBox: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#f0f9ff',
    alignItems: 'center', justifyContent: 'center', position: 'relative'
  },
  stepNumberBadge: {
    position: 'absolute', top: -2, right: -2,
    backgroundColor: '#0ea5e9', width: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.white,
  },
  stepNumberTxt: {
    fontFamily: 'Almarai_800ExtraBold', 
    fontSize: 10, color: Colors.white,
    lineHeight: 14,
    paddingTop: 1.5,
  },
  stepTextContent: {
    flex: 1,
  },
  stepTitle: {
    fontFamily: 'Almarai_800ExtraBold', 
    fontSize: 14, color: Colors.text, textAlign: 'left',
    lineHeight: 20,
    paddingTop: 2,
    marginBottom: 2,
    writingDirection: 'rtl',
  },
  stepDesc: {
    fontFamily: 'Almarai_400Regular', 
    fontSize: 12, color: Colors.textMuted, textAlign: 'left', lineHeight: 18,
    writingDirection: 'rtl',
  },
})
