import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import FavoritesScreen from '../../../../app/profile/favorites'
import { UnifiedCard } from '../../../components/cards/UnifiedCard'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

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
  {
    id: 'job-1',
    title: 'مطلوب فني ميكانيك',
    category: 'jobs',
    priceText: 'راتب مجزي',
    images: ['https://img.souqone.app/job1.jpg'],
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

jest.mock('../../../components/cards/UnifiedCard', () => {
  const { Text, View } = require('react-native')
  return {
    UnifiedCard: jest.fn((props) => (
      <View testID={`unified-card-${props.item.id}`} accessibilityLabel={props.fullWidth ? 'full-width-card' : 'standard-card'}>
        <Text>{props.item.title}</Text>
      </View>
    )),
  }
})

describe('FavoritesScreen - Parts & Services UnifiedCard fullWidth branch', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders parts and services with fullWidth=true, and other categories without fullWidth', async () => {
    await render(<FavoritesScreen />, { wrapper: createWrapper() })

    // Verify elements are rendered
    expect(screen.getByText('سفايف لاندكروزر أصلية')).toBeTruthy()
    expect(screen.getByText('فحص كمبيوتر سيارات وبرمجة')).toBeTruthy()
    expect(screen.getByText('مطلوب فني ميكانيك')).toBeTruthy()

    // Verify UnifiedCard mock invocations
    const mockUnifiedCard = UnifiedCard as unknown as jest.Mock

    // Find call for part-1
    const partCall = mockUnifiedCard.mock.calls.find(call => call[0]?.item?.id === 'part-1')
    expect(partCall).toBeDefined()
    expect(partCall[0].fullWidth).toBe(true)
    expect(partCall[0].onFavorite).toBeUndefined()

    // Find call for service-1
    const serviceCall = mockUnifiedCard.mock.calls.find(call => call[0]?.item?.id === 'service-1')
    expect(serviceCall).toBeDefined()
    expect(serviceCall[0].fullWidth).toBe(true)
    expect(serviceCall[0].onFavorite).toBeUndefined()

    // Find call for job-1 (generic fallback branch)
    const jobCall = mockUnifiedCard.mock.calls.find(call => call[0]?.item?.id === 'job-1')
    expect(jobCall).toBeDefined()
    expect(jobCall[0].fullWidth).toBeUndefined()
    expect(jobCall[0].onFavorite).toBeUndefined()
  })
})
