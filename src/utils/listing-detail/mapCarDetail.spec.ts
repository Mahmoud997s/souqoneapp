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
    expect(vm.specsSections.map((sec) => sec.title)).toEqual([
      'المواصفات الأساسية',
      'المواصفات الفنية',
      'الميزات الإضافية',
    ])

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

  describe('registry-driven specs sections', () => {
    const findValue = (vm: ReturnType<typeof mapCarDetail>, key: string) =>
      vm.specsSections.flatMap((sec) => sec.items).find((item) => item.key === key)?.value

    it('translates exterior and interior colors and enums to Arabic (real listing values)', () => {
      const vm = mapCarDetail({
        ...baseMockCar,
        exteriorColor: 'metallic_white',
        interior: 'ivory',
        bodyType: 'SUV',
        fuelType: 'PETROL',
        transmission: 'AUTOMATIC',
        driveType: 'RWD',
        condition: 'NEW',
        mileage: 0,
      })
      expect(findValue(vm, 'exteriorColor')).toBe('أبيض ميتاليك')
      expect(findValue(vm, 'interior')).toBe('عاجي')
      expect(findValue(vm, 'bodyType')).toBe('دفع رباعي (SUV)')
      expect(findValue(vm, 'fuelType')).toBe('بترول')
      expect(findValue(vm, 'transmission')).toBe('أوتوماتيك')
      expect(findValue(vm, 'driveType')).toBe('دفع خلفي (RWD)')
      expect(findValue(vm, 'condition')).toBe('جديد')
    })

    it('builds a features section of icon chips (empty value) from feature ids', () => {
      const vm = mapCarDetail({
        ...baseMockCar,
        features: ['lfFeatureTouchscreen', 'lfFeatureSunroof', 'custom typed feature'],
      })
      const section = vm.specsSections.find((sec) => sec.title === 'الميزات الإضافية')
      expect(section).toBeDefined()
      expect(section!.items).toEqual([
        { key: 'lfFeatureTouchscreen', label: 'شاشة لمس', value: '', icon: 'tablet-portrait-outline' },
        { key: 'lfFeatureSunroof', label: 'فتحة سقف', value: '', icon: 'sunny-outline' },
        { key: 'custom typed feature', label: 'custom typed feature', value: '', icon: undefined },
      ])
    })

    it('omits the features section and empty rows when data is absent', () => {
      const vm = mapCarDetail({
        ...baseMockCar,
        features: [],
        interior: null,
        exteriorColor: null,
        engineSize: null,
      })
      expect(vm.specsSections.some((sec) => sec.title === 'الميزات الإضافية')).toBe(false)
      const allItems = vm.specsSections.flatMap((sec) => sec.items)
      expect(allItems.some((item) => item.key === 'interior')).toBe(false)
      expect(allItems.some((item) => item.key === 'exteriorColor')).toBe(false)
      expect(allItems.some((item) => item.key === 'engineSize')).toBe(false)
      expect(allItems.every((item) => item.label.length > 0)).toBe(true)
    })

    it('shows rental-only sections only for RENTAL listings', () => {
      const sale = mapCarDetail({ ...baseMockCar, listingType: 'SALE', depositAmount: 100 })
      expect(sale.specsSections.some((sec) => sec.title === 'شروط الإيجار')).toBe(false)

      const rental = mapCarDetail({
        ...baseMockCar,
        listingType: 'RENTAL',
        dailyPrice: '45',
        depositAmount: 100,
        withDriver: false,
      })
      const rentalSection = rental.specsSections.find((sec) => sec.title === 'شروط الإيجار')
      expect(rentalSection).toBeDefined()
      expect(rentalSection!.items.find((i) => i.key === 'depositAmount')?.value).toBe('100 ر.ع')
      expect(rentalSection!.items.find((i) => i.key === 'withDriver')?.value).toBe('بدون سائق')
    })
  })

  describe('Decimal-as-string price fields', () => {
    it('maps a string price ("1800") to amount 1800, not 0', () => {
      const vm = mapCarDetail({ ...baseMockCar, price: '1800' })
      expect(vm.price.amount).toBe(1800)
      expect(vm.price.formattedAmount).toBe('1,800')
      expect(vm.price.fullPriceLabel).toBe('1,800 ر.ع')
    })

    it('still maps a numeric price (regression)', () => {
      const vm = mapCarDetail({ ...baseMockCar, price: 1800 })
      expect(vm.price.amount).toBe(1800)
      expect(vm.price.formattedAmount).toBe('1,800')
    })

    it('populates rental rates and terms from string dailyPrice/monthlyPrice/deposit/km', () => {
      const vm = mapCarDetail({
        ...baseMockCar,
        listingType: 'RENTAL',
        price: '0',
        dailyPrice: '45.5',
        monthlyPrice: '1200',
        depositAmount: '100' as unknown as number,
        kmLimitPerDay: '250' as unknown as number,
      })
      expect(vm.price.dailyRate?.amount).toBe(45.5)
      expect(vm.price.monthlyRate?.amount).toBe(1200)
      expect(vm.price.amount).toBe(45.5)
      expect(vm.price.fullPriceLabel).toBe('45.5 ر.ع / يوم')
      expect(vm.rentalTerms?.depositAmount).toBe(100)
      expect(vm.rentalTerms?.depositLabel).toBe('100 ر.ع')
      expect(vm.rentalTerms?.kmLimitPerDay).toBe(250)
      expect(vm.rentalTerms?.kmLimitLabel).toBe('250 كم / يوم')
    })

    it('treats null and unparseable prices as 0 without throwing', () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
      const nullVm = mapCarDetail({ ...baseMockCar, price: null as unknown as number })
      expect(nullVm.price.amount).toBe(0)

      const badVm = mapCarDetail({ ...baseMockCar, price: 'not-a-number' })
      expect(badVm.price.amount).toBe(0)
      expect(badVm.price.formattedAmount).toBe('0')
      warn.mockRestore()
    })
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
