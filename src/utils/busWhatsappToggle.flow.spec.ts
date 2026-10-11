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
  existingImages: [{ id: 'i1', url: 'https://x/y.jpg' }],
})

const allStepsValid = (data: BusWizardData) => {
  for (let s = 1; s <= 5; s++) {
    const r = validateStep(s, data)
    if (!r.isValid) return { step: s, errors: r.errors }
  }
  return null
}

describe('bus wizard - WhatsApp switch replaces the phone inputs', () => {
  beforeEach(() => useBusWizardStore.getState().reset())

  it('new listing: switch defaults to OFF and the store has no phone fields', () => {
    const d = useBusWizardStore.getState().data
    expect(d.whatsappEnabled).toBe(false)
    expect(d).not.toHaveProperty('contactPhone')
    expect(d).not.toHaveProperty('whatsapp')
  })

  it('new listing without any phone: steps 1-5 pass', () => {
    expect(allStepsValid(base())).toBeNull()
  })

  it.each([true, false])('payload carries whatsappEnabled=%s and NO contactPhone/whatsapp keys', (v) => {
    const payload = buildBusPayload({ ...base(), whatsappEnabled: v })
    expect(payload.whatsappEnabled).toBe(v)
    expect('contactPhone' in payload).toBe(false)
    expect('whatsapp' in payload).toBe(false)
    expect(JSON.stringify(payload)).not.toMatch(/contactPhone|"whatsapp"/)
  })

  it('edit of a bus that already had WhatsApp enabled: the switch state is loaded, saved body = version + whatsappEnabled:true, no phones', () => {
    useBusWizardStore.getState().setEditMode('bus-1', { ...base(), whatsappEnabled: true }, 6)
    const st = useBusWizardStore.getState()
    expect(st.data.whatsappEnabled).toBe(true)
    expect(allStepsValid(st.data)).toBeNull()
    const body = { ...buildBusPayload(st.data), version: st.editVersion }
    expect(body.whatsappEnabled).toBe(true)
    expect(body.version).toBe(6)
    expect('contactPhone' in body).toBe(false)
    expect('whatsapp' in body).toBe(false)
  })

  it('edit of a bus with WhatsApp OFF saves whatsappEnabled:false (so it can also be turned off)', () => {
    useBusWizardStore.getState().setEditMode('bus-1', { ...base(), whatsappEnabled: false }, 2)
    const body = buildBusPayload(useBusWizardStore.getState().data)
    expect(body.whatsappEnabled).toBe(false)
  })

  it('a draft persisted by an OLD app build (stray contactPhone/whatsapp, no whatsappEnabled) never leaks the old fields', () => {
    const legacyDraft: any = { ...base(), contactPhone: '91234567', whatsapp: '99887766' }
    delete legacyDraft.whatsappEnabled
    const payload = buildBusPayload(legacyDraft as BusWizardData)
    expect(payload.whatsappEnabled).toBe(false)
    expect('contactPhone' in payload).toBe(false)
    expect('whatsapp' in payload).toBe(false)
  })
})
