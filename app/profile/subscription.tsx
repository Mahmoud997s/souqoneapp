import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { AppHeader } from '../../src/components/ui/AppHeader'
import { Colors } from '../../src/constants/colors'
import { Spacing } from '../../src/constants/spacing'
import { Radius } from '../../src/constants/radius'
import { paymentsApi } from '../../src/api/payments'
import { dialogService } from '../../src/store/dialogStore'

type PlanId = 'FREE' | 'PRO' | 'ENTERPRISE'

export default function SubscriptionScreen() {
  const [loadingPlan, setLoadingPlan] = useState<PlanId | null>(null)

  const handleSubscribe = async (planId: PlanId) => {
    if (planId === 'FREE') return
    try {
      setLoadingPlan(planId)
      const res = await paymentsApi.subscribe(planId)
      const url = (res.data as any)?.checkoutUrl
      if (url) {
        await Linking.openURL(url)
      } else {
        dialogService.alert('نجاح', 'تم الاشتراك بنجاح')
      }
    } catch (err: any) {
      dialogService.alert('خطأ', err?.response?.data?.message || 'حدث خطأ، حاول مرة أخرى')
    } finally {
      setLoadingPlan(null)
    }
  }

  const PlanCard = ({ planId, title, price, isPopular, isElite, features, btnText, bgColors }: {
    planId: PlanId
    title: string
    price: string
    isPopular?: boolean
    isElite?: boolean
    features: { text: string; disabled?: boolean }[]
    btnText: string
    bgColors: { bg: string; border: string; text: string; btnBg: string; btnTxt: string }
  }) => (
    <View style={[s.card, { backgroundColor: bgColors.bg, borderColor: bgColors.border }]}>
      {isPopular && <View style={s.badge}><Text style={s.badgeTxt}>الأكثر شعبية</Text></View>}
      <View style={s.cardHeader}>
        <View style={s.titleRow}>
          <Text style={[s.cardTitle, { color: bgColors.text }]}>{title}</Text>
          {isElite && <Ionicons name="star" size={16} color={Colors.warning} style={{ marginRight: 4 }} />}
        </View>
        <Text style={[s.price, { color: bgColors.text }]}>{price}</Text>
      </View>
      
      <View style={s.features}>
        {features.map((f, i) => (
          <View key={i} style={[s.featureRow, f.disabled && { opacity: 0.5 }]}>
            <Ionicons name={f.disabled ? 'close-circle' : 'checkmark-circle'} size={20} color={f.disabled ? Colors.borderStrong : (isPopular ? Colors.warning : Colors.success)} />
            <Text style={[s.featureTxt, { color: bgColors.text }, f.disabled && { textDecorationLine: 'line-through' }]}>{f.text}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity 
        style={[s.btn, { backgroundColor: bgColors.btnBg }, planId === 'FREE' && { opacity: 0.6 }]} 
        onPress={() => handleSubscribe(planId)}
        disabled={planId === 'FREE' || loadingPlan === planId}
      >
        {loadingPlan === planId
          ? <ActivityIndicator color={bgColors.btnTxt} />
          : <Text style={[s.btnTxt, { color: bgColors.btnTxt }]}>{btnText}</Text>
        }
      </TouchableOpacity>
    </View>
  )

  return (
    <View style={s.root}>
      <AppHeader title="SouqOne" showBack />
      
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.headerBox}>
          <Text style={s.title}>الاشتراك المميز</Text>
          <Text style={s.subtitle}>اختر الباقة المناسبة لاحتياجاتك لزيادة ظهور إعلاناتك</Text>
        </View>

        <PlanCard 
          planId="FREE"
          title="الأساسية" 
          price="مجاني" 
          features={[
            { text: 'نشر إعلانات غير محدودة' },
            { text: 'دعم فني عبر البريد الإلكتروني' },
            { text: 'تمييز الإعلانات', disabled: true },
          ]}
          btnText="الباقة الحالية"
          bgColors={{ bg: Colors.white, border: Colors.border, text: Colors.text, btnBg: '#f7f9fc', btnTxt: Colors.text }}
        />

        <PlanCard 
          planId="PRO"
          title="بريميوم" 
          price="15 ع.ر/شهر" 
          isPopular
          features={[
            { text: 'كل ميزات الباقة الأساسية' },
            { text: 'تمييز 5 إعلانات أسبوعياً' },
            { text: 'ظهور في نتائج البحث المتقدمة' },
          ]}
          btnText="اشتراك الآن"
          bgColors={{ bg: Colors.primary, border: Colors.warning, text: Colors.white, btnBg: Colors.warning, btnTxt: Colors.white }}
        />

        <PlanCard 
          planId="ENTERPRISE"
          title="إيليت" 
          price="30 ع.ر/شهر" 
          isElite
          features={[
            { text: 'كل ميزات باقة بريميوم' },
            { text: 'تمييز غير محدود للإعلانات' },
            { text: 'أولوية قصوى في الظهور' },
            { text: 'دعم فني مخصص 24/7' },
          ]}
          btnText="اشتراك الآن"
          bgColors={{ bg: Colors.white, border: Colors.border, text: Colors.text, btnBg: Colors.primary, btnTxt: Colors.white }}
        />

      </ScrollView>
    </View>
  )
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f7f9fc' },
  content: { padding: Spacing.space4, paddingBottom: 60, alignItems: 'center' },
  headerBox: { alignItems: 'center', marginBottom: Spacing.space6 },
  title: { fontFamily: 'Almarai_700Bold',  fontSize: 24, color: Colors.primary, marginBottom: 8, writingDirection: 'rtl' },
  subtitle: { fontFamily: 'Almarai_400Regular',  fontSize: 14, color: Colors.text2, textAlign: 'center', writingDirection: 'rtl' },
  card: { maxWidth: 400, width: '100%', borderRadius: Radius.xl, borderWidth: 1, padding: Spacing.space4, marginBottom: Spacing.space4, position: 'relative' },
  badge: { position: 'absolute', top: -12, alignSelf: 'center', backgroundColor: Colors.warning, paddingHorizontal: 12, paddingVertical: 4, borderRadius: Radius.pill },
  badgeTxt: { fontFamily: 'Almarai_700Bold',  fontSize: 12, color: Colors.white },
  cardHeader: { alignItems: 'center', marginBottom: Spacing.space4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontFamily: 'Almarai_700Bold',  fontSize: 20 },
  price: { fontFamily: 'Almarai_800ExtraBold',  fontSize: 28, marginTop: 4 },
  features: { gap: Spacing.space3, marginBottom: Spacing.space6 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8, writingDirection: 'rtl' },
  featureTxt: { flex: 1, fontFamily: 'Almarai_400Regular',  fontSize: 14, writingDirection: 'rtl' },
  btn: { paddingVertical: 12, borderRadius: Radius.lg, alignItems: 'center' },
  btnTxt: { fontFamily: 'Almarai_700Bold',  fontSize: 16 }
})
