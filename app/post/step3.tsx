import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AppHeader } from '../../src/components/ui/AppHeader'
import { Colors } from '../../src/constants/colors'
import { Spacing } from '../../src/constants/spacing'
import { Radius } from '../../src/constants/radius'
import { router } from 'expo-router'
import { usePostStore } from '../../src/store/postStore'
import { LinearGradient } from 'expo-linear-gradient'

// Forms
import { CarForm } from './_components/forms/CarForm'
import { BusForm } from './_components/forms/BusForm'
import { AppButton } from '../../src/components/ui/AppButton'
import { Stepper } from '../../src/components/ui/Stepper'
import { dialogService } from '../../src/store/dialogStore'

export default function PostStep3Screen() {
  const insets = useSafeAreaInsets()
  const { category, title, description, price, details } = usePostStore()

  const validateAndNext = () => {
    if (!title || !title.trim()) {
      dialogService.alert('تنبيه', 'يرجى إدخال عنوان الإعلان')
      return
    }



    if (category === 'cars') {
      const { listingType, condition, make, model, year, mileage } = details || {}
      if (!listingType) return dialogService.alert('تنبيه', 'يرجى اختيار نوع الإعلان')
      if (!condition) return dialogService.alert('تنبيه', 'يرجى اختيار الحالة')
      if (!make) return dialogService.alert('تنبيه', 'يرجى اختيار الماركة')
      if (!model) return dialogService.alert('تنبيه', 'يرجى اختيار الموديل')
      if (!year) return dialogService.alert('تنبيه', 'يرجى اختيار سنة الصنع')
      if (!mileage) return dialogService.alert('تنبيه', 'يرجى إدخال الممشى')
    }

    if (category === 'buses') {
      const { busListingType, busType, make, model, year, capacity } = details || {}
      if (!busListingType) return dialogService.alert('تنبيه', 'يرجى اختيار نوع الإعلان')
      if (!make) return dialogService.alert('تنبيه', 'يرجى اختيار الماركة')
      if (!model) return dialogService.alert('تنبيه', 'يرجى إدخال الموديل')
      if (!year) return dialogService.alert('تنبيه', 'يرجى إدخال سنة الصنع')
      if (!capacity) return dialogService.alert('تنبيه', 'يرجى إدخال عدد المقاعد')
      if (!busType) return dialogService.alert('تنبيه', 'يرجى اختيار فئة الحافلة')
    }

    router.push('/post/step4')
  }

  const renderForm = () => {
    switch (category) {
      case 'cars':
        return <CarForm />
      case 'buses':
        return <BusForm />
      case 'jobs':
      case 'services':
      case 'parts':
      default:
        return (
          <View style={{ padding: Spacing.space4, alignItems: 'center' }}>
            <Text style={{ fontFamily: 'Almarai_700Bold',  color: Colors.textMuted }}>
              نموذج {category} قيد التطوير
            </Text>
          </View>
        )
    }
  }

  return (
    <View style={s.root}>
      <AppHeader title="إضافة إعلان" showBack />

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={s.progressWrap}>

          <Stepper currentStep={3} totalSteps={5} title="التفاصيل والمواصفات" />
        </View>

        <View style={s.headerBox}>
          <Text style={s.title}>التفاصيل والمواصفات</Text>
          <Text style={s.subtitle}>يرجى تعبئة التفاصيل بدقة لزيادة فرصة ظهور إعلانك للمهتمين.</Text>
        </View>

        {renderForm()}
      </ScrollView>

      <View style={[s.bottomBar, { bottom: Math.max(insets.bottom, Spacing.space4) }]}>
        <AppButton variant="outline" title="السابق" onPress={() => router.back()} style={{ flex: 1 }} />
        <AppButton 
          title="التالي" 
          onPress={validateAndNext}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F9FA' },
  content: { padding: Spacing.space4, paddingBottom: 100 },
  progressWrap: { marginBottom: Spacing.space6 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.space2 },
  progressStepTxt: { fontFamily: 'Almarai_700Bold',  fontSize: 12, color: Colors.textMuted },
  progressTitle: { fontFamily: 'Almarai_700Bold',  fontSize: 12, color: Colors.primary },
  progressBarBg: { height: 10, backgroundColor: Colors.surface, borderRadius: 100, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 100 },
  headerBox: { marginBottom: Spacing.space6 },
  title: { fontFamily: 'Almarai_800ExtraBold',  fontSize: 20, color: Colors.text, writingDirection: 'rtl', marginBottom: Spacing.space2 },
  subtitle: { fontFamily: 'Almarai_400Regular',  fontSize: 14, color: Colors.textMuted, writingDirection: 'rtl', lineHeight: 22 },
  bottomBar: { 
    position: 'absolute', left: 0, right: 0, 
    paddingHorizontal: Spacing.space4, 
    flexDirection: 'row', gap: Spacing.space3
  },
})