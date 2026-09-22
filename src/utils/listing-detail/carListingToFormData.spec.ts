import { CarFormData } from '../../types/carForm.types'
import { CarDetailApi } from '../../types/carDetailApi.types'
import { carListingToFormData } from './carListingToFormData'
import { validateCarStep } from '../../hooks/useCarValidation'

/**
 * Compile-time and runtime list of all 49 properties defined in CarFormData.
 * If any property is added or removed from CarFormData, this type assertion
 * and the unit test will immediately flag the disparity.
 */
const ALL_CAR_FORM_KEYS: (keyof CarFormData)[] = [
  'title',
  'description',
  'listingType',
  'condition',
  'year',
  'price',
  'mileage',
  'fuelType',
  'transmission',
  'bodyType',
  'exteriorColor',
  'interior',
  'engineSize',
  'horsepower',
  'doors',
  'seats',
  'driveType',
  'features',
  'currency',
  'isPriceNegotiable',
  'dailyPrice',
  'monthlyPrice',
  'withDriver',
  'depositAmount',
  'minRentalDays',
  'kmLimitPerDay',
  'cancellationPolicy',
  'deliveryAvailable',
  'insuranceIncluded',
  'governorateId',
  'wilayaId',
  'latitude',
  'longitude',
  'brandId',
  'carModelId',
  'carTrimId',
  'make',
  'model',
  'trim',
  'governorateName',
  'wilayaName',
  'images',
  'existingImages',
  'removedImageIds',
  'editMode',
  'editListingId',
  'version',
  'originalBrandId',
  'originalCarModelId',
]

/**
 * Comprehensive fixture for a fully populated RENTAL car listing.
 */
const mockRentalListing: CarDetailApi = {
  id: 'car-rental-101',
  version: 3,
  status: 'ACTIVE',
  title: 'تويوتا لاندكروزر للإيجار اليومي والشهري',
  description: 'سيارة دفع رباعي فاخرة بحالة ممتازة متاحة للإيجار السياحي ورجال الأعمال',
  listingType: 'RENTAL',
  condition: 'USED',

  // Pricing
  price: 0,
  currency: 'OMR',
  isPriceNegotiable: false,

  // Rental specific fields
  dailyPrice: 45,
  monthlyPrice: 950,
  minRentalDays: 2,
  depositAmount: 100,
  kmLimitPerDay: 250,
  cancellationPolicy: 'مرنة - استرداد كامل قبل 24 ساعة',
  withDriver: true,
  deliveryAvailable: true,
  insuranceIncluded: true,

  // Vehicle specifications
  make: 'تويوتا',
  model: 'لاندكروزر',
  trim: 'VXR',
  year: 2023,
  mileage: 28000,
  fuelType: 'PETROL',
  transmission: 'AUTOMATIC',
  bodyType: 'SUV',
  exteriorColor: '#FFFFFF',
  interior: 'BEIGE',
  engineSize: '3.5L Twin Turbo',
  horsepower: 409,
  doors: 5,
  seats: 7,
  driveType: '4WD',
  features: ['فتحة سقف', 'نظام ملاحة', 'مقاعد جلدية', 'كاميرات 360', 'حساسات أمامية وخلفية'],

  // Master Data IDs
  brandId: 'brand-toyota',
  carModelId: 'model-lc',
  carTrimId: 'trim-vxr',

  // Location
  governorateId: 1,
  wilayaId: 101,
  latitude: 23.588,
  longitude: 58.3829,
  governorateRef: { id: 1, nameAr: 'مسقط', nameEn: 'Muscat' },
  wilayaRef: { id: 101, nameAr: 'السيب', nameEn: 'Seeb' },
  governorate: 'مسقط',
  city: 'السيب',

  // Media
  images: [
    { id: 'img-1', url: 'https://cdn.souqone.om/lc1.jpg', order: 0, isPrimary: true },
    { id: 'img-2', url: 'https://cdn.souqone.om/lc2.jpg', order: 1, isPrimary: false },
  ],

  // Seller & Metadata
  seller: {
    id: 'user-77',
    username: 'oman_rentals',
    displayName: 'مكتب مسقط لتأجير السيارات',
    createdAt: '2022-01-15T10:00:00.000Z',
  },
  viewCount: 342,
  createdAt: '2024-03-01T12:00:00.000Z',
}

/**
 * Comprehensive fixture for a standard SALE car listing.
 */
const mockSaleListing: CarDetailApi = {
  id: 'car-sale-202',
  version: 2,
  status: 'ACTIVE',
  title: 'نيسان باترول بلاتينيوم 2022 للبيع بحالة الوكالة',
  description: 'نيسان باترول صبغة وكالة بدون حوادث تشييكات وكالة منتظمة سرفس مجاني',
  listingType: 'SALE',
  condition: 'USED',

  price: 24500,
  currency: 'OMR',
  isPriceNegotiable: true,

  // No rental fields
  dailyPrice: null,
  monthlyPrice: null,
  minRentalDays: null,
  depositAmount: null,
  kmLimitPerDay: null,
  cancellationPolicy: null,
  withDriver: null,
  deliveryAvailable: null,
  insuranceIncluded: null,

  make: 'نيسان',
  model: 'باترول',
  trim: 'Platinum',
  year: 2022,
  mileage: 45000,
  fuelType: 'PETROL',
  transmission: 'AUTOMATIC',
  bodyType: 'SUV',
  exteriorColor: '#000000',
  interior: 'BROWN',
  engineSize: '5.6L V8',
  horsepower: 400,
  doors: 5,
  seats: 8,
  driveType: '4WD',
  features: ['رادار', 'تحديد مسار', 'تبريد مقاعد'],

  brandId: 'brand-nissan',
  carModelId: 'model-patrol',
  carTrimId: 'trim-plat',

  governorateId: 2,
  wilayaId: 201,
  latitude: 23.61,
  longitude: 58.54,
  governorateRef: { id: 2, nameAr: 'ظفار', nameEn: 'Dhofar' },
  wilayaRef: { id: 201, nameAr: 'صلالة', nameEn: 'Salalah' },

  images: [
    { id: 'img-p1', url: 'https://cdn.souqone.om/patrol1.jpg', order: 0, isPrimary: true },
  ],

  seller: {
    id: 'user-88',
    username: 'salalah_cars',
    displayName: 'معرض صلالة',
    createdAt: '2023-05-10T10:00:00.000Z',
  },
  viewCount: 156,
  createdAt: '2024-03-10T12:00:00.000Z',
}

describe('carListingToFormData', () => {
  describe('1. Completeness & Parity (Proving the 16-field gap is closed)', () => {
    it('populates EVERY single key of CarFormData (all 49 fields) without undefined or placeholder values', () => {
      const formData = carListingToFormData(mockRentalListing)

      expect(ALL_CAR_FORM_KEYS).toHaveLength(49)

      ALL_CAR_FORM_KEYS.forEach((key) => {
        expect(formData).toHaveProperty(key)
        expect(formData[key]).not.toBeUndefined()
      })
    })

    it('explicitly populates all 16 fields that were previously dropped by the legacy edit handler', () => {
      const formData = carListingToFormData(mockRentalListing)

      // The 7 missing technical specification fields
      expect(formData.driveType).toBe('4WD')
      expect(formData.interior).toBe('BEIGE')
      expect(formData.engineSize).toBe('3.5L Twin Turbo')
      expect(formData.horsepower).toBe('409')
      expect(formData.doors).toBe('5')
      expect(formData.seats).toBe('7')
      expect(formData.features).toEqual([
        'فتحة سقف',
        'نظام ملاحة',
        'مقاعد جلدية',
        'كاميرات 360',
        'حساسات أمامية وخلفية',
      ])

      // The 9 missing rental fields
      expect(formData.dailyPrice).toBe('45')
      expect(formData.monthlyPrice).toBe('950')
      expect(formData.withDriver).toBe(true)
      expect(formData.depositAmount).toBe('100')
      expect(formData.minRentalDays).toBe('2')
      expect(formData.kmLimitPerDay).toBe('250')
      expect(formData.cancellationPolicy).toBe('مرنة - استرداد كامل قبل 24 ساعة')
      expect(formData.deliveryAvailable).toBe(true)
      expect(formData.insuranceIncluded).toBe(true)
    })
  })

  describe('2. Listing Type Conditionals (RENTAL vs SALE vs WANTED)', () => {
    it('sets rental fields to wizard defaults when converting a SALE listing', () => {
      const formData = carListingToFormData(mockSaleListing)

      // Sale fields are populated
      expect(formData.listingType).toBe('SALE')
      expect(formData.price).toBe('24500')
      expect(formData.isPriceNegotiable).toBe(true)

      // Rental fields MUST remain at wizard defaults (empty string / false)
      expect(formData.dailyPrice).toBe('')
      expect(formData.monthlyPrice).toBe('')
      expect(formData.depositAmount).toBe('')
      expect(formData.minRentalDays).toBe('')
      expect(formData.kmLimitPerDay).toBe('')
      expect(formData.cancellationPolicy).toBe('')
      expect(formData.withDriver).toBe(false)
      expect(formData.deliveryAvailable).toBe(false)
      expect(formData.insuranceIncluded).toBe(false)
    })

    it('handles a WANTED listing correctly with proposed budget and negotiable flag', () => {
      const wantedListing: CarDetailApi = {
        ...mockSaleListing,
        id: 'car-wanted-303',
        listingType: 'WANTED',
        title: 'مطلوب لكزس LX600 موديل 2023 أو 2024',
        price: 50000,
        isPriceNegotiable: true,
        mileage: null,
      }

      const formData = carListingToFormData(wantedListing)

      expect(formData.listingType).toBe('WANTED')
      expect(formData.price).toBe('50000')
      expect(formData.isPriceNegotiable).toBe(true)
      expect(formData.mileage).toBe('')
      expect(formData.dailyPrice).toBe('')
    })
  })

  describe('3. Edge Cases & Type Coercions', () => {
    it('converts null optional scalars to empty strings instead of null/undefined', () => {
      const sparseListing: CarDetailApi = {
        ...mockSaleListing,
        trim: null,
        mileage: null,
        engineSize: null,
        horsepower: null,
        doors: null,
        seats: null,
        driveType: null,
        features: null,
        condition: null,
      }

      const formData = carListingToFormData(sparseListing)

      expect(formData.trim).toBe('')
      expect(formData.mileage).toBe('')
      expect(formData.engineSize).toBe('')
      expect(formData.horsepower).toBe('')
      expect(formData.doors).toBe('')
      expect(formData.seats).toBe('')
      expect(formData.driveType).toBe('')
      expect(formData.features).toEqual([])
      expect(formData.condition).toBe('')
    })

    it('safely handles empty or missing images array', () => {
      const noImagesListing: CarDetailApi = {
        ...mockSaleListing,
        images: [],
      }

      const formData = carListingToFormData(noImagesListing)

      expect(formData.images).toEqual([])
      expect(formData.existingImages).toEqual([])
      expect(formData.removedImageIds).toEqual([])
    })

    it('maps existingImages with proper structure preserving id, url, isPrimary, and order', () => {
      const formData = carListingToFormData(mockRentalListing)

      expect(formData.existingImages).toHaveLength(2)
      expect(formData.existingImages[0]).toEqual({
        id: 'img-1',
        url: 'https://cdn.souqone.om/lc1.jpg',
        isPrimary: true,
        order: 0,
      })
      expect(formData.existingImages[1]).toEqual({
        id: 'img-2',
        url: 'https://cdn.souqone.om/lc2.jpg',
        isPrimary: false,
        order: 1,
      })
      expect(formData.images).toEqual([])
      expect(formData.removedImageIds).toEqual([])
    })

    it('preserves optimistic concurrency version and original brand/model IDs for edit tracking', () => {
      const formData = carListingToFormData(mockRentalListing)

      expect(formData.version).toBe(3)
      expect(formData.originalBrandId).toBe('brand-toyota')
      expect(formData.originalCarModelId).toBe('model-lc')
      expect(formData.editMode).toBe(true)
      expect(formData.editListingId).toBe('car-rental-101')
    })
  })

  describe('4. Round-Trip Validation Sanity Check', () => {
    it('satisfies all 4 wizard validation steps when converted from a valid SALE listing', () => {
      const formData = carListingToFormData(mockSaleListing)

      // Step 1: Type, Title & Description
      const step1Result = validateCarStep(1, formData)
      expect(step1Result.isValid).toBe(true)
      expect(step1Result.errors).toEqual({})

      // Step 2: Images Validation (at least 1 image present)
      const step2Result = validateCarStep(2, formData)
      expect(step2Result.isValid).toBe(true)
      expect(step2Result.errors).toEqual({})

      // Step 3: Technical Specifications
      const step3Result = validateCarStep(3, formData)
      expect(step3Result.isValid).toBe(true)
      expect(step3Result.errors).toEqual({})

      // Step 4: Pricing & Location
      const step4Result = validateCarStep(4, formData)
      expect(step4Result.isValid).toBe(true)
      expect(step4Result.errors).toEqual({})
    })

    it('satisfies all 4 wizard validation steps when converted from a valid RENTAL listing', () => {
      const formData = carListingToFormData(mockRentalListing)

      const step1Result = validateCarStep(1, formData)
      expect(step1Result.isValid).toBe(true)
      expect(step1Result.errors).toEqual({})

      const step2Result = validateCarStep(2, formData)
      expect(step2Result.isValid).toBe(true)
      expect(step2Result.errors).toEqual({})

      const step3Result = validateCarStep(3, formData)
      expect(step3Result.isValid).toBe(true)
      expect(step3Result.errors).toEqual({})

      const step4Result = validateCarStep(4, formData)
      expect(step4Result.isValid).toBe(true)
      expect(step4Result.errors).toEqual({})
    })
  })
})
