import React from 'react'
import { render, screen, cleanup } from '@testing-library/react-native'
import { PartDetailScreen } from '../../screens/parts/PartDetailScreen'
import { ServiceDetailScreen } from '../../screens/services/ServiceDetailScreen'
import { ListingHeaderBlock } from '../../components/listing-detail/ListingHeaderBlock'
import { ServicePriceHeader } from '../../screens/services/components/ServicePriceHeader'
import { ServiceScheduleCard } from '../../screens/services/components/ServiceScheduleCard'
import { OwnerManageBar, type OwnerAction } from '../../components/listing-detail/OwnerManageBar'
import type { PartDetailViewModel } from '../../types/partDetailViewModel.types'
import type { ServiceDetailViewModel, ServiceScheduleViewModel } from '../../types/serviceDetailViewModel.types'
import type { UsePartDetailResult } from '../../screens/parts/hooks/usePartDetail'

jest.setTimeout(30000)

// ── SHARED MOCKS ─────────────────────────────────────────────────────────────

const mockRouterPush = jest.fn()
const mockRouterBack = jest.fn()

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockRouterPush,
    back: mockRouterBack,
    canGoBack: () => true,
  }),
  useLocalSearchParams: () => ({ id: 'item-101' }),
}))

jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual('@tanstack/react-query')
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: jest.fn(),
      removeQueries: jest.fn(),
    }),
  }
})

jest.mock('expo-image', () => {
  const { View } = require('react-native')
  return { Image: (props: unknown) => <View {...(props as object)} /> }
})

jest.mock('expo-blur', () => {
  const { View } = require('react-native')
  return { BlurView: (props: unknown) => <View {...(props as object)} /> }
})

jest.mock('@expo/vector-icons', () => {
  const { View } = require('react-native')
  return {
    Ionicons: (props: unknown) => <View {...(props as object)} />,
    MaterialCommunityIcons: (props: unknown) => <View {...(props as object)} />,
  }
})

jest.mock('../../store/dialogStore', () => ({
  dialogService: {
    alert: jest.fn(),
    confirm: jest.fn(),
  },
}))

jest.mock('../../utils/assertOwnerHasPhoneForEdit', () => ({
  assertOwnerHasPhoneForEdit: jest.fn(() => true),
}))

jest.mock('../../api/parts', () => ({
  partsApi: {
    remove: jest.fn().mockResolvedValue({ success: true }),
  },
}))

jest.mock('../../api/services', () => ({
  servicesApi: {
    remove: jest.fn().mockResolvedValue({ success: true }),
  },
}))

let mockCurrentUser: { id: string; username?: string; name?: string; phone?: string } | null = null

jest.mock('../../store/authStore', () => {
  const hook: any = (selector?: (s: unknown) => unknown) => {
    const state = {
      user: mockCurrentUser,
      isLoggedIn: Boolean(mockCurrentUser),
    }
    return selector ? selector(state) : state
  }
  hook.getState = () => ({
    user: mockCurrentUser,
    isLoggedIn: Boolean(mockCurrentUser),
  })
  return { useAuthStore: hook }
})

jest.mock('../../hooks/listing-detail/useFavoriteToggle', () => ({
  useFavoriteToggle: () => ({
    isFavorite: false,
    isBusy: false,
    toggle: jest.fn(),
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

jest.mock('../../hooks/listing-detail/useShareListing', () => ({
  useShareListing: () => ({
    share: jest.fn(),
  }),
}))

jest.mock('react-native/Libraries/Share/Share', () => ({
  share: jest.fn().mockResolvedValue({ action: 'sharedAction' }),
}))

let mockPartDetailResult: UsePartDetailResult
jest.mock('../../screens/parts/hooks/usePartDetail', () => ({
  usePartDetail: () => mockPartDetailResult,
}))

let mockServiceDetailResult: {
  state: 'loading' | 'ready' | 'notFound' | 'error'
  vm: ServiceDetailViewModel | null
  raw: unknown
  refetch: jest.Mock
  error: unknown
}
jest.mock('../../screens/services/hooks/useServiceDetail', () => ({
  useServiceDetail: () => mockServiceDetailResult,
}))

// ── FIXTURES ─────────────────────────────────────────────────────────────────

function makeSamplePartVm(overrides?: Partial<PartDetailViewModel>): PartDetailViewModel {
  return {
    id: 'part-101',
    version: 1,
    status: 'ACTIVE',
    title: 'سفايف تويوتا كامري أصلية',
    description: 'سفايف جديدة ممتازة بحالة الوكالة',
    listingType: 'SALE',
    condition: 'NEW',
    conditionLabel: 'جديد',
    partCategory: 'BRAKES',
    partCategoryLabel: 'فرامل ومكابح',
    partNumber: '04465-33471',
    isOriginal: true,
    originalityLabel: 'أصلي وكالة',
    compatibleMakes: ['toyota'],
    compatibleMakesLabels: ['تويوتا'],
    compatibleModels: ['Camry'],
    yearFrom: 2018,
    yearTo: 2023,
    yearRangeLabel: 'من 2018 إلى 2023',
    hasWarranty: true,
    warrantyDuration: 'SIX_MONTHS',
    warrantyDurationLabel: '6 أشهر',
    quantity: 'TWO_TO_FIVE',
    quantityLabel: '2 - 5',
    compatibleVehicleTypes: ['CAR'],
    compatibleVehicleTypesLabels: ['سيارات'],
    price: {
      amount: 45,
      formattedAmount: '45',
      currency: 'ر.ع',
      fullPriceLabel: '45 ر.ع',
      isNegotiable: true,
      listingType: 'SALE',
    },
    images: [{ id: 'img-1', url: 'https://cdn.example.com/part1.jpg', order: 0, isPrimary: true }],
    location: {
      governorateName: 'مسقط',
      wilayaName: 'السيب',
      fullLocationText: 'مسقط، السيب',
      hasCoordinates: true,
      latitude: 23.6,
      longitude: 58.4,
    },
    seller: {
      id: 'seller-999',
      name: 'كراج النجوم',
      username: 'stars_garage',
      isVerified: true,
      memberSinceLabel: 'عضو منذ 2024',
    },
    whatsappEnabled: true,
    postedAtLabel: 'منذ يوم',
    viewCount: 42,
    keySpecs: [{ key: 'category', label: 'الفئة', value: 'فرامل ومكابح' }],
    specsSections: [
      {
        title: 'المواصفات الفنية',
        items: [{ key: 'category', label: 'الفئة', value: 'فرامل ومكابح' }],
      },
    ],
    ...overrides,
  }
}

function makeSampleServiceVm(overrides?: Partial<ServiceDetailViewModel>): ServiceDetailViewModel {
  return {
    id: 'srv-101',
    version: 1,
    status: 'ACTIVE',
    title: 'كراج النخبة لصيانة وتعديل السيارات',
    serviceType: 'MAINTENANCE',
    serviceTypeLabel: 'صيانة وإصلاح',
    providerType: 'WORKSHOP',
    providerTypeLabel: 'كراج / ورشة معتمدة',
    providerName: 'كراج النخبة ش.م.م',
    isHomeService: true,
    homeServiceLabel: 'خدمة منزلية / متنقلة متاحة',
    specializations: ['صيانة ميكانيكية'],
    description: 'نقدم خدمات صيانة متكاملة لجميع أنواع السيارات',
    price: {
      amountLabel: '15 - 45 ر.ع.',
      typeLabel: 'نطاق الأسعار المتوقع',
      isRange: true,
      formattedRange: '15 - 45 ر.ع.',
    },
    workingSchedule: {
      hasSchedule: true,
      workingDays: ['السبت', 'الأحد'],
      workingDaysSummary: 'السبت - الأحد (يومان)',
      workingHoursLabel: '08:00 ص - 05:00 م',
      isOpenHoursProvided: true,
    },
    images: ['https://example.com/srv1.jpg'],
    location: {
      fullLocationText: 'مسقط، السيب، المعبيلة الصناعية',
      address: 'شارع 12 مبنى 45',
      hasCoordinates: true,
      latitude: 23.588,
      longitude: 58.3829,
    },
    website: {
      url: 'https://elite-garage.om',
      displayUrl: 'elite-garage.om',
    },
    seller: {
      id: 'seller-user-99',
      name: 'سالم المعمري',
      username: 'salim_m',
      avatarUrl: 'https://example.com/avatar.jpg',
      isVerified: true,
      memberSinceLabel: 'عضو منذ 2024',
      governorate: 'مسقط',
    },
    whatsappEnabled: true,
    postedAtLabel: 'منذ يومين',
    viewCount: 1540,
    ...overrides,
  }
}

const sampleOwnerActions: OwnerAction[] = [
  { id: 'edit', label: 'تعديل', tone: 'primary' },
  { id: 'delete', label: 'حذف', tone: 'danger' },
]

describe('D-182a Characterization: Duplicate Facts Pre-Change Baseline', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    jest.clearAllMocks()
    mockCurrentUser = null
    mockPartDetailResult = {
      state: 'ready',
      vm: makeSamplePartVm(),
      raw: null,
      refetch: jest.fn(),
      error: null,
    }
    mockServiceDetailResult = {
      state: 'ready',
      vm: makeSampleServiceVm(),
      raw: null,
      refetch: jest.fn(),
      error: null,
    }
  })

  // ── 1. PARTS: Location Duplicate ───────────────────────────────────────────
  describe('Parts Location Duplication Characterization', () => {
    it('characterizes pre-change baseline: location appears TWICE on PartDetailScreen (header + LocationCard)', async () => {
      await render(<PartDetailScreen id="part-101" />)

      // Pre-change: 'مسقط، السيب' is rendered in ListingHeaderBlock AND LocationCard
      const locationMatches = screen.getAllByText('مسقط، السيب')
      expect(locationMatches.length).toBe(2)
    })

    it('characterizes ListingHeaderBlock: renders locationText when provided', async () => {
      await render(
        <ListingHeaderBlock
          title="سفايف تويوتا"
          kindLabel="قطعة غيار"
          price={{ amount: 45, formattedAmount: '45', currency: 'ر.ع', fullPriceLabel: '45 ر.ع', isNegotiable: false, listingType: 'SALE' }}
          locationText="مسقط، السيب"
          postedAtLabel="منذ يوم"
        />,
      )

      expect(screen.getByText('مسقط، السيب')).toBeTruthy()
    })
  })

  // ── 2. SERVICES: Home Service Duplication ──────────────────────────────────
  describe('Services Home Service Duplication Characterization', () => {
    it('characterizes pre-change baseline: home service fact appears in header and in ServiceScheduleCard', async () => {
      await render(<ServiceDetailScreen id="srv-101" />)

      // 1. In header (ServicePriceHeader)
      expect(screen.getByText('خدمة متنقلة')).toBeTruthy()

      // 2. In schedule card (ServiceScheduleCard)
      expect(screen.getByText('خدمة منزلية / متنقلة متاحة عند الطلب')).toBeTruthy()
    })

    it('characterizes pre-change ServiceScheduleCard: renders card even when hasSchedule is false if isHomeService is true', async () => {
      const scheduleWithoutDays: ServiceScheduleViewModel = {
        hasSchedule: false,
        workingDays: [],
        workingDaysSummary: '',
        workingHoursLabel: undefined,
        isOpenHoursProvided: false,
      }

      await render(<ServiceScheduleCard schedule={scheduleWithoutDays} isHomeService={true} />)

      expect(screen.getByTestId('service-schedule-card')).toBeTruthy()
      expect(screen.getByText('خدمة منزلية / متنقلة متاحة عند الطلب')).toBeTruthy()
    })
  })

  // ── 3. SERVICES: View Count Duplication ────────────────────────────────────
  describe('Services View Count Duplication Characterization', () => {
    it('characterizes ServicePriceHeader: renders view count by default', async () => {
      await render(
        <ServicePriceHeader
          title="كراج النخبة"
          price={{ amountLabel: '15 ر.ع.', isRange: false }}
          serviceTypeLabel="صيانة"
          postedAtLabel="منذ يومين"
          viewCount={1540}
        />,
      )

      expect(screen.getByText('1,540 مشاهدة')).toBeTruthy()
    })

    it('characterizes OwnerManageBar (inline): renders view count in stats header', async () => {
      await render(
        <OwnerManageBar
          viewCount={1540}
          actions={sampleOwnerActions}
          onAction={jest.fn()}
        />,
      )

      expect(screen.getByText('1,540 مشاهدة')).toBeTruthy()
    })

    it('characterizes pre-change ServiceDetailScreen as owner: viewCount is rendered in header', async () => {
      mockCurrentUser = { id: 'seller-user-99' } // same as seller.id -> owner
      await render(<ServiceDetailScreen id="srv-101" />)

      // Pre-change: '1,540 مشاهدة' is rendered in ServicePriceHeader
      expect(screen.getByText('1,540 مشاهدة')).toBeTruthy()
    })

    it('characterizes ServiceDetailScreen as visitor: viewCount is rendered in header', async () => {
      mockCurrentUser = { id: 'visitor-user-1' } // visitor
      await render(<ServiceDetailScreen id="srv-101" />)

      // Header shows view count
      expect(screen.getByText('1,540 مشاهدة')).toBeTruthy()
      expect(screen.queryByTestId('owner-manage-bar')).toBeNull()
    })
  })
})
