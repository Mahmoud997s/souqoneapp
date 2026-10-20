import { busListingToFormData } from './busListingToFormData'
import type { BusDetailApi } from '../../types/busDetailApi.types'

describe('busListingToFormData', () => {
  const sampleBus: BusDetailApi = {
    id: 'bus-101',
    slug: 'toyota-coaster-2022-101',
    title: 'تويوتا كوستر 2022 بحالة ممتازة',
    description: 'حافلة 30 راكب مع عقد نقل مدرسي ساري',
    busListingType: 'BUS_SALE_WITH_CONTRACT',
    busType: 'COASTER',
    make: 'Toyota',
    model: 'Coaster',
    manufacturerId: 'm-toyota',
    modelId: 'mod-coaster',
    year: 2022,
    capacity: 30,
    mileage: 65000,
    fuelType: 'DIESEL',
    transmission: 'MANUAL',
    condition: 'USED',
    features: ['AIR_CONDITIONING', 'SEAT_BELTS', 'FIRE_EXTINGUISHER'],
    plateNumber: '1234-A',
    price: 24000,
    currency: 'OMR',
    isPriceNegotiable: true,
    dailyPrice: null,
    monthlyPrice: null,
    withDriver: true,
    contractType: 'SCHOOL_TRANSPORT',
    contractClient: 'وزارة التربية والتعليم',
    contractMonthly: 850,
    contractDuration: 24,
    contractExpiry: '2028-06-30T00:00:00.000Z',
    latitude: 23.588,
    longitude: 58.3829,
    whatsappEnabled: true,
    status: 'ACTIVE',
    hiddenByOwnerStatus: false,
    isPremium: false,
    viewCount: 154,
    userId: 'seller-99',
    user: {
      id: 'seller-99',
      username: 'salim_trans',
      createdAt: '2024-01-01T00:00:00.000Z',
    },
    images: [
      { id: 'img-1', url: 'https://images.souqone.om/bus1.jpg', isPrimary: true, order: 0 },
      { id: 'img-2', url: 'https://images.souqone.om/bus2.jpg', isPrimary: false, order: 1 },
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
    version: 3,
    governorateId: 1,
    wilayaId: 10,
    governorateRef: { id: 1, nameAr: 'مسقط' },
    wilayaRef: { id: 10, nameAr: 'السيب' },
  }

  it('correctly maps all 34 bus form fields from api response', () => {
    const formData = busListingToFormData(sampleBus)

    expect(formData.busListingType).toBe('BUS_SALE_WITH_CONTRACT')
    expect(formData.busType).toBe('COASTER')
    expect(formData.make).toBe('Toyota')
    expect(formData.model).toBe('Coaster')
    expect(formData.manufacturerId).toBe('m-toyota')
    expect(formData.modelId).toBe('mod-coaster')
    expect(formData.year).toBe('2022')
    expect(formData.capacity).toBe('30')
    expect(formData.mileage).toBe('65000')
    expect(formData.fuelType).toBe('DIESEL')
    expect(formData.transmission).toBe('MANUAL')
    expect(formData.condition).toBe('USED')
    expect(formData.plateNumber).toBe('1234-A')
    expect(formData.price).toBe('24000')
    expect(formData.currency).toBe('OMR')
    expect(formData.isPriceNegotiable).toBe(true)
    expect(formData.withDriver).toBe(true)
    expect(formData.contractType).toBe('SCHOOL_TRANSPORT')
    expect(formData.contractClient).toBe('وزارة التربية والتعليم')
    expect(formData.contractMonthly).toBe('850')
    expect(formData.contractDuration).toBe('24')
    expect(formData.contractExpiry).toBe('2028-06-30')
    expect(formData.governorateId).toBe(1)
    expect(formData.wilayaId).toBe(10)
    expect(formData.governorateNameAr).toBe('مسقط')
    expect(formData.wilayaNameAr).toBe('السيب')
    expect(formData.latitude).toBe(23.588)
    expect(formData.longitude).toBe(58.3829)
    expect(formData.whatsappEnabled).toBe(true)
    expect(formData.features).toEqual(['AIR_CONDITIONING', 'SEAT_BELTS', 'FIRE_EXTINGUISHER'])
    expect(formData.existingImages).toHaveLength(2)
    expect(formData.existingImages?.[0]).toEqual({ id: 'img-1', url: 'https://images.souqone.om/bus1.jpg' })
  })

  it('handles null/undefined safely without crashing', () => {
    const empty = busListingToFormData(null as any)
    expect(empty).toEqual({})
  })
})
