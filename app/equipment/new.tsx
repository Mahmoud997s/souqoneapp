import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity } from 'react-native';
import { Stack, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../src/constants/colors';
import { Spacing } from '../../src/constants/spacing';
import { useAuthStore } from '../../src/store/authStore';
import { AppHeader } from '../../src/components/ui/AppHeader';
import { Stepper } from '../../src/components/ui/Stepper';
import { AppButton } from '../../src/components/ui/AppButton';
import { Ionicons } from '@expo/vector-icons';
import { Radius } from '../../src/constants/radius';

import { useCreateEquipment, useUpdateEquipment } from '../../src/hooks/useEquipment';
import { dialogService } from '../../src/store/dialogStore';
import { useEquipmentStore } from '../../src/store/equipmentPostStore';
import { EquipmentStep1Type } from '../../src/components/equipment/wizard/EquipmentStep1Type';
import { EquipmentStep2Details } from '../../src/components/equipment/wizard/EquipmentStep2Details';
import { EquipmentStep3Images } from '../../src/components/equipment/wizard/EquipmentStep3Images';
import { EquipmentStep4Location } from '../../src/components/equipment/wizard/EquipmentStep4Location';
import { EquipmentStep5Review } from '../../src/components/equipment/wizard/EquipmentStep5Review';

const TOTAL_STEPS = 5;

export default function NewEquipmentListing() {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { currentStep, nextStep, prevStep } = useEquipmentStore();
  const [isPending, setIsPending] = useState(false);

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

  const validateStep = () => {
    const errs: Record<string, string> = {};
    if (currentStep === 1) {
      if (!state.listingType) errs.listingType = 'يرجى اختيار نوع الإعلان';
      if (!state.equipmentType) errs.equipmentType = 'يرجى اختيار فئة المعدة';
      if (!state.title || !state.title.trim()) errs.title = 'عنوان الإعلان مطلوب';
      if (!state.description || !state.description.trim()) errs.description = 'وصف المعدة مطلوب';
    } else if (currentStep === 2) {
      if (!state.make) errs.make = 'الماركة مطلوبة';
      if (!state.model) errs.model = 'الموديل مطلوب';
      if (!state.year) errs.year = 'سنة الصنع مطلوبة';
      if (state.listingType !== 'EQUIPMENT_WANTED' && !state.condition) errs.condition = 'يرجى اختيار الحالة';
      
      // Technical fields
      if (!state.capacity) errs.capacity = 'مطلوب';
      if (!state.power) errs.power = 'مطلوب';
      if (!state.weight) errs.weight = 'مطلوب';
      if (!state.hoursUsed) errs.hoursUsed = 'مطلوب';
    } else if (currentStep === 3) {
      if (state.listingType !== 'EQUIPMENT_WANTED' && state.images.length === 0 && (!state.existingImages || state.existingImages.length === 0)) {
        errs.images = 'يجب إضافة صورة واحدة على الأقل';
      }
    } else if (currentStep === 4) {
      if (!state.governorate) errs.governorate = 'المحافظة مطلوبة';
      if (!state.city) errs.city = 'الولاية مطلوبة';
      if (!state.quantity) errs.quantity = 'الكمية مطلوبة';
      
      if (state.listingType === 'EQUIPMENT_SALE') {
        if (!state.price) errs.price = 'السعر مطلوب';
      } else if (state.listingType === 'EQUIPMENT_RENT') {
        if (!state.dailyPrice && !state.monthlyPrice) {
          errs.dailyPrice = 'يجب إدخال سعر إيجار واحد على الأقل';
          errs.monthlyPrice = 'يجب إدخال سعر إيجار واحد على الأقل';
        }
      } else if (state.listingType === 'EQUIPMENT_WANTED') {
        if (!state.budgetMin) errs.budgetMin = 'الميزانية مطلوبة';
        if (!state.budgetMax) errs.budgetMax = 'الميزانية مطلوبة';
      }
    }
    return errs;
  };

  const handleNext = () => {
    const errs = validateStep();
    if (Object.keys(errs).length > 0) {
      state.setErrors(errs);
      // Optional: show a quick alert for the user if they miss a lot
      if (currentStep === 3 && errs.images) {
        dialogService.alert('تنبيه', errs.images);
      }
      return;
    }
    state.clearErrors();

    if (currentStep < TOTAL_STEPS) {
      nextStep();
    } else {
      // Final comprehensive check
      const missingFields: string[] = [];
      if (!state.title) missingFields.push('عنوان الإعلان');
      if (!state.equipmentType) missingFields.push('فئة المعدة');
      if (!state.governorate || !state.city) missingFields.push('الموقع (المحافظة والولاية)');
      
      if (missingFields.length > 0) {
        dialogService.alert(
          'بيانات غير مكتملة',
          'الرجاء التأكد من إدخال البيانات التالية لتتمكن من إرسال الإعلان بنجاح:\n\n' + missingFields.map(f => `• ${f}`).join('\n')
        );
        return;
      }
      submitListing();
    }
  };

  const { mutateAsync: createEquipment } = useCreateEquipment();
  const { mutateAsync: updateEquipment } = useUpdateEquipment();
  const state = useEquipmentStore();

  const submitListing = async () => {
    if (!state.title || !state.equipmentType || !state.listingType) {
      // Basic validation
      return;
    }

    setIsPending(true);
    try {
      const payload: any = {
        title: state.title,
        description: state.description,
        equipmentType: state.equipmentType,
        listingType: state.listingType,
        make: state.make || undefined,
        model: state.model || undefined,
        condition: state.condition || undefined,
        governorate: state.governorate || undefined,
        city: state.city || undefined,
      };

      const numericFields = [
        'year', 'hoursUsed', 'capacity', 'power', 'weight',
        'price', 'dailyPrice', 'monthlyPrice', 'budgetMin', 'budgetMax', 'quantity'
      ];
      
      numericFields.forEach(field => {
        const val = (state as any)[field];
        if (val && !isNaN(parseFloat(val))) {
          payload[field] = parseFloat(val);
        }
      });

      if (state.listingType !== 'EQUIPMENT_WANTED' && state.images.length > 0) {
        payload.images = state.images;
      }

      if (state.removedImageIds && state.removedImageIds.length > 0) {
        payload.removedImageIds = state.removedImageIds;
      }

      if (state.editMode && state.editListingId) {
        await updateEquipment({ id: state.editListingId, data: payload });
      } else {
        await createEquipment(payload);
      }
      
      state.reset();
      router.replace('/equipment');
    } catch (error) {
      console.error('Failed to post equipment:', error);
    } finally {
      setIsPending(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <EquipmentStep1Type />;
      case 2: return <EquipmentStep2Details />;
      case 3: return <EquipmentStep3Images />;
      case 4: return <EquipmentStep4Location />;
      case 5: return <EquipmentStep5Review />;
      default: return <EquipmentStep1Type />;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return 'نوع الإعلان والفئة';
      case 2: return 'المواصفات والتفاصيل';
      case 3: return 'صور المعدة';
      case 4: return 'الموقع والتسعير';
      case 5: return 'مراجعة الإعلان';
      default: return state.editMode ? 'تعديل إعلان' : 'إضافة معدة';
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.root, { paddingBottom: insets.bottom }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <AppHeader title={state.editMode ? 'تعديل المعدة' : 'إضافة معدة'} onLeftPress={handleBack} showBack variant="default" />
        
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Stepper currentStep={currentStep} totalSteps={TOTAL_STEPS} title={getStepTitle()} />
          
          {renderStep()}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, Spacing.space4) }]}>
          <AppButton
            title={currentStep === TOTAL_STEPS ? (state.editMode ? 'حفظ التعديلات' : 'نشر الإعلان') : 'التالي'}
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
