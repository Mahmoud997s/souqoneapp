import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react-native'
import type { EquipmentDetailViewModel } from '../../types/equipmentDetailViewModel.types'
import { EquipmentDetailScreen } from './EquipmentDetailScreen'
import { dialogService } from '../../store/dialogStore'

jest.setTimeout(25000)

// ── MOCKS ───────────────────────────────────────────────────────────────────

const mockRouterPush = jest.fn()
const mockRouterBack = jest.fn()

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockRouterPush,
    back: mockRouterBack,
    canGoBack: () => true,
  }),
  useLocalSearchParams: () => ({ id: 'eq-101' }),
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

let mockEquipmentDetailResult: {
  state: 'loading' | 'ready' | 'error' | 'notFound'
  vm: EquipmentDetailViewModel | null
  refetch: jest.Mock
  error: Error | null
} = {
  state: 'ready',
  vm: null,
  refetch: jest.fn(),
  error: null,
}

jest.mock('../../hooks/listing-detail/useEquipmentDetail', () => ({
  useEquipmentDetail: () => mockEquipmentDetailResult,
}))

const mockToggleFavorite = jest.fn()
const mockUseFavoriteToggle = jest.fn(() => ({
  isFavorite: false,
  isBusy: false,
  toggle: mockToggleFavorite,
}))
jest.mock('../../hooks/listing-detail/useFavoriteToggle', () => ({
  useFavoriteToggle: (...args: unknown[]) =>
    (mockUseFavoriteToggle as (...a: unknown[]) => unknown)(...args),
}))

const mockContactCall = jest.fn()
const mockContactWhatsApp = jest.fn()
const mockContactChat = jest.fn()
const mockContactRequireLogin = jest.fn()
const mockUseListingContact = jest.fn(() => ({
  busy: false,
  call: mockContactCall,
  whatsapp: mockContactWhatsApp,
  chat: mockContactChat,
  requireLogin: mockContactRequireLogin,
}))
jest.mock('../../hooks/listing-detail/useListingContact', () => ({
  useListingContact: (...args: unknown[]) =>
    (mockUseListingContact as (...a: unknown[]) => unknown)(...args),
}))

const mockRunOwnerAction = jest.fn()
let mockOwnerActionsList: any[] = [
  { id: 'edit', label: 'تعديل', tone: 'neutral', icon: 'create-outline', requiresConfirm: false },
  { id: 'delete', label: 'حذف', tone: 'danger', icon: 'trash-outline', requiresConfirm: true },
]
jest.mock('../../hooks/listing-detail/useEquipmentOwnerActions', () => ({
  useEquipmentOwnerActions: () => ({
    actions: mockOwnerActionsList,
    viewCount: 180,
    busy: false,
    run: mockRunOwnerAction,
  }),
  isOptimisticLockError: jest.fn(() => false),
}))

let mockSimilarItems: any[] = []
let mockSimilarLoading = false
let mockSimilarError = false
const mockSimilarRefetch = jest.fn()
jest.mock('../../hooks/listing-detail/useEquipmentSimilarListings', () => ({
  useEquipmentSimilarListings: () => ({
    items: mockSimilarItems,
    isLoading: mockSimilarLoading,
    isError: mockSimilarError,
    refetch: mockSimilarRefetch,
  }),
}))

// ── SAMPLE FIXTURES ─────────────────────────────────────────────────────────

function makeSampleVm(overrides?: Partial<EquipmentDetailViewModel>): EquipmentDetailViewModel {
  return {
    id: 'eq-101',
    version: 1,
    status: 'ACTIVE',
    title: 'حفار كوماتسو PC200 للبيع',
    description: 'حفار كوماتسو بحالة ممتازة وجاهز للعمل',
    listingType: 'SALE',
    equipmentListingType: 'EQUIPMENT_SALE',
    equipmentType: 'EXCAVATOR',
    equipmentTypeLabel: 'حفار',
    conditionLabel: 'مستعمل بحالة جيدة',
    price: {
      amount: 32000,
      formattedAmount: '32,000',
      currency: 'ر.ع',
      fullPriceLabel: '32,000 ر.ع',
      isNegotiable: true,
      listingType: 'SALE',
      caption: 'للبيع',
    },
    images: [{ id: 'img-1', url: 'https://example.com/eq.jpg', isPrimary: true, order: 0 }],
    location: {
      governorateName: 'مسقط',
      wilayaName: 'السيب',
      fullLocationText: 'مسقط، السيب',
      hasCoordinates: true,
      latitude: 23.6,
      longitude: 58.2,
    },
    seller: {
      id: 'seller-999',
      name: 'شركة المعدات العمانية',
      username: 'oman_eq',
      isVerified: true,
      memberSinceLabel: 'عضو منذ يناير 2022',
    },
    whatsappEnabled: true,
    postedAtLabel: 'منذ يومين',
    viewCount: 180,
    hoursUsed: 2500,
    hoursUsedLabel: '2,500 ساعة',
    keySpecs: [
      { key: 'hoursUsed', label: 'ساعات العمل', value: '2,500 ساعة', icon: 'clock' },
      { key: 'year', label: 'سنة الصنع', value: '2021', icon: 'calendar' },
    ],
    specsSections: [
      {
        title: 'المواصفات الفنية',
        items: [
          { key: 'hoursUsed', label: 'ساعات العمل', value: '2,500 ساعة' },
          { key: 'power', label: 'القوة', value: '148 حصان' },
        ],
      },
    ],
    features: ['مكيف هواء', 'كابينة مغلقة'],
    operatorBadge: null,
    rental: null,
    wanted: null,
    ...overrides,
  }
}

describe('EquipmentDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCurrentUser = null
    mockSimilarItems = []
    mockEquipmentDetailResult = {
      state: 'ready',
      vm: makeSampleVm(),
      refetch: jest.fn(),
      error: null,
    }
  })

  describe('Non-ready states', () => {
    it('renders loading state when state is loading', async () => {
      mockEquipmentDetailResult.state = 'loading'
      mockEquipmentDetailResult.vm = null

      await render(<EquipmentDetailScreen id="eq-101" />)
      expect(screen.getByTestId('detail-state-loading')).toBeTruthy()
    })

    it('renders notFound state when state is notFound', async () => {
      mockEquipmentDetailResult.state = 'notFound'
      mockEquipmentDetailResult.vm = null

      await render(<EquipmentDetailScreen id="eq-101" />)
      expect(screen.getByTestId('detail-state-not-found')).toBeTruthy()
    })

    it('renders error state and invokes refetch on retry', async () => {
      mockEquipmentDetailResult.state = 'error'
      mockEquipmentDetailResult.vm = null

      await render(<EquipmentDetailScreen id="eq-101" />)
      expect(screen.getByTestId('detail-state-error')).toBeTruthy()

      const retryBtn = screen.getByText('إعادة المحاولة')
      fireEvent.press(retryBtn)
      expect(mockEquipmentDetailResult.refetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('Guest / Visitor mode', () => {
    it('renders contact actions and hides owner manage bar for visitor', async () => {
      mockCurrentUser = { id: 'visitor-123' }
      await render(<EquipmentDetailScreen id="eq-101" />)

      expect(screen.queryByTestId('owner-manage-bar')).toBeNull()
      // Contact actions should be visible
      expect(screen.getAllByTestId('btn-contact-chat').length).toBeGreaterThan(0)
    })

    it('invokes useListingContact with EQUIPMENT_LISTING entity type', async () => {
      mockCurrentUser = { id: 'visitor-123' }
      await render(<EquipmentDetailScreen id="eq-101" />)

      expect(mockUseListingContact).toHaveBeenCalledWith(
        'EQUIPMENT_LISTING',
        'eq-101',
        '/equipment/eq-101',
        'حفار كوماتسو PC200 للبيع'
      )
    })

    it('invokes useFavoriteToggle with EQUIPMENT_LISTING entity type', async () => {
      mockCurrentUser = { id: 'visitor-123' }
      await render(<EquipmentDetailScreen id="eq-101" />)

      expect(mockUseFavoriteToggle).toHaveBeenCalledWith(
        'EQUIPMENT_LISTING',
        'eq-101',
        false,
        { redirectPath: '/equipment/eq-101' }
      )
    })
  })

  describe('Owner mode', () => {
    it('renders owner manage bar and never renders visitor contact actions for owner', async () => {
      mockCurrentUser = { id: 'seller-999' }
      await render(<EquipmentDetailScreen id="eq-101" />)

      expect(screen.getByTestId('btn-owner-edit')).toBeTruthy()
      expect(screen.getByTestId('btn-owner-delete')).toBeTruthy()
      expect(screen.queryByTestId('btn-contact-chat')).toBeNull()
    })

    it('navigates to equipment edit route when edit action is triggered', async () => {
      mockCurrentUser = { id: 'seller-999' }
      await render(<EquipmentDetailScreen id="eq-101" />)

      const editBtn = screen.getByText('تعديل')
      fireEvent.press(editBtn)
      expect(mockRouterPush).toHaveBeenCalledWith('/equipment/edit/eq-101')
    })

    it('prompts confirmation dialog and executes delete action', async () => {
      mockCurrentUser = { id: 'seller-999' }
      ;(dialogService.confirm as jest.Mock).mockImplementation(
        (_title, _msg, onConfirm) => onConfirm()
      )

      await render(<EquipmentDetailScreen id="eq-101" />)

      const deleteBtn = screen.getByText('حذف')
      await act(async () => {
        fireEvent.press(deleteBtn)
      })

      expect(dialogService.confirm).toHaveBeenCalled()
      expect(mockRunOwnerAction).toHaveBeenCalledWith('delete')
    })
  })

  describe('Listing types presentation', () => {
    it('renders SALE listing with price, key specs with working hours first, and no rental/wanted cards', async () => {
      await render(<EquipmentDetailScreen id="eq-101" />)

      expect(screen.getByText('32,000')).toBeTruthy()
      expect(screen.getByText('للبيع')).toBeTruthy()
      expect(screen.getAllByText('2,500 ساعة').length).toBeGreaterThan(0)
      expect(screen.queryByTestId('equipment-rental-card')).toBeNull()
      expect(screen.queryByTestId('equipment-wanted-card')).toBeNull()
    })

    it('renders RENT listing with rental card and operator badge under price', async () => {
      mockEquipmentDetailResult.vm = makeSampleVm({
        equipmentListingType: 'EQUIPMENT_RENT',
        price: {
          amount: 150,
          formattedAmount: '150',
          currency: 'ر.ع',
          fullPriceLabel: '150 ر.ع / يوم',
          dailyRate: { amount: 150, formatted: '150', label: '150 ر.ع / يوم' },
          monthlyRate: { amount: 3000, formatted: '3,000', label: '3,000 ر.ع / شهر' },
          isNegotiable: false,
          listingType: 'RENTAL',
          caption: 'للإيجار',
        },
        operatorBadge: { kind: 'with', label: 'مع مشغّل' },
        rental: {
          dailyPrice: 150,
          dailyPriceFormatted: '150 ر.ع',
          monthlyPrice: 3000,
          monthlyPriceFormatted: '3,000 ر.ع',
          withOperator: true,
          deliveryAvailable: true,
        },
      })

      await render(<EquipmentDetailScreen id="eq-101" />)

      expect(screen.getByText('للإيجار')).toBeTruthy()
      expect(screen.getByText('150 ر.ع / يوم')).toBeTruthy()
      expect(screen.getByText('3,000 ر.ع / شهر')).toBeTruthy()
      expect(screen.getByTestId('equipment-operator-badge')).toBeTruthy()
      expect(screen.getByTestId('equipment-rental-card')).toBeTruthy()
      expect(screen.getByText('شروط الإيجار')).toBeTruthy()
    })

    it('renders WANTED listing with wanted card, caption "مطلوب معدة", and strictly hides price block', async () => {
      mockEquipmentDetailResult.vm = makeSampleVm({
        equipmentListingType: 'EQUIPMENT_WANTED',
        price: {
          amount: 0,
          formattedAmount: '0',
          currency: 'ر.ع',
          fullPriceLabel: '0 ر.ع',
          isNegotiable: false,
          listingType: 'WANTED',
        },
        wanted: {
          budgetRangeFormatted: '1,000 - 2,500 ر.ع',
          rentalDurationLabel: 'شهري',
          quantityFormatted: '1',
          startDate: '2026-11-01T00:00:00.000Z',
          siteDetails: 'موقع العمل: صحار',
        },
      })

      await render(<EquipmentDetailScreen id="eq-101" />)

      expect(screen.getByText('مطلوب معدة')).toBeTruthy()
      expect(screen.getByTestId('equipment-wanted-card')).toBeTruthy()
      expect(screen.getByText('تفاصيل الطلب')).toBeTruthy()
      expect(screen.getByText('1,000 - 2,500 ر.ع')).toBeTruthy()
      // Strictly no price badge or "0 ر.ع"
      expect(screen.queryByTestId('equipment-price-section')).toBeNull()
      expect(screen.queryByText('0 ر.ع')).toBeNull()
    })
  })

  describe('Location & Map compliance', () => {
    it('renders text location card with directions link and strictly no MapView canvas', async () => {
      const res = await render(<EquipmentDetailScreen id="eq-101" />)

      expect(screen.getByTestId('equipment-location-card')).toBeTruthy()
      expect(screen.getAllByText('مسقط، السيب').length).toBeGreaterThan(0)
      expect(screen.getByTestId('equipment-directions-button')).toBeTruthy()

      // Verify no MapView canvas exists
      const jsonStr = JSON.stringify(res.toJSON())
      expect(jsonStr).not.toContain('AIRMap')
      expect(jsonStr).not.toContain('MapView')
    })
  })

  describe('Similar Listings & Navigation bar', () => {
    it('hides similar listings section when items are empty', async () => {
      mockSimilarItems = []
      await render(<EquipmentDetailScreen id="eq-101" />)

      expect(screen.queryByTestId('equipment-similar-section')).toBeNull()
    })

    it('shows similar listings section when items exist', async () => {
      mockSimilarItems = [
        {
          id: 'eq-202',
          slug: 'cat-loader',
          title: 'شيول كتربلر 966',
          equipmentType: 'LOADER',
          listingType: 'EQUIPMENT_SALE',
          price: 25000,
          currency: 'OMR',
          city: 'صحار',
          images: [{ url: 'https://example.com/wheel-loader.jpg' }],
        },
      ]
      await render(<EquipmentDetailScreen id="eq-101" />)

      expect(screen.getByTestId('equipment-similar-section')).toBeTruthy()
      expect(screen.getByText('شيول كتربلر 966')).toBeTruthy()
    })

    it('shows similar listings section during loading even when items are empty', async () => {
      mockSimilarItems = []
      mockSimilarLoading = true
      await render(<EquipmentDetailScreen id="eq-101" />)

      expect(screen.getByTestId('equipment-similar-section')).toBeTruthy()
      expect(screen.getByText('إعلانات مشابهة')).toBeTruthy()
    })

    it('shows similar listings section on error and exposes retry trigger', async () => {
      mockSimilarItems = []
      mockSimilarLoading = false
      mockSimilarError = true
      await render(<EquipmentDetailScreen id="eq-101" />)

      expect(screen.getByTestId('equipment-similar-section')).toBeTruthy()
      const retryBtn = screen.getByText('إعادة المحاولة')
      expect(retryBtn).toBeTruthy()
      fireEvent.press(retryBtn)
      expect(mockSimilarRefetch).toHaveBeenCalled()
    })

    it('strictly NEVER renders a share button in navbar or screen', async () => {
      await render(<EquipmentDetailScreen id="eq-101" />)

      expect(screen.queryByTestId('nav-share-button')).toBeNull()
      expect(screen.queryByLabelText(/مشاركة|share/i)).toBeNull()
    })
  })
})
