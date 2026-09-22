import { CarDetailApi } from '../../types/carDetailApi.types'
import { mapCarDetail } from './mapCarDetail'

describe('mapCarDetail', () => {
  const baseMockCar: CarDetailApi = {
    id: 'car-123',
    version: 1,
    status: 'ACTIVE',
    title: 'تويوتا لاند كروزر V8 2022',
    description: 'سيارة نظيفة جداً بحالة الوكالة بدون حوادث صيانة دورية',
    listingType: 'SALE',
    condition: 'USED',
    price: 24500,
    currency: 'OMR',
    isPriceNegotiable: true,
    make: 'تويوتا',
    model: 'لاند كروزر',
    trim: 'V8 GXR',
    year: 2022,
    mileage: 45000,
    fuelType: 'PETROL',
    transmission: 'AUTOMATIC',
    driveType: '4WD',
    bodyType: 'SUV',
    exteriorColor: 'أبيض لؤلؤي',
    interior: 'بيج جلد',
    engineSize: '4.0L',
    horsepower: 271,
    doors: 5,
    seats: 7,
    features: ['فتحة سقف', 'كاميرا 360', 'حساسات أمامية وخلفية', 'نظام ملاحة'],
    governorate: 'مسقط',
    city: 'السيب',
    latitude: 23.6138,
    longitude: 58.1928,
    images: [
      { id: 'img-2', url: 'https://example.com/2.jpg', order: 2, isPrimary: false },
      { id: 'img-1', url: 'https://example.com/1.jpg', order: 1, isPrimary: true },
      { id: 'img-3', url: 'https://example.com/3.jpg', order: 3, isPrimary: false },
    ],
    seller: {
      id: 'seller-99',
      username: 'ahmed_cars',
      displayName: 'أحمد الحارثي',
      avatarUrl: 'https://example.com/avatar.jpg',
      isVerified: true,
      createdAt: '2022-05-15T10:00:00.000Z',
      accountType: 'DEALER',
    },
    whatsappEnabled: true,
    viewCount: 342,
    createdAt: '2026-09-20T10:00:00.000Z',
  }

  it('maps a standard SALE listing accurately with all specs and views', () => {
    const vm = mapCarDetail(baseMockCar)

    expect(vm.id).toBe('car-123')
    expect(vm.title).toBe('تويوتا لاند كروزر V8 2022')
    expect(vm.listingType).toBe('SALE')
    expect(vm.conditionLabel).toBe('مستعمل')

    // Price
    expect(vm.price.amount).toBe(24500)
    expect(vm.price.formattedAmount).toBe('24,500')
    expect(vm.price.currency).toBe('ر.ع')
    expect(vm.price.fullPriceLabel).toBe('24,500 ر.ع')
    expect(vm.price.isNegotiable).toBe(true)
    expect(vm.price.caption).toBeUndefined()

    // Images (primary first, order ascending)
    expect(vm.images).toHaveLength(3)
    expect(vm.images[0].id).toBe('img-1')
    expect(vm.images[0].isPrimary).toBe(true)
    expect(vm.images[1].id).toBe('img-2')
    expect(vm.images[2].id).toBe('img-3')

    // Location
    expect(vm.location.governorateName).toBe('مسقط')
    expect(vm.location.wilayaName).toBe('السيب')
    expect(vm.location.fullLocationText).toBe('مسقط، السيب')
    expect(vm.location.hasCoordinates).toBe(true)
    expect(vm.location.latitude).toBe(23.6138)
    expect(vm.location.longitude).toBe(58.1928)

    // Seller
    expect(vm.seller.id).toBe('seller-99')
    expect(vm.seller.name).toBe('أحمد الحارثي')
    expect(vm.seller.username).toBe('ahmed_cars')
    expect(vm.seller.isVerified).toBe(true)
    expect(vm.seller.memberSinceLabel).toBe('عضو منذ مايو 2022')

    // Key Specs
    expect(vm.keySpecs).toEqual([
      { key: 'year', label: 'سنة الصنع', value: '2022', icon: 'calendar' },
      { key: 'mileage', label: 'الممشى', value: '45,000 كم', icon: 'speedometer' },
      { key: 'transmission', label: 'ناقل الحركة', value: 'أوتوماتيك', icon: 'git-commit' },
      { key: 'fuelType', label: 'الوقود', value: 'بنزين', icon: 'droplet' },
    ])

    // Structured Sections
    expect(vm.specsSections).toHaveLength(3)
    expect(vm.specsSections[0].title).toBe('المواصفات الأساسية')
    expect(vm.specsSections[1].title).toBe('المحرك والأداء')
    expect(vm.specsSections[2].title).toBe('المظهر والأبعاد')

    // Features
    expect(vm.features).toEqual([
      'فتحة سقف',
      'كاميرا 360',
      'حساسات أمامية وخلفية',
      'نظام ملاحة',
    ])

    // Rental terms should be undefined for SALE
    expect(vm.rentalTerms).toBeUndefined()
  })

  it('maps a RENTAL listing with daily and monthly rates and rental terms', () => {
    const rentalMock: CarDetailApi = {
      ...baseMockCar,
      id: 'car-rental-456',
      listingType: 'RENTAL',
      price: 25,
      dailyPrice: 25,
      monthlyPrice: 500,
      minRentalDays: 2,
      depositAmount: 100,
      kmLimitPerDay: 300,
      cancellationPolicy: 'إلغاء مجاني قبل 24 ساعة',
      withDriver: false,
      deliveryAvailable: true,
      insuranceIncluded: true,
    }

    const vm = mapCarDetail(rentalMock)

    expect(vm.listingType).toBe('RENTAL')
    expect(vm.price.caption).toBe('للإيجار')
    expect(vm.price.amount).toBe(25)
    expect(vm.price.fullPriceLabel).toBe('25 ر.ع / يوم')
    expect(vm.price.dailyRate).toEqual({
      amount: 25,
      formatted: '25 ر.ع',
      label: '25 ر.ع / يوم',
    })
    expect(vm.price.monthlyRate).toEqual({
      amount: 500,
      formatted: '500 ر.ع',
      label: '500 ر.ع / شهر',
    })

    expect(vm.rentalTerms).toBeDefined()
    expect(vm.rentalTerms?.minRentalDays).toBe(2)
    expect(vm.rentalTerms?.depositAmount).toBe(100)
    expect(vm.rentalTerms?.depositLabel).toBe('100 ر.ع')
    expect(vm.rentalTerms?.kmLimitPerDay).toBe(300)
    expect(vm.rentalTerms?.kmLimitLabel).toBe('300 كم / يوم')
    expect(vm.rentalTerms?.cancellationPolicy).toBe('إلغاء مجاني قبل 24 ساعة')
    expect(vm.rentalTerms?.withDriver).toBe(false)
    expect(vm.rentalTerms?.deliveryAvailable).toBe(true)
    expect(vm.rentalTerms?.insuranceIncluded).toBe(true)
  })

  it('maps a WANTED listing with expected budget caption', () => {
    const wantedMock: CarDetailApi = {
      ...baseMockCar,
      id: 'car-wanted-789',
      listingType: 'WANTED',
      price: 18000,
      isPriceNegotiable: false,
    }

    const vm = mapCarDetail(wantedMock)

    expect(vm.listingType).toBe('WANTED')
    expect(vm.price.caption).toBe('الميزانية المتوقعة')
    expect(vm.price.fullPriceLabel).toBe('18,000 ر.ع')
    expect(vm.price.isNegotiable).toBe(false)
  })

  it('handles empty / null fields safely without crashes or polluted labels', () => {
    const minimalCar: CarDetailApi = {
      id: 'car-min',
      status: 'ACTIVE',
      title: 'سيارة عادية',
      description: 'وصف بسيط',
      listingType: 'SALE',
      price: 5000,
      currency: 'OMR',
      images: [],
      seller: {
        id: 'seller-min',
        username: 'user_min',
        displayName: null,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      viewCount: 0,
      createdAt: '2026-09-22T00:00:00.000Z',
    }

    const vm = mapCarDetail(minimalCar)

    expect(vm.images).toEqual([])
    expect(vm.location.hasCoordinates).toBe(false)
    expect(vm.location.latitude).toBeUndefined()
    expect(vm.location.longitude).toBeUndefined()
    expect(vm.location.fullLocationText).toBe('سلطنة عُمان')

    expect(vm.seller.name).toBe('user_min')
    expect(vm.seller.isVerified).toBe(false)
    expect(vm.seller.memberSinceLabel).toBe('عضو منذ يناير 2026')
    expect(vm.viewCount).toBe(0)

    expect(vm.keySpecs).toEqual([])
    expect(vm.specsSections).toEqual([])
    expect(vm.features).toEqual([])
    expect(vm.rentalTerms).toBeUndefined()
  })

  it('safely passes through unexpected enum values without crashing', () => {
    const carWithCustomEnums: CarDetailApi = {
      ...baseMockCar,
      status: 'ACTIVE',
      transmission: 'CUSTOM_GEAR',
      fuelType: 'HYDROGEN',
      driveType: '6x6',
      condition: 'RESTORED',
    }

    const vm = mapCarDetail(carWithCustomEnums)

    expect(vm.status).toBe('ACTIVE')
    expect(vm.conditionLabel).toBe('RESTORED')

    const transSpec = vm.keySpecs.find((s) => s.key === 'transmission')
    expect(transSpec?.value).toBe('CUSTOM_GEAR')

    const fuelSpec = vm.keySpecs.find((s) => s.key === 'fuelType')
    expect(fuelSpec?.value).toBe('HYDROGEN')
  })
})
