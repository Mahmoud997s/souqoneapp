import { mapEquipmentDetail, formatHoursUsed, normalizeCurrency } from './mapEquipmentDetail'
import type { EquipmentDetailApi } from '../../types/equipmentDetailApi.types'

describe('mapEquipmentDetail', () => {
  const fixedNow = new Date('2026-10-22T12:00:00.000Z')

  const baseSeller = {
    id: 'user-123',
    username: 'heavy_machinery_om',
    displayName: 'سوق مسقط للمعدات',
    avatarUrl: 'https://example.com/avatar.jpg',
    isVerified: true,
    governorate: 'مسقط',
    createdAt: '2025-01-15T08:00:00.000Z',
  }

  const baseListing: EquipmentDetailApi = {
    id: 'eq-1',
    title: 'حفار كوماتسو PC200 بحالة ممتازة',
    slug: 'komatsu-pc200-excavator-eq1',
    description: '### تفاصيل الحفار\n**حفار** قوي جداً جاهز للعمل الفوري في مسقط.\n\n- محرك نظيف\n- هيدروليك ممتاز',
    equipmentType: 'EXCAVATOR',
    listingType: 'EQUIPMENT_SALE',
    make: 'Komatsu',
    model: 'PC200-8',
    year: 2021,
    condition: 'USED',
    capacity: '1.2 m3',
    power: '148 HP',
    weight: '20 Tons',
    hoursUsed: 3500,
    features: ['كابينة مكيفة', 'صيانة دورية معتمدة'],
    price: '28000.00',
    currency: 'OMR',
    isPriceNegotiable: true,
    withOperator: false,
    deliveryAvailable: false,
    status: 'ACTIVE',
    hiddenByOwnerStatus: false,
    isPremium: true,
    viewCount: 142,
    userId: 'user-123',
    user: baseSeller,
    images: [
      { id: 'img-2', url: 'https://example.com/img2.jpg', order: 2, isPrimary: false },
      { id: 'img-1', url: 'https://example.com/img1.jpg', order: 1, isPrimary: true },
      { id: 'img-3', url: 'https://example.com/img3.jpg', order: 0, isPrimary: false },
    ],
    governorateRef: { id: 1, nameAr: 'مسقط' },
    wilayaRef: { id: 10, nameAr: 'السيب' },
    latitude: 23.588,
    longitude: 58.3829,
    whatsappEnabled: true,
    createdAt: '2026-10-22T10:00:00.000Z',
    updatedAt: '2026-10-22T10:00:00.000Z',
    version: 3,
  }

  it('maps EQUIPMENT_SALE listing correctly with gallery sorting and stripped markdown', () => {
    const result = mapEquipmentDetail(baseListing, { now: fixedNow })

    expect(result.id).toBe('eq-1')
    expect(result.version).toBe(3)
    expect(result.status).toBe('ACTIVE')
    expect(result.equipmentListingType).toBe('EQUIPMENT_SALE')
    expect(result.equipmentTypeLabel).toBe('حفار')
    expect(result.conditionLabel).toBe('مستعملة بحالة جيدة')

    // Markdown stripped from description
    expect(result.description).not.toContain('###')
    expect(result.description).not.toContain('**')
    expect(result.description).toContain('تفاصيل الحفار')

    // Price
    expect(result.price.amount).toBe(28000)
    expect(result.price.currency).toBe('ر.ع')
    expect(result.price.fullPriceLabel).toBe('28,000 ر.ع')
    expect(result.price.isNegotiable).toBe(true)
    expect(result.price.caption).toBe('للبيع')

    // Gallery order: isPrimary first, then by order asc
    expect(result.images.length).toBe(3)
    expect(result.images[0].id).toBe('img-1')
    expect(result.images[0].isPrimary).toBe(true)

    // Primary metric: hoursUsed
    expect(result.hoursUsed).toBe(3500)
    expect(result.hoursUsedLabel).toBe('3,500 ساعة')
    const hoursSpec = result.keySpecs.find((s) => s.key === 'hoursUsed')
    expect(hoursSpec).toBeDefined()
    expect(hoursSpec?.value).toBe('3,500 ساعة')

    // Location
    expect(result.location.governorateName).toBe('مسقط')
    expect(result.location.wilayaName).toBe('السيب')
    expect(result.location.fullLocationText).toBe('مسقط، السيب')
    expect(result.location.hasCoordinates).toBe(true)

    // Seller
    expect(result.seller.name).toBe('سوق مسقط للمعدات')
    expect(result.seller.isVerified).toBe(true)

    // Sale should not have rental or wanted views or operator badge
    expect(result.rental).toBeNull()
    expect(result.wanted).toBeNull()
    expect(result.operatorBadge).toBeNull()
  })

  it('maps EQUIPMENT_RENT with operator badge, daily & monthly rates, and delivery flag', () => {
    const rentListing: EquipmentDetailApi = {
      ...baseListing,
      listingType: 'EQUIPMENT_RENT',
      price: null,
      dailyPrice: '120.00',
      monthlyPrice: '2500.00',
      withOperator: true,
      deliveryAvailable: true,
    }

    const result = mapEquipmentDetail(rentListing, { now: fixedNow })

    expect(result.equipmentListingType).toBe('EQUIPMENT_RENT')
    expect(result.price.caption).toBe('للإيجار')
    expect(result.price.amount).toBe(120)
    expect(result.price.fullPriceLabel).toBe('120 ر.ع / يوم')
    expect(result.price.dailyRate?.amount).toBe(120)
    expect(result.price.monthlyRate?.amount).toBe(2500)

    // Operator badge
    expect(result.operatorBadge).toEqual({ kind: 'with', label: 'مع مشغّل' })

    // Rental view details
    expect(result.rental).toEqual({
      dailyPrice: 120,
      dailyPriceFormatted: '120 ر.ع',
      monthlyPrice: 2500,
      monthlyPriceFormatted: '2,500 ر.ع',
      withOperator: true,
      deliveryAvailable: true,
    })

    // Specs section contains operator & delivery
    const techSection = result.specsSections.find((s) => s.title === 'المواصفات الفنية')
    expect(techSection).toBeDefined()
    expect(techSection?.items.find((i) => i.key === 'withOperator')?.value).toBe('مع مشغّل')
    expect(techSection?.items.find((i) => i.key === 'deliveryAvailable')?.value).toBe('متوفر')
  })

  it('maps EQUIPMENT_RENT without operator and fallback to monthly price when daily missing', () => {
    const rentListing: EquipmentDetailApi = {
      ...baseListing,
      listingType: 'EQUIPMENT_RENT',
      price: null,
      dailyPrice: null,
      monthlyPrice: 3200,
      withOperator: false,
      deliveryAvailable: false,
    }

    const result = mapEquipmentDetail(rentListing, { now: fixedNow })

    expect(result.operatorBadge).toEqual({ kind: 'without', label: 'بدون مشغّل' })
    expect(result.price.amount).toBe(3200)
    expect(result.price.fullPriceLabel).toBe('3,200 ر.ع / شهر')
    expect(result.rental?.withOperator).toBe(false)
    expect(result.rental?.deliveryAvailable).toBe(false)
  })

  it('maps EQUIPMENT_WANTED with budget range, duration, quantity and site details', () => {
    const wantedListing: EquipmentDetailApi = {
      ...baseListing,
      listingType: 'EQUIPMENT_WANTED',
      price: null,
      dailyPrice: null,
      monthlyPrice: null,
      budgetMin: '500',
      budgetMax: '1200',
      rentalDuration: 'MONTHLY',
      startDate: '2026-11-01',
      endDate: '2027-02-01',
      quantity: 3,
      siteDetails: 'مشروع إنشاء طريق في ولاية صحار',
      hoursUsed: null,
    }

    const result = mapEquipmentDetail(wantedListing, { now: fixedNow })

    expect(result.equipmentListingType).toBe('EQUIPMENT_WANTED')
    expect(result.price.amount).toBe(0)
    expect(result.price.fullPriceLabel).toBe('طلب استئجار / شراء')
    expect(result.operatorBadge).toBeNull()
    expect(result.rental).toBeNull()

    // Wanted card view details
    expect(result.wanted).toBeDefined()
    expect(result.wanted?.budgetMin).toBe(500)
    expect(result.wanted?.budgetMax).toBe(1200)
    expect(result.wanted?.budgetRangeFormatted).toBe('500 ر.ع - 1,200 ر.ع')
    expect(result.wanted?.rentalDurationLabel).toBe('شهري')
    expect(result.wanted?.quantity).toBe(3)
    expect(result.wanted?.quantityFormatted).toBe('3 عدد')
    expect(result.wanted?.siteDetails).toBe('مشروع إنشاء طريق في ولاية صحار')
  })

  it('handles partial budget in EQUIPMENT_WANTED (budgetMin only or budgetMax only)', () => {
    const minOnly = mapEquipmentDetail({
      ...baseListing,
      listingType: 'EQUIPMENT_WANTED',
      budgetMin: 800,
      budgetMax: null,
    })
    expect(minOnly.wanted?.budgetRangeFormatted).toBe('من 800 ر.ع')

    const maxOnly = mapEquipmentDetail({
      ...baseListing,
      listingType: 'EQUIPMENT_WANTED',
      budgetMin: null,
      budgetMax: 1500,
    })
    expect(maxOnly.wanted?.budgetRangeFormatted).toBe('حتى 1,500 ر.ع')
  })

  it('handles empty/minimal listing safely without crashing or leaking undefined/null', () => {
    const minimal: EquipmentDetailApi = {
      id: 'eq-min',
      title: 'معدة بسيطة',
      slug: 'minimal-eq',
      equipmentType: 'OTHER_EQUIPMENT',
      listingType: 'EQUIPMENT_SALE',
      features: [],
      status: 'ACTIVE',
      userId: 'user-0',
      user: {
        id: 'user-0',
        username: 'user0',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      images: [],
      createdAt: '2026-10-22T11:59:00.000Z',
      updatedAt: '2026-10-22T11:59:00.000Z',
      version: 1,
    }

    const result = mapEquipmentDetail(minimal, { now: fixedNow })

    expect(result.id).toBe('eq-min')
    expect(result.images).toEqual([])
    expect(result.location.fullLocationText).toBe('سلطنة عُمان')
    expect(result.location.hasCoordinates).toBe(false)
    expect(result.hoursUsed).toBeUndefined()
    expect(result.hoursUsedLabel).toBeUndefined()
    expect(result.keySpecs.some((s) => s.key === 'hoursUsed')).toBe(false)
    expect(result.price.fullPriceLabel).toBe('السعر عند التواصل')
  })

  it('handles hoursUsed = 0 vs null properly', () => {
    const withZeroHours = mapEquipmentDetail({ ...baseListing, hoursUsed: 0 })
    expect(withZeroHours.hoursUsed).toBe(0)
    expect(withZeroHours.hoursUsedLabel).toBe('0 ساعة')
    expect(withZeroHours.keySpecs.find((s) => s.key === 'hoursUsed')?.value).toBe('0 ساعة')

    const withNullHours = mapEquipmentDetail({ ...baseListing, hoursUsed: null })
    expect(withNullHours.hoursUsed).toBeUndefined()
    expect(withNullHours.hoursUsedLabel).toBeUndefined()
    expect(withNullHours.keySpecs.find((s) => s.key === 'hoursUsed')).toBeUndefined()
  })

  it('handles Decimal fields as numbers or as strings identically', () => {
    const fromString = mapEquipmentDetail({ ...baseListing, price: '15000.50' })
    const fromNumber = mapEquipmentDetail({ ...baseListing, price: 15000.5 })
    expect(fromString.price.amount).toBe(15000.5)
    expect(fromNumber.price.amount).toBe(15000.5)
  })

  it('normalizes currency correctly', () => {
    expect(normalizeCurrency('OMR')).toBe('ر.ع')
    expect(normalizeCurrency('omr')).toBe('ر.ع')
    expect(normalizeCurrency('USD')).toBe('$')
    expect(normalizeCurrency(null)).toBe('ر.ع')
  })

  it('formats hoursUsed correctly', () => {
    expect(formatHoursUsed(0)).toBe('0 ساعة')
    expect(formatHoursUsed(1200)).toBe('1,200 ساعة')
    expect(formatHoursUsed(null)).toBeUndefined()
    expect(formatHoursUsed(undefined)).toBeUndefined()
  })
})
