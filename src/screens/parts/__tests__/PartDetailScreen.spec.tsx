import React from 'react'
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react-native'
import { PartDetailScreen } from '../PartDetailScreen'
import { dialogService } from '../../../store/dialogStore'
import { assertOwnerHasPhoneForEdit } from '../../../utils/assertOwnerHasPhoneForEdit'
import { partsApi } from '../../../api/parts'
import { usePartWizardStore } from '../../../store/partWizardStore'
import type { Part } from '../../../types/listing.types'
import type { PartDetailViewModel } from '../../../types/partDetailViewModel.types'
import type { UsePartDetailResult } from '../hooks/usePartDetail'

// ── MOCKS ───────────────────────────────────────────────────────────────────

const mockQueryClient = {
  invalidateQueries: jest.fn(),
  removeQueries: jest.fn(),
}
jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual('@tanstack/react-query')
  return {
    ...actual,
    useQueryClient: () => mockQueryClient,
  }
})

jest.mock('../hooks/partQueryKeys', () => ({
  partQueryKeys: {
    detail: jest.fn((id: string, auth: boolean) => ['parts-detail', id, auth ? 'auth' : 'guest']),
  },
  invalidatePartListingQueries: jest.fn(),
}))

const mockRouterPush = jest.fn()
const mockRouterBack = jest.fn()
const mockCanGoBack = jest.fn(() => true)

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockRouterPush,
    back: mockRouterBack,
    canGoBack: mockCanGoBack,
  }),
  useLocalSearchParams: () => ({ id: 'part-101' }),
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

jest.mock('../../../store/dialogStore', () => ({
  dialogService: {
    alert: jest.fn(),
    confirm: jest.fn(),
  },
}))

jest.mock('../../../utils/assertOwnerHasPhoneForEdit', () => ({
  assertOwnerHasPhoneForEdit: jest.fn(() => true),
}))

jest.mock('../../../api/parts', () => ({
  partsApi: {
    remove: jest.fn().mockResolvedValue({ success: true }),
  },
}))

let mockCurrentUser: { id: string; name?: string } | null = null
jest.mock('../../../store/authStore', () => ({
  useAuthStore: () => ({
    user: mockCurrentUser,
    isLoggedIn: Boolean(mockCurrentUser),
  }),
}))

let mockPartDetailResult: UsePartDetailResult

jest.mock('../hooks/usePartDetail', () => ({
  usePartDetail: () => mockPartDetailResult,
}))

const mockToggleFavorite = jest.fn()
const mockUseFavoriteToggle = jest.fn(() => ({
  isFavorite: false,
  isBusy: false,
  toggle: mockToggleFavorite,
}))
jest.mock('../../../hooks/listing-detail/useFavoriteToggle', () => ({
  useFavoriteToggle: (...args: unknown[]) =>
    (mockUseFavoriteToggle as (...a: unknown[]) => unknown)(...args),
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
jest.mock('../../../hooks/listing-detail/useListingContact', () => ({
  useListingContact: (...args: unknown[]) =>
    (mockUseListingContact as (...a: unknown[]) => unknown)(...args),
}))

const mockShare = jest.fn()
jest.mock('../../../hooks/listing-detail/useShareListing', () => ({
  useShareListing: () => ({
    share: mockShare,
  }),
}))

// ── FIXTURES ────────────────────────────────────────────────────────────────

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
    images: [
      { id: 'img-1', url: 'https://cdn.example.com/part1.jpg', order: 0, isPrimary: true },
    ],
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
    keySpecs: [
      { key: 'category', label: 'الفئة', value: 'فرامل ومكابح' },
      { key: 'condition', label: 'الحالة', value: 'جديد' },
    ],
    specsSections: [
      {
        title: 'المواصفات الفنية',
        items: [{ key: 'category', label: 'الفئة', value: 'فرامل ومكابح' }],
      },
    ],
    ...overrides,
  }
}

describe('PartDetailScreen', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    jest.clearAllMocks()
    mockCurrentUser = null
    mockRouterPush.mockClear()
    mockRouterBack.mockClear()
    mockPartDetailResult = {
      state: 'ready',
      vm: makeSamplePartVm(),
      raw: {
        id: 'part-101',
        title: 'سفايف',
        partCategory: 'BRAKES',
        price: 45,
        images: [],
        createdAt: '2026-10-27T00:00:00Z',
      } as unknown as Part,
      refetch: jest.fn(),
      error: null,
      errorKind: 'unknown',
      isRefetchError: false,
    }
  })

  describe('Non-ready states', () => {
    it('renders loading state when state is loading', async () => {
      mockPartDetailResult.state = 'loading'
      mockPartDetailResult.vm = undefined

      await render(<PartDetailScreen id="part-101" />)
      expect(screen.getByTestId('detail-state-loading')).toBeTruthy()
    })

    it('renders notFound state when state is notFound', async () => {
      mockPartDetailResult.state = 'notFound'
      mockPartDetailResult.vm = undefined

      await render(<PartDetailScreen id="part-101" />)
      expect(screen.getByTestId('detail-state-not-found')).toBeTruthy()
    })

    it('renders error state and invokes refetch on retry', async () => {
      mockPartDetailResult.state = 'error'
      mockPartDetailResult.vm = undefined

      await render(<PartDetailScreen id="part-101" />)
      expect(screen.getByTestId('detail-state-error')).toBeTruthy()

      const retryBtn = screen.getByText('إعادة المحاولة')
      await fireEvent.press(retryBtn)
      expect(mockPartDetailResult.refetch).toHaveBeenCalledTimes(1)
    })

    it('renders offline state when network error occurs', async () => {
      mockPartDetailResult.state = 'error'
      mockPartDetailResult.vm = undefined
      mockPartDetailResult.errorKind = 'offline'
      mockPartDetailResult.error = { isAxiosError: true, code: 'ERR_NETWORK', message: 'Network Error' } as any

      await render(<PartDetailScreen id="part-101" />)
      expect(screen.getByTestId('detail-state-offline')).toBeTruthy()
      expect(screen.getByText('لا يوجد اتصال بالإنترنت')).toBeTruthy()
    })

    it('renders StaleDataBanner when data is present and isRefetchError is true', async () => {
      mockPartDetailResult.state = 'ready'
      mockPartDetailResult.vm = makeSamplePartVm()
      mockPartDetailResult.isRefetchError = true

      await render(<PartDetailScreen id="part-101" />)
      expect(screen.getByTestId('stale-data-banner')).toBeTruthy()
      expect(screen.getByText('تعذر تحديث البيانات، قد تكون المعلومات المعروضة قديمة')).toBeTruthy()
    })
  })

  describe('Ready state — Visitor view', () => {
    it('renders detail components for visitor with visible favorite heart and contact actions', async () => {
      mockCurrentUser = { id: 'other-user' }

      await render(<PartDetailScreen id="part-101" />)

      expect(screen.getByTestId('part-detail-screen')).toBeTruthy()
      expect(screen.getByText('سفايف تويوتا كامري أصلية')).toBeTruthy()
      expect(screen.getByText('45')).toBeTruthy()
      expect(screen.getAllByText('قابل للتفاوض').length).toBeGreaterThan(0)
      expect(screen.getByText('كراج النجوم')).toBeTruthy()

      // Favorite toggle passed canFavorite: true
      expect(screen.getByTestId('nav-favorite-button')).toBeTruthy()

      // Contact actions rendered
      expect(screen.getAllByTestId('btn-contact-call').length).toBeGreaterThan(0)
      expect(screen.getAllByTestId('btn-contact-chat').length).toBeGreaterThan(0)

      // Owner manage bar not rendered
      expect(screen.queryByTestId('btn-owner-edit')).toBeNull()
      expect(screen.queryByTestId('btn-owner-delete')).toBeNull()
    })

    it('triggers refetch when pull-to-refresh is executed on scroll view', async () => {
      mockCurrentUser = { id: 'other-user' }

      await render(<PartDetailScreen id="part-101" />)

      const scrollView = screen.getByTestId('part-detail-scroll-view')
      const refreshControl = scrollView.props.refreshControl
      expect(refreshControl).toBeDefined()
      expect(refreshControl?.props?.onRefresh).toBeDefined()

      await act(async () => {
        refreshControl.props.onRefresh()
      })

      expect(mockPartDetailResult.refetch).toHaveBeenCalled()
    })
  })

  describe('Ready state — Owner view', () => {
    it('renders owner manage bar and hides favorite heart and contact actions', async () => {
      mockCurrentUser = { id: 'seller-999' } // Same as seller.id

      await render(<PartDetailScreen id="part-101" />)

      // Favorite toggle hidden for owner
      expect(screen.queryByTestId('nav-favorite-button')).toBeNull()

      // Contact actions hidden for owner
      expect(screen.queryByTestId('btn-contact-call')).toBeNull()
      expect(screen.queryByTestId('btn-contact-chat')).toBeNull()

      // Owner manage bar visible
      expect(screen.getByTestId('btn-owner-edit')).toBeTruthy()
      expect(screen.getByTestId('btn-owner-delete')).toBeTruthy()
      expect(screen.getByText('تعديل')).toBeTruthy()
      expect(screen.getByText('حذف')).toBeTruthy()
    })

    it('handles owner edit action with phone check and navigation', async () => {
      mockCurrentUser = { id: 'seller-999' }
      const setEditModeSpy = jest.spyOn(usePartWizardStore.getState(), 'setEditMode')

      await render(<PartDetailScreen id="part-101" />)

      const editBtn = screen.getByTestId('btn-owner-edit')
      await fireEvent.press(editBtn)

      expect(assertOwnerHasPhoneForEdit).toHaveBeenCalled()
      expect(setEditModeSpy).toHaveBeenCalled()
      expect(mockRouterPush).toHaveBeenCalledWith('/parts/new')
    })

    it('handles owner delete action with confirmation dialog', async () => {
      mockCurrentUser = { id: 'seller-999' }

      ;(dialogService.confirm as jest.Mock).mockImplementation(
        (title, message, onConfirm) => {
          onConfirm()
        }
      )

      await render(<PartDetailScreen id="part-101" />)

      const deleteBtn = screen.getByTestId('btn-owner-delete')
      await fireEvent.press(deleteBtn)

      expect(dialogService.confirm).toHaveBeenCalled()
      expect(partsApi.remove).toHaveBeenCalledWith('part-101')
      expect(dialogService.alert).toHaveBeenCalledWith('تم', 'تم حذف إعلان القطعة بنجاح', 'success')
      expect(mockRouterBack).toHaveBeenCalled()
    })
  })

  describe('Search and Filter (D-170a)', () => {
    it('passes search props to DetailTopBar, updates on typing, and submits to /parts/browse with q', async () => {
      mockCurrentUser = { id: 'other-user' }
      await render(<PartDetailScreen id="part-101" />)

      const searchInput = screen.getByPlaceholderText('ابحث في تفاصيل القطعة...')
      expect(searchInput).toBeTruthy()

      await act(async () => {
        fireEvent.changeText(searchInput, 'سفايف')
      })
      expect(searchInput.props.value).toBe('سفايف')

      await act(async () => {
        fireEvent(searchInput, 'submitEditing', { nativeEvent: { text: 'سفايف' } })
      })

      expect(mockRouterPush).toHaveBeenCalledWith({
        pathname: '/parts/browse',
        params: { q: 'سفايف' },
      })
    })

    it('filters specs section by part number and displays matching row while filtering others', async () => {
      mockCurrentUser = { id: 'other-user' }
      await render(<PartDetailScreen id="part-101" />)

      const searchInput = screen.getByPlaceholderText('ابحث في تفاصيل القطعة...')

      // Initially all rows exist
      expect(screen.getByTestId('spec-row-part-number')).toBeTruthy()
      expect(screen.getByTestId('spec-row-category')).toBeTruthy()
      expect(screen.getByTestId('spec-row-originality')).toBeTruthy()
      expect(screen.queryByTestId('specs-no-match')).toBeNull()

      // Type part number
      await act(async () => {
        fireEvent.changeText(searchInput, '04465-33471')
      })

      // Part number matches
      expect(screen.getByTestId('spec-row-part-number')).toBeTruthy()
      expect(screen.getByText('04465-33471')).toBeTruthy()

      // Category and originality do not match
      expect(screen.queryByTestId('spec-row-category')).toBeNull()
      expect(screen.queryByTestId('spec-row-originality')).toBeNull()
      expect(screen.queryByTestId('specs-no-match')).toBeNull()
    })

    it('displays no-match message when no specifications match search query', async () => {
      mockCurrentUser = { id: 'other-user' }
      await render(<PartDetailScreen id="part-101" />)

      const searchInput = screen.getByPlaceholderText('ابحث في تفاصيل القطعة...')

      await act(async () => {
        fireEvent.changeText(searchInput, 'مواصفة غير موجودة بتاتا')
      })

      expect(screen.getByTestId('specs-no-match')).toBeTruthy()
      expect(screen.getByText('لا توجد نتائج مطابقة')).toBeTruthy()
      expect(screen.queryByTestId('spec-row-part-number')).toBeNull()
      expect(screen.queryByTestId('spec-row-category')).toBeNull()

      // Clearing restores specs
      await act(async () => {
        fireEvent.changeText(searchInput, '')
      })

      expect(screen.queryByTestId('specs-no-match')).toBeNull()
      expect(screen.getByTestId('spec-row-part-number')).toBeTruthy()
      expect(screen.getByTestId('spec-row-category')).toBeTruthy()
    })
  })

  describe('Single Placement of Facts & No Duplication (D-170d Req b)', () => {
    it('asserts condition label and negotiable label each appear exactly once on the whole page for visitor view', async () => {
      mockCurrentUser = { id: 'visitor-user' }
      await render(<PartDetailScreen id="part-101" />)

      // Condition label appears exactly once (in header block)
      const conditionMatches = screen.getAllByText('جديد')
      expect(conditionMatches).toHaveLength(1)

      // Negotiable label appears exactly once (in price container)
      const negotiableMatches = screen.getAllByText('قابل للتفاوض')
      expect(negotiableMatches).toHaveLength(1)
    })

    it('asserts condition label and negotiable label each appear exactly once on the whole page for owner view', async () => {
      mockCurrentUser = { id: 'seller-999' }
      await render(<PartDetailScreen id="part-101" />)

      // Condition label appears exactly once (in header block)
      const conditionMatches = screen.getAllByText('جديد')
      expect(conditionMatches).toHaveLength(1)

      // Negotiable label appears exactly once (in price container)
      const negotiableMatches = screen.getAllByText('قابل للتفاوض')
      expect(negotiableMatches).toHaveLength(1)
    })
  })
})
