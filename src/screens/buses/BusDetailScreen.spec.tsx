import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import type { BusDetailViewModel } from '../../types/busDetailViewModel.types'
import type { BusDetailApi } from '../../types/busDetailApi.types'
import { BusDetailScreen } from './BusDetailScreen'

jest.setTimeout(20000)

// ── MOCKS ───────────────────────────────────────────────────────────────────

const mockRouterPush = jest.fn()
const mockRouterBack = jest.fn()

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockRouterPush,
    back: mockRouterBack,
    canGoBack: () => true,
  }),
  useLocalSearchParams: () => ({ id: 'bus-101' }),
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
jest.mock('../../store/busWizardStore', () => ({
  useBusWizardStore: {
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

let mockCurrentUser: { id: string; username?: string } | null = null

jest.mock('../../store/authStore', () => ({
  useAuthStore: () => ({
    user: mockCurrentUser,
    isLoggedIn: Boolean(mockCurrentUser),
  }),
}))

let mockBusDetailResult: {
  state: 'loading' | 'ready' | 'error' | 'notFound'
  vm: BusDetailViewModel | null
  raw: BusDetailApi | null
  refetch: jest.Mock
  error: Error | null
} = {
  state: 'ready',
  vm: null,
  raw: null,
  refetch: jest.fn(),
  error: null,
}

jest.mock('../../hooks/listing-detail/useBusDetail', () => ({
  useBusDetail: () => mockBusDetailResult,
}))

const mockToggleFavorite = jest.fn()
const mockUseFavoriteToggle = jest.fn(() => ({
  isFavorite: false,
  isBusy: false,
  toggle: mockToggleFavorite,
}))
jest.mock('../../hooks/listing-detail/useFavoriteToggle', () => ({
  useFavoriteToggle: (...args: any[]) => (mockUseFavoriteToggle as any)(...args),
}))

const mockShareListing = jest.fn()
jest.mock('../../hooks/listing-detail/useShareListing', () => ({
  useShareListing: () => ({
    share: mockShareListing,
  }),
}))

const mockContactCall = jest.fn()
const mockContactWhatsApp = jest.fn()
const mockContactChat = jest.fn()
const mockUseListingContact = jest.fn(() => ({
  busy: false,
  call: mockContactCall,
  whatsApp: mockContactWhatsApp,
  chat: mockContactChat,
}))
jest.mock('../../hooks/listing-detail/useListingContact', () => ({
  useListingContact: (...args: any[]) => (mockUseListingContact as any)(...args),
}))

const mockRequireAuth = jest.fn()
jest.mock('../../hooks/listing-detail/useRequireAuth', () => ({
  useRequireAuth: () => ({
    requireAuth: mockRequireAuth,
  }),
}))

const mockRunOwnerAction = jest.fn()
let mockOwnerActionsList: any[] = [
  { id: 'edit', label: 'تعديل', tone: 'neutral', icon: 'create-outline', requiresConfirm: false },
  { id: 'delete', label: 'حذف', tone: 'danger', icon: 'trash-outline', requiresConfirm: true },
]
jest.mock('../../hooks/listing-detail/useBusOwnerActions', () => ({
  useBusOwnerActions: () => ({
    actions: mockOwnerActionsList,
    viewCount: 250,
    busy: false,
    run: mockRunOwnerAction,
  }),
  isOptimisticLockError: jest.fn(() => false),
}))

let mockSimilarItems: any[] = []
let mockSimilarLoading = false
let mockSimilarError = false
const mockSimilarRefetch = jest.fn()
jest.mock('../../hooks/listing-detail/useBusSimilarListings', () => ({
  useBusSimilarListings: () => ({
    items: mockSimilarItems,
    isLoading: mockSimilarLoading,
    isError: mockSimilarError,
    refetch: mockSimilarRefetch,
  }),
}))

// ── SAMPLE FIXTURES ─────────────────────────────────────────────────────────

function makeSampleVm(overrides?: Partial<BusDetailViewModel>): BusDetailViewModel {
  return {
    id: 'bus-101',
    version: 1,
    status: 'ACTIVE',
    title: 'تويوتا كوستر 2022 للبيع',
    description: 'حافلة بحالة ممتازة وجاهزة للاستخدام',
    listingType: 'SALE',
    busListingType: 'BUS_SALE_WITH_CONTRACT',
    busTypeLabel: 'كوستر',
    price: {
      amount: 25000,
      formattedAmount: '25,000',
      currency: 'ر.ع',
      fullPriceLabel: '25,000 ر.ع',
      isNegotiable: false,
      listingType: 'BUS_SALE_WITH_CONTRACT',
    },
    images: [{ id: 'img-1', url: 'https://images.souqone.om/bus1.jpg', isPrimary: true, order: 0 }],
    location: {
      governorateName: 'مسقط',
      wilayaName: 'السيب',
      fullLocationText: 'مسقط، السيب',
      hasCoordinates: true,
      latitude: 23.588,
      longitude: 58.3829,
    },
    seller: {
      id: 'seller-77',
      name: 'سالم الشقصي',
      username: 'salim_oman',
      isVerified: true,
      memberSinceLabel: 'عضو منذ 2024',
    },
    whatsappEnabled: true,
    postedAtLabel: 'منذ ساعتين',
    viewCount: 180,
    make: 'Toyota',
    model: 'Coaster',
    keySpecs: [{ key: 'year', label: 'سنة الصنع', value: '2022' }],
    specsSections: [
      {
        title: 'المواصفات الفنية',
        items: [
          { key: 'capacity', label: 'السعة', value: '30 راكب' },
          { key: 'fuel', label: 'نوع الوقود', value: 'ديزل' },
        ],
      },
    ],
    features: ['مكيف هواء', 'أحزمة أمان'],
    contract: {
      access: 'visible',
      typeLabel: 'نقل مدرسي / جامعي',
      clientName: 'وزارة التربية',
      withDriver: true,
      monthlyIncome: 800,
      durationMonths: 24,
      expiryIso: '2028-10-20T00:00:00.000Z',
    },
    ...overrides,
  }
}

describe('BusDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCurrentUser = null
    mockSimilarItems = []
    mockSimilarLoading = false
    mockSimilarError = false
    mockOwnerActionsList = [
      { id: 'edit', label: 'تعديل', tone: 'neutral', icon: 'create-outline', requiresConfirm: false },
      { id: 'delete', label: 'حذف', tone: 'danger', icon: 'trash-outline', requiresConfirm: true },
    ]
    mockBusDetailResult = {
      state: 'ready',
      vm: makeSampleVm(),
      raw: { id: 'bus-101', title: 'تويوتا كوستر 2022 للبيع' } as any,
      refetch: jest.fn(),
      error: null,
    }
  })

  // 1. Loading / NotFound / Error States
  describe('1. States (loading / notFound / error)', () => {
    it('renders loading state indicator', async () => {
      mockBusDetailResult.state = 'loading'
      mockBusDetailResult.vm = null
      await render(<BusDetailScreen id="bus-101" />)
      expect(screen.getByTestId('detail-state-loading')).toBeTruthy()
      expect(screen.getByText('جارٍ تحميل تفاصيل الإعلان...')).toBeTruthy()
    })

    it('renders notFound state when listing does not exist', async () => {
      mockBusDetailResult.state = 'notFound'
      mockBusDetailResult.vm = null
      await render(<BusDetailScreen id="bus-101" />)
      expect(screen.getByTestId('detail-state-not-found')).toBeTruthy()
      expect(screen.getByText('الإعلان غير موجود')).toBeTruthy()
    })

    it('renders error state when request fails', async () => {
      mockBusDetailResult.state = 'error'
      mockBusDetailResult.vm = null
      await render(<BusDetailScreen id="bus-101" />)
      expect(screen.getByTestId('detail-state-error')).toBeTruthy()
      expect(screen.getByText('تعذر تحميل الإعلان')).toBeTruthy()
    })
  })

  // 2. Visitor: ContactActions visible, OwnerManageBar hidden
  describe('2. Visitor / Guest View', () => {
    it('renders ContactActions and hides OwnerManageBar for non-owner visitor', async () => {
      mockCurrentUser = { id: 'visitor-123', username: 'guest' }
      await render(<BusDetailScreen id="bus-101" />)

      // Contact buttons present
      expect(screen.getAllByText('محادثة').length).toBeGreaterThan(0)
      expect(screen.getAllByText('اتصال').length).toBeGreaterThan(0)

      // Owner bar actions not present
      expect(screen.queryByText('تعديل الإعلان')).toBeNull()
      expect(screen.queryByText('إحصائيات الإعلان')).toBeNull()
    })
  })

  // 3. Owner: OwnerManageBar visible, ContactActions hidden, no contact endpoint call
  describe('3. Owner View', () => {
    it('renders OwnerManageBar and strictly hides ContactActions for owner', async () => {
      mockCurrentUser = { id: 'seller-77', username: 'salim_oman' }
      await render(<BusDetailScreen id="bus-101" />)

      // Owner buttons present
      expect(screen.getAllByText('تعديل').length).toBeGreaterThan(0)
      expect(screen.getAllByText('حذف').length).toBeGreaterThan(0)

      // Contact actions strictly hidden
      expect(screen.queryByText('محادثة')).toBeNull()
      expect(screen.queryByText('اتصال')).toBeNull()
      expect(mockContactCall).not.toHaveBeenCalled()
      expect(mockContactWhatsApp).not.toHaveBeenCalled()
    })
  })

  // 4. Chat opens with entityType 'BUS_LISTING'
  describe('4. Chat EntityType verification', () => {
    it('initializes contact hook strictly with BUS_LISTING entityType', async () => {
      mockCurrentUser = { id: 'buyer-55' }
      await render(<BusDetailScreen id="bus-101" />)

      expect(mockUseListingContact).toHaveBeenCalledWith(
        'BUS_LISTING',
        'bus-101',
        '/buses/bus-101',
        'تويوتا كوستر 2022 للبيع'
      )
    })
  })

  // 5. Favorite toggle with entityType 'BUS_LISTING'
  describe('5. Favorite Toggle verification', () => {
    it('initializes favorite hook strictly with BUS_LISTING entityType', async () => {
      await render(<BusDetailScreen id="bus-101" />)

      expect(mockUseFavoriteToggle).toHaveBeenCalledWith(
        'BUS_LISTING',
        'bus-101',
        false,
        { redirectPath: '/buses/bus-101' }
      )
    })
  })

  // 6. Contract access states: guest (locked), auth (visible), expired/none (hidden)
  describe('6. Commercial Contract access states', () => {
    it('renders locked card with login button and no financial numbers for guest', async () => {
      mockBusDetailResult.vm = makeSampleVm({
        contract: { access: 'locked', typeLabel: 'نقل مدرسي' },
      })
      await render(<BusDetailScreen id="bus-101" />)

      expect(screen.getByText('سجّل الدخول لعرض تفاصيل عقد التشغيل')).toBeTruthy()
      expect(screen.getByText('تسجيل الدخول')).toBeTruthy()
      expect(screen.queryByText('إجمالي الدخل المتبقي')).toBeNull()
    })

    it('renders full contract details and disclaimer for authenticated user', async () => {
      mockCurrentUser = { id: 'auth-user-9' }
      mockBusDetailResult.vm = makeSampleVm({
        contract: {
          access: 'visible',
          typeLabel: 'نقل مدرسي',
          clientName: 'وزارة التربية',
          withDriver: true,
          monthlyIncome: 800,
          durationMonths: 24,
          expiryIso: '2028-10-20T00:00:00.000Z',
        },
      })
      await render(<BusDetailScreen id="bus-101" />)

      expect(screen.getByText('وزارة التربية')).toBeTruthy()
      expect(screen.getByText('تقدير مبني على إجمالي دخل العقد المتبقي، ولا يشمل التكاليف التشغيلية')).toBeTruthy()
    })

    it('omits contract section entirely when contract.access is hidden', async () => {
      mockBusDetailResult.vm = makeSampleVm({
        contract: { access: 'hidden' },
      })
      await render(<BusDetailScreen id="bus-101" />)

      expect(screen.queryByText('عقد التشغيل')).toBeNull()
      expect(screen.queryByText('سجّل الدخول لعرض تفاصيل عقد التشغيل')).toBeNull()
    })
  })

  // 7. Bus Rent omits recoveryPercent
  describe('7. Rental Bus Contract Metric Guard', () => {
    it('omits recoveryPercent, annualYield, and payback metrics on BUS_RENT listings', async () => {
      mockCurrentUser = { id: 'auth-user-9' }
      mockBusDetailResult.vm = makeSampleVm({
        busListingType: 'BUS_RENT',
        contract: {
          access: 'visible',
          typeLabel: 'تأجير حافلات',
          monthlyIncome: 600,
          withDriver: false,
          durationMonths: 12,
          expiryIso: '2027-10-20T00:00:00.000Z',
        },
      })
      await render(<BusDetailScreen id="bus-101" />)

      expect(screen.queryByText(/نسبة الاسترداد/)).toBeNull()
      expect(screen.queryByText('العائد السنوي')).toBeNull()
    })
  })

  // 8. Status SOLD renders sold badge and owner actions is delete only
  describe('8. Sold Status and Owner Action Matrix', () => {
    it('renders sold badge and restricts owner actions to delete only when status is SOLD', async () => {
      mockCurrentUser = { id: 'seller-77' }
      mockOwnerActionsList = [
        { id: 'delete', label: 'حذف', tone: 'danger', icon: 'trash-outline', requiresConfirm: true },
      ]
      mockBusDetailResult.vm = makeSampleVm({
        status: 'SOLD',
      })
      await render(<BusDetailScreen id="bus-101" />)

      expect(screen.getByText('تم البيع')).toBeTruthy()
      expect(screen.getAllByText('حذف').length).toBeGreaterThan(0)
      expect(screen.queryByText('تعديل')).toBeNull()
    })
  })

  // 9. Tone and UI Button Constraints
  describe('9. Tone and UI Button Constraints', () => {
    it('strictly guarantees no forbidden promotional words in the tree and verifies share button', async () => {
      const { toJSON } = await render(<BusDetailScreen id="bus-101" />)
      const treeString = JSON.stringify(toJSON())

      // Zero forbidden promotional words
      expect(treeString).not.toMatch(/ربح|أرباح|مضمون|فرصة/)

      // Share button exists and triggers share
      const shareBtn = screen.getByTestId('btn-detail-share')
      expect(shareBtn).toBeTruthy()
      fireEvent.press(shareBtn)
      expect(mockShareListing).toHaveBeenCalled()
    })
  })

  // 10. Similar listings: rendered when items present, omitted when empty
  describe('10. Similar Listings Grid', () => {
    it('renders similar listings grid when items are present', async () => {
      mockSimilarItems = [
        {
          id: 'sim-1',
          title: 'باص ميتسوبيشي روزا 2021',
          price: 18000,
          currency: 'OMR',
          governorateNameAr: 'مسقط',
          images: ['https://images.souqone.om/rosa.jpg'],
        },
        {
          id: 'sim-2',
          title: 'باص للإيجار اليومي',
          dailyPrice: 45,
          currency: 'OMR',
          governorateNameAr: 'ظفار',
        },
        {
          id: 'sim-3',
          title: 'باص للإيجار الشهري',
          monthlyPrice: 650,
          currency: 'OMR',
          governorateNameAr: 'الباطنة',
        },
      ]
      await render(<BusDetailScreen id="bus-101" />)

      expect(screen.getByText('إعلانات مشابهة')).toBeTruthy()
      expect(screen.getByText('باص ميتسوبيشي روزا 2021')).toBeTruthy()
      expect(screen.getByText('18,000 ر.ع')).toBeTruthy()
      expect(screen.getByText('45 ر.ع / يوم')).toBeTruthy()
      expect(screen.getByText('650 ر.ع / شهر')).toBeTruthy()
    })

    it('omits similar listings grid when items list is empty', async () => {
      mockSimilarItems = []
      await render(<BusDetailScreen id="bus-101" />)

      expect(screen.queryByText('إعلانات مشابهة')).toBeNull()
    })
  })
})
