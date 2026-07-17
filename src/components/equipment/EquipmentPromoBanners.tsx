import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'
import { useRouter } from 'expo-router'

export const EquipmentPromoBanners = () => {
  const router = useRouter()
  return (
    <>


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
        {/* Promo 1: Add Equipment */}
        <View style={[s.promoCard, { backgroundColor: '#fffbeb', borderColor: '#fde68a' }]}>
          <View style={s.promoContent}>
            <View style={[s.badgeWrap, { backgroundColor: '#fef08a' }]}>
              <Text style={[s.badgeTxt, { color: '#b45309' }]}>جديد</Text>
            </View>
            <Text style={[s.promoTitle, { color: '#78350f' }]}>أضف معدتك الأولى!</Text>
            <Text style={[s.promoDesc, { color: '#92400e' }]}>ابحث عن مستأجرين ومشترين لمعداتك بسهولة تامة وبأفضل عائد.</Text>
            <TouchableOpacity style={[s.promoBtn, { backgroundColor: '#d97706' }]} activeOpacity={0.8} onPress={() => router.push('/equipment/add')}>
              <Text style={s.promoBtnTxt}>أضف معدتك الآن</Text>
              <Ionicons name="chevron-back" size={14} color={Colors.white} />
            </TouchableOpacity>
          </View>
          <Ionicons name="hardware-chip" size={80} color="#fde68a" style={s.promoIcon} />
        </View>

        {/* Promo 2: Register Operator */}
        <View style={[s.promoCard, { backgroundColor: '#0B2447', borderColor: '#1e3a8a' }]}>
          <View style={s.promoContent}>
            <Text style={[s.promoTitle, { color: '#ffffff' }]}>سجل كمشغل الآن</Text>
            <Text style={[s.promoDesc, { color: '#cbd5e1' }]}>انضم لأفضل شبكة مشغلي المعدات واعرض خبراتك للشركات والأفراد.</Text>
            <TouchableOpacity style={[s.promoBtn, { backgroundColor: '#1e3a8a' }]} activeOpacity={0.8} onPress={() => router.push('/equipment/operators/add')}>
              <Text style={s.promoBtnTxt}>تسجيل كمشغل</Text>
              <Ionicons name="chevron-back" size={14} color={Colors.white} />
            </TouchableOpacity>
          </View>
          <Ionicons name="person-add" size={80} color="#1e3a8a" style={s.promoIcon} />
        </View>
      </ScrollView>
    </>
  )
}

const s = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: Spacing.space3, marginTop: Spacing.space2,
  },
  sectionTitleHeader: { fontFamily: 'Almarai_800ExtraBold',  fontSize: 18, color: Colors.text, textAlign: 'left' },
  sectionSubHeader: { fontFamily: 'Almarai_400Regular',  fontSize: 13, color: Colors.textMuted, textAlign: 'left' },
  promoContainer: {
    gap: Spacing.space3,
    marginBottom: Spacing.space6,
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
