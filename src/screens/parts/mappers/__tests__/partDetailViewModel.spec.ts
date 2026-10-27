import {
  mapPartDetailViewModel,
  formatPartYearRange,
  mapPartImages,
  mapPartLocation,
  mapPartSeller,
} from '../partDetailViewModel'

describe('partDetailViewModel', () => {
  const FIXED_NOW = new Date('2026-10-27T10:00:00.000Z')

  describe('formatPartYearRange', () => {
    it('returns formatted range when both from and to are provided', () => {
      expect(formatPartYearRange(2015, 2020)).toBe('من 2015 إلى 2020')
    })

    it('returns single year when from equals to', () => {
      expect(formatPartYearRange(2018, 2018)).toBe('2018')
    })

    it('returns "من سنة X" when only from is provided', () => {
      expect(formatPartYearRange(2016, undefined)).toBe('من سنة 2016')
      expect(formatPartYearRange(2016, null)).toBe('من سنة 2016')
    })

    it('returns "حتى سنة Y" when only to is provided', () => {
      expect(formatPartYearRange(undefined, 2022)).toBe('حتى سنة 2022')
      expect(formatPartYearRange(null, 2022)).toBe('حتى سنة 2022')
    })

    it('returns undefined when neither is valid', () => {
      expect(formatPartYearRange(undefined, undefined)).toBeUndefined()
      expect(formatPartYearRange(0, 0)).toBeUndefined()
      expect(formatPartYearRange(null, null)).toBeUndefined()
    })
  })

  describe('mapPartImages', () => {
    it('returns empty array when images is missing or empty', () => {
      expect(mapPartImages(undefined)).toEqual([])
      expect(mapPartImages([])).toEqual([])
    })

    it('sorts primary image first and orders by order ascending', () => {
      const raw = [
        { id: 'img-1', url: 'https://example.com/1.jpg', order: 2, isPrimary: false },
        { id: 'img-2', url: 'https://example.com/2.jpg', order: 1, isPrimary: true },
        { id: 'img-3', url: 'https://example.com/3.jpg', order: 0, isPrimary: false },
      ]
      const mapped = mapPartImages(raw)
      expect(mapped).toHaveLength(3)
      expect(mapped[0].id).toBe('img-2')
      expect(mapped[0].isPrimary).toBe(true)
      expect(mapped[1].id).toBe('img-3')
      expect(mapped[2].id).toBe('img-1')
    })

    it('handles string URLs in images array', () => {
      const raw = ['https://example.com/a.jpg', 'https://example.com/b.jpg']
      const mapped = mapPartImages(raw)
      expect(mapped).toHaveLength(2)
      expect(mapped[0].url).toBe('https://example.com/a.jpg')
      expect(mapped[0].isPrimary).toBe(true)
      expect(mapped[1].url).toBe('https://example.com/b.jpg')
    })
  })

  describe('mapPartLocation', () => {
    it('combines governorate and wilaya when both exist', () => {
      const loc = mapPartLocation({
        governorate: 'مسقط',
        city: 'السيب',
      })
      expect(loc.fullLocationText).toBe('مسقط، السيب')
      expect(loc.governorateName).toBe('مسقط')
      expect(loc.wilayaName).toBe('السيب')
    })

    it('uses governorateName when governorate equals wilaya', () => {
      const loc = mapPartLocation({
        governorate: 'مسقط',
        city: 'مسقط',
      })
      expect(loc.fullLocationText).toBe('مسقط')
    })

    it('prefers governorateRef and wilayaRef when present', () => {
      const loc = mapPartLocation({
        governorateRef: { nameAr: 'ظفار' },
        wilayaRef: { nameAr: 'صلالة' },
      })
      expect(loc.fullLocationText).toBe('ظفار، صلالة')
    })

    it('falls back to "سلطنة عُمان" when location is missing', () => {
      const loc = mapPartLocation({})
      expect(loc.fullLocationText).toBe('سلطنة عُمان')
    })

    it('detects valid coordinates correctly', () => {
      const locValid = mapPartLocation({ latitude: 23.588, longitude: 58.3829 })
      expect(locValid.hasCoordinates).toBe(true)
      expect(locValid.latitude).toBe(23.588)

      const locZero = mapPartLocation({ latitude: 0, longitude: 0 })
      expect(locZero.hasCoordinates).toBe(false)
    })
  })

  describe('mapPartSeller', () => {
    it('maps seller displayName and verified badge', () => {
      const seller = mapPartSeller({
        seller: {
          id: 'u-123',
          displayName: 'سالم المعمري',
          username: 'salim_m',
          isVerified: true,
          createdAt: '2025-01-15T00:00:00.000Z',
        },
      })
      expect(seller.id).toBe('u-123')
      expect(seller.name).toBe('سالم المعمري')
      expect(seller.username).toBe('salim_m')
      expect(seller.isVerified).toBe(true)
      expect(seller.memberSinceLabel).toContain('2025')
    })

    it('handles raw.user fallback', () => {
      const seller = mapPartSeller({
        user: {
          id: 'u-456',
          username: 'user_456',
        },
      })
      expect(seller.id).toBe('u-456')
      expect(seller.name).toBe('user_456')
    })
  })

  describe('full mapPartDetailViewModel', () => {
    const fullMock = {
      id: 'part-001',
      version: 2,
      status: 'ACTIVE',
      title: '**سفايف بريك تويوتا كامري**',
      description: 'قطع غيار أصلية وكالة ممتازة بحالة الجديد',
      partCategory: 'BRAKES',
      condition: 'NEW',
      partNumber: '04465-33471',
      isOriginal: true,
      compatibleMakes: ['toyota', 'lexus'],
      compatibleModels: ['Camry', 'ES350'],
      yearFrom: 2018,
      yearTo: 2023,
      price: '45.00',
      isPriceNegotiable: true,
      currency: 'OMR',
      governorate: 'مسقط',
      city: 'بوشر',
      latitude: 23.6,
      longitude: 58.4,
      hasWarranty: true,
      warrantyDuration: 'SIX_MONTHS',
      quantity: 'TWO_TO_FIVE',
      compatibleVehicleTypes: ['CAR'],
      whatsappEnabled: true,
      viewCount: 154,
      createdAt: '2026-10-27T08:00:00.000Z',
      images: [
        { id: 'img-1', url: 'https://cdn.example.com/part1.jpg', isPrimary: true, order: 0 },
      ],
      seller: {
        id: 'seller-77',
        displayName: 'كراج النخبة',
        username: 'elite_garage',
        isVerified: true,
      },
      brand: 'PHANTOM_BRAND_MUST_NOT_BE_READ',
    }

    it('maps all fields with proper Arabic labels and formatting', () => {
      const vm = mapPartDetailViewModel(fullMock, { now: FIXED_NOW })

      expect(vm.id).toBe('part-001')
      expect(vm.version).toBe(2)
      expect(vm.status).toBe('ACTIVE')
      expect(vm.title).toBe('سفايف بريك تويوتا كامري') // stripped markdown
      expect(vm.partCategory).toBe('BRAKES')
      expect(vm.partCategoryLabel).toBe('فرامل ومكابح')
      expect(vm.condition).toBe('NEW')
      expect(vm.conditionLabel).toBe('جديد')
      expect(vm.partNumber).toBe('04465-33471')
      expect(vm.isOriginal).toBe(true)
      expect(vm.originalityLabel).toBe('أصلي وكالة')
      expect(vm.compatibleMakesLabels).toEqual(['تويوتا', 'لكزس'])
      expect(vm.compatibleModels).toEqual(['Camry', 'ES350'])
      expect(vm.yearRangeLabel).toBe('من 2018 إلى 2023')
      expect(vm.hasWarranty).toBe(true)
      expect(vm.warrantyDurationLabel).toBe('6 أشهر')
      expect(vm.quantityLabel).toBe('2 - 5')
      expect(vm.compatibleVehicleTypesLabels).toEqual(['سيارات'])
      expect(vm.price.amount).toBe(45)
      expect(vm.price.formattedAmount).toBe('45')
      expect(vm.price.fullPriceLabel).toBe('45 ر.ع')
      expect(vm.price.isNegotiable).toBe(true)
      expect(vm.location.fullLocationText).toBe('مسقط، بوشر')
      expect(vm.seller.name).toBe('كراج النخبة')
      expect(vm.whatsappEnabled).toBe(true)
      expect(vm.viewCount).toBe(154)
      expect(vm.postedAtLabel).toBe('منذ ساعتين')
    })

    it('does NOT read or output phantom raw.brand', () => {
      const vm = mapPartDetailViewModel(fullMock, { now: FIXED_NOW }) as unknown as Record<string, unknown>
      expect(vm.brand).toBeUndefined()
    })

    it('handles missing optional fields safely with sensible defaults', () => {
      const sparseMock = {
        id: 'part-999',
        title: 'قطعة مستعملة',
        price: 0,
      }
      const vm = mapPartDetailViewModel(sparseMock)

      expect(vm.id).toBe('part-999')
      expect(vm.version).toBe(1)
      expect(vm.title).toBe('قطعة مستعملة')
      expect(vm.description).toBe('')
      expect(vm.partCategory).toBe('OTHER')
      expect(vm.partCategoryLabel).toBe('أخرى')
      expect(vm.condition).toBe('USED')
      expect(vm.conditionLabel).toBe('مستعمل')
      expect(vm.partNumber).toBeUndefined()
      expect(vm.isOriginal).toBe(false)
      expect(vm.originalityLabel).toBe('تجاري / بديل')
      expect(vm.compatibleMakes).toEqual([])
      expect(vm.compatibleModels).toEqual([])
      expect(vm.yearRangeLabel).toBeUndefined()
      expect(vm.hasWarranty).toBe(false)
      expect(vm.warrantyDurationLabel).toBe('بدون ضمان')
      expect(vm.quantityLabel).toBeUndefined()
      expect(vm.price.amount).toBe(0)
      expect(vm.price.fullPriceLabel).toBe('تواصل للسعر')
      expect(vm.images).toEqual([])
      expect(vm.location.fullLocationText).toBe('سلطنة عُمان')
      expect(vm.seller.name).toBe('البائع')
      expect(vm.keySpecs.length).toBeGreaterThanOrEqual(3)
      expect(vm.specsSections.length).toBeGreaterThanOrEqual(1)
    })
  })
})
