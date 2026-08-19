import { EquipmentFormData, EquipmentFormErrors } from '../types/equipmentForm.types'

/**
 * Pure validation logic for Equipment Form steps
 * Logical Order:
 * Step 1: Type, Category, Title & Description
 * Step 2: Images & Photos
 * Step 3: Technical Specifications, Condition & Features
 * Step 4: Pricing, Location & Direct Contact
 * Step 5: Review & Confirm
 */
export function validateEquipmentStep(
  step: number,
  formData: Partial<EquipmentFormData>
): { isValid: boolean; errors: EquipmentFormErrors } {
  const errors: EquipmentFormErrors = {}

  if (step === 1) {
    if (!formData.listingType) {
      errors.listingType = 'يرجى اختيار نوع الإعلان (بيع / إيجار / مطلوب)'
    }
    if (!formData.equipmentType) {
      errors.equipmentType = 'يرجى اختيار فئة المعدة'
    }
    if (!formData.title || formData.title.trim().length < 5) {
      errors.title = 'عنوان الإعلان مطلوب (5 أحرف على الأقل)'
    }
    if (!formData.description || formData.description.trim().length < 10) {
      errors.description = 'وصف المعدة مطلوب (10 أحرف على الأقل)'
    }
  } else if (step === 2) {
    // Step 2: Images Validation
    const hasNewImages = Array.isArray(formData.images) && formData.images.length > 0
    const hasExistingImages = Array.isArray(formData.existingImages) && formData.existingImages.length > 0

    if (formData.listingType !== 'EQUIPMENT_WANTED' && !hasNewImages && !hasExistingImages) {
      errors.images = 'يجب إضافة صورة واحدة على الأقل للمعدة'
    }
  } else if (step === 3) {
    // Step 3: Technical Specifications Validation
    if (!formData.make || !formData.make.trim()) {
      errors.make = 'الماركة / الشركة المصنعة مطلوبة'
    }
    if (!formData.model || !formData.model.trim()) {
      errors.model = 'الموديل / الطراز مطلوب'
    }
    if (
      !formData.year ||
      isNaN(Number(formData.year)) ||
      Number(formData.year) < 1950 ||
      Number(formData.year) > new Date().getFullYear() + 1
    ) {
      errors.year = 'يرجى إدخال سنة صنع صحيحة'
    }
    if (formData.listingType !== 'EQUIPMENT_WANTED' && !formData.condition) {
      errors.condition = 'يرجى تحديد حالة المعدة'
    }
  } else if (step === 4) {
    // Location validation (Strict IDs matching Backend migration)
    if (!formData.governorateId) {
      errors.governorateId = 'يرجى اختيار المحافظة'
      errors.governorate = 'يرجى اختيار المحافظة'
    }
    if (!formData.wilayaId) {
      errors.wilayaId = 'يرجى اختيار الولاية'
      errors.city = 'يرجى اختيار الولاية'
    }

    // Pricing validation by listing type
    if (formData.listingType === 'EQUIPMENT_SALE') {
      if (!formData.price || isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
        errors.price = 'سعر البيع الإجمالي مطلوب'
      }
    } else if (formData.listingType === 'EQUIPMENT_RENT') {
      const hasDaily = formData.dailyPrice && !isNaN(Number(formData.dailyPrice)) && Number(formData.dailyPrice) > 0
      const hasMonthly = formData.monthlyPrice && !isNaN(Number(formData.monthlyPrice)) && Number(formData.monthlyPrice) > 0

      if (!hasDaily && !hasMonthly) {
        errors.dailyPrice = 'يجب إدخال الأجر اليومي أو الشهري على الأقل'
        errors.monthlyPrice = 'يجب إدخال الأجر اليومي أو الشهري على الأقل'
      }
    } else if (formData.listingType === 'EQUIPMENT_WANTED') {
      if (!formData.budgetMax || isNaN(Number(formData.budgetMax)) || Number(formData.budgetMax) <= 0) {
        errors.budgetMax = 'الميزانية التقديرية مطلوبة'
      }
      if (!formData.quantity || isNaN(Number(formData.quantity)) || Number(formData.quantity) < 1) {
        errors.quantity = 'الكمية المطلوبة يجب أن تكون 1 على الأقل'
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}
