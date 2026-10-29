import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import FavoritesScreen from '../../../app/profile/favorites'
import { useFavorites } from '../../hooks/useListings'
import axios from 'axios'

jest.mock('../../hooks/useListings', () => ({
  useFavorites: jest.fn(),
}))

jest.mock('../../features/favorites/useFavoriteIds', () => ({
  useFavoriteIds: () => ({
    favoriteIds: new Set(['car-101']),
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  }),
}))

jest.mock('../../features/favorites/useFavoriteToggle', () => ({
  useFavoriteToggle: () => ({
    isFavorite: true,
    isBusy: false,
    toggle: jest.fn(),
  }),
}))

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 40, bottom: 20, left: 0, right: 0 }),
}))

jest.mock('../../hooks/useScrollAwareNav', () => ({
  useScrollAwareNav: () => ({
    scrollHandler: jest.fn(),
  }),
}))

jest.mock('../../context/NavVisibilityContext', () => ({
  useNavVisibility: () => ({
    setNavVisible: jest.fn(),
  }),
}))

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ tab: 'all' }),
  router: {
    push: jest.fn(),
    back: jest.fn(),
  },
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}))

const mockFavoritesData = [
  {
    id: 'car-101',
    title: 'تويوتا كامري 2022',
    category: 'cars',
    price: 6500,
    currency: 'OMR',
    images: ['https://img.souqone.app/car1.jpg'],
  },
]

describe('FavoritesScreen — Error vs Empty vs Data & Refresh', () => {
  const mockUseFavorites = useFavorites as jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
  })

  function createWrapper() {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
      },
    })
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }

  it('renders data state: displays listings and does not show error or empty state', async () => {
    mockUseFavorites.mockReturnValue({
      data: mockFavoritesData,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    })

    await render(<FavoritesScreen />, { wrapper: createWrapper() })

    expect(screen.getByText('تويوتا كامري 2022')).toBeTruthy()
    expect(screen.queryByTestId('favorites-error-state')).toBeNull()
    expect(screen.queryByTestId('favorites-empty-state')).toBeNull()
  })

  it('renders empty state: displays empty messaging when request succeeds with 0 items', async () => {
    mockUseFavorites.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    })

    await render(<FavoritesScreen />, { wrapper: createWrapper() })

    expect(screen.getByTestId('favorites-empty-state')).toBeTruthy()
    expect(screen.getByText('لا توجد مفضلة')).toBeTruthy()
    expect(screen.getByText('تصفح الإعلانات')).toBeTruthy()
    expect(screen.queryByTestId('favorites-error-state')).toBeNull()
  })

  it('renders offline error state: displays offline copy and retry button when network fails', async () => {
    const offlineError = new axios.AxiosError('Network Error', 'ERR_NETWORK')
    const refetchMock = jest.fn()

    mockUseFavorites.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: offlineError,
      refetch: refetchMock,
    })

    await render(<FavoritesScreen />, { wrapper: createWrapper() })

    expect(screen.getByTestId('favorites-error-state')).toBeTruthy()
    expect(screen.getByText('لا يوجد اتصال بالإنترنت')).toBeTruthy()
    expect(screen.getByText('يرجى التأكد من اتصال هاتفك بالإنترنت ثم إعادة المحاولة.')).toBeTruthy()
    expect(screen.getByText('إعادة المحاولة')).toBeTruthy()
    expect(screen.queryByTestId('favorites-empty-state')).toBeNull()

    // Press retry button calls refetch
    fireEvent.press(screen.getByText('إعادة المحاولة'))
    expect(refetchMock).toHaveBeenCalledTimes(1)
  })

  it('renders server error state: displays server error copy and retry button on HTTP 500', async () => {
    const serverError = new axios.AxiosError(
      'Server Error',
      'ERR_BAD_RESPONSE',
      undefined,
      undefined,
      { status: 500, statusText: 'Internal Server Error', data: {}, headers: {}, config: {} as any }
    )

    mockUseFavorites.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: serverError,
      refetch: jest.fn(),
    })

    await render(<FavoritesScreen />, { wrapper: createWrapper() })

    expect(screen.getByTestId('favorites-error-state')).toBeTruthy()
    expect(screen.getByText('خطأ في الخادم')).toBeTruthy()
    expect(screen.queryByTestId('favorites-empty-state')).toBeNull()
  })

  it('preserves cached list when refetch fails in background', async () => {
    // Has cached data, but isError is true from a background refetch attempt
    mockUseFavorites.mockReturnValue({
      data: mockFavoritesData,
      isLoading: false,
      isError: true,
      error: new axios.AxiosError('Network Error', 'ERR_NETWORK'),
      refetch: jest.fn(),
    })

    await render(<FavoritesScreen />, { wrapper: createWrapper() })

    // Cached item remains visible!
    expect(screen.getByText('تويوتا كامري 2022')).toBeTruthy()
    expect(screen.queryByTestId('favorites-error-state')).toBeNull()
  })

  it('pull to refresh invokes refetch function', async () => {
    const refetchMock = jest.fn().mockResolvedValue(undefined)

    mockUseFavorites.mockReturnValue({
      data: mockFavoritesData,
      isLoading: false,
      isError: false,
      error: null,
      refetch: refetchMock,
    })

    await render(<FavoritesScreen />, { wrapper: createWrapper() })

    const flatList = screen.getByTestId('favorites-flat-list')
    expect(flatList.props.refreshControl).toBeTruthy()

    await act(async () => {
      flatList.props.refreshControl.props.onRefresh()
    })

    await waitFor(() => {
      expect(refetchMock).toHaveBeenCalledTimes(1)
    })
  })
})
