import { OperatorFormData, OperatorFormErrors } from '../types/operatorForm.types'

/**
 * Pure validation logic for Operator Form steps
 */
export function validateOperatorStep(step: number, formData: Partial<OperatorFormData>): { isValid: boolean; errors: OperatorFormErrors } {
  const errors: OperatorFormErrors = {}

  if (step === 1) {
    if (!formData.operatorType) {
      errors.operatorType = 'يرجى اختيار نوع الدور أو التخصص المهني'
    }
    if (!formData.title || formData.title.trim().length < 5) {
      errors.title = 'عنوان الإعلان مطلوب (5 أحرف على الأقل)'
    }
    if (!formData.experienceYears || isNaN(Number(formData.experienceYears)) || Number(formData.experienceYears) < 0) {
      errors.experienceYears = 'سنوات الخبرة الإجمالية مطلوبة'
    }
    if (!formData.description || formData.description.trim().length < 10) {
      errors.description = 'يرجى كتابة نبذة تفصيلية عن خبراتك ومهامك (10 أحرف على الأقل)'
    }
  } else if (step === 2) {
    if (!formData.equipmentTypes || formData.equipmentTypes.length === 0) {
      errors.equipmentTypes = 'يرجى تحديد معدة واحدة على الأقل تجيد تشغيلها'
    }
    if (!formData.certifications || formData.certifications.length === 0) {
      errors.certifications = 'يرجى إرفاق صورة الرخصة / شهادة الكفاءة أو كتابتها نصياً'
    }
  } else if (step === 3) {
    if (!formData.dailyRate || isNaN(Number(formData.dailyRate)) || Number(formData.dailyRate) <= 0) {
      errors.dailyRate = 'الأجر اليومي الاسترشادي مطلوب'
    }
    if (!formData.hourlyRate || isNaN(Number(formData.hourlyRate)) || Number(formData.hourlyRate) <= 0) {
      errors.hourlyRate = 'الأجر بالساعة مطلوب'
    }
    if (!formData.governorateId) {
      errors.governorate = 'يرجى اختيار المحافظة'
    }
    if (!formData.wilayaId) {
      errors.city = 'يرجى اختيار المدينة / الولاية'
    }
    if (!formData.contactPhone || formData.contactPhone.trim().length < 8) {
      errors.contactPhone = 'رقم هاتف الاتصال المباشر مطلوب (8 أرقام على الأقل)'
    }
    if (!formData.whatsapp || formData.whatsapp.trim().length < 8) {
      errors.whatsapp = 'رقم الواتساب مطلوب (8 أرقام على الأقل)'
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}
