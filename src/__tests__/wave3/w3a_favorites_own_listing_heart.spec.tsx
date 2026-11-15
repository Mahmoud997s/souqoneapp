import React from 'react'
import { render } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ServiceCard } from '../../components/services/ServiceCard'
import { SearchCardDispatcher } from '../../screens/search/components/SearchCardDispatcher'
import FavoritesScreen from '../../../app/profile/favorites'

let mockCurrentUserId: string | null = 'owner-1'

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn() },
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({}),
}))

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}))

jest.mock('react-native-reanimated', () => {
  const reanimated = require('react-native-reanimated/mock')
  return {
    ...reanimated,
    useSharedValue: jest.fn((init) => ({ value: init })),
    useAnimatedScrollHandler: jest.fn(() => jest.fn()),
    useAnimatedStyle: jest.fn((cb) => cb()),
  }
})

jest.mock('../../context/NavVisibilityContext', () => ({
  useNavVisibility: () => ({ navHidden: { value: 0 } }),
  TAB_BAR_H: 60,
}))

jest.mock('../../store/authStore', () => ({
  useAuthStore: () => ({
    user: mockCurrentUserId ? { id: mockCurrentUserId } : null,
  }),
}))

jest.mock('../../features/favorites/useFavoriteToggle', () => ({
  useFavoriteToggle: () => ({
    isFavorite: false,
    isLoading: false,
    toggle: jest.fn(),
  }),
}))

const mockFavoritesData = [
  {
    id: 'car-fav-1',
    title: 'تويوتا كامري 2024',
    price: 7000,
    currency: 'ر.ع.',
    governorate: 'مسقط - السيب',
    images: ['https://example.com/car.jpg'],
    category: 'cars',
    raw: { id: 'car-fav-1', userId: 'other-user' },
  },
  {
    id: 'part-own-1',
    title: 'فلتر هواء أصلي',
    price: 15,
    currency: 'ر.ع.',
    governorate: 'الداخلية - نزوى',
    images: ['https://example.com/part.jpg'],
    category: 'parts',
    raw: { id: 'part-own-1', sellerId: 'owner-1' },
  },
]

jest.mock('../../hooks/useListings', () => ({
  useFavorites: () => ({
    data: mockFavoritesData,
    isLoading: false,
    isError: false,
    error: null,
    refetch: jest.fn().mockResolvedValue({}),
  }),
}))

describe('Wave 3a (3.10 / S-10): Own listing favorite heart & favorites card rendering', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  beforeEach(() => {
    mockCurrentUserId = 'owner-1'
  })

  it('falls back to resolveListingLocation in ServiceCard when item.governorate is empty', async () => {
    const { getByText } = await render(
      <QueryClientProvider client={queryClient}>
        <ServiceCard
          item={{
            id: 'svc-loc-1',
            title: 'صيانة سريعة',
            governorate: '',
            images: [],
            category: 'services',
            raw: { id: 'svc-loc-1', governorate: 'مسقط', city: 'بوشر', userId: 'other-user' },
          }}
          onPress={jest.fn()}
        />
      </QueryClientProvider>
    )

    expect(getByText(/مسقط/)).toBeTruthy()
  })

  it('hides heart button on own listings across SearchCardDispatcher verticals and shows it for others', async () => {
    const ownService = {
      id: 'svc-own-1',
      title: 'خدمة المالك',
      governorate: 'مسقط',
      images: [],
      category: 'services',
      raw: { id: 'svc-own-1', userId: 'owner-1' },
    }
    const otherCar = {
      id: 'car-other-1',
      title: 'سيارة مستخدم آخر',
      price: 5000,
      governorate: 'صحار',
      images: [],
      category: 'cars',
      raw: { id: 'car-other-1', userId: 'other-user' },
    }

    const ownRender = await render(
      <QueryClientProvider client={queryClient}>
        <SearchCardDispatcher item={ownService} />
      </QueryClientProvider>
    )
    expect(ownRender.queryByTestId('listing-card-favorite')).toBeNull()

    const otherRender = await render(
      <QueryClientProvider client={queryClient}>
        <SearchCardDispatcher item={otherCar} />
      </QueryClientProvider>
    )
    expect(otherRender.getByTestId('listing-card-favorite')).toBeTruthy()
  })

  it('renders FavoritesScreen cards without heart on own listings and with heart on others', async () => {
    const { getByText, getAllByTestId } = await render(
      <QueryClientProvider client={queryClient}>
        <FavoritesScreen />
      </QueryClientProvider>
    )

    expect(getByText('تويوتا كامري 2024')).toBeTruthy()
    expect(getByText('فلتر هواء أصلي')).toBeTruthy()
    // Only car-fav-1 (other-user) shows heart; part-own-1 (owner-1) hides heart
    expect(getAllByTestId('listing-card-favorite')).toHaveLength(1)
  })
})
