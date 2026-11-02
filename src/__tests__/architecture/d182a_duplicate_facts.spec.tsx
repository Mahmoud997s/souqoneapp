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

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))

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
  const hook = (selector?: (s: { user: typeof mockCurrentUser; isLoggedIn: boolean }) => unknown) => {
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
  { id: 'edit', label: 'تعديل', tone: 'primary', icon: 'create-outline', requiresConfirm: false },
  { id: 'delete', label: 'حذف', tone: 'danger', icon: 'trash-outline', requiresConfirm: true },
]

describe('D-182a: Remove Duplicate Facts from Parts and Services Detail Pages', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    jest.clearAllMocks()
    mockCurrentUser = null
    mockPartDetailResult = {
      state: 'ready',
      vm: makeSamplePartVm(),
      raw: undefined,
      refetch: jest.fn(),
      error: null,
      errorKind: 'unknown',
      isRefetchError: false,
    }
    mockServiceDetailResult = {
      state: 'ready',
      vm: makeSampleServiceVm(),
      raw: null,
      refetch: jest.fn(),
      error: null,
    }
  })

  // ── 1. PARTS: Location Fact Appears Once in LocationCard ────────────────────
  describe('Parts Location Single-Source Specification (D-182a decision 1)', () => {
    it('shows location text exactly ONCE on PartDetailScreen (in LocationCard only, omitted from header)', async () => {
      await render(<PartDetailScreen id="part-101" />)

      // Post-change: location text 'مسقط، السيب' appears exactly ONCE across the entire screen
      const locationMatches = screen.getAllByText('مسقط، السيب')
      expect(locationMatches.length).toBe(1)
    })

    it('ListingHeaderBlock: omits location item and dot divider when locationText is omitted or empty', async () => {
      await render(
        <ListingHeaderBlock
          title="سفايف تويوتا"
          kindLabel="قطعة غيار"
          price={{ amount: 45, formattedAmount: '45', currency: 'ر.ع', fullPriceLabel: '45 ر.ع', isNegotiable: false, listingType: 'SALE' }}
          postedAtLabel="منذ يوم"
        />,
      )

      expect(screen.getByText('سفايف تويوتا')).toBeTruthy()
      expect(screen.getByText('منذ يوم')).toBeTruthy()
      expect(screen.queryByText('مسقط، السيب')).toBeNull()
    })

    it('Cars/Buses/Equipment parity: ListingHeaderBlock renders locationText normally when provided', async () => {
      await render(
        <ListingHeaderBlock
          title="تويوتا كامري 2023"
          kindLabel="للبيع"
          price={{ amount: 7500, formattedAmount: '7,500', currency: 'ر.ع', fullPriceLabel: '7,500 ر.ع', isNegotiable: true, listingType: 'SALE' }}
          locationText="مسقط، السيب"
          postedAtLabel="منذ ساعتين"
        />,
      )

      expect(screen.getByText('تويوتا كامري 2023')).toBeTruthy()
      expect(screen.getByText('مسقط، السيب')).toBeTruthy()
      expect(screen.getByText('منذ ساعتين')).toBeTruthy()
    })
  })

  // ── 2. SERVICES: Home Service Fact Appears Once in Header Badge ─────────────
  describe('Services Home Service Single-Source Specification (D-182a decision 2)', () => {
    it('shows home-service fact in header badge and strictly omits duplicate badge from ServiceScheduleCard', async () => {
      await render(<ServiceDetailScreen id="srv-101" />)

      // 1. In header (ServicePriceHeader): top-level header badge is present
      expect(screen.getByText('خدمة متنقلة')).toBeTruthy()

      // 2. In schedule card (ServiceScheduleCard): duplicate badge is strictly omitted
      expect(screen.queryByText('خدمة منزلية / متنقلة متاحة عند الطلب')).toBeNull()
    })

    it('ServiceScheduleCard: returns null when hasSchedule is false, even if isHomeService is true', async () => {
      const scheduleWithoutDays: ServiceScheduleViewModel = {
        hasSchedule: false,
        workingDays: [],
        workingDaysSummary: '',
        workingHoursLabel: undefined,
        isOpenHoursProvided: false,
      }

      await render(<ServiceScheduleCard schedule={scheduleWithoutDays} isHomeService={true} />)

      expect(screen.queryByTestId('service-schedule-card')).toBeNull()
      expect(screen.queryByText('خدمة منزلية / متنقلة متاحة عند الطلب')).toBeNull()
    })
  })

  // ── 3. SERVICES: View Count Single-Source Specification (D-182a1 correction) ──
  describe('Services View Count Single-Source Specification (D-182a1)', () => {
    it('shows viewCount exactly ONCE in header for a VISITOR (sticky owner bar is not rendered)', async () => {
      mockCurrentUser = { id: 'visitor-user-1' } // visitor
      await render(<ServiceDetailScreen id="srv-101" />)

      const viewMatches = screen.getAllByText('1,540 مشاهدة')
      expect(viewMatches.length).toBe(1)
      expect(screen.queryByTestId('owner-manage-bar')).toBeNull()
    })

    it('shows viewCount exactly ONCE in header for the OWNER while sticky OwnerManageBar is rendered without viewCount', async () => {
      mockCurrentUser = { id: 'seller-user-99' } // same as seller.id -> owner
      await render(<ServiceDetailScreen id="srv-101" />)

      // Header renders view count exactly once for the owner, and sticky OwnerManageBar does not duplicate it
      const viewMatches = screen.getAllByText('1,540 مشاهدة')
      expect(viewMatches.length).toBe(1)
      expect(screen.getAllByText(/مشاهدة/).length).toBe(1)
    })

    it('ServicePriceHeader: always renders viewCount without a showViewCount prop', async () => {
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

    it('OwnerManageBar (sticky): never renders view count, while (inline) renders view count in stats header', async () => {
      const { unmount } = await render(
        <OwnerManageBar
          variant="sticky"
          viewCount={1540}
          busy={false}
          actions={sampleOwnerActions}
          onAction={jest.fn()}
        />,
      )
      expect(screen.queryByText(/مشاهدة/)).toBeNull()
      unmount()

      await render(
        <OwnerManageBar
          variant="inline"
          viewCount={1540}
          busy={false}
          actions={sampleOwnerActions}
          onAction={jest.fn()}
        />,
      )

      expect(screen.getByText(/مشاهدة/)).toBeTruthy()
      expect(screen.getByText('أنت مالك هذا الإعلان')).toBeTruthy()
    })
  })
})
