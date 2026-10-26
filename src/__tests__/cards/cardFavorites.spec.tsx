import React from 'react'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BusCard } from '../../components/buses/BusCard'
import { EquipCard } from '../../components/cards/EquipCard'
import { CarCard } from '../../components/cars/CarCard'
import { UnifiedCard } from '../../components/cards/UnifiedCard'
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

    await render(
      <BusCard item={busItem} onPress={jest.fn()} />,
      { wrapper: createWrapper() }
    )

    const heartBtn = screen.getByTestId('listing-card-favorite')
    fireEvent.press(heartBtn)

    await waitFor(() => {
      expect(favoritesApi.add).toHaveBeenCalledTimes(1)
      expect(favoritesApi.add).toHaveBeenCalledWith('BUS_LISTING', 'bus-101')
    })
  })

  it('EquipCard calls favoritesApi.add with EQUIPMENT_LISTING entity type', async () => {
    const equipItem: any = {
      id: 'eq-202',
      title: 'حفار كوماتسو',
      price: 32000,
      equipmentType: 'EXCAVATOR',
      images: [],
    }

    await render(
      <EquipCard item={equipItem} onPress={jest.fn()} />,
      { wrapper: createWrapper() }
    )

    const heartBtn = screen.getByTestId('listing-card-favorite')
    fireEvent.press(heartBtn)

    await waitFor(() => {
      expect(favoritesApi.add).toHaveBeenCalledTimes(1)
      expect(favoritesApi.add).toHaveBeenCalledWith('EQUIPMENT_LISTING', 'eq-202')
    })
  })

  it('CarCard calls favoritesApi.add with LISTING entity type (regression guard)', async () => {
    const carItem: any = {
      id: 'car-303',
      title: 'تويوتا كامري 2024',
      price: 8500,
      make: 'Toyota',
      model: 'Camry',
      year: 2024,
      images: [],
    }

    await render(
      <CarCard item={carItem} onPress={jest.fn()} />,
      { wrapper: createWrapper() }
    )

    const heartBtn = screen.getByTestId('listing-card-favorite')
    fireEvent.press(heartBtn)

    await waitFor(() => {
      expect(favoritesApi.add).toHaveBeenCalledTimes(1)
      expect(favoritesApi.add).toHaveBeenCalledWith('LISTING', 'car-303')
    })
  })

  it('UnifiedCard passes BUS_LISTING for bus category items', async () => {
    const busUnified: any = {
      id: 'uni-bus-1',
      title: 'حافلة مدرسية',
      category: 'buses',
      images: [],
    }

    await render(
      <UnifiedCard item={busUnified} onPress={jest.fn()} />,
      { wrapper: createWrapper() }
    )

    fireEvent.press(screen.getByTestId('listing-card-favorite'))
    await waitFor(() => {
      expect(favoritesApi.add).toHaveBeenCalledWith('BUS_LISTING', 'uni-bus-1')
    })
  })

  it('UnifiedCard passes EQUIPMENT_LISTING for equipment category items', async () => {
    const equipUnified: any = {
      id: 'uni-eq-2',
      title: 'رافعة شوكية',
      category: 'equipment',
      images: [],
    }

    await render(
      <UnifiedCard item={equipUnified} onPress={jest.fn()} />,
      { wrapper: createWrapper() }
    )

    fireEvent.press(screen.getByTestId('listing-card-favorite'))
    await waitFor(() => {
      expect(favoritesApi.add).toHaveBeenCalledWith('EQUIPMENT_LISTING', 'uni-eq-2')
    })
  })

  it('ListingCardBase handles failure by alerting and reverting favorite state without console.log', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
    ;(favoritesApi.add as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    const item: any = {
      id: 'fail-test-1',
      title: 'إعلان اختبار الفشل',
      isFavorite: false,
      images: [],
    }

    await render(
      <ListingCardBase item={item} title="إعلان اختبار" priceLabel="1000 ر.ع." favoriteType="LISTING" onPress={jest.fn()} />,
      { wrapper: createWrapper() }
    )

    const heartBtn = screen.getByTestId('listing-card-favorite')
    fireEvent.press(heartBtn)

    await waitFor(() => {
      expect(favoritesApi.add).toHaveBeenCalledWith('LISTING', 'fail-test-1')
      expect(dialogService.alert).toHaveBeenCalledWith(
        'خطأ',
        'تعذّر تحديث المفضلة، حاول مرة أخرى'
      )
    })

    expect(consoleLogSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('Error toggling favorite'),
      expect.anything()
    )

    consoleErrorSpy.mockRestore()
    consoleLogSpy.mockRestore()
  })

  it('ListingCardBase ignores duplicate presses while favorite request is in flight', async () => {
    let resolveApi: (val: any) => void = () => {}
    const slowPromise = new Promise((resolve) => {
      resolveApi = resolve
    })
    ;(favoritesApi.add as jest.Mock).mockReturnValue(slowPromise)

    const item: any = {
      id: 'flight-1',
      title: 'إعلان تحت الطلب',
      images: [],
    }

    const { getByTestId } = await render(
      <ListingCardBase
        item={item}
        title="إعلان تحت الطلب"
        priceLabel="2000 ر.ع."
        favoriteType="LISTING"
        onPress={jest.fn()}
      />,
      { wrapper: createWrapper() }
    )

    const heartBtn = getByTestId('listing-card-favorite')

    // Trigger rapid clicks directly on component handler without dangling RNTL act()
    heartBtn.props.onClick()
    heartBtn.props.onClick()
    heartBtn.props.onClick()

    expect(favoritesApi.add).toHaveBeenCalledTimes(1)

    await React.act(async () => {
      resolveApi({ data: { favorited: true } })
      await slowPromise
    })
  })

  it('unauthenticated press redirects to login and allows repeated redirect on subsequent press without latch lockup', async () => {
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
    expect(mockRouterPush).toHaveBeenCalledWith('/(auth)/login')
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
    expect(mockRouterPush).toHaveBeenCalledWith('/(auth)/login')
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
