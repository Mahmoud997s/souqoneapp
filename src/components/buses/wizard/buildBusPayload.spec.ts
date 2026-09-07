import { buildBusPayload } from '../../../utils/busPayload'
import { BusWizardData } from '../../../store/busWizardStore'

const baseData: BusWizardData = {
  busListingType: 'BUS_SALE',
  busType: 'COASTER',
  make: 'Toyota',
  model: 'Coaster',
  manufacturerId: 'man_123',
  modelId: 'mod_456',
  year: '2023',
  capacity: '30',
  condition: 'USED',
  transmission: 'MANUAL',
  fuelType: 'DIESEL',
  mileage: '45000',
  plateNumber: '9988 AA',
  features: ['ac', 'wifi'],
  price: '18000',
  currency: 'OMR',
  isPriceNegotiable: true,
  dailyPrice: '',
  monthlyPrice: '',
  withDriver: false,
  contractType: '',
  contractClient: '',
  contractMonthly: '',
  contractDuration: '',
  contractExpiry: null,
  title: 'حافلة تويوتا نظيفة',
  description: 'حافلة ممتازة جاهزة للعمل والاستخدام اليومي',
  governorateId: 1,
  wilayaId: 101,
  governorateNameAr: 'مسقط',
  wilayaNameAr: 'السيب',
  latitude: 23.588,
  longitude: 58.3829,
  images: [],
  existingImages: [],
  removedImageIds: [],
  contactPhone: '91234567',
  whatsapp: '99887766',
}

describe('buildBusPayload', () => {
  it('builds valid payload for BUS_SALE branch', () => {
    const payload = buildBusPayload(baseData)

    expect(payload).toEqual({
      title: 'حافلة تويوتا نظيفة',
      description: 'حافلة ممتازة جاهزة للعمل والاستخدام اليومي',
      busListingType: 'BUS_SALE',
      busType: 'COASTER',
      make: 'Toyota',
      model: 'Coaster',
      year: 2023,
      capacity: 30,
      currency: 'OMR',
      governorateId: 1,
      wilayaId: 101,
      manufacturerId: 'man_123',
      modelId: 'mod_456',
      mileage: 45000,
      fuelType: 'DIESEL',
      transmission: 'MANUAL',
      condition: 'USED',
      features: ['ac', 'wifi'],
      plateNumber: '9988 AA',
      price: 18000,
      isPriceNegotiable: true,
      latitude: 23.588,
      longitude: 58.3829,
      contactPhone: '91234567',
      whatsapp: '99887766',
    })
  })

  it('builds valid payload for BUS_RENT branch', () => {
    const rentData: BusWizardData = {
      ...baseData,
      busListingType: 'BUS_RENT',
      price: '',
      dailyPrice: '50',
      monthlyPrice: '1000',
      withDriver: true,
    }

    const payload = buildBusPayload(rentData)

    expect(payload.busListingType).toBe('BUS_RENT')
    expect(payload.dailyPrice).toBe(50)
    expect(payload.monthlyPrice).toBe(1000)
    expect(payload.withDriver).toBe(true)
    expect(payload.price).toBeUndefined()
  })

  it('builds valid payload for BUS_SALE_WITH_CONTRACT branch', () => {
    const contractData: BusWizardData = {
      ...baseData,
      busListingType: 'BUS_SALE_WITH_CONTRACT',
      price: '25000',
      isPriceNegotiable: false,
      contractType: 'SCHOOL',
      contractClient: 'مدرسة التفوق',
      contractMonthly: '800',
      contractDuration: '24',
      contractExpiry: '2027-12-31',
    }

    const payload = buildBusPayload(contractData)

    expect(payload.busListingType).toBe('BUS_SALE_WITH_CONTRACT')
    expect(payload.price).toBe(25000)
    expect(payload.isPriceNegotiable).toBe(false)
    expect(payload.contractType).toBe('SCHOOL')
    expect(payload.contractClient).toBe('مدرسة التفوق')
    expect(payload.contractMonthly).toBe(800)
    expect(payload.contractDuration).toBe(24)
    expect(payload.contractExpiry).toBe('2027-12-31')
  })

  it('sets manufacturerId and modelId to null for free-text input and strips UI display names', () => {
    const freeTextData: BusWizardData = {
      ...baseData,
      manufacturerId: '',
      modelId: '',
      governorateNameAr: 'مسقط',
      wilayaNameAr: 'السيب',
    }

    const payload = buildBusPayload(freeTextData)

    expect(payload.manufacturerId).toBeNull()
    expect(payload.modelId).toBeNull()
    expect(payload.governorateNameAr).toBeUndefined()
    expect(payload.wilayaNameAr).toBeUndefined()
  })
})
