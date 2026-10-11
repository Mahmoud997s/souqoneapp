import { buildBusPayload } from './busPayload'
import { validateStep } from '../hooks/useBusValidation'
import { useBusWizardStore, BusWizardData } from '../store/busWizardStore'

const base = (): BusWizardData => ({
  ...useBusWizardStore.getState().data,
  busListingType: 'BUS_SALE',
  busType: 'MINI_BUS',
  make: 'Toyota',
  model: 'Coaster',
  year: '2020',
  capacity: '30',
  mileage: '50000',
  price: '10000',
  title: 'Bus title',
  description: 'Bus description',
  governorateId: 1,
  wilayaId: 2,
})

describe('buildBusPayload - empty contactPhone / whatsapp are OMITTED (never sent as "")', () => {
  beforeEach(() => useBusWizardStore.getState().reset())

  it.each([
    ['empty string', ''],
    ['whitespace only', '   '],
  ])('%s -> keys absent from the payload object', (_n, v) => {
    const payload = buildBusPayload({ ...base(), contactPhone: v, whatsapp: v })
    expect('contactPhone' in payload).toBe(false)
    expect('whatsapp' in payload).toBe(false)
    expect(JSON.stringify(payload)).not.toContain('contactPhone')
    expect(JSON.stringify(payload)).not.toContain('whatsapp')
  })

  it('non-empty values are trimmed and sent', () => {
    const payload = buildBusPayload({ ...base(), contactPhone: ' 91234567 ', whatsapp: ' 99887766 ' })
    expect(payload.contactPhone).toBe('91234567')
    expect(payload.whatsapp).toBe('99887766')
  })

  it('edit payload built from a form opened on a response WITHOUT the fields still has no contact keys', () => {
    // the API no longer returns contactPhone/whatsapp -> setEditMode receives '' (see app/buses/[id].tsx)
    useBusWizardStore.getState().setEditMode('bus-1', { ...base(), contactPhone: '', whatsapp: '' }, 3)
    const data = useBusWizardStore.getState().data
    const payload = { ...buildBusPayload(data), version: useBusWizardStore.getState().editVersion }
    expect(payload).not.toHaveProperty('contactPhone')
    expect(payload).not.toHaveProperty('whatsapp')
    expect(payload.version).toBe(3)
  })
})

describe('step 5 contactPhone: required when ADDING, not required when EDITING', () => {
  it('empty + add mode (default) -> error (unchanged)', () => {
    const r = validateStep(5, { ...base(), contactPhone: '' })
    expect(r.isValid).toBe(false)
    expect(r.errors.contactPhone).toBe('الرجاء إدخال رقم الجوال')
  })

  it('empty + add mode (explicit editMode:false) -> error', () => {
    expect(validateStep(5, { ...base(), contactPhone: '' }, { editMode: false }).isValid).toBe(false)
  })

  it('empty + edit mode -> accepted', () => {
    const r = validateStep(5, { ...base(), contactPhone: '' }, { editMode: true })
    expect(r.isValid).toBe(true)
    expect(r.errors).toEqual({})
  })

  it('edit mode still enforces the other step-5 rules (governorate / wilaya)', () => {
    const r = validateStep(5, { ...base(), contactPhone: '', governorateId: null, wilayaId: null }, { editMode: true })
    expect(r.isValid).toBe(false)
    expect(r.errors.governorateId).toBeDefined()
    expect(r.errors.wilayaId).toBeDefined()
    expect(r.errors.contactPhone).toBeUndefined()
  })

  it('phone typed + add mode -> valid', () => {
    expect(validateStep(5, { ...base(), contactPhone: '91234567' }).isValid).toBe(true)
  })

  it('END-TO-END (logic): edit a bus without typing a phone -> all steps 1-5 pass and the PATCH body carries version but no contactPhone', () => {
    // API response no longer contains contactPhone/whatsapp -> the form is opened with ''
    useBusWizardStore.getState().setEditMode(
      'bus-1',
      { ...base(), contactPhone: '', whatsapp: '', existingImages: [{ id: 'i1', url: 'https://x/y.jpg' }] },
      4,
    )
    const st = useBusWizardStore.getState()
    for (let s = 1; s <= 5; s++) {
      const r = validateStep(s, st.data, { editMode: st.editMode })
      expect({ step: s, ok: r.isValid, errors: r.errors }).toEqual({ step: s, ok: true, errors: {} })
    }
    const body = { ...buildBusPayload(st.data), version: st.editVersion }
    expect(body.version).toBe(4)
    expect('contactPhone' in body).toBe(false)
    expect('whatsapp' in body).toBe(false)
  })

  it('SAME form in ADD mode (not edit) still stops at step 5 without a phone', () => {
    useBusWizardStore.getState().reset()
    const r = validateStep(5, { ...base(), contactPhone: '' }, { editMode: useBusWizardStore.getState().editMode })
    expect(r.isValid).toBe(false)
  })
})
