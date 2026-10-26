import { mapBusDetail } from './mapBusDetail'
import { BusDetailApi } from '../../types/busDetailApi.types'

const baseMockBus: BusDetailApi = {
  id: 'bus-123',
  slug: 'bus-toyota-coaster-2022-123',
  title: 'تويوتا كوستر 2022 بحالة ممتازة',
  description: 'حافلة ممتازة جاهزة للعمل والاستخدام الفوري',
  busListingType: 'BUS_SALE',
  busType: 'COASTER',
  make: 'Toyota',
  model: 'Coaster',
  year: 2022,
  capacity: 30,
  mileage: 45000,
  fuelType: 'DIESEL',
  transmission: 'MANUAL',
  condition: 'USED',
  features: ['ac', 'curtains', 'wifi'],
  plateNumber: '1234 A',
  price: '18500',
  currency: 'OMR',
  isPriceNegotiable: true,
  withDriver: false,
  status: 'ACTIVE',
  hiddenByOwnerStatus: false,
  isPremium: false,
  viewCount: 150,
  userId: 'user-456',
  user: {
    id: 'user-456',
    username: 'salim_transport',
    displayName: 'سالم للنقل',
    avatarUrl: 'https://example.com/avatar.jpg',
    isVerified: true,
    governorate: 'مسقط',
    createdAt: '2023-01-15T10:00:00.000Z',
  },
  images: [
    { id: 'img-2', url: 'https://example.com/2.jpg', order: 2, isPrimary: false },
    { id: 'img-1', url: 'https://example.com/1.jpg', order: 5, isPrimary: true },
    { id: 'img-3', url: 'https://example.com/3.jpg', order: 1, isPrimary: false },
  ],
  createdAt: '2026-10-18T12:00:00.000Z',
  updatedAt: '2026-10-19T12:00:00.000Z',
  version: 3,
  governorateRef: { id: 1, nameAr: 'مسقط' },
  wilayaRef: { id: 101, nameAr: 'السيب' },
  latitude: 23.61,
  longitude: 58.54,
  whatsappEnabled: true,
}

describe('mapBusDetail', () => {
  const mockNow = new Date('2026-10-20T12:00:00.000Z')

  describe('Basic Mapping & Passthrough', () => {
    it('maps id, status, version, and basic fields correctly', () => {
      const vm = mapBusDetail(baseMockBus, { isAuthenticated: true, now: mockNow })

      expect(vm.id).toBe('bus-123')
      expect(vm.status).toBe('ACTIVE')
      expect(vm.version).toBe(3)
      expect(vm.title).toBe('تويوتا كوستر 2022 بحالة ممتازة')
      expect(vm.busListingType).toBe('BUS_SALE')
      expect(vm.make).toBe('Toyota')
      expect(vm.model).toBe('Coaster')
      expect(vm.year).toBe(2022)
      expect(vm.capacity).toBe(30)
      expect(vm.mileage).toBe(45000)
      expect(vm.mileageLabel).toBe('45,000 كم')
      expect(vm.whatsappEnabled).toBe(true)
      expect(vm.viewCount).toBe(150)
    })

    it('translates bus enums accurately using constants', () => {
      const vm = mapBusDetail(baseMockBus, { isAuthenticated: true, now: mockNow })

      expect(vm.busTypeLabel).toBe('كوستر')
      expect(vm.conditionLabel).toBe('مستعمل')

      const basicSection = vm.specsSections.find((s) => s.title === 'المواصفات الأساسية')
      expect(basicSection).toBeDefined()
      const typeItem = basicSection?.items.find((i) => i.key === 'busListingType')
      expect(typeItem?.value).toBe('للبيع')

      const techSection = vm.specsSections.find((s) => s.title === 'المواصفات الفنية')
      expect(techSection).toBeDefined()
      const transItem = techSection?.items.find((i) => i.key === 'transmission')
      expect(transItem?.value).toBe('عادي / يدوي')
      const fuelItem = techSection?.items.find((i) => i.key === 'fuelType')
      expect(fuelItem?.value).toBe('ديزل')
    })

    it('falls back to raw value if enum is unknown', () => {
      const unknownBus: BusDetailApi = {
        ...baseMockBus,
        busType: 'FUTURISTIC_BUS' as any,
        fuelType: 'HYDROGEN',
        transmission: 'QUANTUM',
        condition: 'LIKE_NEW',
      }
      const vm = mapBusDetail(unknownBus, { isAuthenticated: true, now: mockNow })

      expect(vm.busTypeLabel).toBe('FUTURISTIC_BUS')
      const techSection = vm.specsSections.find((s) => s.title === 'المواصفات الفنية')
      expect(techSection?.items.find((i) => i.key === 'transmission')?.value).toBe('QUANTUM')
      expect(techSection?.items.find((i) => i.key === 'fuelType')?.value).toBe('HYDROGEN')
    })
  })

  describe('Images Sorting', () => {
    it('always places primary image first, then sorts by order ascending', () => {
      const vm = mapBusDetail(baseMockBus, { isAuthenticated: true, now: mockNow })

      expect(vm.images).toHaveLength(3)
      expect(vm.images[0].id).toBe('img-1')
      expect(vm.images[0].isPrimary).toBe(true)
      expect(vm.images[1].id).toBe('img-3')
      expect(vm.images[1].order).toBe(1)
      expect(vm.images[2].id).toBe('img-2')
      expect(vm.images[2].order).toBe(2)
    })

    it('handles null or empty images gracefully', () => {
      const vm = mapBusDetail({ ...baseMockBus, images: [] }, { isAuthenticated: true })
      expect(vm.images).toEqual([])
    })
  })

  describe('Location & Seller Mapping', () => {
    it('formats location text combining governorate and wilaya', () => {
      const vm = mapBusDetail(baseMockBus, { isAuthenticated: true, now: mockNow })

      expect(vm.location.governorateName).toBe('مسقط')
      expect(vm.location.wilayaName).toBe('السيب')
      expect(vm.location.fullLocationText).toBe('مسقط، السيب')
      expect(vm.location.hasCoordinates).toBe(true)
      expect(vm.location.latitude).toBe(23.61)
      expect(vm.location.longitude).toBe(58.54)
    })

    it('maps seller profile correctly', () => {
      const vm = mapBusDetail(baseMockBus, { isAuthenticated: true, now: mockNow })

      expect(vm.seller.id).toBe('user-456')
      expect(vm.seller.name).toBe('سالم للنقل')
      expect(vm.seller.username).toBe('salim_transport')
      expect(vm.seller.isVerified).toBe(true)
      expect(vm.seller.memberSinceLabel).toContain('عضو منذ يناير 2023')
    })
  })

  describe('Pricing Scenarios', () => {
    it('formats standard sale price correctly', () => {
      const vm = mapBusDetail(baseMockBus, { isAuthenticated: true, now: mockNow })

      expect(vm.price.amount).toBe(18500)
      expect(vm.price.formattedAmount).toBe('18,500')
      expect(vm.price.currency).toBe('ر.ع')
      expect(vm.price.fullPriceLabel).toBe('18,500 ر.ع')
      expect(vm.price.isNegotiable).toBe(true)
    })

    it('formats rental listing price with daily/monthly rates', () => {
      const rentalBus: BusDetailApi = {
        ...baseMockBus,
        busListingType: 'BUS_RENT',
        price: null,
        dailyPrice: '35',
        monthlyPrice: '650',
        withDriver: true,
      }
      const vm = mapBusDetail(rentalBus, { isAuthenticated: true, now: mockNow })

      expect(vm.price.caption).toBe('للإيجار')
      expect(vm.price.dailyRate?.amount).toBe(35)
      expect(vm.price.dailyRate?.label).toBe('35 ر.ع / يوم')
      expect(vm.price.monthlyRate?.amount).toBe(650)
      expect(vm.price.monthlyRate?.label).toBe('650 ر.ع / شهر')
      expect(vm.price.fullPriceLabel).toBe('35 ر.ع / يوم')

      const techSection = vm.specsSections.find((s) => s.title === 'المواصفات الفنية')
      const withDriverItem = techSection?.items.find((i) => i.key === 'withDriver')
      expect(withDriverItem?.value).toBe('مع سائق')
    })
  })

  describe('Contract Access Rules (BusContractView)', () => {
    const contractBusBase: BusDetailApi = {
      ...baseMockBus,
      busListingType: 'BUS_SALE_WITH_CONTRACT',
      price: '25000',
      contractType: 'SCHOOL',
      contractClient: 'وزارة التربية والتعليم',
      contractMonthly: '650',
      contractDuration: 24,
      contractExpiry: '2027-06-30T00:00:00.000Z',
      withDriver: true,
    }

    it('returns hidden when listing type is not BUS_SALE_WITH_CONTRACT', () => {
      const vmSale = mapBusDetail({ ...contractBusBase, busListingType: 'BUS_SALE' }, { isAuthenticated: true, now: mockNow })
      expect(vmSale.contract).toEqual({ access: 'hidden' })

      const vmRent = mapBusDetail({ ...contractBusBase, busListingType: 'BUS_RENT' }, { isAuthenticated: true, now: mockNow })
      expect(vmRent.contract).toEqual({ access: 'hidden' })
    })

    it('returns hidden when contract has no valid monthly income (null or <= 0)', () => {
      const vmZero = mapBusDetail({ ...contractBusBase, contractMonthly: 0 }, { isAuthenticated: true, now: mockNow })
      expect(vmZero.contract).toEqual({ access: 'hidden' })

      const vmNegative = mapBusDetail({ ...contractBusBase, contractMonthly: '-50' }, { isAuthenticated: true, now: mockNow })
      expect(vmNegative.contract).toEqual({ access: 'hidden' })

      const vmNull = mapBusDetail({ ...contractBusBase, contractMonthly: null }, { isAuthenticated: true, now: mockNow })
      expect(vmNull.contract).toEqual({ access: 'hidden' })
    })

    it('returns hidden when contract has expired', () => {
      const expiredBus: BusDetailApi = {
        ...contractBusBase,
        contractExpiry: '2026-09-01T00:00:00.000Z', // Before mockNow (2026-10-20)
      }
      const vm = mapBusDetail(expiredBus, { isAuthenticated: true, now: mockNow })
      expect(vm.contract).toEqual({ access: 'hidden' })
    })

    it('returns locked for guest (isAuthenticated = false) without exposing contract numbers', () => {
      const vm = mapBusDetail(contractBusBase, { isAuthenticated: false, now: mockNow })

      expect(vm.contract.access).toBe('locked')
      if (vm.contract.access === 'locked') {
        expect(vm.contract.typeLabel).toBe('نقل مدرسي / جامعي')
        expect((vm.contract as any).monthlyIncome).toBeUndefined()
        expect((vm.contract as any).durationMonths).toBeUndefined()
        expect((vm.contract as any).clientName).toBeUndefined()
      }
    })

    it('returns visible for authenticated user with full contract details', () => {
      const vm = mapBusDetail(contractBusBase, { isAuthenticated: true, now: mockNow })

      expect(vm.contract).toEqual({
        access: 'visible',
        typeLabel: 'نقل مدرسي / جامعي',
        clientName: 'وزارة التربية والتعليم',
        withDriver: true,
        monthlyIncome: 650,
        durationMonths: 24,
        expiryIso: '2027-06-30T00:00:00.000Z',
      })
    })

    it('maps contractType to basicItems in specsSections so it is visible and searchable', () => {
      const vm = mapBusDetail(contractBusBase, { isAuthenticated: true, now: mockNow })
      const basicSection = vm.specsSections.find((s) => s.title === 'المواصفات الأساسية')
      const contractItem = basicSection?.items.find((i) => i.key === 'contractType')
      expect(contractItem).toEqual({
        key: 'contractType',
        label: 'نوع العقد',
        value: 'نقل مدرسي / جامعي',
      })
    })

    it('maps withDriver to technical specs when busListingType is BUS_SALE_WITH_CONTRACT', () => {
      const vm = mapBusDetail(contractBusBase, { isAuthenticated: true, now: mockNow })
      const techSection = vm.specsSections.find((s) => s.title === 'المواصفات الفنية')
      const driverItem = techSection?.items.find((i) => i.key === 'withDriver')
      expect(driverItem).toEqual({
        key: 'withDriver',
        label: 'سائق',
        value: 'مع سائق',
      })
    })
  })

  describe('Zero Pollution & Empty Fields Filtering', () => {
    it('omits null or empty specs without rendering dashes or undefined', () => {
      const sparseBus: BusDetailApi = {
        ...baseMockBus,
        mileage: null,
        fuelType: null,
        transmission: null,
        condition: null,
        plateNumber: null,
        features: [],
        governorateRef: null,
        wilayaRef: null,
        latitude: null,
        longitude: null,
      }
      const vm = mapBusDetail(sparseBus, { isAuthenticated: true, now: mockNow })

      expect(vm.mileage).toBeUndefined()
      expect(vm.mileageLabel).toBeUndefined()
      expect(vm.conditionLabel).toBeUndefined()

      // keySpecs should only have year and capacity
      expect(vm.keySpecs.map((s) => s.key)).toEqual(['year', 'capacity'])

      // Technical specs section should not exist since all its fields are null
      const techSection = vm.specsSections.find((s) => s.title === 'المواصفات الفنية')
      expect(techSection).toBeUndefined()

      // Features section should not exist
      const featuresSection = vm.specsSections.find((s) => s.title === 'الميزات الإضافية')
      expect(featuresSection).toBeUndefined()

      // Location section should not exist
      const locationSection = vm.specsSections.find((s) => s.title === 'الموقع')
      expect(locationSection).toBeUndefined()
    })
  })
})
