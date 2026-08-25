import { CarFormData, CarFormErrors } from '../types/carForm.types'

/**
 * Pure validation logic for Car Form steps
 * Logical Order:
 * Step 1: Type, Title & Description
 * Step 2: Images
 * Step 3: Technical Specifications
 * Step 4: Pricing & Location
 * Step 5: Review & Confirm
 */
export function validateCarStep(
  step: number,
  formData: Partial<CarFormData>
): { isValid: boolean; errors: CarFormErrors } {
  const errors: CarFormErrors = {}

  if (step === 1) {
    // Step 1: Type, Title & Description
    if (!formData.listingType) {
      errors.listingType = 'يرجى اختيار نوع الإعلان (بيع / إيجار / مطلوب)'
    }
    if (!formData.title || formData.title.trim().length < 5) {
      errors.title = 'يجب أن يكون العنوان 5 أحرف على الأقل'
    } else if (formData.title.length > 200) {
      errors.title = 'يجب ألا يتجاوز العنوان 200 حرف'
    }

    if (!formData.description || formData.description.trim().length < 10) {
      errors.description = 'يجب أن يكون الوصف 10 أحرف على الأقل'
    } else if (formData.description.length > 2000) {
      errors.description = 'يجب ألا يتجاوز الوصف 2000 حرف'
    }
  } else if (step === 2) {
    // Step 2: Images Validation
    const totalImages = (formData.images?.length || 0) + (formData.existingImages?.length || 0)
    if (formData.listingType !== 'WANTED' && totalImages === 0) {
      errors.images = 'يجب إضافة صورة واحدة على الأقل للإعلان'
    } else if (totalImages > 20) {
      errors.images = 'لا يمكن تجاوز 20 صورة'
    }
  } else if (step === 3) {
    // Step 3: Technical Specifications Validation (Mandatory fields from backend)
    if (!formData.brandId) {
      errors.brandId = 'يرجى اختيار ماركة السيارة'
    }

    if (!formData.carModelId) {
      errors.carModelId = 'يرجى اختيار موديل السيارة'
    }

    if (
      !formData.year ||
      isNaN(Number(formData.year)) ||
      Number(formData.year) < 1900 ||
      Number(formData.year) > 2030
    ) {
      errors.year = 'يرجى اختيار سنة صنع صحيحة (1900-2030)'
    }
    
    if (formData.listingType !== 'WANTED' && !formData.condition) {
      errors.condition = 'يرجى تحديد حالة السيارة (جديدة / مستعملة)'
    }

    if (formData.listingType !== 'WANTED') {
      if (formData.condition !== 'NEW') {
        if (!formData.mileage || isNaN(Number(formData.mileage)) || Number(formData.mileage) < 0) {
          errors.mileage = 'يرجى إدخال الممشى كأرقام صحيحة'
        }
      }
      if (!formData.fuelType) {
        errors.fuelType = 'يرجى اختيار نوع الوقود'
      }
      if (!formData.bodyType) {
        errors.bodyType = 'يرجى اختيار شكل السيارة'
      }
      if (!formData.driveType) {
        errors.driveType = 'يرجى اختيار نظام الدفع'
      }
      if (!formData.transmission) {
        errors.transmission = 'يرجى اختيار ناقل الحركة'
      }
      if (!formData.exteriorColor) {
        errors.exteriorColor = 'يرجى اختيار اللون الخارجي'
      }
    }

  } else if (step === 4) {
    // Location validation (Mandatory for backend)
    if (!formData.governorateId) {
      errors.governorateId = 'يرجى اختيار المحافظة'
    }
    if (!formData.wilayaId) {
      errors.wilayaId = 'يرجى اختيار الولاية'
    }

    // Pricing validation by listing type
    if (formData.listingType === 'SALE') {
      if (!formData.price || isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
        errors.price = 'سعر البيع مطلوب ويجب أن يكون أكبر من صفر'
      }
    } else if (formData.listingType === 'RENTAL') {
      const hasDaily = formData.dailyPrice && !isNaN(Number(formData.dailyPrice)) && Number(formData.dailyPrice) > 0
      const hasMonthly = formData.monthlyPrice && !isNaN(Number(formData.monthlyPrice)) && Number(formData.monthlyPrice) > 0

      if (!hasDaily && !hasMonthly) {
        errors.dailyPrice = 'يجب إدخال الأجر اليومي أو الشهري على الأقل'
        errors.monthlyPrice = 'يجب إدخال الأجر اليومي أو الشهري على الأقل'
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}
