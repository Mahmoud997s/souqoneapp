import React from 'react'
import { render, fireEvent, act } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CarHorizontalList } from '../../components/cars/CarHorizontalList'
import CarsLandingScreen from '../../../app/cars/index'
import { useCarListings } from '../../hooks/useCarListings'

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), canGoBack: () => true }),
  useLocalSearchParams: () => ({}),
  usePathname: () => '/cars',
  useSegments: () => ['cars'],
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

jest.mock('../../utils/scheduleIdleTask', () => ({
  scheduleIdleTask: (cb: () => void) => {
    cb()
    return { cancel: jest.fn() }
  },
}))

jest.mock('../../components/navigation/glassSupport', () => ({
  useGlassSupport: () => ({ canUseGlass: false, isIOS26Plus: false }),
  GlassSurface: () => null,
}))

jest.mock('../../components/cars/CarsBottomBar', () => ({
  CarsBottomBar: () => null,
}))

jest.mock('../../components/cars/CategoriesGrid', () => ({
  CategoriesGrid: () => null,
}))

jest.mock('../../components/cars/HowItWorks', () => ({
  HowItWorks: () => null,
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

jest.mock('../../hooks/useCarListings')

const mockedUseCarListings = jest.mocked(useCarListings)

const makeAxiosOfflineError = () => ({
  isAxiosError: true,
  message: 'Network Error',
  code: 'ERR_NETWORK',
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

describe('Cars Landing Screen & Strips S2 Error States (D-277)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('CarHorizontalList', () => {
    it('renders classified error state + retry when isError is true and data is empty', async () => {
      const onRetry = jest.fn()
      const { getByTestId, getByText, queryByText } = await render(
        <CarHorizontalList
          title="سيارات للبيع"
          subTitle="تصفح أحدث عروض البيع"
          data={[]}
          isLoading={false}
          isError={true}
          error={makeAxiosServerError(503)}
          onRetry={onRetry}
          emptyText="لا توجد سيارات للبيع حالياً"
          onSeeAll={jest.fn()}
          onPressItem={jest.fn()}
        />
      )

      expect(getByTestId('cars-horizontal-error-state')).toBeTruthy()
      expect(getByText('خطأ في الخادم')).toBeTruthy()
      expect(queryByText('لا توجد سيارات للبيع حالياً')).toBeNull()

      fireEvent.press(getByText('إعادة المحاولة'))
      expect(onRetry).toHaveBeenCalledTimes(1)
    })

    it('renders StaleDataBanner above cached cars when refetch fails', async () => {
      const onRetry = jest.fn()
      const { getByTestId, getByText } = await render(
        <CarHorizontalList
          title="سيارات للبيع"
          subTitle="تصفح أحدث عروض البيع"
          data={[{ id: 'car-1', title: 'كامري 2024', images: [] } as any]}
          isLoading={false}
          isError={true}
          isRefetchError={true}
          isRefetching={false}
          onRetry={onRetry}
          emptyText="لا توجد سيارات للبيع حالياً"
          onSeeAll={jest.fn()}
          onPressItem={jest.fn()}
        />
      )

      expect(getByTestId('stale-data-banner')).toBeTruthy()
      expect(getByText('كامري 2024')).toBeTruthy()

      fireEvent.press(getByTestId('stale-data-retry-button'))
      expect(onRetry).toHaveBeenCalledTimes(1)
    })
  })

  describe('CarsLandingScreen (app/cars/index.tsx)', () => {
    it('wires error/retry and stale banner states on landing horizontal strips', async () => {
      const refetchSale = jest.fn()
      const refetchRent = jest.fn()

      mockedUseCarListings.mockImplementation((params: any) => {
        if (params?.listingType === 'SALE') {
          return {
            data: [],
            isLoading: false,
            isError: true,
            error: makeAxiosOfflineError(),
            refetch: refetchSale,
            isRefetchError: false,
            isRefetching: false,
          } as any
        }
        if (params?.listingType === 'RENTAL') {
          return {
            data: [{ id: 'rent-1', title: 'تاهو للإيجار', images: [] }],
            isLoading: false,
            isError: true,
            error: makeAxiosServerError(500),
            refetch: refetchRent,
            isRefetchError: true,
            isRefetching: false,
          } as any
        }
        return {
          data: [],
          isLoading: false,
          isError: false,
          error: null,
          refetch: jest.fn(),
          isRefetchError: false,
          isRefetching: false,
        } as any
      })

      const { getByText, getAllByText, getByTestId, getAllByTestId } = await renderWithClient(<CarsLandingScreen />)

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 250))
      })

      expect(getAllByTestId('cars-horizontal-error-state').length).toBeGreaterThanOrEqual(1)
      expect(getByText('لا يوجد اتصال بالإنترنت')).toBeTruthy()
      expect(getByTestId('stale-data-banner')).toBeTruthy()
      expect(getByText('تاهو للإيجار')).toBeTruthy()

      const retryButtons = getAllByText('إعادة المحاولة')
      expect(retryButtons.length).toBeGreaterThanOrEqual(1)
      fireEvent.press(retryButtons[0])
      expect(refetchSale).toHaveBeenCalledTimes(1)

      fireEvent.press(getByTestId('stale-data-retry-button'))
      expect(refetchRent).toHaveBeenCalledTimes(1)
    })
  })
})
