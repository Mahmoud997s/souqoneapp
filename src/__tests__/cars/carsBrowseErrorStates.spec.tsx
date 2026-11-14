import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowseEmptyState } from '../../components/ui/BrowseEmptyState'
import CarsBrowseScreen from '../../../app/cars/browse'
import { useInfiniteCarListings } from '../../hooks/useCarListings'

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), canGoBack: () => true }),
  useLocalSearchParams: () => ({}),
  usePathname: () => '/cars/browse',
  useSegments: () => ['cars', 'browse'],
  router: { push: jest.fn(), back: jest.fn(), canGoBack: () => true },
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
  useBrands: () => ({ data: [], isLoading: false }),
  useSearchBrands: () => ({ data: [], isLoading: false }),
  useCarModels: () => ({ data: [], isLoading: false }),
  useCarTrims: () => ({ data: [], isLoading: false }),
}))

jest.mock('../../api/locations', () => ({
  locationsApi: {
    getGovernorates: jest.fn().mockResolvedValue({ data: [] }),
    getWilayas: jest.fn().mockResolvedValue({ data: [] }),
  },
}))

jest.mock('../../components/navigation/glassSupport', () => ({
  useGlassSupport: () => ({ canUseGlass: false, isIOS26Plus: false }),
  GlassSurface: () => null,
}))

jest.mock('../../components/cars/CarsBottomBar', () => ({
  CarsBottomBar: () => null,
}))

jest.mock('../../components/cars/CarCard', () => ({
  CarCard: ({ item }: { item: any }) => {
    const { View, Text } = require('react-native')
    return (
      <View testID={`car-card-${item.id}`}>
        <Text>{item.title}</Text>
      </View>
    )
  },
}))

jest.mock('../../components/ui/CollapsibleSubHeader', () => ({
  CollapsibleSubHeader: ({ children }: { children: React.ReactNode }) => {
    const { View } = require('react-native')
    return <View>{children}</View>
  },
}))

jest.mock('../../hooks/useCarListings')

const mockedUseInfiniteCarListings = jest.mocked(useInfiniteCarListings)

const makeAxiosOfflineError = () => ({
  isAxiosError: true,
  message: 'Network Error',
  code: 'ERR_NETWORK',
})

const makeAxiosTimeoutError = () => ({
  isAxiosError: true,
  code: 'ECONNABORTED',
  message: 'timeout of 10000ms exceeded',
})

const makeAxiosServerError = (status = 500) => ({
  isAxiosError: true,
  response: { status },
  message: `Request failed with status code ${status}`,
})

async function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return await render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

describe('Cars Browse Screen S2 Error and Stale States (D-277)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('BrowseEmptyState (Non-Breaking + getListErrorProps)', () => {
    it('preserves legacy errorText fallback when error prop is omitted', async () => {
      const onRetry = jest.fn()
      const { getByText, queryByTestId } = await render(
        <BrowseEmptyState
          isLoading={false}
          isError={true}
          errorText="حدث خطأ أثناء تحميل الحافلات"
          onRetry={onRetry}
        />
      )

      expect(getByText('حدث خطأ أثناء تحميل الحافلات')).toBeTruthy()
      expect(queryByTestId('browse-error-state')).toBeNull()

      fireEvent.press(getByText('إعادة المحاولة'))
      expect(onRetry).toHaveBeenCalledTimes(1)
    })

    it('renders classified offline error state via getListErrorProps when offline error is passed', async () => {
      const onRetry = jest.fn()
      const { getByTestId, getByText } = await render(
        <BrowseEmptyState
          isLoading={false}
          isError={true}
          error={makeAxiosOfflineError()}
          onRetry={onRetry}
        />
      )

      expect(getByTestId('browse-error-state')).toBeTruthy()
      expect(getByText('لا يوجد اتصال بالإنترنت')).toBeTruthy()
      fireEvent.press(getByText('إعادة المحاولة'))
      expect(onRetry).toHaveBeenCalledTimes(1)
    })

    it('renders classified timeout error state via getListErrorProps when timeout error is passed', async () => {
      const { getByTestId, getByText } = await render(
        <BrowseEmptyState
          isLoading={false}
          isError={true}
          error={makeAxiosTimeoutError()}
          onRetry={jest.fn()}
        />
      )

      expect(getByTestId('browse-error-state')).toBeTruthy()
      expect(getByText('انتهت مهلة الاتصال')).toBeTruthy()
    })

    it('renders classified serverError state via getListErrorProps when 500 error is passed', async () => {
      const { getByTestId, getByText } = await render(
        <BrowseEmptyState
          isLoading={false}
          isError={true}
          error={makeAxiosServerError(500)}
          onRetry={jest.fn()}
        />
      )

      expect(getByTestId('browse-error-state')).toBeTruthy()
      expect(getByText('خطأ في الخادم')).toBeTruthy()
    })
  })

  describe('CarsBrowseScreen (app/cars/browse.tsx)', () => {
    it('renders classified browse-error-state with retry when initial load fails', async () => {
      const refetchMock = jest.fn()
      mockedUseInfiniteCarListings.mockReturnValue({
        data: undefined,
        isLoading: false,
        isFetching: false,
        isError: true,
        error: makeAxiosServerError(500),
        isRefetchError: false,
        isRefetching: false,
        refetch: refetchMock,
        fetchNextPage: jest.fn(),
        hasNextPage: false,
        isFetchingNextPage: false,
      } as any)

      const { getByTestId, getByText, queryByText } = await renderWithClient(<CarsBrowseScreen />)

      expect(getByTestId('browse-error-state')).toBeTruthy()
      expect(getByText('خطأ في الخادم')).toBeTruthy()
      expect(queryByText('لا توجد سيارات مطابقة')).toBeNull()

      fireEvent.press(getByText('إعادة المحاولة'))
      expect(refetchMock).toHaveBeenCalledTimes(1)
    })

    it('preserves cached cars and renders StaleDataBanner when background refetch fails', async () => {
      const refetchMock = jest.fn()
      mockedUseInfiniteCarListings.mockReturnValue({
        data: {
          pages: [
            {
              items: [{ id: 'car-cached-1', title: 'نيسان باترول 2023', images: [] }],
              nextPage: undefined,
            },
          ],
          pageParams: [1],
        },
        isLoading: false,
        isFetching: false,
        isError: true,
        error: makeAxiosOfflineError(),
        isRefetchError: true,
        isRefetching: false,
        refetch: refetchMock,
        fetchNextPage: jest.fn(),
        hasNextPage: false,
        isFetchingNextPage: false,
      } as any)

      const { getByTestId, getByText, queryByTestId } = await renderWithClient(<CarsBrowseScreen />)

      expect(getByTestId('stale-data-banner')).toBeTruthy()
      expect(getByText('نيسان باترول 2023')).toBeTruthy()
      expect(queryByTestId('browse-error-state')).toBeNull()

      fireEvent.press(getByTestId('stale-data-retry-button'))
      expect(refetchMock).toHaveBeenCalledTimes(1)
    })
  })
})
