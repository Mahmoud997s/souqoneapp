import { mapServiceDetailViewModel } from '../serviceDetailViewModel'
import type { Service } from '../../../../types/listing.types'

describe('mapServiceDetailViewModel', () => {
  const sampleService: Service = {
    id: 'srv-100',
    title: 'مركز الأفق لصيانة وتعديل المحركات',
    serviceType: 'MAINTENANCE',
    providerType: 'WORKSHOP',
    providerName: 'كراج الأفق المتطور',
    isHomeService: true,
    specializations: ['تغيير زيت وفلاتر', 'ميكانيكا عامة', 'إصلاح تكييف'],
    description: 'نقدم خدمات صيانة السيارات الشاملة بأحدث أجهزة الفحص.',
    priceFrom: 15,
    priceTo: 45,
    currency: 'OMR',
    workingDays: ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
    workingHoursOpen: '08:00',
    workingHoursClose: '21:00',
    address: 'شارع المعارض، بجانب محطة شل',
    website: 'https://al-ofuq-garage.om',
    whatsappEnabled: true,
    governorate: 'مسقط',
    city: 'السيب',
    latitude: 23.6143,
    longitude: 58.5453,
    images: [
      { id: 'img-1', url: 'https://img.souqone.app/s1.jpg' } as any,
      { id: 'img-2', url: 'https://img.souqone.app/s2.jpg' } as any,
    ],
    createdAt: '2026-10-15T10:00:00.000Z',
    isPremium: true,
    user: {
      id: 'seller-500',
      username: 'alofuq_om',
      displayName: 'كراج الأفق',
      avatarUrl: 'https://img.souqone.app/avatar.jpg',
      isVerified: true,
      governorate: 'مسقط',
      createdAt: '2024-03-01T00:00:00.000Z',
    } as any,
  }

  it('correctly maps a full Service object with all fields', () => {
    const vm = mapServiceDetailViewModel(sampleService)

    expect(vm.id).toBe('srv-100')
    expect(vm.title).toBe('مركز الأفق لصيانة وتعديل المحركات')
    expect(vm.serviceType).toBe('MAINTENANCE')
    expect(vm.serviceTypeLabel).toBe('صيانة وميكانيكا')
    expect(vm.providerType).toBe('WORKSHOP')
    expect(vm.providerTypeLabel).toBe('ورشة / كراج')
    expect(vm.providerName).toBe('كراج الأفق المتطور')
    expect(vm.isHomeService).toBe(true)
    expect(vm.homeServiceLabel).toBe('خدمة منزلية / متنقلة')

    // Specializations
    expect(vm.specializations).toEqual([
      'تغيير زيت وفلاتر',
      'ميكانيكا عامة',
      'إصلاح تكييف',
    ])

    // Price
    expect(vm.price.isRange).toBe(true)
    expect(vm.price.amountLabel).toBe('15 - 45 ر.ع.')
    expect(vm.price.typeLabel).toBe('نطاق السعر التقريبي')

    // Schedule
    expect(vm.workingSchedule.hasSchedule).toBe(true)
    expect(vm.workingSchedule.workingDaysSummary).toBe('من السبت إلى الخميس')
    expect(vm.workingSchedule.workingHoursLabel).toBe('من 08:00 ص إلى 09:00 م')

    // Location & Website
    expect(vm.location.fullLocationText).toBe('مسقط - السيب')
    expect(vm.location.address).toBe('شارع المعارض، بجانب محطة شل')
    expect(vm.location.hasCoordinates).toBe(true)
    expect(vm.website).toEqual({
      url: 'https://al-ofuq-garage.om',
      displayUrl: 'al-ofuq-garage.om',
    })

    // Seller
    expect(vm.seller.id).toBe('seller-500')
    expect(vm.seller.name).toBe('كراج الأفق')
    expect(vm.seller.isVerified).toBe(true)
    expect(vm.seller.memberSinceLabel).toBe('عضو منذ 2024')

    // Images
    expect(vm.images).toEqual([
      'https://img.souqone.app/s1.jpg',
      'https://img.souqone.app/s2.jpg',
    ])
    expect(vm.whatsappEnabled).toBe(true)
  })

  it('handles sparse/empty service object with safe fallbacks', () => {
    const minimal: Service = {
      id: 'srv-min',
      title: '',
      serviceType: 'UNKNOWN_TYPE',
      description: '',
      governorate: '',
      city: '',
      images: [],
      createdAt: 'invalid-date',
    }

    const vm = mapServiceDetailViewModel(minimal)

    expect(vm.id).toBe('srv-min')
    expect(vm.title).toBe('خدمة سيارات')
    expect(vm.serviceTypeLabel).toBe('UNKNOWN_TYPE')
    expect(vm.providerName).toBeUndefined()
    expect(vm.isHomeService).toBe(false)
    expect(vm.homeServiceLabel).toBeUndefined()
    expect(vm.specializations).toEqual([])
    expect(vm.price.amountLabel).toBe('تواصل لمعرفة السعر')
    expect(vm.workingSchedule.hasSchedule).toBe(false)
    expect(vm.location.fullLocationText).toBe('عُمان')
    expect(vm.location.hasCoordinates).toBe(false)
    expect(vm.website).toBeUndefined()
    expect(vm.seller.name).toBe('مقدم الخدمة')
    expect(vm.seller.memberSinceLabel).toBe('عضو منذ فترة')
    expect(vm.images).toEqual([])
  })

  it('maps single starting price correctly', () => {
    const service: Service = {
      ...sampleService,
      priceFrom: 25,
      priceTo: undefined,
    }

    const vm = mapServiceDetailViewModel(service)
    expect(vm.price.isRange).toBe(false)
    expect(vm.price.amountLabel).toBe('25 ر.ع.')
    expect(vm.price.typeLabel).toBe('السعر يبدأ من')
  })
})
