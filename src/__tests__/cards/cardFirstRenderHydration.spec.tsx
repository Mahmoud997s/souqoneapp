import React from 'react'
import { render, screen, fireEvent, waitFor, cleanup, act } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BusCard } from '../../components/buses/BusCard'
import { EquipCard } from '../../components/cards/EquipCard'
import { CarCard } from '../../components/cars/CarCard'
import { UnifiedCard } from '../../components/cards/UnifiedCard'
import { DetailTopBar } from '../../components/listing-detail/DetailTopBar'
import { useFavoriteToggle } from '../../features/favorites/useFavoriteToggle'
import { FAVORITE_IDS_QUERY_KEY } from '../../features/favorites/useFavoriteIds'
import { favoritesApi } from '../../api/favorites'
import { useAuthStore } from '../../store/authStore'
import { Colors } from '../../constants/colors'
import { SharedValue } from 'react-native-reanimated'

jest.mock('@expo/vector-icons', () => {
  const React = require('react')
  const { View } = require('react-native')
  return {
    Ionicons: (props: any) =>
      React.createElement(View, { testID: `icon-${props.name}`, ...props }),
    MaterialCommunityIcons: (props: any) =>
      React.createElement(View, { testID: `m-icon-${props.name}`, ...props }),
  }
})

jest.mock('expo-image', () => ({
  Image: () => <></>,
}))

jest.mock('expo-blur', () => ({
  BlurView: ({ children }: any) => <>{children}</>,
}))

jest.mock('../../api/favorites', () => ({
  favoritesApi: {
    add: jest.fn().mockResolvedValue({ data: { favorited: true } }),
    ids: jest.fn().mockResolvedValue({ data: [] }),
    check: jest.fn().mockResolvedValue({ data: { favorited: false } }),
  },
}))

function createHarnessQueryClient(seededKeys: string[] = []) {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  })
  qc.setQueryData<Set<string>>(FAVORITE_IDS_QUERY_KEY, new Set(seededKeys))
  return qc
}

describe('First-Render Store Hydration & Cross-Screen Consistency (D-092d)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useAuthStore.setState({ isLoggedIn: true })
  })

  afterEach(() => {
    cleanup()
  })

  it('BusCard shows filled heart (Colors.error) on first render when in ids store', async () => {
    const queryClient = createHarnessQueryClient(['BUS_LISTING:bus-seeded-1'])
    await render(
      <QueryClientProvider client={queryClient}>
        <BusCard
          onPress={() => {}}
          item={{
            id: 'bus-seeded-1',
            title: 'حافلة تويوتا',
            busType: 'COASTER',
            capacity: 30,
            images: [],
          } as any}
        />
      </QueryClientProvider>
    )
    const icon = screen.getByTestId('icon-heart')
    expect(icon.props.color).toBe(Colors.error)
  })

  it('EquipCard shows filled heart (Colors.error) on first render when in ids store', async () => {
    const queryClient = createHarnessQueryClient(['EQUIPMENT_LISTING:eq-seeded-2'])
    await render(
      <QueryClientProvider client={queryClient}>
        <EquipCard
          onPress={() => {}}
          item={{
            id: 'eq-seeded-2',
            title: 'حفار كاتربيلر',
            equipmentType: 'EXCAVATOR',
            images: [],
          } as any}
        />
      </QueryClientProvider>
    )
    const icon = screen.getByTestId('icon-heart')
    expect(icon.props.color).toBe(Colors.error)
  })

  it('CarCard shows filled heart (Colors.error) on first render when in ids store', async () => {
    const queryClient = createHarnessQueryClient(['LISTING:car-seeded-3'])
    await render(
      <QueryClientProvider client={queryClient}>
        <CarCard
          onPress={() => {}}
          item={{
            id: 'car-seeded-3',
            title: 'كامري 2024',
            price: 9000,
            images: [],
          } as any}
        />
      </QueryClientProvider>
    )
    const icon = screen.getByTestId('icon-heart')
    expect(icon.props.color).toBe(Colors.error)
  })

  it('UnifiedCard (compact) shows filled heart (Colors.error) on first render when in ids store', async () => {
    const queryClient = createHarnessQueryClient(['BUS_LISTING:uni-seeded-4'])
    await render(
      <QueryClientProvider client={queryClient}>
        <UnifiedCard
          compact
          item={{
            id: 'uni-seeded-4',
            category: 'buses',
            title: 'حافلة سياحية',
            images: [],
          } as any}
        />
      </QueryClientProvider>
    )
    const icon = screen.getByTestId('icon-heart')
    expect(icon.props.color).toBe(Colors.error)
  })

  it('renders outline heart when key is NOT in ids store', async () => {
    const queryClient = createHarnessQueryClient([])
    await render(
      <QueryClientProvider client={queryClient}>
        <BusCard
          onPress={() => {}}
          item={{
            id: 'bus-unseeded-9',
            title: 'حافلة غير مفضلة',
            busType: 'COASTER',
            capacity: 30,
            images: [],
          } as any}
        />
      </QueryClientProvider>
    )
    expect(screen.getByTestId('icon-heart-outline')).toBeTruthy()
  })

  it('cross-screen consistency: toggling favorite on a card updates detail navbar heart through same QueryClient cache', async () => {
    let activeIds: string[] = []
    ;(favoritesApi.ids as jest.Mock).mockImplementation(async () => ({ data: activeIds }))
    ;(favoritesApi.add as jest.Mock).mockImplementation(async (type, id) => {
      activeIds = [`${type}:${id}`]
      return { data: { favorited: true } }
    })

    const queryClient = createHarnessQueryClient([])
    const mockScrollY = { value: 0 } as SharedValue<number>

    function CrossScreenTestContainer() {
      const detailToggle = useFavoriteToggle('BUS_LISTING', 'cross-bus-1')

      return (
        <>
          <BusCard
            onPress={() => {}}
            item={{
              id: 'cross-bus-1',
              title: 'حافلة الاختبار المشترك',
              busType: 'COASTER',
              capacity: 30,
              images: [],
            } as any}
          />
          <DetailTopBar
            onBack={jest.fn()}
            canFavorite={true}
            isFavorite={detailToggle.isFavorite}
            favoriteBusy={detailToggle.isBusy}
            onToggleFavorite={detailToggle.toggle}
          />
        </>
      )
    }

    await render(
      <QueryClientProvider client={queryClient}>
        <CrossScreenTestContainer />
      </QueryClientProvider>
    )

    // Initially outline heart on both card and detail navbar
    expect(screen.getAllByTestId('icon-heart-outline')).toHaveLength(2)

    // Tap heart on the card
    const cardFavBtn = screen.getByTestId('listing-card-favorite')
    await act(async () => {
      fireEvent.press(cardFavBtn)
    })

    // Both card and detail navbar flip to filled heart
    await waitFor(() => {
      expect(screen.getAllByTestId('icon-heart')).toHaveLength(2)
    })

    // Cache contains the key
    const currentSet = queryClient.getQueryData<Set<string>>(FAVORITE_IDS_QUERY_KEY)
    expect(currentSet?.has('BUS_LISTING:cross-bus-1')).toBe(true)
  })
})
