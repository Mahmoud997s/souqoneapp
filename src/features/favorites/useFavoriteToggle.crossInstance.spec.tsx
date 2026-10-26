import React from 'react'
import { View, TouchableOpacity, Text } from 'react-native'
import { render, screen, fireEvent, waitFor, act, cleanup } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useFavoriteToggle } from './useFavoriteToggle'
import { FAVORITE_IDS_QUERY_KEY } from './useFavoriteIds'
import { favoritesApi } from '../../api/favorites'
import { useAuthStore } from '../../store/authStore'
import { useToastStore } from '../../store/toastStore'

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

jest.mock('../../api/favorites', () => ({
  favoritesApi: {
    add: jest.fn(),
    ids: jest.fn(),
    check: jest.fn(),
  },
}))

jest.mock('../../store/dialogStore', () => ({
  dialogService: {
    alert: jest.fn(),
  },
}))

function TwoHeartsHarness({
  entityType = 'BUS_LISTING',
  id = 'bus-777',
  initialIsFavorite = false,
}: {
  entityType?: string
  id?: string
  initialIsFavorite?: boolean
}) {
  const card = useFavoriteToggle(entityType, id, initialIsFavorite, { title: 'Card Item' })
  const detail = useFavoriteToggle(entityType, id, initialIsFavorite, { title: 'Detail Item' })

  return (
    <View>
      <TouchableOpacity testID="card-fav-btn" onPress={card.toggle}>
        <Text testID="card-fav-status">{card.isFavorite ? 'FAVORITED' : 'UNFAVORITED'}</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="detail-fav-btn" onPress={detail.toggle}>
        <Text testID="detail-fav-status">{detail.isFavorite ? 'FAVORITED' : 'UNFAVORITED'}</Text>
      </TouchableOpacity>
    </View>
  )
}

function FiveHeartsHarness() {
  const h1 = useFavoriteToggle('BUS_LISTING', 'bus-1', false)
  const h2 = useFavoriteToggle('BUS_LISTING', 'bus-2', false)
  const h3 = useFavoriteToggle('BUS_LISTING', 'bus-3', false)
  const h4 = useFavoriteToggle('BUS_LISTING', 'bus-4', false)
  const h5 = useFavoriteToggle('BUS_LISTING', 'bus-5', false)

  return (
    <View>
      <Text testID="h1">{h1.isFavorite ? 'FAV' : 'NOT'}</Text>
      <Text testID="h2">{h2.isFavorite ? 'FAV' : 'NOT'}</Text>
      <Text testID="h3">{h3.isFavorite ? 'FAV' : 'NOT'}</Text>
      <Text testID="h4">{h4.isFavorite ? 'FAV' : 'NOT'}</Text>
      <Text testID="h5">{h5.isFavorite ? 'FAV' : 'NOT'}</Text>
    </View>
  )
}

describe('useFavoriteToggle cross-instance synchronization (D-092e)', () => {
  let queryClient: QueryClient
  let serverFavoriteSet: Set<string>

  beforeEach(() => {
    jest.clearAllMocks()
    useToastStore.setState({ current: null })
    useAuthStore.setState({ isLoggedIn: true })
    serverFavoriteSet = new Set<string>()

    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false },
      },
    })

    ;(favoritesApi.ids as jest.Mock).mockImplementation(async () => {
      return { data: Array.from(serverFavoriteSet) }
    })

    ;(favoritesApi.check as jest.Mock).mockImplementation(async (type: string, id: string) => {
      const key = `${type}:${id}`
      return { data: { favorited: serverFavoriteSet.has(key) } }
    })

    ;(favoritesApi.add as jest.Mock).mockImplementation(async (type: string, id: string) => {
      const key = `${type}:${id}`
      if (serverFavoriteSet.has(key)) {
        serverFavoriteSet.delete(key)
        return { data: { favorited: false } }
      } else {
        serverFavoriteSet.add(key)
        return { data: { favorited: true } }
      }
    })
  })

  afterEach(() => {
    queryClient.clear()
    cleanup()
  })

  it('card toggles ON, settles; then detail toggles OFF -> both instances must show UNFAVORITED', async () => {
    await render(
      <QueryClientProvider client={queryClient}>
        <TwoHeartsHarness initialIsFavorite={false} />
      </QueryClientProvider>
    )

    expect(screen.getByTestId('card-fav-status').props.children).toBe('UNFAVORITED')
    expect(screen.getByTestId('detail-fav-status').props.children).toBe('UNFAVORITED')

    // 1. Card toggles ON
    await act(async () => {
      fireEvent.press(screen.getByTestId('card-fav-btn'))
    })

    // Settle card toggle
    await waitFor(() => {
      expect(screen.getByTestId('card-fav-status').props.children).toBe('FAVORITED')
      expect(screen.getByTestId('detail-fav-status').props.children).toBe('FAVORITED')
    })

    // 2. Detail toggles OFF
    await act(async () => {
      fireEvent.press(screen.getByTestId('detail-fav-btn'))
    })

    // Settle detail toggle: Card MUST NOT stay stuck on FAVORITED
    await waitFor(() => {
      expect(screen.getByTestId('detail-fav-status').props.children).toBe('UNFAVORITED')
      expect(screen.getByTestId('card-fav-status').props.children).toBe('UNFAVORITED')
    })
  })

  it('reverse: detail toggles ON, settles; then card toggles OFF -> both instances must show UNFAVORITED', async () => {
    await render(
      <QueryClientProvider client={queryClient}>
        <TwoHeartsHarness initialIsFavorite={false} />
      </QueryClientProvider>
    )

    expect(screen.getByTestId('card-fav-status').props.children).toBe('UNFAVORITED')
    expect(screen.getByTestId('detail-fav-status').props.children).toBe('UNFAVORITED')

    // 1. Detail toggles ON
    await act(async () => {
      fireEvent.press(screen.getByTestId('detail-fav-btn'))
    })

    await waitFor(() => {
      expect(screen.getByTestId('detail-fav-status').props.children).toBe('FAVORITED')
      expect(screen.getByTestId('card-fav-status').props.children).toBe('FAVORITED')
    })

    // 2. Card toggles OFF
    await act(async () => {
      fireEvent.press(screen.getByTestId('card-fav-btn'))
    })

    await waitFor(() => {
      expect(screen.getByTestId('card-fav-status').props.children).toBe('UNFAVORITED')
      expect(screen.getByTestId('detail-fav-status').props.children).toBe('UNFAVORITED')
    })
  })

  it('shared in-flight state: toggling in one instance shows new state during in-flight period too', async () => {
    let resolveAdd!: (val: unknown) => void
    ;(favoritesApi.add as jest.Mock).mockImplementationOnce(
      () =>
        new Promise((res) => {
          resolveAdd = res
        })
    )

    await render(
      <QueryClientProvider client={queryClient}>
        <TwoHeartsHarness initialIsFavorite={false} />
      </QueryClientProvider>
    )

    // Wait for initial ids query to finish so background query doesn't overwrite optimistic write
    await waitFor(() => {
      expect(queryClient.getQueryData(FAVORITE_IDS_QUERY_KEY)).toBeDefined()
    })

    // Trigger toggle
    await act(async () => {
      fireEvent.press(screen.getByTestId('card-fav-btn'))
    })

    // During in-flight, shared cache write updates both instances
    expect(screen.getByTestId('card-fav-status').props.children).toBe('FAVORITED')
    expect(screen.getByTestId('detail-fav-status').props.children).toBe('FAVORITED')

    // Resolve server with confirmed favorite
    serverFavoriteSet.add('BUS_LISTING:bus-777')
    await act(async () => {
      resolveAdd({ data: { favorited: true } })
    })

    await waitFor(() => {
      expect(screen.getByTestId('card-fav-status').props.children).toBe('FAVORITED')
      expect(screen.getByTestId('detail-fav-status').props.children).toBe('FAVORITED')
    })
  })

  it('Defect 2 teeth: mounting 5 hearts calls favoritesApi.check 0 times and favoritesApi.ids at most once', async () => {
    await render(
      <QueryClientProvider client={queryClient}>
        <FiveHeartsHarness />
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('h1')).toBeTruthy()
    })

    expect(favoritesApi.check).toHaveBeenCalledTimes(0)
    expect(favoritesApi.ids).toHaveBeenCalledTimes(1)
  })
})
