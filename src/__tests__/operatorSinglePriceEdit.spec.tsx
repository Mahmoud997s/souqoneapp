import { validateOperatorStep } from '../hooks/useOperatorValidation'
import { buildOperatorPayload } from '../utils/operator-payload'
import { OperatorWizardFormData } from '../store/operatorWizardStore'

describe('D-226: Operator Single Valid Price & Edit Flow Contract', () => {
  const baseOperator: OperatorWizardFormData = {
    operatorType: 'OPERATOR',
    title: 'مشغل حفارات ومعدات ثقيلة',
    experienceYears: '10',
    description: 'خبرة طويلة في قيادة الحفارات والبلدوزرات في مشاريع البنية التحتية',
    equipmentTypes: ['EXCAVATOR', 'BULLDOZER'],
    specializations: ['حفر', 'تسوية'],
    certifications: ['رخصة قيادة معدات ثقيلة معتمدة'],
    dailyRate: '',
    hourlyRate: '',
    currency: 'OMR',
    isPriceNegotiable: true,
    governorateId: 1,
    wilayaId: 101,
    governorateName: 'مسقط',
    wilayaName: 'السيب',
    whatsappEnabled: true,
    profileImageUrl: null,
    isEditMode: true,
    editListingId: 'op-123',
  }

  it('edit flow: loads operator with ONLY dailyRate and validates step 3 without error', () => {
    // Simulates operator loaded from backend where dailyRate is 35 and hourlyRate is null
    const editDataWithDailyOnly: OperatorWizardFormData = {
      ...baseOperator,
      dailyRate: '35',
      hourlyRate: '',
    }

    const { isValid, errors } = validateOperatorStep(3, editDataWithDailyOnly)
    expect(isValid).toBe(true)
    expect(errors.dailyRate).toBeUndefined()
    expect(errors.hourlyRate).toBeUndefined()

    // Payload verification
    const payload = buildOperatorPayload(editDataWithDailyOnly)
    expect(payload.dailyRate).toBe(35)
    expect(payload.hourlyRate).toBeUndefined()
    expect(payload.dailyRate).not.toBe(0)
    expect(payload.dailyRate).not.toBeNaN()
  })

  it('edit flow: loads operator with ONLY hourlyRate and validates step 3 without error', () => {
    // Simulates operator loaded from backend where hourlyRate is 6 and dailyRate is null
    const editDataWithHourlyOnly: OperatorWizardFormData = {
      ...baseOperator,
      dailyRate: '',
      hourlyRate: '6',
    }

    const { isValid, errors } = validateOperatorStep(3, editDataWithHourlyOnly)
    expect(isValid).toBe(true)
    expect(errors.dailyRate).toBeUndefined()
    expect(errors.hourlyRate).toBeUndefined()

    // Payload verification
    const payload = buildOperatorPayload(editDataWithHourlyOnly)
    expect(payload.hourlyRate).toBe(6)
    expect(payload.dailyRate).toBeUndefined()
    expect(payload.hourlyRate).not.toBe(0)
    expect(payload.hourlyRate).not.toBeNaN()
  })

  it('payload contract: never emits 0 or NaN for empty, zero, or invalid price values', () => {
    const rawForm: any = {
      ...baseOperator,
      dailyRate: '0',
      hourlyRate: 'NaN',
    }

    const payload = buildOperatorPayload(rawForm)
    expect(payload.dailyRate).toBeUndefined()
    expect(payload.hourlyRate).toBeUndefined()
    expect(payload).not.toHaveProperty('dailyRate', 0)
    expect(payload).not.toHaveProperty('hourlyRate', 0)
  })
})
