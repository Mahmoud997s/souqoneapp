import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Radius } from '../../constants/radius'
import { Spacing } from '../../constants/spacing'
import { OPERATOR_FAQ_ITEMS } from '../../constants/operators'

export function OperatorFAQ() {
  return (
    <View style={s.faqContainer}>
      <View style={s.faqHeader}>
        <View style={s.faqIconWrap}>
          <Ionicons name="help-circle-outline" size={20} color={Colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.faqTitle}>الأسئلة الشائعة حول دليل المشغلين</Text>
          <Text style={s.faqSubtitle}>كل ما تحتاج معرفته عن خدمات وتوظيف المشغلين</Text>
        </View>
      </View>

      <View style={s.faqCardsWrap}>
        {OPERATOR_FAQ_ITEMS.map((item, idx) => (
          <View key={idx} style={s.faqCard}>
            <View style={s.faqQRow}>
              <View style={s.faqQDot} />
              <Text style={s.faqQText}>{item.q}</Text>
            </View>
            <Text style={s.faqAText}>{item.a}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  faqContainer: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.space3,
    marginTop: Spacing.space3,
    marginBottom: Spacing.space3,
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space2,
    marginBottom: Spacing.space2,
  },
  faqIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  faqTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 13.5,
    lineHeight: 18,
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  faqSubtitle: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    lineHeight: 15,
    color: Colors.textMuted,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  faqCardsWrap: {
    gap: 8,
  },
  faqCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.md,
    padding: Spacing.space3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  faqQRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 3,
  },
  faqQDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.primary,
  },
  faqQText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  faqAText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11.5,
    lineHeight: 16,
    color: Colors.textMuted,
    textAlign: 'left',
    writingDirection: 'rtl',
    paddingStart: 10,
  },
})
