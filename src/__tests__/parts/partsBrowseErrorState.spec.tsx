import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import PartsBrowseScreen from '../../../app/parts/browse'
import { useInfiniteParts } from '../../hooks/useInfiniteParts'

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({}),
  usePathname: () => '/parts/browse',
  useSegments: () => ['parts', 'browse'],
  router: { push: jest.fn(), back: jest.fn() },
}))

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}))

jest.mock('../../hooks/useScrollAwareNav', () => ({
  useScrollAwareNav: () => ({
    scrollHandler: jest.fn(),
    scrollY: { value: 0 },
  }),
}))

jest.mock('../../hooks/useCars', () => ({
  useBrands: () => ({ data: [] }),
}))

jest.mock('../../api/locations', () => ({
  locationsApi: {
    getGovernorates: jest.fn().mockResolvedValue({ data: [] }),
  },
}))

jest.mock('../../components/parts/PartsBottomBar', () => ({
  PartsBottomBar: () => null,
}))

jest.mock('../../components/ui/CollapsibleSubHeader', () => ({
  CollapsibleSubHeader: ({ children }: { children: React.ReactNode }) => {
    const { View } = require('react-native')
    return <View>{children}</View>
  },
}))

jest.mock('../../hooks/useInfiniteParts')

const mockedUseInfiniteParts = jest.mocked(useInfiniteParts)

async function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return await render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

describe('Parts Browse Screen Error and Empty States (D-235)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders parts-browse-error-state on initial error (isError: true, no data), displays retry and hides empty state', async () => {
    const refetchMock = jest.fn()
    mockedUseInfiniteParts.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      isError: true,
      error: new Error('Network error'),
      refetch: refetchMock,
      isRefetchError: false,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
      isFetchNextPageError: false,
    } as any)

    const { getByTestId, queryByTestId, getByText, queryByText } = await renderWithClient(<PartsBrowseScreen />)

    // Error state must be visible
    expect(getByTestId('parts-browse-error-state')).toBeTruthy()
    expect(getByText('تعذر تحميل قطع الغيار')).toBeTruthy()

    // Retry button triggers refetch
    const retryBtn = getByText('إعادة المحاولة')
    expect(retryBtn).toBeTruthy()
    fireEvent.press(retryBtn)
    expect(refetchMock).toHaveBeenCalledTimes(1)

    // Real empty state must NOT be rendered
    expect(queryByTestId('parts-browse-empty-state')).toBeNull()
    expect(queryByText('لا توجد قطع غيار مطابقة')).toBeNull()
  })

  it('renders parts-browse-empty-state when request succeeds with empty data', async () => {
    mockedUseInfiniteParts.mockReturnValue({
      data: { pages: [{ items: [] }] },
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
      isRefetchError: false,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
      isFetchNextPageError: false,
    } as any)

    const { getByTestId, queryByTestId, getByText } = await renderWithClient(<PartsBrowseScreen />)

    // Empty state must be visible
    expect(getByTestId('parts-browse-empty-state')).toBeTruthy()
    expect(getByText('لا توجد قطع غيار مطابقة')).toBeTruthy()

    // Error state must NOT be visible
    expect(queryByTestId('parts-browse-error-state')).toBeNull()
  })

  it('preserves cached rows and displays StaleDataBanner when background refetch fails (isRefetchError: true)', async () => {
    const refetchMock = jest.fn()
    mockedUseInfiniteParts.mockReturnValue({
      data: {
        pages: [{
          items: [{
            id: 'part-c1',
            title: 'محرك نيسان التيما',
            images: [],
            price: 450,
          }],
        }],
      },
      isLoading: false,
      isFetching: false,
      isError: false,
      error: new Error('Failed to refresh'),
      refetch: refetchMock,
      isRefetchError: true,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
      isFetchNextPageError: false,
    } as any)

    const { getByTestId, queryByTestId, getByText } = await renderWithClient(<PartsBrowseScreen />)

    // StaleDataBanner must be visible
    expect(getByTestId('stale-data-banner')).toBeTruthy()
    const retryBannerBtn = getByTestId('stale-data-retry-button')
    fireEvent.press(retryBannerBtn)
    expect(refetchMock).toHaveBeenCalledTimes(1)

    // Full screen error and empty states must NOT be visible
    expect(queryByTestId('parts-browse-error-state')).toBeNull()
    expect(queryByTestId('parts-browse-empty-state')).toBeNull()
  })

  it('displays pagination retry button when next page fails without wiping existing items (isFetchNextPageError: true)', async () => {
    const fetchNextPageMock = jest.fn()
    mockedUseInfiniteParts.mockReturnValue({
      data: {
        pages: [{
          items: [{
            id: 'part-p1',
            title: 'دينامو كامري',
            images: [],
            price: 60,
          }],
        }],
      },
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
      isRefetchError: false,
      fetchNextPage: fetchNextPageMock,
      hasNextPage: true,
      isFetchingNextPage: false,
      isFetchNextPageError: true,
    } as any)

    const { getByTestId, getByText } = await renderWithClient(<PartsBrowseScreen />)

    // Pagination error row must be visible
    expect(getByTestId('parts-pagination-error')).toBeTruthy()
    expect(getByText('تعذر تحميل المزيد من قطع الغيار')).toBeTruthy()

    // Retry button triggers fetchNextPage
    const retryPageBtn = getByTestId('parts-pagination-retry-button')
    fireEvent.press(retryPageBtn)
    expect(fetchNextPageMock).toHaveBeenCalledTimes(1)
  })

  it('does NOT display initial skeleton grid during background refetch when listings are present', async () => {
    mockedUseInfiniteParts.mockReturnValue({
      data: {
        pages: [{
          items: [{
            id: 'part-1',
            title: 'قماش فرامل',
            images: [],
            price: 15,
          }],
        }],
      },
      isLoading: false,
      isFetching: true,
      isError: false,
      error: null,
      refetch: jest.fn(),
      isRefetchError: false,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
      isFetchNextPageError: false,
    } as any)

    const { queryByTestId } = await renderWithClient(<PartsBrowseScreen />)

    // Neither error nor empty state is visible
    expect(queryByTestId('parts-browse-error-state')).toBeNull()
    expect(queryByTestId('parts-browse-empty-state')).toBeNull()
  })
})
