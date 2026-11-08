import { OperatorWizardFormData } from '../store/operatorWizardStore'

export type OperatorFormErrors = Partial<Record<keyof OperatorWizardFormData | 'governorate' | 'city', string>>

/**
 * Pure validation logic for Operator Form steps
 */
export function validateOperatorStep(step: number, formData: Partial<OperatorWizardFormData>): { isValid: boolean; errors: OperatorFormErrors } {
  const errors: OperatorFormErrors = {}

  if (step === 1) {
    if (!formData.operatorType) {
      errors.operatorType = 'يرجى اختيار نوع الدور أو التخصص المهني'
    }
    if (!formData.title || formData.title.trim().length < 5) {
      errors.title = 'عنوان الإعلان مطلوب (5 أحرف على الأقل)'
    } else if (formData.title.length > 100) {
      errors.title = 'يجب ألا يتجاوز العنوان 100 حرف'
    }
    if (!formData.experienceYears || isNaN(Number(formData.experienceYears)) || Number(formData.experienceYears) < 0) {
      errors.experienceYears = 'سنوات الخبرة الإجمالية مطلوبة'
    }
    if (!formData.description || formData.description.trim().length < 10) {
      errors.description = 'يرجى كتابة نبذة تفصيلية عن خبراتك ومهامك (10 أحرف على الأقل)'
    } else if (formData.description.length > 2000) {
      errors.description = 'يجب ألا تتجاوز النبذة 2000 حرف'
    }
  } else if (step === 2) {
    if (!formData.equipmentTypes || formData.equipmentTypes.length === 0) {
      errors.equipmentTypes = 'يرجى تحديد معدة واحدة على الأقل تجيد تشغيلها'
    }
    if (!formData.certifications || formData.certifications.length === 0) {
      errors.certifications = 'يرجى إرفاق صورة الرخصة / شهادة الكفاءة أو كتابتها نصياً'
    }
  } else if (step === 3) {
    const rawDaily = formData.dailyRate != null ? String(formData.dailyRate).trim() : ''
    const rawHourly = formData.hourlyRate != null ? String(formData.hourlyRate).trim() : ''

    const hasDaily = rawDaily.length > 0
    const hasHourly = rawHourly.length > 0

    if (!hasDaily && !hasHourly) {
      errors.dailyRate = 'يجب تحديد الأجر اليومي أو بالساعة على الأقل'
      errors.hourlyRate = 'يجب تحديد الأجر بالساعة أو اليومي على الأقل'
    } else {
      if (hasDaily) {
        const numDaily = Number(rawDaily)
        if (isNaN(numDaily) || numDaily <= 0) {
          errors.dailyRate = 'الأجر اليومي يجب أن يكون رقماً أكبر من صفر'
        }
      }
      if (hasHourly) {
        const numHourly = Number(rawHourly)
        if (isNaN(numHourly) || numHourly <= 0) {
          errors.hourlyRate = 'الأجر بالساعة يجب أن يكون رقماً أكبر من صفر'
        }
      }
    }

    if (!formData.governorateId) {
      errors.governorate = 'يرجى اختيار المحافظة'
      errors.governorateId = 'يرجى اختيار المحافظة'
    }
    if (!formData.wilayaId) {
      errors.city = 'يرجى اختيار المدينة / الولاية'
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}
