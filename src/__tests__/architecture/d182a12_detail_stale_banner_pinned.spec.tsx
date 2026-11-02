import React from 'react'
import { render, screen, within } from '@testing-library/react-native'
import { StyleSheet } from 'react-native'
import { BusDetailScreen } from '../../screens/buses/BusDetailScreen'
import { TopBarTokens } from '../../constants/topBarTokens'
import type { BusDetailViewModel } from '../../types/busDetailViewModel.types'

// Mock dependencies
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn() },
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({ id: 'bus-101' }),
}))

const mockInsets = { top: 44, bottom: 34, left: 0, right: 0 }
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => mockInsets,
}))

let mockCurrentUser: { id: string; username?: string } | null = null
jest.mock('../../store/authStore', () => ({
  useAuthStore: () => ({
    user: mockCurrentUser,
    isLoggedIn: Boolean(mockCurrentUser),
  }),
}))

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

let mockBusHookResult = {
  state: 'ready' as const,
  vm: makeSampleVm(),
  raw: null,
  error: null,
  isRefetchError: true,
  refreshing: false,
  refetch: jest.fn(),
  contactAvailability: { mode: 'visible' as const },
}

jest.mock('../../hooks/listing-detail/useBusDetail', () => ({
  useBusDetail: () => mockBusHookResult,
}))

jest.mock('../../hooks/listing-detail/useFavoriteToggle', () => ({
  useFavoriteToggle: () => ({ isFavorite: false, isBusy: false, toggle: jest.fn() }),
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
  useShareListing: () => ({ share: jest.fn() }),
}))

jest.mock('../../hooks/listing-detail/useBusOwnerActions', () => ({
  useBusOwnerActions: () => ({
    actions: [],
    busy: false,
    viewCount: 12,
  }),
  isOptimisticLockError: () => false,
}))

jest.mock('../../hooks/listing-detail/useBusSimilarListings', () => ({
  useBusSimilarListings: () => ({
    items: [],
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  }),
}))

describe('D-182a12: StaleDataBanner pinned under overlaid DetailTopBar', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCurrentUser = { id: 'visitor-123', username: 'guest' }
    mockBusHookResult = {
      state: 'ready',
      vm: makeSampleVm(),
      raw: null,
      error: null,
      isRefetchError: true,
      refreshing: false,
      refetch: jest.fn(),
      contactAvailability: { mode: 'visible' },
    }
  })

  it('renders StaleDataBanner OUTSIDE the scroll view when isRefetchError is true (TEETH: not a child of ScrollView)', async () => {
    await render(<BusDetailScreen id="bus-101" />)

    // 1. The banner wrapper exists at root level
    const bannerWrapper = screen.getByTestId('detail-stale-banner-wrapper')
    expect(bannerWrapper).toBeTruthy()

    // 2. The inner StaleDataBanner exists
    const staleBanner = screen.getByTestId('stale-data-banner')
    expect(staleBanner).toBeTruthy()

    // 3. TEETH: Verify the banner is strictly NOT inside the ScrollView
    const scrollView = screen.getByTestId('bus-detail-scroll-view')
    const bannerInsideScroll = within(scrollView).queryByTestId('stale-data-banner')
    expect(bannerInsideScroll).toBeNull()

    // 4. Verify banner wrapper has absolute positioning directly under the top bar
    const wrapperStyle = StyleSheet.flatten(bannerWrapper.props.style)
    expect(wrapperStyle.position).toBe('absolute')
    expect(wrapperStyle.left).toBe(0)
    expect(wrapperStyle.right).toBe(0)
    expect(wrapperStyle.top).toBe(mockInsets.top + TopBarTokens.detailTopBarBodyHeight)
    expect(wrapperStyle.zIndex).toBe(49)
  })

  it('preserves identical ScrollView paddingTop without shifting layout when isRefetchError is true vs false', async () => {
    // Render with error = true
    mockBusHookResult.isRefetchError = true
    const { rerender } = await render(<BusDetailScreen id="bus-101" />)
    const scrollViewWithError = screen.getByTestId('bus-detail-scroll-view')
    const contentStyleWithError = StyleSheet.flatten(scrollViewWithError.props.contentContainerStyle)
    const expectedPaddingTop = mockInsets.top + TopBarTokens.detailTopBarBodyHeight
    expect(contentStyleWithError.paddingTop).toBe(expectedPaddingTop)

    // Render with error = false
    mockBusHookResult.isRefetchError = false
    await rerender(<BusDetailScreen id="bus-101" />)
    const scrollViewNoError = screen.getByTestId('bus-detail-scroll-view')
    const contentStyleNoError = StyleSheet.flatten(scrollViewNoError.props.contentContainerStyle)
    expect(contentStyleNoError.paddingTop).toBe(expectedPaddingTop)

    // Banner is completely unmounted when isRefetchError is false
    expect(screen.queryByTestId('detail-stale-banner-wrapper')).toBeNull()
    expect(screen.queryByTestId('stale-data-banner')).toBeNull()
  })
})
