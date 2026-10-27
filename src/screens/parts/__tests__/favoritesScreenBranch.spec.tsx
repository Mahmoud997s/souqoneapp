import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import FavoritesScreen from '../../../../app/profile/favorites'

const mockFavoritesData = [
  {
    id: 'car-1',
    title: 'تويوتا كامري 2022',
    category: 'cars',
    price: 6500,
    images: ['https://img.souqone.app/car1.jpg'],
  },
  {
    id: 'part-1',
    title: 'سفايف لاندكروزر أصلية',
    category: 'parts',
    price: 45,
    images: ['https://img.souqone.app/part1.jpg'],
  },
  {
    id: 'service-1',
    title: 'فحص كمبيوتر سيارات وبرمجة',
    category: 'services',
    priceText: 'تبدأ من 10 ر.ع',
    images: ['https://img.souqone.app/service1.jpg'],
  },
]

const mockRefetch = jest.fn()

jest.mock('../../../hooks/useListings', () => ({
  useFavorites: () => ({
    data: mockFavoritesData,
    isLoading: false,
    refetch: mockRefetch,
  }),
}))

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 40, bottom: 20, left: 0, right: 0 }),
}))

jest.mock('../../../hooks/useScrollAwareNav', () => ({
  useScrollAwareNav: () => ({
    scrollHandler: jest.fn(),
  }),
}))

jest.mock('../../../context/NavVisibilityContext', () => ({
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

const mockToggle = jest.fn()
jest.mock('../../../features/favorites/useFavoriteToggle', () => ({
  useFavoriteToggle: () => ({
    isFavorite: true,
    isBusy: false,
    toggle: mockToggle,
  }),
}))

jest.mock('../../../hooks/listing-detail/useListingContact', () => ({
  useListingContact: () => ({
    call: jest.fn(),
    whatsApp: jest.fn(),
    chat: jest.fn(),
    busy: false,
  }),
}))

describe('FavoritesScreen - Parts & Services UnifiedCard fullWidth branch', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders parts and services via UnifiedCard with fullWidth and onFavorite wired', async () => {
    await render(<FavoritesScreen />)

    // Verify all items are rendered
    expect(screen.getByText('تويوتا كامري 2022')).toBeTruthy()
    expect(screen.getByText('سفايف لاندكروزر أصلية')).toBeTruthy()
    expect(screen.getByText('فحص كمبيوتر سيارات وبرمجة')).toBeTruthy()

    // Find favorite toggle buttons (hearts)
    // index 0: cars (CarCard), index 1: parts (UnifiedCard), index 2: services (UnifiedCard)
    const favoriteHearts = screen.getAllByTestId('listing-card-favorite')
    expect(favoriteHearts.length).toBeGreaterThan(1)

    // Press the heart on the part card to un-favorite
    fireEvent.press(favoriteHearts[1])

    // Verify toggle was invoked
    expect(mockToggle).toHaveBeenCalled()

    // Verify refetch (handleFavorite) was triggered to refresh the list
    expect(mockRefetch).toHaveBeenCalledTimes(1)
  })
})
