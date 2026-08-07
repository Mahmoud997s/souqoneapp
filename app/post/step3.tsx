import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AppHeader } from '../../src/components/ui/AppHeader'
import { Colors } from '../../src/constants/colors'
import { Spacing } from '../../src/constants/spacing'
import { Radius } from '../../src/constants/radius'
import { router } from 'expo-router'
import { usePostStore } from '../../src/store/postStore'
import { LinearGradient } from 'expo-linear-gradient'

// Forms
import { CarForm, BusForm, PartForm, ServiceForm } from '../../src/components/post/forms'
import { AppButton } from '../../src/components/ui/AppButton'
import { Stepper } from '../../src/components/ui/Stepper'
import { dialogService } from '../../src/store/dialogStore'

export default function PostStep3Screen() {
  const insets = useSafeAreaInsets()
  const { category, title, description, price, details, editMode } = usePostStore()
  const [isKeyboardVisible, setKeyboardVisible] = useState(false)

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow'
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide'

    const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true))
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false))

    return () => {
      showSub.remove()
      hideSub.remove()
    }
  }, [])

  const validateAndNext = () => {
    if (!title || !title.trim()) {
      dialogService.alert('تنبيه', 'يرجى إدخال عنوان الإعلان')
      return
    }

    if (!description || !description.trim()) {
      dialogService.alert('تنبيه', 'يرجى إدخال وصف الإعلان')
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

    if (category === 'parts') {
      const { partCategory } = details || {}
      if (!partCategory && !details?.category) {
        return dialogService.alert('تنبيه', 'يرجى اختيار قسم قطعة الغيار')
      }
      if (price === '' || price == null || isNaN(Number(price))) {
        return dialogService.alert('تنبيه', 'يرجى إدخال سعر قطعة الغيار')
      }
    }

    if (category === 'services') {
      const { serviceType, providerName } = details || {}
      if (!serviceType) {
        return dialogService.alert('تنبيه', 'يرجى اختيار نوع الخدمة')
      }
      if (!providerName || !providerName.trim()) {
        return dialogService.alert('تنبيه', 'يرجى إدخال اسم مقدم الخدمة أو الورشة')
      }
    }

    router.push('/post/step4')
  }

  const renderForm = () => {
    switch (category) {
      case 'cars':
        return <CarForm />
      case 'buses':
        return <BusForm />
      case 'parts':
        return <PartForm />
      case 'services':
        return <ServiceForm />
      case 'jobs':
      default:
        return (
          <View style={{ padding: Spacing.space4, alignItems: 'center' }}>
            <Text style={{ fontFamily: 'Almarai_700Bold', color: Colors.textMuted }}>
              نموذج {category} قيد التطوير
            </Text>
          </View>
        )
    }
  }

  return (
    <View style={s.root}>
      <AppHeader title="إضافة إعلان" showBack />

      <KeyboardAvoidingView
        style={s.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          style={s.flex1}
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          <View style={s.centerWrap}>
            <View style={s.progressWrap}>
              <Stepper currentStep={3} totalSteps={5} title="التفاصيل والمواصفات" />
            </View>

            {renderForm()}
          </View>
        </ScrollView>

        <View
          style={[
            s.bottomBarWrap,
            { paddingBottom: isKeyboardVisible ? 10 : Math.max(insets.bottom, 12) },
          ]}
        >
          <View style={s.bottomBarContent}>
            <AppButton
              variant="outline"
              size="sm"
              title="السابق"
              onPress={() => router.back()}
              style={{ flex: 1 }}
            />
            <AppButton
              title="التالي"
              size="sm"
              onPress={validateAndNext}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F9FA' },
  flex1: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.space3,
    paddingTop: Spacing.space3,
    paddingBottom: Spacing.space5,
  },
  centerWrap: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  progressWrap: {
    marginBottom: Spacing.space3,
  },
  bottomBarWrap: {
    backgroundColor: Colors.white,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#EEF2F6',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
      },
      android: { elevation: 6 },
    }),
  },
  bottomBarContent: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: Spacing.space3,
    paddingHorizontal: Spacing.space4,
  },
})