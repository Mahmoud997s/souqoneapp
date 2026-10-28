import React from 'react'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BusCard } from '../../components/buses/BusCard'
import { EquipCard } from '../../components/cards/EquipCard'
import { CarCard } from '../../components/cars/CarCard'
import { PartCard } from '../../components/parts/PartCard'
import { ServiceCard } from '../../components/services/ServiceCard'
import { ListingCardBase } from '../../components/ui/ListingCardBase'
import { favoritesApi } from '../../api/favorites'
import { dialogService } from '../../store/dialogStore'
import { useAuthStore } from '../../store/authStore'

jest.mock('expo-image', () => ({
  Image: () => <></>,
}))

jest.mock('expo-blur', () => ({
  BlurView: ({ children }: any) => <>{children}</>,
}))

const mockRouterPush = jest.fn()

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockRouterPush,
    back: jest.fn(),
  }),
  router: {
    push: mockRouterPush,
    back: jest.fn(),
  },
}))

jest.mock('../../api/favorites', () => ({
  favoritesApi: {
    add: jest.fn().mockResolvedValue({ data: { favorited: true } }),
    getAll: jest.fn().mockResolvedValue({ data: [] }),
    check: jest.fn().mockResolvedValue({ data: { favorited: false } }),
  },
}))

jest.mock('../../store/dialogStore', () => ({
  dialogService: {
    alert: jest.fn(),
  },
}))

jest.mock('../../store/authStore', () => ({
  useAuthStore: jest.fn(() => ({
    isLoggedIn: true,
    user: { id: 'u1', name: 'Test User' },
  })),
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('Card Favorites Entity Types & Error Handling (D-091)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRouterPush.mockClear()
    ;(useAuthStore as unknown as jest.Mock).mockReturnValue({
      isLoggedIn: true,
      user: { id: 'u1', name: 'Test User' },
    })
    ;(favoritesApi.add as jest.Mock).mockResolvedValue({ data: { favorited: true } })
  })

  afterEach(() => {
    cleanup()
  })

  it('BusCard calls favoritesApi.add with BUS_LISTING entity type', async () => {
    const busItem: any = {
      id: 'bus-101',
      title: 'حافلة تويوتا كوستر',
      price: 15000,
      busType: 'COASTER',
      capacity: 30,
      images: [],
    }

    const { getByTestId } = await render(<BusCard item={busItem} onPress={() => {}} />, {
      wrapper: createWrapper(),
    })

    const heartBtn = getByTestId('listing-card-favorite')
    await React.act(async () => {
      fireEvent.press(heartBtn)
    })

    await waitFor(() => {
      expect(favoritesApi.add).toHaveBeenCalledTimes(1)
      expect(favoritesApi.add).toHaveBeenCalledWith('BUS_LISTING', 'bus-101')
    })
  })

  it('EquipCard calls favoritesApi.add with EQUIPMENT_LISTING entity type', async () => {
    const equipItem: any = {
      id: 'eq-202',
      title: 'حفار كاتربيلر 320',
      price: 45000,
      equipmentType: 'EXCAVATOR',
      images: [],
    }

    const { getByTestId } = await render(<EquipCard item={equipItem} onPress={() => {}} />, {
      wrapper: createWrapper(),
    })

    const heartBtn = getByTestId('listing-card-favorite')
    await React.act(async () => {
      fireEvent.press(heartBtn)
    })

    await waitFor(() => {
      expect(favoritesApi.add).toHaveBeenCalledTimes(1)
      expect(favoritesApi.add).toHaveBeenCalledWith('EQUIPMENT_LISTING', 'eq-202')
    })
  })

  it('CarCard calls favoritesApi.add with LISTING entity type (regression guard)', async () => {
    const carItem: any = {
      id: 'car-303',
      title: 'تويوتا كامري 2024',
      price: 9500,
      brand: 'TOYOTA',
      model: 'CAMRY',
      year: 2024,
      images: [],
    }

    const { getByTestId } = await render(<CarCard item={carItem} onPress={() => {}} />, {
      wrapper: createWrapper(),
    })

    const heartBtn = getByTestId('listing-card-favorite')
    await React.act(async () => {
      fireEvent.press(heartBtn)
    })

    await waitFor(() => {
      expect(favoritesApi.add).toHaveBeenCalledTimes(1)
      expect(favoritesApi.add).toHaveBeenCalledWith('LISTING', 'car-303')
    })
  })

  it('PartCard calls favoritesApi.add with SPARE_PART entity type', async () => {
    const partItem: any = {
      id: 'part-101',
      title: 'سفايف لاندكروزر أصلية',
      price: 45,
      images: [],
    }

    const { getByTestId } = await render(<PartCard item={partItem} onPress={() => {}} />, {
      wrapper: createWrapper(),
    })

    const heartBtn = getByTestId('listing-card-favorite')
    await React.act(async () => {
      fireEvent.press(heartBtn)
    })

    await waitFor(() => {
      expect(favoritesApi.add).toHaveBeenCalledWith('SPARE_PART', 'part-101')
    })
  })

  it('ServiceCard calls favoritesApi.add with CAR_SERVICE entity type', async () => {
    const serviceItem: any = {
      id: 'service-202',
      title: 'فحص كمبيوتر سيارات وبرمجة',
      priceText: 'تبدأ من 10 ر.ع',
      images: [],
    }

    const { getByTestId } = await render(<ServiceCard item={serviceItem} onPress={() => {}} />, {
      wrapper: createWrapper(),
    })

    const heartBtn = getByTestId('listing-card-favorite')
    await React.act(async () => {
      fireEvent.press(heartBtn)
    })

    await waitFor(() => {
      expect(favoritesApi.add).toHaveBeenCalledWith('CAR_SERVICE', 'service-202')
    })
  })

  it('displays user-friendly Arabic alert and rolls back heart when favoritesApi.add rejects', async () => {
    ;(favoritesApi.add as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    const carItem: any = {
      id: 'fail-test-1',
      title: 'سيارة تجريبية تفشل',
      price: 5000,
      images: [],
      isFavorite: false,
    }

    const { getByTestId } = await render(<CarCard item={carItem} onPress={() => {}} />, {
      wrapper: createWrapper(),
    })

    const heartBtn = getByTestId('listing-card-favorite')
    await React.act(async () => {
      fireEvent.press(heartBtn)
    })

    await waitFor(() => {
      expect(favoritesApi.add).toHaveBeenCalledWith('LISTING', 'fail-test-1')
      expect(dialogService.alert).toHaveBeenCalledTimes(1)
      expect(dialogService.alert).toHaveBeenCalledWith(
        'خطأ',
        'تعذّر تحديث المفضلة، حاول مرة أخرى'
      )
    })
  })

  it('ignores rapid duplicate presses while toggle is in flight (mutex latch)', async () => {
    let resolveAdd: (val: any) => void = () => {}
    const slowPromise = new Promise((resolve) => {
      resolveAdd = resolve
    })
    ;(favoritesApi.add as jest.Mock).mockReturnValue(slowPromise)

    const busItem: any = {
      id: 'latch-bus-1',
      title: 'حافلة سباق النقرات',
      price: 20000,
      busType: 'COASTER',
      capacity: 30,
      images: [],
    }

    const { getByTestId } = await render(<BusCard item={busItem} onPress={() => {}} />, {
      wrapper: createWrapper(),
    })

    const heartBtn = getByTestId('listing-card-favorite')

    // Fire 3 rapid presses
    await React.act(async () => {
      fireEvent.press(heartBtn)
      fireEvent.press(heartBtn)
      fireEvent.press(heartBtn)
    })

    // Resolve the single in-flight call
    await React.act(async () => {
      resolveAdd({ data: { favorited: true } })
    })

    await waitFor(() => {
      expect(favoritesApi.add).toHaveBeenCalledTimes(1)
    })
  })

  it('unauthenticated press redirects to login and does NOT permanently latch the heart button', async () => {
    ;(useAuthStore as unknown as jest.Mock).mockReturnValue({
      isLoggedIn: false,
      user: null,
    })

    const item: any = {
      id: 'unauth-latch-1',
      title: 'إعلان بدون تسجيل 1',
      images: [],
    }

    const { getByTestId } = await render(
      <ListingCardBase
        item={item}
        title="إعلان بدون تسجيل 1"
        priceLabel="5000 ر.ع."
        favoriteType="LISTING"
        onPress={jest.fn()}
      />,
      { wrapper: createWrapper() }
    )

    const heartBtn = getByTestId('listing-card-favorite')

    // First press while logged out
    await React.act(async () => {
      fireEvent.press(heartBtn)
    })
    expect(mockRouterPush).toHaveBeenCalledWith(expect.stringContaining('/(auth)/login'))
    expect(mockRouterPush).toHaveBeenCalledTimes(1)
    expect(favoritesApi.add).not.toHaveBeenCalled()

    // Second press while still logged out — must trigger router.push again if latch was not held
    await React.act(async () => {
      fireEvent.press(heartBtn)
    })
    expect(mockRouterPush).toHaveBeenCalledTimes(2)
    expect(favoritesApi.add).not.toHaveBeenCalled()
  })

  it('unauthenticated press redirects to login, then switches to logged-in and allows favorite toggle on same card', async () => {
    ;(useAuthStore as unknown as jest.Mock).mockReturnValue({
      isLoggedIn: false,
      user: null,
    })

    const item: any = {
      id: 'unauth-latch-2',
      title: 'إعلان بدون تسجيل 2',
      images: [],
    }

    const { getByTestId, rerender } = await render(
      <ListingCardBase
        item={item}
        title="إعلان بدون تسجيل 2"
        priceLabel="5000 ر.ع."
        favoriteType="LISTING"
        onPress={jest.fn()}
      />,
      { wrapper: createWrapper() }
    )

    const heartBtn = getByTestId('listing-card-favorite')

    // First press while logged out
    await React.act(async () => {
      fireEvent.press(heartBtn)
    })
    expect(mockRouterPush).toHaveBeenCalledWith(expect.stringContaining('/(auth)/login'))
    expect(mockRouterPush).toHaveBeenCalledTimes(1)
    expect(favoritesApi.add).not.toHaveBeenCalled()

    // Switch store to logged-in on the same mounted card
    ;(useAuthStore as unknown as jest.Mock).mockReturnValue({
      isLoggedIn: true,
      user: { id: 'u1', name: 'Logged In User' },
    })

    await rerender(
      <ListingCardBase
        item={item}
        title="إعلان بدون تسجيل 2"
        priceLabel="5000 ر.ع."
        favoriteType="LISTING"
        onPress={jest.fn()}
      />
    )

    // Press heart button now that user is logged in
    await React.act(async () => {
      fireEvent.press(getByTestId('listing-card-favorite'))
    })

    await waitFor(() => {
      expect(favoritesApi.add).toHaveBeenCalledTimes(1)
      expect(favoritesApi.add).toHaveBeenCalledWith('LISTING', 'unauth-latch-2')
    })
  })
})
