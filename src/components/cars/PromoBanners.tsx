import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'

export const PromoBanners = () => {
  return (
    <View style={s.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={{ marginHorizontal: -Spacing.space5 }}
        contentContainerStyle={[s.promoContainer, { paddingHorizontal: Spacing.space5 }]}
        snapToInterval={(Dimensions.get('window').width * 0.85) + Spacing.space3}
        snapToAlignment="center"
        disableIntervalMomentum={true}
        decelerationRate="fast"
      >
        {/* Promo 1: Car Insurance */}
        <View style={[s.promoCard, { backgroundColor: '#f0fdf4', borderColor: '#dcfce7' }]}>
          <View style={s.promoContent}>
            <View style={s.badgeWrap}>
              <Text style={[s.badgeTxt, { color: '#166534' }]}>جديد</Text>
            </View>
            <Text style={[s.promoTitle, { color: '#14532d' }]}>تأمين السيارات</Text>
            <Text style={[s.promoDesc, { color: '#166534' }]}>أمّن سيارتك في دقائق بأفضل الأسعار المتاحة محلياً وبكل سهولة.</Text>
            <TouchableOpacity style={[s.promoBtn, { backgroundColor: '#22c55e' }]} activeOpacity={0.8}>
              <Text style={s.promoBtnTxt}>قارن عروض التأمين</Text>
              <Ionicons name="chevron-back" size={14} color={Colors.white} />
            </TouchableOpacity>
          </View>
          <Ionicons name="shield-checkmark" size={80} color="#bbf7d0" style={s.promoIcon} />
        </View>

        {/* Promo 2: Inspection */}
        <View style={[s.promoCard, { backgroundColor: '#f0f9ff', borderColor: '#e0f2fe' }]}>
          <View style={s.promoContent}>
            <Text style={[s.promoTitle, { color: '#0c4a6e' }]}>فحص قبل الشراء</Text>
            <Text style={[s.promoDesc, { color: '#075985' }]}>لا تشتري سيارة مستعملة قبل فحصها بالكامل لضمان راحة بالك.</Text>
            <TouchableOpacity style={[s.promoBtn, { backgroundColor: '#0ea5e9' }]} activeOpacity={0.8}>
              <Text style={s.promoBtnTxt}>احجز موعد فحص</Text>
              <Ionicons name="chevron-back" size={14} color={Colors.white} />
            </TouchableOpacity>
          </View>
          <Ionicons name="car-sport" size={80} color="#bae6fd" style={s.promoIcon} />
        </View>


      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    marginBottom: Spacing.space6,
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: Spacing.space3, marginTop: Spacing.space2,
  },
  sectionTitleHeader: { fontFamily: 'Almarai_800ExtraBold',  fontSize: 18, color: Colors.text, textAlign: 'left' },
  sectionSubHeader: { fontFamily: 'Almarai_400Regular',  fontSize: 13, color: Colors.textMuted, textAlign: 'left' },
  promoContainer: {
    gap: Spacing.space3,
    paddingRight: Spacing.space5,
  },
  promoCard: {
    width: Dimensions.get('window').width * 0.85,
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 24, padding: 20,
    borderWidth: 1, overflow: 'hidden',
  },
  promoContent: {
    flex: 1, zIndex: 2, alignItems: 'flex-start'
  },
  badgeWrap: {
    backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginBottom: 8,
  },
  badgeTxt: {
    fontFamily: 'Almarai_800ExtraBold',  fontSize: 10,
  },
  promoTitle: {
    fontFamily: 'Almarai_800ExtraBold', 
    fontSize: 18, marginBottom: 4, textAlign: 'left',
  },
  promoDesc: {
    fontFamily: 'Almarai_400Regular', 
    fontSize: 13, marginBottom: 16, textAlign: 'left', lineHeight: 22, opacity: 0.9,
  },
  promoBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: Radius.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
    alignSelf: 'flex-end'
  },
  promoBtnTxt: {
    fontFamily: 'Almarai_700Bold', 
    fontSize: 13, color: Colors.white,
  },
  promoIcon: {
    position: 'absolute', left: -16, bottom: -16, zIndex: 1, opacity: 0.4,
    transform: [{ rotate: '15deg' }]
  },
})
