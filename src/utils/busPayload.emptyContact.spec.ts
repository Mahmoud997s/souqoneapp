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

describe('FINDING - step 5 still REQUIRES contactPhone, so an edit form prefilled with "" cannot be submitted', () => {
  it('validateStep(5) rejects an empty contactPhone', () => {
    const r = validateStep(5, { ...base(), contactPhone: '' })
    expect(r.isValid).toBe(false)
    expect(r.errors.contactPhone).toBe('الرجاء إدخال رقم الجوال')
  })

  it('validateStep(5) passes once a phone is typed', () => {
    expect(validateStep(5, { ...base(), contactPhone: '91234567' }).isValid).toBe(true)
  })
})
