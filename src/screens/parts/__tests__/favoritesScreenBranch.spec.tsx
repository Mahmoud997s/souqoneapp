import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import FavoritesScreen from '../../../../app/profile/favorites'
import { CarCard } from '../../../components/cars/CarCard'
import { BusCard } from '../../../components/buses/BusCard'
import { EquipCard } from '../../../components/cards/EquipCard'
import { PartCard } from '../../../components/parts/PartCard'
import { ServiceCard } from '../../../components/services/ServiceCard'
import { JobCard } from '../../../components/cards/JobCard'

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
    id: 'bus-1',
    title: 'حافلة تويوتا كوستر 30 راكب',
    category: 'buses',
    price: 18500,
    images: ['https://img.souqone.app/bus1.jpg'],
  },
  {
    id: 'equip-1',
    title: 'رافعة شوكية كاتربيلر 3 طن',
    category: 'equipment',
    price: 8000,
    images: ['https://img.souqone.app/equip1.jpg'],
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

jest.mock('../../../components/cars/CarCard', () => {
  const { Text, View } = require('react-native')
  return {
    CarCard: jest.fn((props) => (
      <View testID={`car-card-${props.item?.id}`} accessibilityLabel={props.fullWidth ? 'full-width-card' : 'standard-card'}>
        <Text>{props.item?.title}</Text>
      </View>
    )),
  }
})

jest.mock('../../../components/buses/BusCard', () => {
  const { Text, View } = require('react-native')
  return {
    BusCard: jest.fn((props) => (
      <View testID={`bus-card-${props.item?.id}`} accessibilityLabel={props.fullWidth ? 'full-width-card' : 'standard-card'}>
        <Text>{props.item?.title}</Text>
      </View>
    )),
  }
})

jest.mock('../../../components/cards/EquipCard', () => {
  const { Text, View } = require('react-native')
  return {
    EquipCard: jest.fn((props) => (
      <View testID={`equip-card-${props.item?.id}`} accessibilityLabel={props.fullWidth ? 'full-width-card' : 'standard-card'}>
        <Text>{props.item?.title}</Text>
      </View>
    )),
  }
})

jest.mock('../../../components/parts/PartCard', () => {
  const { Text, View } = require('react-native')
  return {
    PartCard: jest.fn((props) => (
      <View testID={`part-card-${props.item?.id}`} accessibilityLabel={props.fullWidth ? 'full-width-card' : 'standard-card'}>
        <Text>{props.item?.title}</Text>
      </View>
    )),
  }
})

jest.mock('../../../components/services/ServiceCard', () => {
  const { Text, View } = require('react-native')
  return {
    ServiceCard: jest.fn((props) => (
      <View testID={`service-card-${props.item?.id}`} accessibilityLabel={props.fullWidth ? 'full-width-card' : 'standard-card'}>
        <Text>{props.item?.title}</Text>
      </View>
    )),
  }
})

jest.mock('../../../components/cards/JobCard', () => {
  const { Text, View } = require('react-native')
  return {
    JobCard: jest.fn((props) => (
      <View testID={`job-card-${props.job?.id}`} accessibilityLabel={props.fullWidth ? 'full-width-card' : 'standard-card'}>
        <Text>{props.job?.title}</Text>
      </View>
    )),
  }
})

describe('FavoritesScreen - Original per-vertical cards render with fullWidth', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders every category with its original card component and fullWidth=true', async () => {
    await render(<FavoritesScreen />, { wrapper: createWrapper() })

    // Verify all titles are rendered
    expect(screen.getByText('تويوتا كامري 2022')).toBeTruthy()
    expect(screen.getByText('حافلة تويوتا كوستر 30 راكب')).toBeTruthy()
    expect(screen.getByText('رافعة شوكية كاتربيلر 3 طن')).toBeTruthy()
    expect(screen.getByText('سفايف لاندكروزر أصلية')).toBeTruthy()
    expect(screen.getByText('فحص كمبيوتر سيارات وبرمجة')).toBeTruthy()
    expect(screen.queryByText('مطلوب فني ميكانيك')).toBeNull()

    // 1. Cars -> CarCard (fullWidth: true)
    const mockCarCard = CarCard as unknown as jest.Mock
    const carCall = mockCarCard.mock.calls.find(call => call[0]?.item?.id === 'car-1')
    expect(carCall).toBeDefined()
    expect(carCall[0].fullWidth).toBe(true)

    // 2. Buses -> BusCard (fullWidth: true)
    const mockBusCard = BusCard as unknown as jest.Mock
    const busCall = mockBusCard.mock.calls.find(call => call[0]?.item?.id === 'bus-1')
    expect(busCall).toBeDefined()
    expect(busCall[0].fullWidth).toBe(true)

    // 3. Equipment -> EquipCard (fullWidth: true)
    const mockEquipCard = EquipCard as unknown as jest.Mock
    const equipCall = mockEquipCard.mock.calls.find(call => call[0]?.item?.id === 'equip-1')
    expect(equipCall).toBeDefined()
    expect(equipCall[0].fullWidth).toBe(true)

    // 4. Parts -> PartCard (fullWidth: true)
    const mockPartCard = PartCard as unknown as jest.Mock
    const partCall = mockPartCard.mock.calls.find(call => call[0]?.item?.id === 'part-1')
    expect(partCall).toBeDefined()
    expect(partCall[0].fullWidth).toBe(true)

    // 5. Services -> ServiceCard (fullWidth: true)
    const mockServiceCard = ServiceCard as unknown as jest.Mock
    const serviceCall = mockServiceCard.mock.calls.find(call => call[0]?.item?.id === 'service-1')
    expect(serviceCall).toBeDefined()
    expect(serviceCall[0].fullWidth).toBe(true)

    // 6. Jobs filtered out
    const mockJobCard = JobCard as unknown as jest.Mock
    expect(mockJobCard).not.toHaveBeenCalled()
  })
})
