import React from 'react'
import { render, act } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import HomeScreen from '../../../app/(tabs)/index'

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
  useAuthStore: () => ({
    user: { id: 'u-1', displayName: 'أحمد' },
  }),
}))

jest.mock('../../../src/components/profile/DeletionScheduledBanner', () => ({
  DeletionScheduledBanner: () => null,
}))

const mockRefetchListings = jest.fn().mockResolvedValue({})
const mockRefetchServices = jest.fn().mockResolvedValue({})
const mockRefetchParts = jest.fn().mockResolvedValue({})
const mockRefetchBuses = jest.fn().mockResolvedValue({})
const mockRefetchEquipment = jest.fn().mockResolvedValue({})

jest.mock('../../../src/hooks/useListings', () => ({
  useListings: () => ({ data: [], isLoading: false, refetch: mockRefetchListings }),
}))

jest.mock('../../../src/hooks/useServices', () => ({
  useServices: () => ({ data: [], isLoading: false, refetch: mockRefetchServices }),
}))

jest.mock('../../../src/hooks/useParts', () => ({
  useParts: () => ({ data: [], isLoading: false, refetch: mockRefetchParts }),
}))

jest.mock('../../../src/hooks/useBuses', () => ({
  useBuses: () => ({ data: [], isLoading: false, refetch: mockRefetchBuses }),
}))

jest.mock('../../../src/hooks/useEquipment', () => ({
  useEquipment: () => ({ data: [], isLoading: false, refetch: mockRefetchEquipment }),
}))

describe('Wave 3a (3.7 / S-07): HomeScreen greeting & pull-to-refresh', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders greeting without 👋 emoji and attaches RefreshControl calling all home refetches', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    const { getByText, queryByText, getByTestId } = await render(
      <QueryClientProvider client={queryClient}>
        <HomeScreen />
      </QueryClientProvider>
    )

    expect(getByText('أهلاً بك، أحمد')).toBeTruthy()
    expect(queryByText(/👋/)).toBeNull()

    const scrollView = getByTestId('home-scroll-view')
    const refreshControl = scrollView.props.refreshControl
    expect(refreshControl).toBeTruthy()
    expect(refreshControl.props.refreshing).toBe(false)

    await act(async () => {
      await refreshControl.props.onRefresh()
    })

    expect(mockRefetchListings).toHaveBeenCalledTimes(1)
    expect(mockRefetchServices).toHaveBeenCalledTimes(1)
    expect(mockRefetchParts).toHaveBeenCalledTimes(1)
    expect(mockRefetchBuses).toHaveBeenCalledTimes(1)
    expect(mockRefetchEquipment).toHaveBeenCalledTimes(1)
  })
})
