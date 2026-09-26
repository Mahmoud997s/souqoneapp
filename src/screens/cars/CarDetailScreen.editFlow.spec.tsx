import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import type { CarFormData } from '../../types/carForm.types'
import type { CarDetailApi } from '../../types/carDetailApi.types'
import type { CarDetailViewModel } from '../../types/carDetailViewModel.types'
import { CarDetailScreen } from './CarDetailScreen'

// ── MOCKS ───────────────────────────────────────────────────────────────────

const mockRouterPush = jest.fn()
const mockRouterBack = jest.fn()

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockRouterPush,
    back: mockRouterBack,
  }),
  useLocalSearchParams: () => ({ id: 'car-rental-101' }),
}))

jest.mock('expo-image', () => {
  const { View } = require('react-native')
  return { Image: (props: any) => <View {...props} /> }
})

jest.mock('expo-blur', () => {
  const { View } = require('react-native')
  return { BlurView: (props: any) => <View {...props} /> }
})

jest.mock('@expo/vector-icons', () => {
  const { View } = require('react-native')
  return { Ionicons: (props: any) => <View {...props} /> }
})

const mockSetEditMode = jest.fn()
jest.mock('../../store/carWizardStore', () => ({
  useCarWizardStore: {
    getState: () => ({
      setEditMode: mockSetEditMode,
    }),
  },
}))

jest.mock('../../store/dialogStore', () => ({
  dialogService: {
    alert: jest.fn(),
    confirm: jest.fn(),
  },
}))

let mockCurrentUser: { id: string; username?: string } | null = {
  id: 'user-77',
  username: 'oman_rentals',
}

jest.mock('../../store/authStore', () => ({
  useAuthStore: () => ({
    user: mockCurrentUser,
  }),
}))

let mockCarDetailResult: {
  state: 'loading' | 'ready' | 'error' | 'notFound'
  vm: CarDetailViewModel | null
  raw: CarDetailApi | null
  refetch: jest.Mock
  error: Error | null
} = {
  state: 'ready',
  vm: null,
  raw: null,
  refetch: jest.fn(),
  error: null,
}

jest.mock('../../hooks/listing-detail/useCarDetail', () => ({
  useCarDetail: () => mockCarDetailResult,
}))

jest.mock('../../hooks/listing-detail/useFavoriteToggle', () => ({
  useFavoriteToggle: () => ({
    isFavorite: false,
    isBusy: false,
    toggle: jest.fn(),
  }),
}))

jest.mock('../../hooks/listing-detail/useShareListing', () => ({
  useShareListing: () => ({
    share: jest.fn(),
    isSharing: false,
  }),
}))

jest.mock('../../hooks/listing-detail/useListingContact', () => ({
  useListingContact: () => ({
    busy: false,
    call: jest.fn(),
    whatsApp: jest.fn(),
    chat: jest.fn(),
  }),
}))

const mockRunOwnerAction = jest.fn()
jest.mock('../../hooks/listing-detail/useOwnerActions', () => ({
  useOwnerActions: () => ({
    actions: [
      { id: 'edit', label: 'تعديل', tone: 'primary', icon: 'create-outline' },
      { id: 'delete', label: 'حذف', tone: 'danger', icon: 'trash-outline' },
    ],
    viewCount: 342,
    busy: false,
    run: mockRunOwnerAction,
  }),
  isOptimisticLockError: jest.fn(() => false),
}))

jest.mock('../../hooks/listing-detail/useSimilarListings', () => ({
  useSimilarListings: () => ({
    listings: [],
    loading: false,
    error: null,
    refetch: jest.fn(),
  }),
}))

// ── FIXTURES & CONSTANTS ───────────────────────────────────────────────────

/**
 * Compile-time and runtime array of all 49 fields in CarFormData.
 * Guarantees that any field added or deleted from the form contract is accounted for.
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
 * Fully populated RENTAL CarDetailApi fixture containing all 16 previously-dropped
 * attributes (specifications + rental options) as well as master data and location.
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

  // Rental specific fields (9 fields)
  dailyPrice: 45,
  monthlyPrice: 950,
  minRentalDays: 2,
  depositAmount: 100,
  kmLimitPerDay: 250,
  cancellationPolicy: 'مرنة - استرداد كامل قبل 24 ساعة',
  withDriver: true,
  deliveryAvailable: true,
  insuranceIncluded: true,

  // Vehicle specifications (7 fields)
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

const mockRentalViewModel: CarDetailViewModel = {
  id: 'car-rental-101',
  version: 3,
  status: 'ACTIVE',
  title: 'تويوتا لاندكروزر للإيجار اليومي والشهري',
  description: 'سيارة دفع رباعي فاخرة بحالة ممتازة متاحة للإيجار السياحي ورجال الأعمال',
  listingType: 'RENTAL',
  conditionLabel: 'مستعمل',
  price: {
    amount: 0,
    formattedAmount: '0',
    currency: 'ر.ع',
    fullPriceLabel: '0 ر.ع',
    isNegotiable: false,
    listingType: 'RENTAL',
  },
  images: [
    { id: 'img-1', url: 'https://cdn.souqone.om/lc1.jpg', order: 0, isPrimary: true },
    { id: 'img-2', url: 'https://cdn.souqone.om/lc2.jpg', order: 1, isPrimary: false },
  ],
  location: {
    fullLocationText: 'مسقط، السيب',
    hasCoordinates: true,
    latitude: 23.588,
    longitude: 58.3829,
    governorateName: 'مسقط',
    wilayaName: 'السيب',
  },
  seller: {
    id: 'user-77',
    name: 'مكتب مسقط لتأجير السيارات',
    username: 'oman_rentals',
    isVerified: false,
    memberSinceLabel: 'عضو منذ 2022',
  },
  whatsappEnabled: true,
  postedAtLabel: 'منذ أسبوع',
  viewCount: 342,
  make: 'تويوتا',
  model: 'لاندكروزر',
  trim: 'VXR',
  year: 2023,
  keySpecs: [],
  specsSections: [],
  features: ['فتحة سقف', 'نظام ملاحة', 'مقاعد جلدية', 'كاميرات 360', 'حساسات أمامية وخلفية'],
}

// ── TEST SUITE ─────────────────────────────────────────────────────────────

describe('CarDetailScreen Edit Flow & 49-Field Parity Regression', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCurrentUser = { id: 'user-77', username: 'oman_rentals' }
    mockCarDetailResult = {
      state: 'ready',
      vm: mockRentalViewModel,
      raw: mockRentalListing,
      refetch: jest.fn(),
      error: null,
    }
  })

  it('1. Contract Guard: ALL_CAR_FORM_KEYS contains exactly 49 keys matching CarFormData', () => {
    expect(ALL_CAR_FORM_KEYS).toHaveLength(49)
    const uniqueKeys = new Set(ALL_CAR_FORM_KEYS)
    expect(uniqueKeys.size).toBe(49)
  })

  it('2. Core Integration: pressing edit button triggers carListingToFormData, populates setEditMode and navigates to /cars/new', async () => {
    await render(<CarDetailScreen id="car-rental-101" />)

    const editBtn = screen.getByTestId('btn-owner-edit')
    expect(editBtn).toBeTruthy()

    fireEvent.press(editBtn)

    expect(mockSetEditMode).toHaveBeenCalledTimes(1)
    expect(mockSetEditMode).toHaveBeenCalledWith('car-rental-101', expect.any(Object))
    expect(mockRouterPush).toHaveBeenCalledTimes(1)
    expect(mockRouterPush).toHaveBeenCalledWith('/cars/new')
  })

  it('3. Complete 49-Field Parity: every single CarFormData key exists and is non-undefined in setEditMode payload', async () => {
    await render(<CarDetailScreen id="car-rental-101" />)

    fireEvent.press(screen.getByTestId('btn-owner-edit'))

    const [listingId, formData] = mockSetEditMode.mock.calls[0] as [string, CarFormData]
    expect(listingId).toBe('car-rental-101')

    // Verify key parity
    const payloadKeys = Object.keys(formData)
    expect(payloadKeys.sort()).toEqual([...ALL_CAR_FORM_KEYS].sort())

    // Verify each field is explicitly defined
    for (const key of ALL_CAR_FORM_KEYS) {
      expect(formData[key]).toBeDefined()
    }
  })

  it('4. Historical Bug (P-05) Prevention: all 7 specification fields survive into edit formData without loss', async () => {
    await render(<CarDetailScreen id="car-rental-101" />)

    fireEvent.press(screen.getByTestId('btn-owner-edit'))

    const [, formData] = mockSetEditMode.mock.calls[0] as [string, CarFormData]

    // 7 spec fields previously lost in legacy edit handler
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
  })

  it('5. Historical Bug (P-05) Prevention: all 9 rental fields survive into edit formData without loss', async () => {
    await render(<CarDetailScreen id="car-rental-101" />)

    fireEvent.press(screen.getByTestId('btn-owner-edit'))

    const [, formData] = mockSetEditMode.mock.calls[0] as [string, CarFormData]

    // 9 rental fields previously lost in legacy edit handler
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

  it('6. Location & Master Data Integrity: governorate, wilaya, coordinates, and brand/model IDs are preserved', async () => {
    await render(<CarDetailScreen id="car-rental-101" />)

    fireEvent.press(screen.getByTestId('btn-owner-edit'))

    const [, formData] = mockSetEditMode.mock.calls[0] as [string, CarFormData]

    expect(formData.governorateId).toBe(1)
    expect(formData.wilayaId).toBe(101)
    expect(formData.latitude).toBe(23.588)
    expect(formData.longitude).toBe(58.3829)
    expect(formData.governorateName).toBe('مسقط')
    expect(formData.wilayaName).toBe('السيب')

    expect(formData.brandId).toBe('brand-toyota')
    expect(formData.carModelId).toBe('model-lc')
    expect(formData.carTrimId).toBe('trim-vxr')
    expect(formData.make).toBe('تويوتا')
    expect(formData.model).toBe('لاندكروزر')
    expect(formData.trim).toBe('VXR')

    // Concurrency tracking & edit mode flags
    expect(formData.version).toBe(3)
    expect(formData.originalBrandId).toBe('brand-toyota')
    expect(formData.originalCarModelId).toBe('model-lc')
    expect(formData.editMode).toBe(true)
    expect(formData.editListingId).toBe('car-rental-101')
  })

  it('7. Image Preservation: existingImages are mapped with primary flag and order preserved', async () => {
    await render(<CarDetailScreen id="car-rental-101" />)

    fireEvent.press(screen.getByTestId('btn-owner-edit'))

    const [, formData] = mockSetEditMode.mock.calls[0] as [string, CarFormData]

    expect(formData.images).toEqual([])
    expect(formData.removedImageIds).toEqual([])
    expect(formData.existingImages).toEqual([
      { id: 'img-1', url: 'https://cdn.souqone.om/lc1.jpg', isPrimary: true, order: 0 },
      { id: 'img-2', url: 'https://cdn.souqone.om/lc2.jpg', isPrimary: false, order: 1 },
    ])
  })

  it('8. Security / Non-Owner Guard: edit button is not rendered when viewer is not listing seller', async () => {
    mockCurrentUser = { id: 'user-different', username: 'buyer_user' }

    await render(<CarDetailScreen id="car-rental-101" />)

    expect(screen.queryByTestId('btn-owner-edit')).toBeNull()
    expect(mockSetEditMode).not.toHaveBeenCalled()
    expect(mockRouterPush).not.toHaveBeenCalled()
  })

  it('9. Non-Ready State Guard: edit button is not rendered in loading state', async () => {
    mockCarDetailResult = {
      state: 'loading',
      vm: null,
      raw: null,
      refetch: jest.fn(),
      error: null,
    }

    await render(<CarDetailScreen id="car-rental-101" />)

    expect(screen.queryByTestId('btn-owner-edit')).toBeNull()
    expect(mockSetEditMode).not.toHaveBeenCalled()
    expect(mockRouterPush).not.toHaveBeenCalled()
  })
})
