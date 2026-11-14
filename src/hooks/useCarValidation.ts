import { CarFormData, CarFormErrors } from '../types/carForm.types'
import { MAX_CAR_IMAGES } from '../constants/cars'

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
    } else if (totalImages > MAX_CAR_IMAGES) {
      errors.images = `لا يمكن تجاوز ${MAX_CAR_IMAGES} صورة`
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
    } else if (formData.listingType === 'WANTED') {
      const hasValidPrice = formData.price && !isNaN(Number(formData.price)) && Number(formData.price) > 0;
      
      if (!hasValidPrice && !formData.isPriceNegotiable) {
        errors.price = 'يجب إدخال الميزانية المقترحة أو تحديد خيار "قابل للتفاوض"';
      }
    } else if (formData.listingType === 'RENTAL') {
      const hasDaily = formData.dailyPrice && !isNaN(Number(formData.dailyPrice)) && Number(formData.dailyPrice) > 0;
      const hasMonthly = formData.monthlyPrice && !isNaN(Number(formData.monthlyPrice)) && Number(formData.monthlyPrice) > 0;

      if (!hasDaily && !hasMonthly) {
        errors.dailyPrice = 'يجب إدخال الأجر اليومي أو الشهري على الأقل';
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

export interface MappedCarBackendErrors {
  fieldErrors: Record<string, string>
  firstInvalidStep: number | null
}

const CAR_FIELD_STEP_MAP: Record<string, number> = {
  // Step 1: Type, Title, Description
  listingType: 1,
  title: 1,
  description: 1,

  // Step 2: Images
  images: 2,

  // Step 3: Technical Specifications
  brandId: 3,
  carModelId: 3,
  modelId: 3,
  carTrimId: 3,
  trimId: 3,
  year: 3,
  condition: 3,
  mileage: 3,
  fuelType: 3,
  transmission: 3,
  bodyType: 3,
  exteriorColor: 3,
  interior: 3,
  engineSize: 3,
  horsepower: 3,
  doors: 3,
  seats: 3,
  driveType: 3,
  features: 3,

  // Step 4: Pricing & Location & Rental Details
  price: 4,
  currency: 4,
  isPriceNegotiable: 4,
  dailyPrice: 4,
  monthlyPrice: 4,
  withDriver: 4,
  depositAmount: 4,
  minRentalDays: 4,
  kmLimitPerDay: 4,
  cancellationPolicy: 4,
  deliveryAvailable: 4,
  insuranceIncluded: 4,
  governorateId: 4,
  wilayaId: 4,
  latitude: 4,
  longitude: 4,
  whatsappEnabled: 4,
}

const CAR_FIELD_ARABIC_FALLBACKS: Record<string, string> = {
  listingType: 'يرجى اختيار نوع الإعلان',
  title: 'عنوان الإعلان غير صالح',
  description: 'وصف الإعلان غير صالح',
  images: 'يجب إضافة صورة واحدة صالحة على الأقل',
  brandId: 'يرجى اختيار ماركة السيارة',
  carModelId: 'يرجى اختيار موديل السيارة',
  modelId: 'يرجى اختيار موديل السيارة',
  carTrimId: 'فئة السيارة المحددة غير صالحة',
  trimId: 'فئة السيارة المحددة غير صالحة',
  year: 'سنة الصنع غير صالحة',
  condition: 'حالة السيارة غير صالحة',
  mileage: 'الممشى المدخل غير صالح',
  fuelType: 'نوع الوقود غير صالح',
  transmission: 'ناقل الحركة غير صالح',
  bodyType: 'شكل هيكل السيارة غير صالح',
  exteriorColor: 'اللون الخارجي غير صالح',
  interior: 'الفرش الداخلي غير صالح',
  engineSize: 'سعة المحرك غير صالحة',
  horsepower: 'القوة الحصانية غير صالحة',
  doors: 'عدد الأبواب غير صالح',
  seats: 'عدد المقاعد غير صالح',
  driveType: 'نظام الدفع غير صالح',
  features: 'المواصفات المحددة غير صالحة',
  price: 'السعر المدخل غير صالح',
  currency: 'العملة المحددة غير صالحة',
  dailyPrice: 'الأجر اليومي غير صالح',
  monthlyPrice: 'الأجر الشهري غير صالح',
  depositAmount: 'مبلغ التأمين غير صالح',
  minRentalDays: 'أقل مدة للإيجار غير صالحة',
  kmLimitPerDay: 'الحد اليومي للمسافة غير صالح',
  cancellationPolicy: 'سياسة الإلغاء غير صالحة',
  governorateId: 'المحافظة المحددة غير صالحة',
  wilayaId: 'الولاية المحددة غير صالحة',
  latitude: 'إحداثيات الموقع غير صالحة',
  longitude: 'إحداثيات الموقع غير صالحة',
  whatsappEnabled: 'خيار الواتساب غير صالح',
}

const LOWERCASE_CAR_FIELD_LOOKUP: Record<string, string> = Object.keys(CAR_FIELD_STEP_MAP).reduce(
  (acc, key) => {
    acc[key.toLowerCase()] = key
    return acc
  },
  {} as Record<string, string>
)

const ARABIC_CAR_MESSAGE_FIELD_PATTERNS: ReadonlyArray<readonly [RegExp, string]> = [
  [/نوع الإعلان|نوع الإدراج/, 'listingType'],
  [/العنوان/, 'title'],
  [/الوصف/, 'description'],
  [/صورة|الصور/, 'images'],
  [/الماركة|ماركة السيارة/, 'brandId'],
  [/الموديل|موديل السيارة/, 'carModelId'],
  [/الفئة|فئة السيارة/, 'carTrimId'],
  [/سنة الصنع|سنة/, 'year'],
  [/حالة السيارة|الحالة/, 'condition'],
  [/الممشى|كيلومتر/, 'mileage'],
  [/نوع الوقود|الوقود/, 'fuelType'],
  [/ناقل الحركة|القير/, 'transmission'],
  [/الهيكل|شكل السيارة/, 'bodyType'],
  [/اللون الخارجي|اللون/, 'exteriorColor'],
  [/المحرك|سعة المحرك/, 'engineSize'],
  [/نظام الدفع|الدفع/, 'driveType'],
  [/السعر الإجمالي|سعر البيع|السعر/, 'price'],
  [/الأجر اليومي|السعر اليومي/, 'dailyPrice'],
  [/الأجر الشهري|السعر الشهري/, 'monthlyPrice'],
  [/التأمين|مبلغ التأمين/, 'depositAmount'],
  [/المحافظة/, 'governorateId'],
  [/الولاية/, 'wilayaId'],
]

/**
 * Pure helper that extracts structured field errors from a NestJS 400 response
 * (conforming to PR #163 allowlist and standard ValidationPipe arrays) and
 * determines the earliest wizard step that requires user correction.
 */
export function mapCarBackendErrors(errorResponse: unknown): MappedCarBackendErrors {
  const fieldErrors: Record<string, string> = {}

  if (!errorResponse || typeof errorResponse !== 'object') {
    return { fieldErrors, firstInvalidStep: null }
  }

  // Handle AxiosError shape: errorResponse.response.data vs direct data
  const rawObj = errorResponse as Record<string, unknown>
  const res: Record<string, unknown> =
    rawObj.response && typeof rawObj.response === 'object' && (rawObj.response as Record<string, unknown>).data && typeof (rawObj.response as Record<string, unknown>).data === 'object'
      ? ((rawObj.response as Record<string, unknown>).data as Record<string, unknown>)
      : rawObj

  // 1. Check structured fieldErrors (array or object) from backend (PR #163 / S7)
  if (Array.isArray(res.fieldErrors)) {
    for (const item of res.fieldErrors) {
      if (item && typeof item === 'object' && typeof item.field === 'string') {
        const canonicalField =
          CAR_FIELD_STEP_MAP[item.field] !== undefined
            ? item.field
            : LOWERCASE_CAR_FIELD_LOOKUP[item.field.toLowerCase()]

        if (canonicalField && !fieldErrors[canonicalField]) {
          const msg =
            typeof item.message === 'string' && item.message.trim().length > 0
              ? item.message
              : CAR_FIELD_ARABIC_FALLBACKS[canonicalField] ?? 'قيمة غير صالحة'
          fieldErrors[canonicalField] = msg
        }
      }
    }
  } else if (res.fieldErrors && typeof res.fieldErrors === 'object') {
    for (const [key, val] of Object.entries(res.fieldErrors as Record<string, unknown>)) {
      const canonicalField =
        CAR_FIELD_STEP_MAP[key] !== undefined
          ? key
          : LOWERCASE_CAR_FIELD_LOOKUP[key.toLowerCase()]
      if (canonicalField && !fieldErrors[canonicalField]) {
        const msg =
          typeof val === 'string' && val.trim().length > 0
            ? val
            : CAR_FIELD_ARABIC_FALLBACKS[canonicalField] ?? 'قيمة غير صالحة'
        fieldErrors[canonicalField] = msg
      }
    }
  }

  // 2. Check string array or single string message (NestJS ValidationPipe default fallback)
  const messages: string[] = []
  if (Array.isArray(res.message)) {
    for (const m of res.message) {
      if (typeof m === 'string') messages.push(m)
    }
  } else if (typeof res.message === 'string') {
    messages.push(res.message)
  }

  for (const rawMsg of messages) {
    // English pattern: "fieldName must be ..." or "fieldName should not be empty"
    const englishMatch = rawMsg.match(/^([a-zA-Z0-9_]+)\s+/)
    if (englishMatch) {
      const candidateKey = englishMatch[1]
      const canonicalField =
        CAR_FIELD_STEP_MAP[candidateKey] !== undefined
          ? candidateKey
          : LOWERCASE_CAR_FIELD_LOOKUP[candidateKey.toLowerCase()]

      if (canonicalField && !fieldErrors[canonicalField]) {
        fieldErrors[canonicalField] =
          CAR_FIELD_ARABIC_FALLBACKS[canonicalField] ?? 'قيمة غير صالحة'
        continue
      }
    }

    // Arabic regex patterns
    for (const [pattern, fieldKey] of ARABIC_CAR_MESSAGE_FIELD_PATTERNS) {
      if (pattern.test(rawMsg)) {
        if (!fieldErrors[fieldKey]) {
          fieldErrors[fieldKey] = rawMsg
        }
        break
      }
    }
  }

  // 3. Determine firstInvalidStep (1 | 2 | 3 | 4)
  let firstInvalidStep: number | null = null
  for (const field of Object.keys(fieldErrors)) {
    const step = CAR_FIELD_STEP_MAP[field]
    if (step !== undefined) {
      if (firstInvalidStep === null || step < firstInvalidStep) {
        firstInvalidStep = step
      }
    }
  }

  return { fieldErrors, firstInvalidStep }
}
