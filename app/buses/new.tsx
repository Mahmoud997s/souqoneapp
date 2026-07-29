import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { dialogService } from '../../src/store/dialogStore';
import { Stack, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../src/constants/colors';
import { Spacing } from '../../src/constants/spacing';
import { useBusWizardStore } from '../../src/store/busWizardStore';
import { useAuthStore } from '../../src/store/authStore';
import { AppHeader } from '../../src/components/ui/AppHeader';
import { Stepper } from '../../src/components/ui/Stepper';
import { AppButton } from '../../src/components/ui/AppButton';

import { BusStep1Images } from '../../src/components/buses/wizard/BusStep1Images';
import { BusStep2Type } from '../../src/components/buses/wizard/BusStep2Type';
import { BusStep3Info } from '../../src/components/buses/wizard/BusStep3Info';
import { BusStep4Pricing } from '../../src/components/buses/wizard/BusStep4Pricing';
import { BusStep5Location } from '../../src/components/buses/wizard/BusStep5Location';
import { BusStep6Review } from '../../src/components/buses/wizard/BusStep6Review';
import { Ionicons } from '@expo/vector-icons';
import { Radius } from '../../src/constants/radius';
import { busesApi } from '../../src/api/buses';

const TOTAL_STEPS = 6;

export default function NewBusListing() {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { currentStep, nextStep, prevStep, data, editMode, editListingId, setErrors } = useBusWizardStore();
  const [isPending, setIsPending] = React.useState(false);

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
      case 1: {
        const allImages = [...data.existingImages, ...data.images];
        if (allImages.length === 0) {
          dialogService.alert('تنبيه', 'يرجى إضافة صورة واحدة على الأقل للاستمرار', 'warning');
          errs.images = 'required';
        }
        break;
      }
      case 2:
        if (!data.busListingType) errs.busListingType = 'الرجاء اختيار نوع الإعلان';
        if (!data.busType) errs.busType = 'الرجاء اختيار فئة الحافلة';
        break;
      case 3:
        if (!data.title) errs.title = 'الرجاء كتابة العنوان';
        if (!data.description) errs.description = 'الرجاء كتابة الوصف';
        if (!data.make) errs.make = 'الرجاء اختيار الماركة';
        if (!data.model) errs.model = 'الرجاء إدخال الموديل';
        if (!data.year) errs.year = 'الرجاء إدخال سنة الصنع';
        if (!data.capacity) errs.capacity = 'الرجاء إدخال عدد المقاعد';
        if (!data.mileage) errs.mileage = 'الرجاء إدخال الممشى';
        break;
      case 4:
        if (data.busListingType === 'BUS_SALE' || data.busListingType === 'BUS_SALE_WITH_CONTRACT') {
          if (!data.price) errs.price = 'الرجاء إدخال السعر';
          if (!data.condition) errs.condition = 'الرجاء اختيار حالة الحافلة';
        }
        if (data.busListingType === 'BUS_RENT') {
          if (!data.dailyPrice && !data.monthlyPrice) errs.dailyPrice = 'الرجاء إدخال الإيجار اليومي أو الشهري';
        }
        if (data.busListingType === 'BUS_SALE_WITH_CONTRACT') {
          if (!data.contractType) errs.contractType = 'الرجاء اختيار نوع العقد';
          if (!data.contractClient) errs.contractClient = 'الرجاء إدخال الجهة';
          if (!data.contractMonthly) errs.contractMonthly = 'الرجاء إدخال القيمة';
          if (!data.contractDuration) errs.contractDuration = 'الرجاء إدخال المدة المتبقية';
        }
        break;
      case 5:
        if (!data.governorate) errs.governorate = 'الرجاء اختيار المحافظة';
        if (!data.city) errs.city = 'الرجاء اختيار الولاية';
        if (!data.contactPhone) errs.contactPhone = 'الرجاء إدخال رقم الجوال';
        break;
    }
    return errs;
  };

  const handleNext = async () => {
    const errs = validateStep();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});

    if (currentStep < TOTAL_STEPS) {
      nextStep();
    } else {
      const payload: any = {
        busListingType: data.busListingType,
        busType: data.busType,
        make: data.make,
        model: data.model,
        year: parseInt(data.year),
        capacity: parseInt(data.capacity),
        condition: data.condition,
        transmission: data.transmission,
        fuelType: data.fuelType,
        mileage: parseInt(data.mileage),
        plateNumber: data.plateNumber,
        features: data.features,
        title: data.title,
        description: data.description,
        governorate: data.governorate,
        city: data.city,
        latitude: data.latitude,
        longitude: data.longitude,
        contactPhone: data.contactPhone,
        whatsapp: data.whatsapp,
      };

      if (data.busListingType === 'BUS_SALE' || data.busListingType === 'BUS_SALE_WITH_CONTRACT') {
        payload.price = parseFloat(data.price);
        payload.isPriceNegotiable = data.isPriceNegotiable;
      }

      if (data.busListingType === 'BUS_RENT') {
        if (data.dailyPrice) payload.dailyPrice = parseFloat(data.dailyPrice);
        if (data.monthlyPrice) payload.monthlyPrice = parseFloat(data.monthlyPrice);
        payload.withDriver = data.withDriver;
      }

      if (data.busListingType === 'BUS_SALE_WITH_CONTRACT') {
        payload.contractType = data.contractType;
        payload.contractClient = data.contractClient;
        if (data.contractMonthly) payload.contractMonthly = parseFloat(data.contractMonthly);
        if (data.contractDuration) payload.contractDuration = parseFloat(data.contractDuration);
      }

      setIsPending(true);
      try {
        if (editMode && editListingId) {
          await busesApi.update(editListingId, payload);
          
          // Link newly added images
          if (data.images.length > 0) {
            try { await busesApi.addImages(editListingId, data.images); } catch { /* ignore */ }
          }

          // Delete removed images via buses endpoint
          if (data.removedImageIds && data.removedImageIds.length > 0) {
            for (const imgId of data.removedImageIds) {
              try { await busesApi.removeImage(imgId); } catch { /* ignore */ }
            }
          }

          dialogService.alert('تم بنجاح', 'تم تحديث الإعلان بنجاح', 'success');
          useBusWizardStore.getState().reset();
          router.replace('/(tabs)/profile');
        } else {
          const res = await busesApi.create(payload);
          const busId = res.data?.id;
          if (busId && data.images.length > 0) {
            try { await busesApi.addImages(busId, data.images); } catch { /* ignore */ }
          }
          dialogService.alert('تم بنجاح', 'تم رفع الإعلان وسيكون قيد المراجعة', 'success');
          useBusWizardStore.getState().reset();
          router.replace('/(tabs)/profile');
        }
      } catch (err: any) {
        console.error('Failed to save listing', err.response?.data || err);
        const msg = err.response?.data?.message || err.response?.data?.error || err.message || '';
        if (msg.toLowerCase().includes('network error') || !err.response) {
           dialogService.alert('تعذر الاتصال', 'تم حفظ المسودة بنجاح. يمكنك إعادة المحاولة عند توفر الإنترنت.', 'warning');
        } else {
           dialogService.alert('حدث خطأ', Array.isArray(msg) ? msg.join('\n') : String(msg), 'error');
        }
      } finally {
        setIsPending(false);
      }
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <BusStep1Images />;
      case 2: return <BusStep2Type />;
      case 3: return <BusStep3Info />;
      case 4: return <BusStep4Pricing />;
      case 5: return <BusStep5Location />;
      case 6: return <BusStep6Review />;
      default: return <BusStep1Images />;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return 'الصور';
      case 2: return 'النوع والفئة';
      case 3: return 'المواصفات';
      case 4: return 'التسعير';
      case 5: return 'الموقع';
      case 6: return 'مراجعة الإعلان';
      default: return 'إضافة إعلان حافلة';
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.root}>
        <Stack.Screen options={{ headerShown: false }} />
        <AppHeader title={editMode ? 'تعديل الإعلان' : 'إضافة إعلان حافلة'} onLeftPress={handleBack} showBack />
        
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={{ marginBottom: Spacing.space6 }}>
            <Stepper currentStep={currentStep} totalSteps={TOTAL_STEPS} title={getStepTitle()} />
          </View>
          
          {renderStep()}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, Spacing.space4) }]}>
          <AppButton
            title={currentStep === TOTAL_STEPS ? 'إرسال الإعلان' : 'التالي'}
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
