import React from 'react'
import { render, screen } from '@testing-library/react-native'
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

jest.mock('../../../hooks/useListings', () => ({
  useFavorites: () => ({
    data: mockFavoritesData,
    isLoading: false,
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

jest.mock('../../../features/favorites/useFavoriteToggle', () => ({
  useFavoriteToggle: () => ({
    isFavorite: true,
    toggle: jest.fn(),
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

describe('FavoritesScreen - Parts & Services fullWidth branch', () => {
  it('renders parts and services via PartFavoriteCardAdapter alongside cars', async () => {
    await render(<FavoritesScreen />)

    // Verify all items are rendered
    expect(screen.getByText('تويوتا كامري 2022')).toBeTruthy()
    expect(screen.getByText('سفايف لاندكروزر أصلية')).toBeTruthy()
    expect(screen.getByText('فحص كمبيوتر سيارات وبرمجة')).toBeTruthy()

    // Verify contact buttons from PartFavoriteCardAdapter are rendered for parts and services
    const callButtons = screen.getAllByTestId('part-favorite-call-btn')
    expect(callButtons.length).toBe(2) // 1 for part-1, 1 for service-1
  })
})
