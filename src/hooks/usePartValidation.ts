import { useMemo } from 'react';
import { PartFormData, usePartWizardStore } from '../store/partWizardStore';

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

function validateStep1(data: PartFormData): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.listingType) errors.listingType = 'اختر نوع الإعلان';
  if (!data.partCategory) errors.partCategory = 'اختر فئة القطعة';
  if (!data.condition) errors.condition = 'اختر حالة القطعة';
  if (data.isOriginal === null) errors.isOriginal = 'حدد هل القطعة أصلية';

  return { isValid: Object.keys(errors).length === 0, errors };
}

function validateStep2(_data: PartFormData): ValidationResult {
  return { isValid: true, errors: {} };
}

function validateStep3(data: PartFormData): ValidationResult {
  const errors: Record<string, string> = {};

  if (data.title.trim().length < 3) errors.title = 'العنوان لازم يكون 3 أحرف على الأقل';
  if (data.description.trim().length < 10) errors.description = 'الوصف لازم يكون 10 أحرف على الأقل';

  return { isValid: Object.keys(errors).length === 0, errors };
}

function validateStep4(data: PartFormData): ValidationResult {
  const errors: Record<string, string> = {};

  if (data.yearFrom !== null && data.yearTo !== null && data.yearTo < data.yearFrom) {
    errors.yearTo = 'سنة النهاية أكبر من سنة البداية';
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

function validateStep5(data: PartFormData): ValidationResult {
  const errors: Record<string, string> = {};

  if (data.price === null || data.price <= 0) errors.price = 'أدخل سعر القطعة';
  if (data.governorateId === null) errors.governorateId = 'اختر المحافظة';
  if (data.wilayaId === null) errors.wilayaId = 'اختر الولاية';

  return { isValid: Object.keys(errors).length === 0, errors };
}

export function validateStep(step: number, formData: PartFormData): ValidationResult {
  switch (step) {
    case 1: return validateStep1(formData);
    case 2: return validateStep2(formData);
    case 3: return validateStep3(formData);
    case 4: return validateStep4(formData);
    case 5: return validateStep5(formData);
    case 6: return { isValid: true, errors: {} };
    default: return { isValid: true, errors: {} };
  }
}

export function usePartValidation(step: number) {
  const formData = usePartWizardStore((state) => state.formData);
  return useMemo(() => validateStep(step, formData), [step, formData]);
}
