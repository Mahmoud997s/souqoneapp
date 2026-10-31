import React from 'react'
import { render } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import HomeScreen from '../../../app/(tabs)/index'

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
  },
  useRouter: () => ({
    push: jest.fn(),
  }),
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
    FadeInDown: {
      duration: () => ({}),
    },
    useSharedValue: jest.fn((init) => ({ value: init })),
    useAnimatedScrollHandler: jest.fn(() => jest.fn()),
    useAnimatedStyle: jest.fn((cb) => cb()),
    withSpring: jest.fn((val) => val),
    withTiming: jest.fn((val) => val),
  }
})

jest.mock('../../../src/context/NavVisibilityContext', () => ({
  useNavVisibility: () => ({
    navHidden: { value: 0 },
  }),
  TAB_BAR_H: 60,
}))

jest.mock('../../../src/store/authStore', () => ({
  useAuthStore: () => ({
    user: null,
  }),
}))

jest.mock('../../../src/components/profile/DeletionScheduledBanner', () => ({
  DeletionScheduledBanner: () => null,
}))

const mockCars = [
  {
    id: 'car-smoke-1',
    title: 'تويوتا كامري 2024 فل كامل',
    price: 6500,
    currency: 'OMR',
    images: ['https://example.com/car.jpg'],
    city: 'السيب',
    governorate: 'مسقط',
    year: 2024,
    mileage: 15000,
    transmission: 'أوتوماتيك',
  },
]

const mockServices = [
  {
    id: 'svc-smoke-1',
    title: 'فحص كمبيوتر وصيانة دورية',
    price: 25,
    currency: 'OMR',
    images: ['https://example.com/svc.jpg'],
    city: 'بوشر',
    governorate: 'مسقط',
  },
]

const mockParts = [
  {
    id: 'part-smoke-1',
    title: 'طقم إطارات ميشلان أصلي',
    price: 140,
    currency: 'OMR',
    images: ['https://example.com/part.jpg'],
    city: 'المعبيلة',
    governorate: 'مسقط',
  },
]

const mockBuses = [
  {
    id: 'bus-smoke-1',
    title: 'حافلة تويوتا كوستر 30 راكب',
    price: 8500,
    currency: 'OMR',
    images: ['https://example.com/bus.jpg'],
    city: 'صحار',
    governorate: 'شمال الباطنة',
  },
]

const mockEquipment = [
  {
    id: 'eq-smoke-1',
    title: 'حفار كاتربيلر 320 بحالة ممتازة',
    price: 22000,
    currency: 'OMR',
    images: ['https://example.com/eq.jpg'],
    city: 'نزوى',
    governorate: 'الداخلية',
  },
]

jest.mock('../../../src/hooks/useListings', () => ({
  useListings: () => ({ data: mockCars, isLoading: false }),
}))

jest.mock('../../../src/hooks/useServices', () => ({
  useServices: () => ({ data: mockServices, isLoading: false }),
}))

jest.mock('../../../src/hooks/useParts', () => ({
  useParts: () => ({ data: mockParts, isLoading: false }),
}))

jest.mock('../../../src/hooks/useBuses', () => ({
  useBuses: () => ({ data: mockBuses, isLoading: false }),
}))

jest.mock('../../../src/hooks/useEquipment', () => ({
  useEquipment: () => ({ data: mockEquipment, isLoading: false }),
}))

describe('HomeScreen Smoke Test — CategorySections & Layout (D-164c)', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  it('mounts full HomeScreen and renders all 5 CategorySection headers and the first car card', async () => {
    const { getByText, getByTestId, queryByTestId } = await render(
      <QueryClientProvider client={queryClient}>
        <HomeScreen />
      </QueryClientProvider>
    )

    // 0. Home navbar glass buttons (brand, chat, notifications, large search)
    expect(getByTestId('home-brand-icon-btn')).toBeTruthy()
    expect(
      queryByTestId('home-brand-icon-btn-glass-liquid') ||
        queryByTestId('home-brand-icon-btn-glass-blur')
    ).toBeTruthy()
    expect(
      queryByTestId('hero-header-notification-btn-glass-liquid') ||
        queryByTestId('hero-header-notification-btn-glass-blur')
    ).toBeTruthy()
    expect(
      queryByTestId('hero-header-chat-btn-glass-liquid') ||
        queryByTestId('hero-header-chat-btn-glass-blur')
    ).toBeTruthy()
    expect(
      queryByTestId('hero-header-large-search-glass-liquid') ||
        queryByTestId('hero-header-large-search-glass-blur')
    ).toBeTruthy()
    expect(queryByTestId('hero-header-add-btn')).toBeNull()

    // 1. All 5 CategorySection Titles
    expect(getByText('أحدث إعلانات السيارات')).toBeTruthy()
    expect(getByText('خدمات السيارات')).toBeTruthy()
    expect(getByText('قطع الغيار')).toBeTruthy()
    expect(getByText('حافلات ونقل ركاب')).toBeTruthy()
    expect(getByText('معدات ومشغلون')).toBeTruthy()

    // 2. First card of cars section
    expect(getByText('تويوتا كامري 2024 فل كامل')).toBeTruthy()

    // 3. Other category cards
    expect(getByText('فحص كمبيوتر وصيانة دورية')).toBeTruthy()
    expect(getByText('طقم إطارات ميشلان أصلي')).toBeTruthy()
    expect(getByText('حافلة تويوتا كوستر 30 راكب')).toBeTruthy()
    expect(getByText('حفار كاتربيلر 320 بحالة ممتازة')).toBeTruthy()

    // 4. Category tiles in grid
    expect(getByText('سيارات')).toBeTruthy()
    expect(getByText('خدمات')).toBeTruthy()
    expect(getByText('قطع غيار')).toBeTruthy()
    expect(getByText('حافلات')).toBeTruthy()
    expect(getByText('معدات')).toBeTruthy()
    expect(getByText('تصفح الكل')).toBeTruthy()
  })
})
