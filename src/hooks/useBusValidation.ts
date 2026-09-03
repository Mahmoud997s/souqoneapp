import { useMemo } from 'react';
import { BusWizardData, useBusWizardStore } from '../store/busWizardStore';

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateStep1(data: BusWizardData): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.busListingType) {
    errors.busListingType = 'الرجاء اختيار نوع الإعلان';
  }
  if (!data.busType) {
    errors.busType = 'الرجاء اختيار فئة الحافلة';
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

export function validateStep2(data: BusWizardData): ValidationResult {
  const errors: Record<string, string> = {};
  const totalImages = (data.images?.length || 0) + (data.existingImages?.length || 0);

  if (totalImages < 1) {
    errors.images = 'يرجى إضافة صورة واحدة على الأقل للاستمرار';
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

export function validateStep3(data: BusWizardData): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.title || !data.title.trim()) {
    errors.title = 'الرجاء كتابة العنوان';
  }
  if (!data.description || !data.description.trim()) {
    errors.description = 'الرجاء كتابة الوصف';
  }
  if (!data.make || !data.make.trim()) {
    errors.make = 'الرجاء اختيار الماركة';
  }
  if (!data.model || !data.model.trim()) {
    errors.model = 'الرجاء إدخال الموديل';
  }
  if (!data.year || !data.year.trim()) {
    errors.year = 'الرجاء إدخال سنة الصنع';
  }
  if (!data.capacity || !data.capacity.trim()) {
    errors.capacity = 'الرجاء إدخال عدد المقاعد';
  }
  if (!data.mileage || !data.mileage.trim()) {
    errors.mileage = 'الرجاء إدخال الممشى';
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

export function validateStep4(data: BusWizardData): ValidationResult {
  const errors: Record<string, string> = {};

  if (data.busListingType === 'BUS_SALE' || data.busListingType === 'BUS_SALE_WITH_CONTRACT') {
    if (!data.price || !data.price.trim()) {
      errors.price = 'الرجاء إدخال السعر';
    }
    if (!data.condition) {
      errors.condition = 'الرجاء اختيار حالة الحافلة';
    }
  }

  if (data.busListingType === 'BUS_RENT') {
    if (!data.dailyPrice?.trim() && !data.monthlyPrice?.trim()) {
      errors.dailyPrice = 'الرجاء إدخال الإيجار اليومي أو الشهري';
    }
  }

  if (data.busListingType === 'BUS_SALE_WITH_CONTRACT') {
    if (!data.contractType) {
      errors.contractType = 'الرجاء اختيار نوع العقد';
    }
    if (!data.contractClient || !data.contractClient.trim()) {
      errors.contractClient = 'الرجاء إدخال الجهة';
    }
    if (!data.contractMonthly || !data.contractMonthly.trim()) {
      errors.contractMonthly = 'الرجاء إدخال القيمة';
    }
    if (!data.contractDuration || !data.contractDuration.trim()) {
      errors.contractDuration = 'الرجاء إدخال المدة المتبقية';
    }
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

export function validateStep5(data: BusWizardData): ValidationResult {
  const errors: Record<string, string> = {};

  if (data.governorateId === null || data.governorateId === undefined) {
    errors.governorateId = 'الرجاء اختيار المحافظة';
  }
  if (data.wilayaId === null || data.wilayaId === undefined) {
    errors.wilayaId = 'الرجاء اختيار الولاية';
  }
  if (!data.contactPhone || !data.contactPhone.trim()) {
    errors.contactPhone = 'الرجاء إدخال رقم الجوال';
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

export function validateStep(step: number, data: BusWizardData): ValidationResult {
  switch (step) {
    case 1:
      return validateStep1(data);
    case 2:
      return validateStep2(data);
    case 3:
      return validateStep3(data);
    case 4:
      return validateStep4(data);
    case 5:
      return validateStep5(data);
    case 6:
      return { isValid: true, errors: {} };
    default:
      return { isValid: true, errors: {} };
  }
}

export function useBusValidation(step?: number) {
  const data = useBusWizardStore((state) => state.data);

  const stepResult = useMemo(() => {
    if (step === undefined) return { isValid: true, errors: {} };
    return validateStep(step, data);
  }, [step, data]);

  return {
    validateStep: (s: number, customData?: BusWizardData) => validateStep(s, customData || data),
    isValid: stepResult.isValid,
    errors: stepResult.errors,
  };
}
