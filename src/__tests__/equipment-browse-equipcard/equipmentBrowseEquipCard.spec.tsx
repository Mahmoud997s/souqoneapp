import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import EquipmentBrowseScreen from '../../../app/equipment/browse'
import { EquipCard } from '../../../src/components/cards/EquipCard'
import { CarCard } from '../../../src/components/cars/CarCard'
import { router } from 'expo-router'

const mockEquipmentData = [
  {
    id: 'eq-1',
    title: 'حفارة كاتربيلر 320D',
    category: 'equipment',
    listingType: 'EQUIPMENT_SALE',
    condition: 'مستعملة',
    price: 25000,
    currency: 'ر.ع.',
    governorate: 'مسقط - السيب',
    images: ['https://img.souqone.app/eq1.jpg'],
    isPremium: true,
    isVerified: true,
    raw: {
      id: 'eq-1',
      equipmentType: 'EXCAVATOR',
      make: 'Caterpillar',
      model: '320D',
      year: 2021,
      hoursUsed: 3500,
      condition: 'USED',
      price: 25000,
      listingType: 'EQUIPMENT_SALE',
    },
  },
  {
    id: 'eq-2',
    title: 'رافعة شوكية تويوتا 3 طن',
    category: 'equipment',
    listingType: 'EQUIPMENT_RENT',
    condition: 'شبه جديدة',
    price: 35,
    priceLabel: 'يوم',
    currency: 'ر.ع.',
    governorate: 'شمال الباطنة - صحار',
    images: ['https://img.souqone.app/eq2.jpg'],
    withDriver: true,
    raw: {
      id: 'eq-2',
      equipmentType: 'FORKLIFT',
      make: 'Toyota',
      model: '8FD30',
      year: 2023,
      hoursUsed: 400,
      condition: 'LIKE_NEW',
      dailyPrice: 35,
      listingType: 'EQUIPMENT_RENT',
      withDriver: true,
    },
  },
]

const mockUseEquipment = jest.fn()

jest.mock('../../../src/hooks/useEquipment', () => ({
  useEquipment: (...args: any[]) => mockUseEquipment(...args),
}))

jest.mock('../../../src/hooks/useScrollAwareNav', () => ({
  useScrollAwareNav: () => ({
    scrollHandler: jest.fn(),
  }),
}))

jest.mock('../../../src/context/NavVisibilityContext', () => ({
  useNavVisibility: () => ({
    navHidden: { value: 0 },
    setNavVisible: jest.fn(),
  }),
}))

jest.mock('../../../src/api/locations', () => ({
  locationsApi: {
    getGovernorates: jest.fn().mockResolvedValue([
      { id: 1, nameAr: 'مسقط', nameEn: 'Muscat' },
      { id: 2, nameAr: 'شمال الباطنة', nameEn: 'North Al Batinah' },
    ]),
  },
}))

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    back: jest.fn(),
  },
  useLocalSearchParams: () => ({}),
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}))

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}))

// Mock EquipCard to spy on props and verify it is rendered
jest.mock('../../../src/components/cards/EquipCard', () => {
  const { View, Text, TouchableOpacity } = require('react-native')
  return {
    EquipCard: jest.fn((props) => (
      <View
        testID={`equip-card-${props.item?.id}`}
        accessibilityLabel={props.fullWidth ? 'full-width' : 'standard-width'}
      >
        <Text testID={`equip-card-title-${props.item?.id}`}>{props.item?.title}</Text>
        <TouchableOpacity
          testID={`equip-card-press-${props.item?.id}`}
          onPress={props.onPress}
        >
          <Text>عرض التفاصيل</Text>
        </TouchableOpacity>
      </View>
    )),
  }
})

// Mock CarCard to verify it is NEVER rendered in equipment browse
jest.mock('../../../src/components/cars/CarCard', () => {
  const { View, Text } = require('react-native')
  return {
    CarCard: jest.fn(() => (
      <View testID="car-card-unexpected">
        <Text>CarCard should not be rendered</Text>
      </View>
    )),
  }
})

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('EquipmentBrowseScreen - EquipCard Parity', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseEquipment.mockReturnValue({
      data: mockEquipmentData,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    })
  })

  it('renders EquipCard for each equipment item and never renders CarCard', async () => {
    await render(<EquipmentBrowseScreen />, { wrapper: createWrapper() })

    // Verify EquipCard is rendered for both items
    expect(screen.getByTestId('equip-card-eq-1')).toBeTruthy()
    expect(screen.getByTestId('equip-card-eq-2')).toBeTruthy()

    // Verify CarCard was NEVER called
    expect(CarCard).not.toHaveBeenCalled()
    expect(screen.queryByTestId('car-card-unexpected')).toBeNull()

    // Verify EquipCard was called with fullWidth=true, showChips=true, maxChips=3
    const mockEquipCalls = (EquipCard as unknown as jest.Mock).mock.calls
    const firstCall = mockEquipCalls.find((call) => call[0]?.item?.id === 'eq-1')
    expect(firstCall).toBeTruthy()
    expect(firstCall[0].fullWidth).toBe(true)
    expect(firstCall[0].showChips).toBe(true)
    expect(firstCall[0].maxChips).toBe(3)
    expect(firstCall[0].item.title).toBe('حفارة كاتربيلر 320D')

    // Verify item is passed directly without mutating into car schema
    expect(firstCall[0].item.raw.equipmentType).toBe('EXCAVATOR')
    expect(firstCall[0].item.raw.hoursUsed).toBe(3500)
    expect(firstCall[0].item.category).toBe('equipment')
    expect(firstCall[0].item.mileage).toBeUndefined()

    const secondCall = mockEquipCalls.find((call) => call[0]?.item?.id === 'eq-2')
    expect(secondCall).toBeTruthy()
    expect(secondCall[0].fullWidth).toBe(true)
    expect(secondCall[0].showChips).toBe(true)
    expect(secondCall[0].maxChips).toBe(3)
    expect(secondCall[0].item.title).toBe('رافعة شوكية تويوتا 3 طن')
  })

  it('navigates to /equipment/{id} when EquipCard onPress is triggered', async () => {
    await render(<EquipmentBrowseScreen />, { wrapper: createWrapper() })

    const pressButton1 = screen.getByTestId('equip-card-press-eq-1')
    fireEvent.press(pressButton1)
    expect(router.push).toHaveBeenCalledWith('/equipment/eq-1')

    const pressButton2 = screen.getByTestId('equip-card-press-eq-2')
    fireEvent.press(pressButton2)
    expect(router.push).toHaveBeenCalledWith('/equipment/eq-2')
  })

  it('renders empty count and no cards when listings is empty array', async () => {
    mockUseEquipment.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    })
    await render(<EquipmentBrowseScreen />, { wrapper: createWrapper() })

    expect(EquipCard).not.toHaveBeenCalled()
    expect(CarCard).not.toHaveBeenCalled()
  })
})
