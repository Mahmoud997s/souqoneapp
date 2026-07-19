import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '../../src/components/ui/AppHeader';
import { Colors } from '../../src/constants/colors';
import { Radius } from '../../src/constants/radius';

export default function CarrierRegisterIntroScreen() {
  const insets = useSafeAreaInsets();
  const [agreed, setAgreed] = useState(false);
  const [termsVisible, setTermsVisible] = useState(false);

  return (
    <View style={s.root}>
      <AppHeader title="التسجيل كناقل" showBack />
      
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        
        <View style={s.hero}>
          <View style={s.iconWrap}>
            <MaterialCommunityIcons name="truck-fast-outline" size={64} color={Colors.primary} />
          </View>
          <Text style={s.title}>انضم إلى شبكة نواقل سوق ون</Text>
          <Text style={s.subtitle}>ضاعف أرباحك، احصل على طلبات نقل مستمرة، وقم بإدارة عملك بكل سهولة عبر منصة واحدة.</Text>
        </View>

        <View style={s.featuresList}>
          <View style={s.featureItem}>
            <View style={s.featureIcon}>
              <Ionicons name="cash-outline" size={24} color="#10b981" />
            </View>
            <View style={s.featureTextWrap}>
              <Text style={s.featureTitle}>أرباح أعلى وفرص مستمرة</Text>
              <Text style={s.featureDesc}>وصول مباشر لآلاف الطلبات المتاحة يومياً بدون وسطاء، لضمان استمرارية عملك.</Text>
            </View>
          </View>

          <View style={s.featureItem}>
            <View style={s.featureIcon}>
              <Ionicons name="time-outline" size={24} color="#f59e0b" />
            </View>
            <View style={s.featureTextWrap}>
              <Text style={s.featureTitle}>مرونة تامة في العمل</Text>
              <Text style={s.featureDesc}>أنت مدير نفسك. اقبل الطلبات التي تناسبك في الوقت والمكان الذي تفضله.</Text>
            </View>
          </View>

          <View style={s.featureItem}>
            <View style={s.featureIcon}>
              <Ionicons name="shield-checkmark-outline" size={24} color="#3b82f6" />
            </View>
            <View style={s.featureTextWrap}>
              <Text style={s.featureTitle}>بيئة عمل آمنة وموثوقة</Text>
              <Text style={s.featureDesc}>جميع الطلبات والعملاء موثقين لدينا، لضمان حقوقك المادية وحمايتك.</Text>
            </View>
          </View>
        </View>

        <View style={s.checkboxRow}>
          <TouchableOpacity onPress={() => setAgreed(!agreed)} activeOpacity={0.7} style={{ padding: 4, paddingRight: 0 }}>
            <Ionicons 
              name={agreed ? "checkbox" : "square-outline"} 
              size={24} 
              color={agreed ? Colors.primary : '#94a3b8'} 
            />
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={s.termsText}>أوافق على </Text>
            <TouchableOpacity onPress={() => setTermsVisible(true)}>
              <Text style={s.termsLinkText}>شروط وأحكام النواقل في سوق ون</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>

      <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>

        <TouchableOpacity 
          style={[s.startBtn, !agreed && s.startBtnDisabled]}
          onPress={() => {
            if (agreed) {
              router.push('/transport/carrier-onboarding' as any);
            }
          }}
          activeOpacity={agreed ? 0.8 : 1}
        >
          <Text style={s.startBtnText}>ابدأ التسجيل الآن</Text>
          <Ionicons name="arrow-back-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <Modal
        visible={termsVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setTermsVisible(false)}
      >
        <View style={s.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setTermsVisible(false)} />
          <View style={[s.bottomSheet, { paddingBottom: Math.max(insets.bottom, 20), maxHeight: '85%' }]}>
            <View style={s.sheetHeader}>
              <Text style={s.sheetTitle}>شروط وأحكام النواقل</Text>
              <TouchableOpacity onPress={() => setTermsVisible(false)} style={s.sheetCloseBtn}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.sheetScrollContent}>
              <Text style={s.termsHeading}>1. شروط الانضمام</Text>
              <Text style={s.termsParagraph}>- يجب أن يكون لدى الناقل رخصة قيادة سارية المفعول.</Text>
              <Text style={s.termsParagraph}>- يجب أن تكون المركبة بحالة جيدة ومطابقة للمواصفات.</Text>
              
              <Text style={s.termsHeading}>2. الالتزام بالمواعيد</Text>
              <Text style={s.termsParagraph}>- يلتزم الناقل بتسليم البضائع في الوقت المتفق عليه مع العميل.</Text>
              <Text style={s.termsParagraph}>- في حالة التأخير يجب إبلاغ العميل مسبقاً.</Text>

              <Text style={s.termsHeading}>3. المحافظة على الشحنة</Text>
              <Text style={s.termsParagraph}>- يتحمل الناقل المسؤولية الكاملة عن الشحنة منذ استلامها وحتى تسليمها.</Text>
              <Text style={s.termsParagraph}>- في حالة التلف أو الفقدان، يتم التعويض بحسب قيمة الشحنة.</Text>

              <Text style={s.termsHeading}>4. المدفوعات والعمولات</Text>
              <Text style={s.termsParagraph}>- تلتزم بدفع عمولة المنصة المحددة للطلبات الناجحة.</Text>
              <Text style={s.termsParagraph}>- يتم تحويل المستحقات بناءً على طرق الدفع المعتمدة في التطبيق.</Text>
            </ScrollView>
            <TouchableOpacity style={s.acceptTermsBtn} onPress={() => { setAgreed(true); setTermsVisible(false); }}>
              <Text style={s.acceptTermsBtnText}>موافق</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  iconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 22,
    color: '#0f172a',
    textAlign: 'left',
    marginBottom: 12,
    paddingVertical: 4,
  },
  subtitle: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  featuresList: {
    gap: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  featureTextWrap: {
    flex: 1,
  },
  featureTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 16,
    color: '#0f172a',
    marginBottom: 4,
    textAlign: 'left',
    paddingVertical: 4,
  },
  featureDesc: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 14,
    color: '#64748b',
    lineHeight: 22,
    textAlign: 'left',
    paddingVertical: 4,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#fff',
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    height: 54,
    borderRadius: Radius.lg,
    marginBottom: 12,
  },
  startBtnDisabled: {
    opacity: 0.5,
  },
  startBtnText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 16,
    color: '#fff',
    paddingVertical: 4,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 40,
    marginBottom: 0,
  },
  termsText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  termsLinkText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 14,
    color: Colors.primary,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sheetTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 20,
    color: '#0f172a',
  },
  sheetCloseBtn: {
    padding: 4,
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
  },
  sheetScrollContent: {
    paddingBottom: 24,
  },
  termsHeading: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 16,
    color: '#0f172a',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'left',
  },
  termsParagraph: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 14,
    color: '#64748b',
    lineHeight: 24,
    textAlign: 'left',
    marginBottom: 6,
  },
  acceptTermsBtn: {
    backgroundColor: Colors.primary,
    height: 54,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  acceptTermsBtnText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 16,
    color: '#fff',
  },
});
