import { validateOperatorStep } from '../hooks/useOperatorValidation'
import { buildOperatorPayload } from '../utils/operator-payload'
import { OperatorFormData } from '../types/operatorForm.types'

describe('Operators Wizard (Add & Edit Tests)', () => {
  const baseValidForm: OperatorFormData = {
    operatorType: 'OPERATOR',
    title: 'مشغل حفارات كوماتسو بخبرة 8 سنوات',
    experienceYears: '8',
    description: 'خبرة طويلة في تشغيل الحفارات واللوادر الثقيلة في مشاريع البنية التحتية',
    equipmentTypes: ['EXCAVATOR', 'LOADER'],
    specializations: ['حفر أساسات', 'تسوية أراضي'],
    certifications: ['رخصة معدات ثقيلة'],
    dailyRate: '25',
    hourlyRate: '5',
    isPriceNegotiable: true,
    governorateId: 1,
    wilayaId: 101,
    governorateName: 'مسقط',
    wilayaName: 'السيب',
    contactPhone: '96891234567',
    whatsapp: '96891234567',
  }

  // ── 1. Step 1: Role, Type, Title & Description ──────────────────────────
  describe('Step 1: Role, Type, Title & Description Validation', () => {
    it('should pass with valid step 1 data', () => {
      const { isValid, errors } = validateOperatorStep(1, baseValidForm)
      expect(isValid).toBe(true)
      expect(Object.keys(errors).length).toBe(0)
    })

    it('should fail if operatorType is missing', () => {
      const { isValid, errors } = validateOperatorStep(1, { ...baseValidForm, operatorType: '' })
      expect(isValid).toBe(false)
      expect(errors.operatorType).toBeDefined()
    })

    it('should fail if title is missing or less than 5 characters', () => {
      const { isValid, errors } = validateOperatorStep(1, { ...baseValidForm, title: 'مشغل' })
      expect(isValid).toBe(false)
      expect(errors.title).toBeDefined()
    })

    it('should fail if title is empty', () => {
      const { isValid, errors } = validateOperatorStep(1, { ...baseValidForm, title: '' })
      expect(isValid).toBe(false)
      expect(errors.title).toBeDefined()
    })

    it('should fail if experienceYears is missing or invalid', () => {
      const { isValid, errors } = validateOperatorStep(1, { ...baseValidForm, experienceYears: '' })
      expect(isValid).toBe(false)
      expect(errors.experienceYears).toBeDefined()
    })

    it('should fail if experienceYears is NaN', () => {
      const { isValid, errors } = validateOperatorStep(1, { ...baseValidForm, experienceYears: 'abc' })
      expect(isValid).toBe(false)
      expect(errors.experienceYears).toBeDefined()
    })

    it('should pass if experienceYears is 0 (valid fresh operator)', () => {
      const { isValid, errors } = validateOperatorStep(1, { ...baseValidForm, experienceYears: '0' })
      expect(isValid).toBe(true)
      expect(errors.experienceYears).toBeUndefined()
    })

    it('should fail if description is missing or less than 10 characters', () => {
      const { isValid, errors } = validateOperatorStep(1, { ...baseValidForm, description: 'خبرة قصير' })
      expect(isValid).toBe(false)
      expect(errors.description).toBeDefined()
    })

    it('should accumulate all step 1 errors when multiple fields are invalid', () => {
      const { isValid, errors } = validateOperatorStep(1, {
        ...baseValidForm,
        operatorType: '',
        title: '',
        experienceYears: '',
        description: '',
      })
      expect(isValid).toBe(false)
      expect(errors.operatorType).toBeDefined()
      expect(errors.title).toBeDefined()
      expect(errors.experienceYears).toBeDefined()
      expect(errors.description).toBeDefined()
    })
  })

  // ── 2. Step 2: Equipment & Certifications ───────────────────────────────
  describe('Step 2: Equipment Types & Certifications Validation', () => {
    it('should pass with valid equipmentTypes and certifications', () => {
      const { isValid, errors } = validateOperatorStep(2, baseValidForm)
      expect(isValid).toBe(true)
      expect(Object.keys(errors).length).toBe(0)
    })

    it('should fail if equipmentTypes is empty', () => {
      const { isValid, errors } = validateOperatorStep(2, { ...baseValidForm, equipmentTypes: [] })
      expect(isValid).toBe(false)
      expect(errors.equipmentTypes).toBeDefined()
    })

    it('should fail if certifications is empty', () => {
      const { isValid, errors } = validateOperatorStep(2, { ...baseValidForm, certifications: [] })
      expect(isValid).toBe(false)
      expect(errors.certifications).toBeDefined()
    })

    it('should fail if both equipmentTypes and certifications are empty', () => {
      const { isValid, errors } = validateOperatorStep(2, {
        ...baseValidForm,
        equipmentTypes: [],
        certifications: [],
      })
      expect(isValid).toBe(false)
      expect(errors.equipmentTypes).toBeDefined()
      expect(errors.certifications).toBeDefined()
    })
  })

  // ── 3. Step 3: Rates, Location & Contact ────────────────────────────────
  describe('Step 3: Rates, Location & Contact Validation', () => {
    it('should pass with valid rates, location IDs, and contact info', () => {
      const { isValid, errors } = validateOperatorStep(3, baseValidForm)
      expect(isValid).toBe(true)
      expect(Object.keys(errors).length).toBe(0)
    })

    it('should fail if dailyRate is missing or zero', () => {
      const { isValid, errors } = validateOperatorStep(3, { ...baseValidForm, dailyRate: '' })
      expect(isValid).toBe(false)
      expect(errors.dailyRate).toBeDefined()
    })

    it('should fail if dailyRate is zero', () => {
      const { isValid, errors } = validateOperatorStep(3, { ...baseValidForm, dailyRate: '0' })
      expect(isValid).toBe(false)
      expect(errors.dailyRate).toBeDefined()
    })

    it('should fail if hourlyRate is missing or zero', () => {
      const { isValid, errors } = validateOperatorStep(3, { ...baseValidForm, hourlyRate: '' })
      expect(isValid).toBe(false)
      expect(errors.hourlyRate).toBeDefined()
    })

    it('should fail if governorateId is missing (strict ID check, not string)', () => {
      const { isValid, errors } = validateOperatorStep(3, {
        ...baseValidForm,
        governorateId: null,
      })
      expect(isValid).toBe(false)
      // Should set error on 'governorate' key (for UI display compatibility)
      expect(errors.governorate).toBeDefined()
    })

    it('should fail if wilayaId is missing (strict ID check, not string)', () => {
      const { isValid, errors } = validateOperatorStep(3, {
        ...baseValidForm,
        wilayaId: null,
      })
      expect(isValid).toBe(false)
      // Should set error on 'city' key (for UI display compatibility)
      expect(errors.city).toBeDefined()
    })

    it('should fail if both governorateId and wilayaId are missing', () => {
      const { isValid, errors } = validateOperatorStep(3, {
        ...baseValidForm,
        governorateId: null,
        wilayaId: null,
      })
      expect(isValid).toBe(false)
      expect(errors.governorate).toBeDefined()
      expect(errors.city).toBeDefined()
    })

    it('should fail if contactPhone is missing or less than 8 digits', () => {
      const { isValid, errors } = validateOperatorStep(3, { ...baseValidForm, contactPhone: '1234567' })
      expect(isValid).toBe(false)
      expect(errors.contactPhone).toBeDefined()
    })

    it('should fail if contactPhone is empty', () => {
      const { isValid, errors } = validateOperatorStep(3, { ...baseValidForm, contactPhone: '' })
      expect(isValid).toBe(false)
      expect(errors.contactPhone).toBeDefined()
    })

    it('should fail if whatsapp is missing or less than 8 digits', () => {
      const { isValid, errors } = validateOperatorStep(3, { ...baseValidForm, whatsapp: '12345' })
      expect(isValid).toBe(false)
      expect(errors.whatsapp).toBeDefined()
    })

    it('should accumulate all step 3 errors when everything is invalid', () => {
      const { isValid, errors } = validateOperatorStep(3, {
        ...baseValidForm,
        dailyRate: '',
        hourlyRate: '',
        governorateId: null,
        wilayaId: null,
        contactPhone: '',
        whatsapp: '',
      })
      expect(isValid).toBe(false)
      expect(errors.dailyRate).toBeDefined()
      expect(errors.hourlyRate).toBeDefined()
      expect(errors.governorate).toBeDefined()
      expect(errors.city).toBeDefined()
      expect(errors.contactPhone).toBeDefined()
      expect(errors.whatsapp).toBeDefined()
    })
  })

  // ── 4. Store ↔ Hook Unified Source Verification ─────────────────────────
  describe('Store ↔ Hook Unified Source Verification', () => {
    it('should return identical results from hook for step 1 valid data', () => {
      // The store now delegates to validateOperatorStep internally.
      // Verify the hook directly returns the expected contract.
      const hookResult = validateOperatorStep(1, baseValidForm)
      expect(hookResult).toHaveProperty('isValid')
      expect(hookResult).toHaveProperty('errors')
      expect(hookResult.isValid).toBe(true)
      expect(typeof hookResult.isValid).toBe('boolean')
      expect(typeof hookResult.errors).toBe('object')
    })

    it('should return identical error messages from hook for step 3 missing governorate', () => {
      const hookResult = validateOperatorStep(3, { ...baseValidForm, governorateId: null })
      expect(hookResult.errors.governorate).toBe('يرجى اختيار المحافظة')
    })

    it('should return identical error messages from hook for step 3 missing wilaya', () => {
      const hookResult = validateOperatorStep(3, { ...baseValidForm, wilayaId: null })
      expect(hookResult.errors.city).toBe('يرجى اختيار المدينة / الولاية')
    })

    it('should return identical error messages from hook for step 3 short contactPhone', () => {
      const hookResult = validateOperatorStep(3, { ...baseValidForm, contactPhone: '123' })
      expect(hookResult.errors.contactPhone).toBe('رقم هاتف الاتصال المباشر مطلوب (8 أرقام على الأقل)')
    })

    it('should return identical error messages from hook for step 3 short whatsapp', () => {
      const hookResult = validateOperatorStep(3, { ...baseValidForm, whatsapp: '123' })
      expect(hookResult.errors.whatsapp).toBe('رقم الواتساب مطلوب (8 أرقام على الأقل)')
    })
  })

  // ── 5. Payload Shape Verification ───────────────────────────────────────
  describe('Payload Shape: Backend DTO Contract', () => {
    it('should build a valid operator payload with numeric IDs and trimmed strings', () => {
      const payload = buildOperatorPayload(baseValidForm)

      // Verify numeric types (not strings)
      expect(typeof payload.governorateId).toBe('number')
      expect(typeof payload.wilayaId).toBe('number')
      expect(typeof payload.experienceYears).toBe('number')
      expect(typeof payload.dailyRate).toBe('number')
      expect(typeof payload.hourlyRate).toBe('number')

      // Verify no forbidden text-based location keys
      expect(payload).not.toHaveProperty('governorate')
      expect(payload).not.toHaveProperty('city')
      expect(payload).not.toHaveProperty('governorateName')
      expect(payload).not.toHaveProperty('wilayaName')
    })

    it('should use formData.currency when provided', () => {
      const formWithCurrency = { ...baseValidForm, currency: 'USD' }
      const payload = buildOperatorPayload(formWithCurrency as any)
      expect(payload.currency).toBe('USD')
    })

    it('should fallback to OMR when currency is missing (same behavior for add and edit)', () => {
      // Simulate edit flow where formData has no currency field (old data)
      const formNoCurrency = { ...baseValidForm }
      delete (formNoCurrency as any).currency
      const payload = buildOperatorPayload(formNoCurrency as any)
      expect(payload.currency).toBe('OMR')
    })

    it('whatsapp should fallback to contactPhone when empty', () => {
      const payload = buildOperatorPayload({ ...baseValidForm, whatsapp: '' })
      expect(payload.whatsapp).toBe(baseValidForm.contactPhone.trim())
    })
  })
})
