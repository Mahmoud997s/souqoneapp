import { useMemo } from 'react';
import { ServiceFormData, useServiceWizardStore } from '../store/serviceWizardStore';

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateStep1(data: ServiceFormData): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.serviceType) {
    errors.serviceType = 'اختر نوع الخدمة';
  }
  if (!data.providerType) {
    errors.providerType = 'اختر صفة مقدم الخدمة';
  }
  if (!data.providerName || data.providerName.trim().length < 3) {
    errors.providerName = 'اسم مقدم الخدمة لازم يكون 3 أحرف على الأقل';
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

export function validateStep2(data: ServiceFormData): ValidationResult {
  const errors: Record<string, string> = {};
  const totalImages = (data.images?.length || 0) + (data.existingImages?.length || 0);

  if (totalImages < 1) {
    errors.images = 'أضف صورة واحدة على الأقل';
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

export function validateStep3(data: ServiceFormData): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.title || data.title.trim().length < 3) {
    errors.title = 'العنوان لازم يكون 3 أحرف على الأقل';
  }
  if (!data.description || data.description.trim().length < 10) {
    errors.description = 'الوصف لازم يكون 10 أحرف على الأقل';
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

export function validateStep4(_data: ServiceFormData): ValidationResult {
  return { isValid: true, errors: {} };
}

export function validateStep5(data: ServiceFormData): ValidationResult {
  const errors: Record<string, string> = {};

  if (data.priceFrom === null || isNaN(data.priceFrom) || data.priceFrom <= 0) {
    errors.priceFrom = 'أدخل سعر الخدمة';
  } else if (
    data.priceTo !== null &&
    !isNaN(data.priceTo) &&
    data.priceTo < data.priceFrom
  ) {
    errors.priceTo = 'السعر الأعلى لازم يكون أكبر من أو يساوي السعر الأدنى';
  }

  if (data.governorateId === null) {
    errors.governorateId = 'اختر المحافظة';
  }
  if (data.wilayaId === null) {
    errors.wilayaId = 'اختر الولاية';
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

export function validateStep(step: number, formData: ServiceFormData): ValidationResult {
  switch (step) {
    case 1:
      return validateStep1(formData);
    case 2:
      return validateStep2(formData);
    case 3:
      return validateStep3(formData);
    case 4:
      return validateStep4(formData);
    case 5:
      return validateStep5(formData);
    case 6:
      return { isValid: true, errors: {} };
    default:
      return { isValid: true, errors: {} };
  }
}

export function useServiceValidation(step: number): ValidationResult {
  const formData = useServiceWizardStore((state) => state.formData);
  return useMemo(() => validateStep(step, formData), [step, formData]);
}
