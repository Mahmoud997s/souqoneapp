import React from 'react'
import { View, Text } from 'react-native'
import { render, fireEvent } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import HomeScreen, { CategorySection, HomeCustomCardProps } from '../../../app/(tabs)/index'

jest.setTimeout(30000)

const mockListingsResult = {
  data: undefined as any,
  isLoading: false,
  isError: false,
  error: null as unknown,
  refetch: jest.fn(),
  isRefetching: false,
}

const mockServicesResult = {
  data: [
    {
      id: 'svc-1',
      title: 'صيانة وتبديل زيوت',
      price: 20,
      currency: 'OMR',
      images: ['https://example.com/svc.jpg'],
      city: 'بوشر',
      governorate: 'مسقط',
    },
  ],
  isLoading: false,
  isError: false,
  error: null as unknown,
  refetch: jest.fn(),
  isRefetching: false,
}

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
  useRouter: () => ({ push: jest.fn() }),
}))

jest.mock('../../../src/features/favorites/useFavoriteToggle', () => ({
  useFavoriteToggle: () => ({
    isFavorited: false,
    isLoading: false,
    toggleFavorite: jest.fn(),
  }),
}))

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}))

jest.mock('react-native-reanimated', () => {
  const reanimated = require('react-native-reanimated/mock')
  return {
    ...reanimated,
    FadeInDown: { duration: () => ({}) },
    useSharedValue: jest.fn((init) => ({ value: init })),
    useAnimatedScrollHandler: jest.fn(() => jest.fn()),
    useAnimatedStyle: jest.fn((cb) => cb()),
    withSpring: jest.fn((val) => val),
    withTiming: jest.fn((val) => val),
  }
})

jest.mock('../../../src/context/NavVisibilityContext', () => ({
  useNavVisibility: () => ({ navHidden: { value: 0 } }),
  TAB_BAR_H: 60,
}))

jest.mock('../../../src/store/authStore', () => ({
  useAuthStore: () => ({ user: null }),
}))

jest.mock('../../../src/components/profile/DeletionScheduledBanner', () => ({
  DeletionScheduledBanner: () => null,
}))

jest.mock('../../../src/hooks/useListings', () => ({
  useListings: () => mockListingsResult,
}))

jest.mock('../../../src/hooks/useServices', () => ({
  useServices: () => mockServicesResult,
}))

jest.mock('../../../src/hooks/useParts', () => ({
  useParts: () => ({ data: [], isLoading: false, isError: false, error: null, refetch: jest.fn(), isRefetching: false }),
}))

jest.mock('../../../src/hooks/useBuses', () => ({
  useBuses: () => ({ data: [], isLoading: false, isError: false, error: null, refetch: jest.fn(), isRefetching: false }),
}))

jest.mock('../../../src/hooks/useEquipment', () => ({
  useEquipment: () => ({ data: [], isLoading: false, isError: false, error: null, refetch: jest.fn(), isRefetching: false }),
}))

const DummyCard: React.FC<HomeCustomCardProps> = ({ item }) => (
  <View testID={`dummy-card-${item.id}`}>
    <Text>{item.title}</Text>
  </View>
)

describe('Home CategorySection & HomeScreen Error States (R6)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockListingsResult.data = undefined
    mockListingsResult.isLoading = false
    mockListingsResult.isError = false
    mockListingsResult.error = null
    mockListingsResult.isRefetching = false
    mockListingsResult.refetch = jest.fn()
  })

  it('keeps section visible and shows offline error card + Retry when isError and data is empty', async () => {
    const onRetry = jest.fn()
    const offlineError = new AxiosError('Network Error', 'ERR_NETWORK')

    const { getByTestId, getByText, queryByTestId } = await render(
      <CategorySection
        title="أحدث السيارات"
        subTitle="سيارات جديدة ومستعملة"
        icon="car-sports"
        seeAllRoute="/cars/browse"
        data={[]}
        isLoading={false}
        isError={true}
        error={offlineError}
        onRetry={onRetry}
        routeBase="cars"
        CustomCard={DummyCard}
      />
    )

    expect(getByTestId('home-section-cars')).toBeTruthy()
    expect(getByTestId('home-section-header-cars')).toBeTruthy()
    expect(getByTestId('home-section-error-cars')).toBeTruthy()
    expect(getByText('لا يوجد اتصال بالإنترنت')).toBeTruthy()
    expect(queryByTestId('home-section-stale-cars')).toBeNull()

    fireEvent.press(getByTestId('home-section-retry-cars'))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('keeps cached cards rendered and shows StaleDataBanner above them when isError with data', async () => {
    const onRetry = jest.fn()
    const serverError = new AxiosError('Server Error', 'ERR_BAD_RESPONSE', undefined, undefined, {
      status: 500,
    } as any)

    const { getByTestId, getByText, queryByTestId } = await render(
      <CategorySection
        title="أحدث السيارات"
        icon="car-sports"
        seeAllRoute="/cars/browse"
        data={[
          {
            id: 'car-1',
            title: 'لكزس ES350 2023',
            price: 14500,
            currency: 'OMR',
            images: [],
            governorate: 'مسقط',
          },
        ]}
        isLoading={false}
        isError={true}
        error={serverError}
        onRetry={onRetry}
        routeBase="cars"
        CustomCard={DummyCard}
      />
    )

    expect(getByTestId('home-section-cars')).toBeTruthy()
    expect(getByTestId('home-section-stale-cars')).toBeTruthy()
    expect(getByTestId('stale-data-banner')).toBeTruthy()
    expect(getByTestId('dummy-card-car-1')).toBeTruthy()
    expect(getByText('لكزس ES350 2023')).toBeTruthy()
    expect(queryByTestId('home-section-error-cars')).toBeNull()

    fireEvent.press(getByTestId('stale-data-retry-button'))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('still returns null when not loading, no error, and data is empty', async () => {
    const { queryByTestId } = await render(
      <CategorySection
        title="أحدث السيارات"
        icon="car-sports"
        seeAllRoute="/cars/browse"
        data={[]}
        isLoading={false}
        isError={false}
        routeBase="cars"
        CustomCard={DummyCard}
      />
    )

    expect(queryByTestId('home-section-cars')).toBeNull()
  })

  it('renders failing section inline error in HomeScreen while healthy section still renders normally', async () => {
    const retryCars = jest.fn()
    mockListingsResult.data = []
    mockListingsResult.isError = true
    mockListingsResult.error = new AxiosError('Server Error', 'ERR_BAD_RESPONSE', undefined, undefined, {
      status: 500,
    } as any)
    mockListingsResult.refetch = retryCars

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    const { getByTestId, getByText, queryByTestId } = await render(
      <QueryClientProvider client={queryClient}>
        <HomeScreen />
      </QueryClientProvider>
    )

    // Failing Cars section renders header + inline error card with server error copy
    expect(getByTestId('home-section-cars')).toBeTruthy()
    expect(getByTestId('home-section-error-cars')).toBeTruthy()
    expect(getByText('خطأ في الخادم')).toBeTruthy()

    // Healthy Services section continues rendering cards normally
    expect(getByTestId('home-section-services')).toBeTruthy()
    expect(queryByTestId('home-section-error-services')).toBeNull()
    expect(getByText('صيانة وتبديل زيوت')).toBeTruthy()

    fireEvent.press(getByTestId('home-section-retry-cars'))
    expect(retryCars).toHaveBeenCalledTimes(1)
  })
})
