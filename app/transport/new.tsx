import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView } from 'react-native';
import { Stack, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../src/constants/colors';
import { Spacing } from '../../src/constants/spacing';
import { useTransportWizardStore } from '../../src/store/transportWizardStore';
import { useCreateTransportRequest } from '../../src/hooks/useTransport';
import { useAuthStore } from '../../src/store/authStore';
import { AppHeader } from '../../src/components/ui/AppHeader';
import { Stepper } from '../../src/components/ui/Stepper';
import { AppButton } from '../../src/components/ui/AppButton';

import { TransportStep1Service } from '../../src/components/transport/wizard/TransportStep1Service';
import { TransportStep2Location } from '../../src/components/transport/wizard/TransportStep2Location';
import { TransportStep3Details } from '../../src/components/transport/wizard/TransportStep3Details';
import { TransportStep4Budget } from '../../src/components/transport/wizard/TransportStep4Budget';
import { TransportStep5Review } from '../../src/components/transport/wizard/TransportStep5Review';
import { Ionicons } from '@expo/vector-icons';
import { Radius } from '../../src/constants/radius';
import { dialogService } from '../../src/store/dialogStore'

const TOTAL_STEPS = 5;

export default function NewTransportRequest() {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { currentStep, nextStep, prevStep, data } = useTransportWizardStore();
  const { mutateAsync: createRequest, isPending } = useCreateTransportRequest();

  if (!user) {
    return (
      <View style={[styles.root, { paddingTop: insets.top, alignItems: 'center', justifyContent: 'center' }]}>
        <Ionicons name="lock-closed-outline" size={48} color={Colors.textMuted} />
        <Text style={{ fontFamily: 'Almarai_700Bold', fontSize: 16, color: Colors.text, marginTop: 12 }}>يجب تسجيل الدخول</Text>
        <TouchableOpacity style={{ backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: Radius.md, marginTop: 16 }} onPress={() => router.push('/(auth)/login')}>
          <Text style={{ fontFamily: 'Almarai_700Bold', fontSize: 14, color: '#fff' }}>تسجيل الدخول</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBack = () => {
    if (currentStep > 1) {
      prevStep();
    } else {
      router.back();
    }
  };

  const validateStep = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    switch (currentStep) {
      case 1:
        if (!data.serviceType) errs.serviceType = 'الرجاء اختيار نوع الخدمة';
        break;
      case 2:
        if (!data.fromGovernorateId) errs.fromGovernorateId = 'الرجاء تحديد موقع الانطلاق';
        if (!data.toGovernorateId) errs.toGovernorateId = 'الرجاء تحديد موقع الوصول';
        break;
      case 3:
        if (data.cargoDescription.trim().length < 5) errs.cargoDescription = 'الرجاء كتابة وصف واضح لا يقل عن 5 أحرف';
        if (!data.weightTons || data.weightTons <= 0) errs.weightTons = 'الرجاء تحديد الوزن التقريبي';
        if (!data.notes || data.notes.trim().length < 2) errs.notes = 'الرجاء كتابة ملاحظات للناقل أو النفي إن لم يوجد';
        break;
      case 4:
        if (!data.scheduledDate || data.scheduledDate.trim().length === 0) errs.scheduledDate = 'الرجاء اختيار التاريخ';
        if (!data.scheduledTime || data.scheduledTime.trim().length === 0) errs.scheduledTime = 'الرجاء اختيار الوقت';
        
        if (data.scheduledDateObj && data.scheduledTimeObj) {
          const sDate = new Date(data.scheduledDateObj);
          const sTime = new Date(data.scheduledTimeObj);
          const combined = new Date(
            sDate.getFullYear(),
            sDate.getMonth(),
            sDate.getDate(),
            sTime.getHours(),
            sTime.getMinutes()
          );
          // Require at least 15 minutes in the future to give them time to review
          const minFutureTime = new Date(Date.now() + 15 * 60000);
          if (combined < minFutureTime) {
            errs.scheduledTime = 'الرجاء اختيار موعد لا يقل عن 15 دقيقة من الآن';
          }
        }

        if (!data.budgetMin || data.budgetMin <= 0) errs.budgetMin = 'مطلوب إدخال الحد الأدنى';
        if (!data.budgetMax || data.budgetMax <= 0) errs.budgetMax = 'مطلوب إدخال الحد الأعلى';
        else if (data.budgetMax < (data.budgetMin || 0)) errs.budgetMax = 'يجب أن يكون الحد الأعلى أكبر من أو يساوي الحد الأدنى';
        break;
    }
    return errs;
  };

  const handleNext = async () => {
    const errs = validateStep();
    if (Object.keys(errs).length > 0) {
      useTransportWizardStore.getState().setErrors(errs);
      return;
    }
    useTransportWizardStore.getState().setErrors({});

    if (currentStep < TOTAL_STEPS) {
      nextStep();
    } else {
      // 1. Full Validation before hitting the Backend
      const missingFields: string[] = [];
      if (!data.serviceType) missingFields.push('نوع الشحن');
      if (!data.fromGovernorateId || !data.toGovernorateId) missingFields.push('مواقع الانطلاق والوصول');
      if (!data.cargoDescription || data.cargoDescription.trim().length < 5) missingFields.push('وصف الحمولة (5 أحرف على الأقل)');
      if (!data.weightTons || data.weightTons <= 0) missingFields.push('الوزن التقريبي');
      if (!data.timingType) missingFields.push('تحديد الموعد (في أقرب وقت / مجدول)');
      if (data.timingType === 'scheduled' && (!data.scheduledDateObj || !data.scheduledTimeObj)) missingFields.push('تاريخ ووقت النقل');

      if (missingFields.length > 0) {
        dialogService.alert(
          'بيانات غير مكتملة',
          'الرجاء التأكد من إدخال البيانات التالية لتتمكن من إرسال الطلب بنجاح:\n\n' + missingFields.map(f => `• ${f}`).join('\n')
        );
        return;
      }

      let isoScheduledAt: string | undefined = undefined;
      if (data.timingType === 'scheduled' && data.scheduledDateObj && data.scheduledTimeObj) {
        const sDate = new Date(data.scheduledDateObj);
        const sTime = new Date(data.scheduledTimeObj);
        let combined = new Date(
          sDate.getFullYear(),
          sDate.getMonth(),
          sDate.getDate(),
          sTime.getHours(),
          sTime.getMinutes()
        );
        
        isoScheduledAt = combined.toISOString();
      }

      const payload: any = {
        serviceType: data.serviceType,
        fromGovernorateId: data.fromGovernorateId,
        fromWilayaId: data.fromWilayaId,
        fromAddress: `${data.fromGovernorateNameAr}${data.fromWilayaNameAr ? ' - ' + data.fromWilayaNameAr : ''}, سلطنة عمان`,
        fromLat: data.fromLat,
        fromLng: data.fromLng,
        toGovernorateId: data.toGovernorateId,
        toWilayaId: data.toWilayaId,
        toAddress: `${data.toGovernorateNameAr}${data.toWilayaNameAr ? ' - ' + data.toWilayaNameAr : ''}, سلطنة عمان`,
        toLat: data.toLat,
        toLng: data.toLng,
        cargoDescription: data.cargoDescription,
        weightTons: data.weightTons,
        requiresHelper: data.requiresHelper,
        notes: data.notes,
        scheduledAt: isoScheduledAt,
        isFlexible: data.isFlexible,
        budgetMin: data.budgetMin,
        budgetMax: data.budgetMax,
      };
      // Remove undefined fields
      Object.keys(payload).forEach(key => {
        if (payload[key] === undefined) {
          delete payload[key];
        }
      });

      try {
        await createRequest(payload);
        // On success, go to my requests
        router.replace('/transport/my-requests');
      } catch (err: any) {
        console.error('Failed to create request', err.response?.data || err);
        const msg = err.response?.data?.message || err.response?.data?.error || err.message;
        dialogService.alert(
          'حدث خطأ أثناء الإرسال',
          `الوقت المرسل: ${payload.scheduledAt}\n\nرد الخادم: ${Array.isArray(msg) ? msg.join('\n') : String(msg)}`
        );
      }
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <TransportStep1Service />;
      case 2: return <TransportStep2Location />;
      case 3: return <TransportStep3Details />;
      case 4: return <TransportStep4Budget />;
      case 5: return <TransportStep5Review />;
      default: return <TransportStep1Service />;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return 'نوع الشحن والخدمة';
      case 2: return 'مسار النقل';
      case 3: return 'تفاصيل الحمولة';
      case 4: return 'الموعد والميزانية';
      case 5: return 'مراجعة الطلب';
      default: return 'طلب نقل جديد';
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.root, { paddingBottom: insets.bottom }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <AppHeader title="طلب نقل جديد" onLeftPress={handleBack} showBack variant="jobs" />
        
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Stepper currentStep={currentStep} totalSteps={TOTAL_STEPS} title={getStepTitle()} />
          
          {renderStep()}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, Spacing.space4) }]}>
          <AppButton
            title={currentStep === TOTAL_STEPS ? 'إرسال الطلب' : 'التالي'}
            size="sm"
            onPress={handleNext}
            disabled={isPending}
            loading={isPending}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    padding: Spacing.space4,
    paddingBottom: 120,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    start: 0,
    end: 0,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.space4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
