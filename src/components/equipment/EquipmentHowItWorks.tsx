import React from 'react'
import { View, Text, StyleSheet, ScrollView, Platform, Dimensions } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'

const { width } = Dimensions.get('window')

const STEPS = [
  { num: '01', icon: 'search', title: 'ابحث بسهولة', desc: 'تصفح المعدات والمشغلين عبر فلاتر دقيقة' },
  { num: '02', icon: 'chatbubbles', title: 'تواصل مباشرة', desc: 'دردش مع المالك أو المشغل عبر واتساب' },
  { num: '03', icon: 'shield-checkmark', title: 'أتمّ الصفقة', desc: 'قم بتأجير أو شراء المعدة بكل أمان' },
]

export const EquipmentHowItWorks = () => {
  return (
    <View style={s.container}>
      <View style={s.headerContainer}>
        <Text style={s.mainTitle}>كيف تعمل المنصة؟</Text>
        <Text style={s.subTitle}>ثلاث خطوات بسيطة تفصلك عن معدتك المثالية</Text>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
        snapToInterval={width * 0.75 + Spacing.space3}
        decelerationRate="fast"
      >
        {STEPS.map((step, index) => (
          <View key={index} style={s.card}>
            {/* Watermark Number */}
            <Text style={s.watermark}>{step.num}</Text>
            
            <View style={s.iconContainer}>
              <View style={s.iconBg} />
              <Ionicons name={step.icon as any} size={28} color="#d97706" />
            </View>
            
            <Text style={s.stepTitle}>{step.title}</Text>
            <Text style={s.stepDesc}>{step.desc}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    paddingVertical: Spacing.space6,
    marginBottom: Spacing.space4,
  },
  headerContainer: {
    paddingHorizontal: Spacing.space5,
    marginBottom: Spacing.space4,
    alignItems: 'flex-start',
  },
  mainTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 20,
    color: Colors.text,
    marginBottom: 4,
    textAlign: 'left',
  },
  subTitle: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'left',
  },
  scrollContent: {
    paddingHorizontal: Spacing.space5,
    gap: Spacing.space3,
    paddingBottom: Spacing.space4, // for shadow
  },
  card: {
    width: width * 0.75,
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: Spacing.space5,
    position: 'relative',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#d97706',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: { elevation: 6 },
    }),
  },
  watermark: {
    position: 'absolute',
    top: -10,
    right: -5,
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 80,
    color: '#d97706',
    opacity: 0.04,
    zIndex: 0,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.space4,
    zIndex: 1,
  },
  iconBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#d97706',
    opacity: 0.1,
    borderRadius: 28,
  },
  stepTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 16,
    color: Colors.text,
    marginBottom: Spacing.space2,
    writingDirection: 'rtl',
    textAlign: 'left',
    zIndex: 1,
  },
  stepDesc: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 22,
    writingDirection: 'rtl',
    textAlign: 'left',
    zIndex: 1,
  },
})
