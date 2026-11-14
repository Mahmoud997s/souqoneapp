import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ServicesBrowseScreen from '../../../app/services/browse'
import { useInfiniteServices } from '../../hooks/useInfiniteServices'

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({}),
  usePathname: () => '/services/browse',
  useSegments: () => ['services', 'browse'],
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

jest.mock('../../components/services/ServicesBottomBar', () => ({
  ServicesBottomBar: () => null,
}))

jest.mock('../../components/services/ServicesVisualFilters', () => ({
  ServicesVisualFilters: () => null,
}))

jest.mock('../../components/services/ServicesFilterBottomSheet', () => ({
  ServicesFilterBottomSheet: () => null,
}))

jest.mock('../../components/filters/LegacyQuickFilterModal', () => ({
  QuickFilterModal: () => null,
}))

jest.mock('../../components/ui/CollapsibleSubHeader', () => ({
  CollapsibleSubHeader: ({ children }: { children: React.ReactNode }) => {
    const { View } = require('react-native')
    return <View>{children}</View>
  },
}))

jest.mock('../../components/services/ServiceCard', () => ({
  ServiceCard: ({ item }: { item: any }) => {
    const { Text, View } = require('react-native')
    return (
      <View testID={`service-browse-card-${item.id}`}>
        <Text>{item.title}</Text>
      </View>
    )
  },
}))

jest.mock('../../hooks/useInfiniteServices')

const mockedUseInfiniteServices = jest.mocked(useInfiniteServices)

async function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return await render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

describe('Services Browse Screen Error and Empty States (D-262)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders services-browse-error-state on initial error (isError: true, no data), displays retry and hides empty state', async () => {
    const refetchMock = jest.fn()
    mockedUseInfiniteServices.mockReturnValue({
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

    const { getByTestId, queryByTestId, getByText, queryByText } = await renderWithClient(
      <ServicesBrowseScreen />
    )

    expect(getByTestId('services-browse-error-state')).toBeTruthy()
    expect(getByText('تعذر تحميل الخدمات')).toBeTruthy()

    const retryBtn = getByText('إعادة المحاولة')
    expect(retryBtn).toBeTruthy()
    fireEvent.press(retryBtn)
    expect(refetchMock).toHaveBeenCalledTimes(1)

    expect(queryByTestId('services-browse-empty-state')).toBeNull()
    expect(queryByText('لم يتم العثور على خدمات مطابقة')).toBeNull()
  })

  it('renders services-browse-empty-state when request succeeds with empty data', async () => {
    mockedUseInfiniteServices.mockReturnValue({
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

    const { getByTestId, queryByTestId, getByText } = await renderWithClient(
      <ServicesBrowseScreen />
    )

    expect(getByTestId('services-browse-empty-state')).toBeTruthy()
    expect(getByText('لم يتم العثور على خدمات مطابقة')).toBeTruthy()
    expect(queryByTestId('services-browse-error-state')).toBeNull()
  })

  it('preserves cached rows and displays StaleDataBanner when background refetch fails (isRefetchError: true)', async () => {
    const refetchMock = jest.fn()
    mockedUseInfiniteServices.mockReturnValue({
      data: {
        pages: [{
          items: [{
            id: 'svc-c1',
            title: 'مركز الصيانة المعتمد',
            images: [],
            price: 25,
          }],
        }],
      },
      isLoading: false,
      isFetching: false,
      isError: true,
      error: new Error('Failed to refresh'),
      refetch: refetchMock,
      isRefetchError: true,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
      isFetchNextPageError: false,
    } as any)

    const { getByTestId, queryByTestId, getByText } = await renderWithClient(
      <ServicesBrowseScreen />
    )

    expect(getByTestId('service-browse-card-svc-c1')).toBeTruthy()
    expect(getByText('مركز الصيانة المعتمد')).toBeTruthy()

    expect(getByTestId('stale-data-banner')).toBeTruthy()
    const retryBannerBtn = getByTestId('stale-data-retry-button')
    fireEvent.press(retryBannerBtn)
    expect(refetchMock).toHaveBeenCalledTimes(1)

    expect(queryByTestId('services-browse-error-state')).toBeNull()
    expect(queryByTestId('services-browse-empty-state')).toBeNull()
  })

  it('displays pagination retry button when next page fails without triggering StaleDataBanner', async () => {
    const fetchNextPageMock = jest.fn()
    mockedUseInfiniteServices.mockReturnValue({
      data: {
        pages: [{
          items: [{
            id: 'svc-p1',
            title: 'تلميع سيارات متنقل',
            images: [],
            price: 15,
          }],
        }],
      },
      isLoading: false,
      isFetching: false,
      isError: true,
      error: new Error('Next page error'),
      refetch: jest.fn(),
      isRefetchError: false,
      fetchNextPage: fetchNextPageMock,
      hasNextPage: true,
      isFetchingNextPage: false,
      isFetchNextPageError: true,
    } as any)

    const { getByTestId, queryByTestId, getByText } = await renderWithClient(
      <ServicesBrowseScreen />
    )

    expect(getByTestId('services-pagination-error')).toBeTruthy()
    expect(getByText('تعذر تحميل المزيد من الخدمات')).toBeTruthy()
    expect(queryByTestId('stale-data-banner')).toBeNull()

    const retryPageBtn = getByTestId('services-pagination-retry-button')
    fireEvent.press(retryPageBtn)
    expect(fetchNextPageMock).toHaveBeenCalledTimes(1)
  })
})
