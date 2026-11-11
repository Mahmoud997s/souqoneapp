import { OperatorWizardFormData } from '../store/operatorWizardStore'

export type OperatorFormErrors = Partial<Record<keyof OperatorWizardFormData | 'governorate' | 'city', string>>

export interface MappedOperatorBackendErrors {
  fieldErrors: OperatorFormErrors
  firstInvalidStep: 1 | 2 | 3
  hasFieldErrors: boolean
  rawMessage?: string
}

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

const STEP_1_FIELDS: Array<keyof OperatorWizardFormData> = [
  'operatorType',
  'title',
  'experienceYears',
  'description',
  'profileImageUrl',
]

const STEP_2_FIELDS: Array<keyof OperatorWizardFormData> = [
  'equipmentTypes',
  'specializations',
  'certifications',
]

const STEP_3_FIELDS: Array<keyof OperatorWizardFormData | 'governorate' | 'city'> = [
  'dailyRate',
  'hourlyRate',
  'currency',
  'isPriceNegotiable',
  'governorateId',
  'governorate',
  'wilayaId',
  'city',
  'whatsappEnabled',
]

/**
 * Normalizes a raw field key or error message keyword to an OperatorFormErrors field
 */
function normalizeOperatorFieldKey(rawKey: string): keyof OperatorWizardFormData | 'governorate' | 'city' | null {
  const k = rawKey.trim()
  if (!k) return null

  // Direct matches
  if (k === 'operatorType') return 'operatorType'
  if (k === 'title') return 'title'
  if (k === 'description') return 'description'
  if (k === 'experienceYears') return 'experienceYears'
  if (k === 'equipmentTypes') return 'equipmentTypes'
  if (k === 'specializations') return 'specializations'
  if (k === 'certifications') return 'certifications'
  if (k === 'dailyRate') return 'dailyRate'
  if (k === 'hourlyRate') return 'hourlyRate'
  if (k === 'currency') return 'currency'
  if (k === 'isPriceNegotiable' || k === 'isNegotiable') return 'isPriceNegotiable'
  if (k === 'governorateId' || k === 'governorate') return 'governorateId'
  if (k === 'wilayaId' || k === 'wilaya' || k === 'city') return 'wilayaId'
  if (k === 'whatsappEnabled') return 'whatsappEnabled'
  if (k === 'profileImageUrl') return 'profileImageUrl'

  // Pattern checks for Arabic/English strings
  const lower = k.toLowerCase()
  if (/operator[_\s-]?type|نوع\s*الدور|التخصص\s*المهني/i.test(lower)) return 'operatorType'
  if (/title|عنوان/i.test(lower)) return 'title'
  if (/experience[_\s-]?years|سنوات\s*الخبرة/i.test(lower)) return 'experienceYears'
  if (/description|نبذة|الوصف/i.test(lower)) return 'description'
  if (/equipment[_\s-]?types|معدات|معدة/i.test(lower)) return 'equipmentTypes'
  if (/certifications?|شهادة|رخصة/i.test(lower)) return 'certifications'
  if (/specializations?|تخصص/i.test(lower)) return 'specializations'
  if (/daily[_\s-]?rate|أجر\s*يومي|يومي/i.test(lower)) return 'dailyRate'
  if (/hourly[_\s-]?rate|أجر\s*بالساعة|ساعة/i.test(lower)) return 'hourlyRate'
  if (/governorate|محافظة/i.test(lower)) return 'governorateId'
  if (/wilaya|city|مدينة|ولاية/i.test(lower)) return 'wilayaId'
  if (/profile[_\s-]?image|صورة/i.test(lower)) return 'profileImageUrl'

  return null
}

/**
 * Determines the first wizard step (1 | 2 | 3) that contains an invalid field.
 */
export function getOperatorFirstInvalidStep(errors: OperatorFormErrors): 1 | 2 | 3 {
  for (const field of STEP_1_FIELDS) {
    if (errors[field]) return 1
  }
  for (const field of STEP_2_FIELDS) {
    if (errors[field]) return 2
  }
  for (const field of STEP_3_FIELDS) {
    if (errors[field]) return 3
  }
  return 1
}

/**
 * Maps backend 400 validation error responses (including PR #163 fieldErrors)
 * to OperatorFormErrors and determines the first affected wizard step.
 */
export function mapOperatorBackendErrors(errorResponse: unknown): MappedOperatorBackendErrors {
  const fieldErrors: OperatorFormErrors = {}
  let rawMessage: string | undefined

  if (!errorResponse || typeof errorResponse !== 'object') {
    return { fieldErrors: {}, firstInvalidStep: 1, hasFieldErrors: false }
  }

  const res = errorResponse as Record<string, any>

  // 1. Structured fieldErrors (PR #163)
  const structuredErrors = res.fieldErrors ?? res.errors
  if (structuredErrors && typeof structuredErrors === 'object' && !Array.isArray(structuredErrors)) {
    for (const [key, val] of Object.entries(structuredErrors)) {
      const normalizedKey = normalizeOperatorFieldKey(key)
      if (normalizedKey) {
        const text = Array.isArray(val) ? val.filter(Boolean).join('، ') : String(val ?? '')
        if (text) {
          fieldErrors[normalizedKey] = text
          if (normalizedKey === 'governorateId') {
            fieldErrors.governorate = text
          }
          if (normalizedKey === 'wilayaId') {
            fieldErrors.city = text
          }
        }
      }
    }
  }

  // 2. Unstructured or class-validator message array
  const messageVal = res.message
  if (Array.isArray(messageVal)) {
    for (const item of messageVal) {
      if (typeof item === 'string') {
        const matchedKey = normalizeOperatorFieldKey(item)
        if (matchedKey && !fieldErrors[matchedKey]) {
          fieldErrors[matchedKey] = item
          if (matchedKey === 'governorateId') fieldErrors.governorate = item
          if (matchedKey === 'wilayaId') fieldErrors.city = item
        }
      }
    }
    rawMessage = messageVal.join('، ')
  } else if (typeof messageVal === 'string') {
    rawMessage = messageVal
    const matchedKey = normalizeOperatorFieldKey(messageVal)
    if (matchedKey && !fieldErrors[matchedKey]) {
      fieldErrors[matchedKey] = messageVal
      if (matchedKey === 'governorateId') fieldErrors.governorate = messageVal
      if (matchedKey === 'wilayaId') fieldErrors.city = messageVal
    }
  }

  const hasFieldErrors = Object.keys(fieldErrors).length > 0
  const firstInvalidStep = hasFieldErrors ? getOperatorFirstInvalidStep(fieldErrors) : 1

  return {
    fieldErrors,
    firstInvalidStep,
    hasFieldErrors,
    rawMessage,
  }
}
