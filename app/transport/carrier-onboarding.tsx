import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform, ActivityIndicator, KeyboardAvoidingView, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { transportApi } from '../../src/api/transport';
import { useCarrierWizardStore } from '../../src/store/carrierWizardStore';
import { AppHeader } from '../../src/components/ui/AppHeader';
import { Stepper } from '../../src/components/ui/Stepper';
import { Colors } from '../../src/constants/colors';
import { Radius } from '../../src/constants/radius';

// Steps
import CarrierStep1Info from '../../src/components/transport/carrier/CarrierStep1Info';
import CarrierStep2Vehicles from '../../src/components/transport/carrier/CarrierStep2Vehicles';
import CarrierStep3Location from '../../src/components/transport/carrier/CarrierStep3Location';
import { dialogService } from '../../src/store/dialogStore'

export default function CarrierOnboardingScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const {
    companyName,
    bio,
    vehicleTypes,
    serviceTypes,
    governorate,
    city,
    baseLat,
    baseLng,
    contactPhone,
    whatsapp,
    reset,
  } = useCarrierWizardStore();

  const createMutation = useMutation({
    mutationFn: async () => {
      return transportApi.createCarrierProfile({
        companyName: companyName || undefined,
        bio: bio || undefined,
        vehicleTypes,
        serviceTypes,
        governorate,
        city: city || undefined,
        baseLat,
        baseLng,
        contactPhone: contactPhone || undefined,
        whatsapp: whatsapp || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-carrier-profile'] });
      reset();
      dialogService.alert('تم بنجاح', 'تم تسجيلك كناقل في النظام بنجاح!', 'success')
      router.replace('/transport/carrier-dashboard' as any)
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message;
      const errorText = Array.isArray(msg) ? msg.join('\n') : (msg || 'حدث خطأ أثناء إنشاء الحساب');
      dialogService.alert('خطأ', errorText);
    }
  });

  const handleNext = () => {
    const storeErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!companyName?.trim()) storeErrors.companyName = 'اسم الشركة / الشخص مطلوب';
      if (!bio?.trim()) storeErrors.bio = 'نبذة تعريفية مطلوبة';
      if (!contactPhone?.trim()) storeErrors.contactPhone = 'رقم الهاتف الرئيسي مطلوب';
      if (!whatsapp?.trim()) storeErrors.whatsapp = 'رقم الواتساب مطلوب';
      
      if (Object.keys(storeErrors).length > 0) {
        useCarrierWizardStore.getState().setErrors(storeErrors);
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (vehicleTypes.length === 0) storeErrors.vehicleTypes = 'الرجاء اختيار نوع المركبة على الأقل';
      if (serviceTypes.length === 0) storeErrors.serviceTypes = 'الرجاء اختيار نوع الخدمة على الأقل';
      
      if (Object.keys(storeErrors).length > 0) {
        useCarrierWizardStore.getState().setErrors(storeErrors);
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (!governorate) storeErrors.governorate = 'الرجاء اختيار المحافظة الأساسية';
      if (!city?.trim()) storeErrors.city = 'الرجاء إدخال الولاية / المدينة';
      
      if (Object.keys(storeErrors).length > 0) {
        useCarrierWizardStore.getState().setErrors(storeErrors);
        return;
      }
      createMutation.mutate();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return 'معلومات الناقل';
      case 2: return 'المركبة والخدمات';
      case 3: return 'النطاق الجغرافي';
      default: return 'انضم كناقل';
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[s.root, { paddingBottom: insets.bottom }]}>
        <AppHeader
          title="انضم كناقل"
          showBack
          onLeftPress={handleBack}
        />
        
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <View style={{ paddingBottom: 24 }}>
            <Stepper currentStep={currentStep} totalSteps={totalSteps} title={getStepTitle()} />
          </View>
          {currentStep === 1 && <CarrierStep1Info />}
          {currentStep === 2 && <CarrierStep2Vehicles />}
          {currentStep === 3 && <CarrierStep3Location />}
        </ScrollView>

        <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TouchableOpacity
            style={s.nextBtn}
            onPress={handleNext}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={s.nextBtnText}>{currentStep === totalSteps ? 'تأكيد والتسجيل' : 'التالي'}</Text>
                <Ionicons name="arrow-back-outline" size={20} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },
  content: {
    padding: 16,
    paddingBottom: 120,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    start: 0,
    end: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  nextBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    borderRadius: Radius.lg,
    gap: 8,
  },
  nextBtnText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 16,
    color: '#fff',
  },
});
