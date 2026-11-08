import { validateOperatorStep } from '../hooks/useOperatorValidation'
import { buildOperatorPayload } from '../utils/operator-payload'
import { OperatorWizardFormData } from '../store/operatorWizardStore'

describe('Operators Wizard (Add & Edit Tests)', () => {
  const baseValidForm: OperatorWizardFormData = {
    operatorType: 'OPERATOR',
    title: 'مشغل حفارات كوماتسو بخبرة 8 سنوات',
    experienceYears: '8',
    description: 'خبرة طويلة في تشغيل الحفارات واللوادر الثقيلة في مشاريع البنية التحتية',
    equipmentTypes: ['EXCAVATOR', 'LOADER'],
    specializations: ['حفر أساسات', 'تسوية أراضي'],
    certifications: ['رخصة معدات ثقيلة'],
    dailyRate: '25',
    hourlyRate: '5',
    currency: 'OMR',
    isPriceNegotiable: true,
    governorateId: 1,
    wilayaId: 101,
    governorateName: 'مسقط',
    wilayaName: 'السيب',
    whatsappEnabled: true,
    profileImageUrl: null,
    isEditMode: false,
    editListingId: null,
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

    it('should fail if title is empty or too long', () => {
      const { isValid: invalid, errors: e1 } = validateOperatorStep(1, { ...baseValidForm, title: '' })
      expect(invalid).toBe(false)
      expect(e1.title).toBeDefined()

      const longTitle = 'a'.repeat(101)
      const { isValid: invalidLong, errors: e2 } = validateOperatorStep(1, { ...baseValidForm, title: longTitle })
      expect(invalidLong).toBe(false)
      expect(e2.title).toBeDefined()
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

    it('should fail if description is empty or too long', () => {
      const { isValid: invalid, errors: e1 } = validateOperatorStep(1, { ...baseValidForm, description: '' })
      expect(invalid).toBe(false)
      expect(e1.description).toBeDefined()

      const longDesc = 'a'.repeat(2001)
      const { isValid: invalidLong, errors: e2 } = validateOperatorStep(1, { ...baseValidForm, description: longDesc })
      expect(invalidLong).toBe(false)
      expect(e2.description).toBeDefined()
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
  describe('Step 3: Rates, Location & Contact Validation (D-226 Single Valid Price)', () => {
    it('should pass with both daily and hourly rates (both valid)', () => {
      const { isValid, errors } = validateOperatorStep(3, baseValidForm)
      expect(isValid).toBe(true)
      expect(Object.keys(errors).length).toBe(0)
    })

    it('should pass with daily rate only when hourly rate is empty (daily only)', () => {
      const { isValid, errors } = validateOperatorStep(3, { ...baseValidForm, dailyRate: '25', hourlyRate: '' })
      expect(isValid).toBe(true)
      expect(errors.dailyRate).toBeUndefined()
      expect(errors.hourlyRate).toBeUndefined()
    })

    it('should pass with hourly rate only when daily rate is empty (hourly only)', () => {
      const { isValid, errors } = validateOperatorStep(3, { ...baseValidForm, dailyRate: '', hourlyRate: '5' })
      expect(isValid).toBe(true)
      expect(errors.dailyRate).toBeUndefined()
      expect(errors.hourlyRate).toBeUndefined()
    })

    it('should fail when neither daily nor hourly rate is provided (neither)', () => {
      const { isValid, errors } = validateOperatorStep(3, { ...baseValidForm, dailyRate: '', hourlyRate: '' })
      expect(isValid).toBe(false)
      expect(errors.dailyRate).toBe('يجب تحديد الأجر اليومي أو بالساعة على الأقل')
      expect(errors.hourlyRate).toBe('يجب تحديد الأجر بالساعة أو اليومي على الأقل')
    })

    it('should fail when daily is valid but hourly is invalid zero (one valid + one invalid)', () => {
      const { isValid, errors } = validateOperatorStep(3, { ...baseValidForm, dailyRate: '25', hourlyRate: '0' })
      expect(isValid).toBe(false)
      expect(errors.hourlyRate).toBe('الأجر بالساعة يجب أن يكون رقماً أكبر من صفر')
      expect(errors.dailyRate).toBeUndefined()
    })

    it('should fail when daily is valid but hourly is invalid NaN (one valid + one invalid)', () => {
      const { isValid, errors } = validateOperatorStep(3, { ...baseValidForm, dailyRate: '25', hourlyRate: 'abc' })
      expect(isValid).toBe(false)
      expect(errors.hourlyRate).toBe('الأجر بالساعة يجب أن يكون رقماً أكبر من صفر')
      expect(errors.dailyRate).toBeUndefined()
    })

    it('should fail when hourly is valid but daily is invalid zero (one valid + one invalid)', () => {
      const { isValid, errors } = validateOperatorStep(3, { ...baseValidForm, dailyRate: '0', hourlyRate: '5' })
      expect(isValid).toBe(false)
      expect(errors.dailyRate).toBe('الأجر اليومي يجب أن يكون رقماً أكبر من صفر')
      expect(errors.hourlyRate).toBeUndefined()
    })

    it('should fail when hourly is valid but daily is invalid negative (one valid + one invalid)', () => {
      const { isValid, errors } = validateOperatorStep(3, { ...baseValidForm, dailyRate: '-15', hourlyRate: '5' })
      expect(isValid).toBe(false)
      expect(errors.dailyRate).toBe('الأجر اليومي يجب أن يكون رقماً أكبر من صفر')
      expect(errors.hourlyRate).toBeUndefined()
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

    it('does NOT validate phone or whatsapp on step 3 (handled by profile phone guard)', () => {
      const { isValid, errors } = validateOperatorStep(3, baseValidForm)
      expect(isValid).toBe(true)
      expect(errors).not.toHaveProperty('contactPhone')
      expect(errors).not.toHaveProperty('whatsapp')
    })

    it('should accumulate all step 3 errors when everything is invalid', () => {
      const { isValid, errors } = validateOperatorStep(3, {
        ...baseValidForm,
        dailyRate: '',
        hourlyRate: '',
        governorateId: null,
        wilayaId: null,
      })
      expect(isValid).toBe(false)
      expect(errors.dailyRate).toBeDefined()
      expect(errors.hourlyRate).toBeDefined()
      expect(errors.governorate).toBeDefined()
      expect(errors.city).toBeDefined()
      expect(errors).not.toHaveProperty('contactPhone')
      expect(errors).not.toHaveProperty('whatsapp')
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

    it('store validateStep matches hook for single valid dailyRate and single valid hourlyRate', () => {
      const { useOperatorWizardStore } = require('../store/operatorWizardStore')

      // Daily only
      useOperatorWizardStore.getState().setFormData({ ...baseValidForm, dailyRate: '30', hourlyRate: '' })
      const dailyValid = useOperatorWizardStore.getState().validateStep(3)
      expect(dailyValid).toBe(true)
      expect(useOperatorWizardStore.getState().errors.dailyRate).toBeUndefined()
      expect(useOperatorWizardStore.getState().errors.hourlyRate).toBeUndefined()

      // Hourly only
      useOperatorWizardStore.getState().setFormData({ ...baseValidForm, dailyRate: '', hourlyRate: '7' })
      const hourlyValid = useOperatorWizardStore.getState().validateStep(3)
      expect(hourlyValid).toBe(true)
      expect(useOperatorWizardStore.getState().errors.dailyRate).toBeUndefined()
      expect(useOperatorWizardStore.getState().errors.hourlyRate).toBeUndefined()

      // Neither -> errors on both
      useOperatorWizardStore.getState().setFormData({ ...baseValidForm, dailyRate: '', hourlyRate: '' })
      const neitherValid = useOperatorWizardStore.getState().validateStep(3)
      expect(neitherValid).toBe(false)
      expect(useOperatorWizardStore.getState().errors.dailyRate).toBe('يجب تحديد الأجر اليومي أو بالساعة على الأقل')
      expect(useOperatorWizardStore.getState().errors.hourlyRate).toBe('يجب تحديد الأجر بالساعة أو اليومي على الأقل')

      // Typing dailyRate clears both mutual errors
      useOperatorWizardStore.getState().setFormField('dailyRate', '40')
      expect(useOperatorWizardStore.getState().errors.dailyRate).toBeUndefined()
      expect(useOperatorWizardStore.getState().errors.hourlyRate).toBeUndefined()
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

    it('payload carries whatsappEnabled and NO contactPhone/whatsapp keys', () => {
      const payload = buildOperatorPayload({ ...baseValidForm, whatsappEnabled: true })
      expect(payload.whatsappEnabled).toBe(true)
      expect(payload).not.toHaveProperty('contactPhone')
      expect(payload).not.toHaveProperty('whatsapp')
    })

    it('should build payload with only dailyRate when hourlyRate is empty or whitespace (no 0 or NaN)', () => {
      const payload = buildOperatorPayload({ ...baseValidForm, dailyRate: '35', hourlyRate: '' })
      expect(payload.dailyRate).toBe(35)
      expect(payload.hourlyRate).toBeUndefined()
    })

    it('should build payload with only hourlyRate when dailyRate is empty or whitespace (no 0 or NaN)', () => {
      const payload = buildOperatorPayload({ ...baseValidForm, dailyRate: '  ', hourlyRate: '8' })
      expect(payload.dailyRate).toBeUndefined()
      expect(payload.hourlyRate).toBe(8)
    })

    it('should never send 0 or NaN for omitted or zero rates', () => {
      const payload = buildOperatorPayload({ ...baseValidForm, dailyRate: '0', hourlyRate: 'invalid' })
      expect(payload.dailyRate).toBeUndefined()
      expect(payload.hourlyRate).toBeUndefined()
    })
  })
})
