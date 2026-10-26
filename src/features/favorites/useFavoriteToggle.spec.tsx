import React from 'react'
import { View, TouchableOpacity, Text } from 'react-native'
import { render, screen, fireEvent, waitFor, act, cleanup } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useFavoriteToggle } from './useFavoriteToggle'
import { FAVORITE_IDS_QUERY_KEY } from './useFavoriteIds'
import { favoritesApi } from '../../api/favorites'
import { useAuthStore } from '../../store/authStore'
import { dialogService } from '../../store/dialogStore'
import { useToastStore } from '../../store/toastStore'

const mockPush = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
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

function TestToggleHarness({
  entityType = 'BUS_LISTING',
  id = 'bus-777',
  initialIsFavorite = false,
  title = 'حافلة مرسيدس 2024',
}: {
  entityType?: string
  id?: string
  initialIsFavorite?: boolean
  title?: string
}) {
  const { isFavorite, isBusy, toggle } = useFavoriteToggle(
    entityType,
    id,
    initialIsFavorite,
    { title }
  )

  return (
    <View>
      <TouchableOpacity testID="fav-btn" onPress={toggle}>
        <Text testID="fav-status">{isFavorite ? 'FAVORITED' : 'UNFAVORITED'}</Text>
        <Text testID="busy-status">{isBusy ? 'BUSY' : 'IDLE'}</Text>
      </TouchableOpacity>
    </View>
  )
}

describe('useFavoriteToggle (Feature Module)', () => {
  let queryClient: QueryClient
  let serverSet: Set<string>

  beforeEach(() => {
    jest.clearAllMocks()
    mockPush.mockClear()
    useToastStore.setState({ current: null })
    useAuthStore.setState({ isLoggedIn: true })
    serverSet = new Set<string>()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false },
      },
    })
    ;(favoritesApi.ids as jest.Mock).mockImplementation(async () => ({
      data: Array.from(serverSet),
    }))
    ;(favoritesApi.check as jest.Mock).mockResolvedValue({ data: { favorited: false } })
  })

  afterEach(() => {
    queryClient.clear()
    cleanup()
  })

  it('optimistically adds key to cache and shows success toast after server confirmation', async () => {
    let resolveAdd: (val: any) => void = () => {}
    ;(favoritesApi.add as jest.Mock).mockReturnValue(
      new Promise((res) => {
        resolveAdd = res
      })
    )

    await render(
      <QueryClientProvider client={queryClient}>
        <TestToggleHarness initialIsFavorite={false} />
      </QueryClientProvider>
    )

    expect(screen.getByText('UNFAVORITED')).toBeTruthy()

    // Tap to add
    await act(async () => {
      fireEvent.press(screen.getByTestId('fav-btn'))
    })

    // Optimistic flip to FAVORITED & BUSY
    expect(screen.getByText('FAVORITED')).toBeTruthy()
    expect(screen.getByText('BUSY')).toBeTruthy()

    // Cache updated optimistically
    const cachedIds = queryClient.getQueryData<Set<string>>(FAVORITE_IDS_QUERY_KEY)
    expect(cachedIds?.has('BUS_LISTING:bus-777')).toBe(true)

    // No toast yet before server confirms
    expect(useToastStore.getState().current).toBeNull()

    // Server confirms addition
    serverSet.add('BUS_LISTING:bus-777')
    await act(async () => {
      resolveAdd({ data: { favorited: true } })
    })

    await waitFor(() => {
      expect(screen.getByText('IDLE')).toBeTruthy()
    })
    expect(screen.getByText('FAVORITED')).toBeTruthy()

    // Success toast shown with title
    const currentToast = useToastStore.getState().current
    expect(currentToast).not.toBeNull()
    expect(currentToast?.kind).toBe('success')
    expect(currentToast?.title).toBe('تمت إضافة الإعلان إلى المفضلة')
    expect(currentToast?.message).toBe('حافلة مرسيدس 2024')
    expect(favoritesApi.add).toHaveBeenCalledTimes(1)
  })

  it('optimistically removes key from cache and shows removal toast after server confirmation', async () => {
    // Seed ids cache with bus-777
    serverSet.add('BUS_LISTING:bus-777')
    queryClient.setQueryData<Set<string>>(
      FAVORITE_IDS_QUERY_KEY,
      new Set(['BUS_LISTING:bus-777'])
    )

    let resolveAdd: (val: any) => void = () => {}
    ;(favoritesApi.add as jest.Mock).mockReturnValue(
      new Promise((res) => {
        resolveAdd = res
      })
    )

    await render(
      <QueryClientProvider client={queryClient}>
        <TestToggleHarness initialIsFavorite={true} />
      </QueryClientProvider>
    )

    expect(screen.getByText('FAVORITED')).toBeTruthy()

    // Tap to remove
    await act(async () => {
      fireEvent.press(screen.getByTestId('fav-btn'))
    })

    // Optimistic flip to UNFAVORITED
    expect(screen.getByText('UNFAVORITED')).toBeTruthy()
    const cachedIds = queryClient.getQueryData<Set<string>>(FAVORITE_IDS_QUERY_KEY)
    expect(cachedIds?.has('BUS_LISTING:bus-777')).toBe(false)

    // Server confirms removal
    serverSet.delete('BUS_LISTING:bus-777')
    await act(async () => {
      resolveAdd({ data: { favorited: false } })
    })

    await waitFor(() => {
      expect(screen.getByText('IDLE')).toBeTruthy()
    })

    const currentToast = useToastStore.getState().current
    expect(currentToast).not.toBeNull()
    expect(currentToast?.kind).toBe('neutral')
    expect(currentToast?.title).toBe('تمت إزالة الإعلان من المفضلة')
    expect(currentToast?.message).toBe('حافلة مرسيدس 2024')
  })

  it('rolls back state, displays Arabic error alert, and shows NO toast on API error', async () => {
    let rejectAdd: (err: any) => void = () => {}
    ;(favoritesApi.add as jest.Mock).mockReturnValue(
      new Promise((_, rej) => {
        rejectAdd = rej
      })
    )

    await render(
      <QueryClientProvider client={queryClient}>
        <TestToggleHarness initialIsFavorite={false} />
      </QueryClientProvider>
    )

    await act(async () => {
      fireEvent.press(screen.getByTestId('fav-btn'))
    })

    expect(screen.getByText('FAVORITED')).toBeTruthy()
    expect(screen.getByText('BUSY')).toBeTruthy()

    // API fails
    await act(async () => {
      rejectAdd(new Error('Network error'))
    })

    await waitFor(() => {
      expect(screen.getByText('IDLE')).toBeTruthy()
      expect(screen.getByText('UNFAVORITED')).toBeTruthy()
    })

    // Rollback confirmed
    const cachedIds = queryClient.getQueryData<Set<string>>(FAVORITE_IDS_QUERY_KEY)
    expect(cachedIds?.has('BUS_LISTING:bus-777')).toBe(false)

    // Alert called once
    expect(dialogService.alert).toHaveBeenCalledWith(
      'خطأ',
      'تعذّر تحديث المفضلة، حاول مرة أخرى'
    )

    // NO toast on error
    expect(useToastStore.getState().current).toBeNull()
  })

  it('ignores duplicate presses while in-flight', async () => {
    let resolveAdd: (val: any) => void = () => {}
    ;(favoritesApi.add as jest.Mock).mockReturnValue(
      new Promise((res) => {
        resolveAdd = res
      })
    )

    await render(
      <QueryClientProvider client={queryClient}>
        <TestToggleHarness initialIsFavorite={false} />
      </QueryClientProvider>
    )

    // Tap once
    await act(async () => {
      fireEvent.press(screen.getByTestId('fav-btn'))
    })
    expect(favoritesApi.add).toHaveBeenCalledTimes(1)

    // Rapid second tap
    await act(async () => {
      fireEvent.press(screen.getByTestId('fav-btn'))
    })
    expect(favoritesApi.add).toHaveBeenCalledTimes(1)

    // Resolve API
    await act(async () => {
      resolveAdd({ data: { favorited: true } })
    })

    await waitFor(() => {
      expect(screen.getByText('IDLE')).toBeTruthy()
    })
  })

  it('redirects guest to login without modifying cache or calling API', async () => {
    useAuthStore.setState({ isLoggedIn: false })

    await render(
      <QueryClientProvider client={queryClient}>
        <TestToggleHarness initialIsFavorite={false} />
      </QueryClientProvider>
    )

    await act(async () => {
      fireEvent.press(screen.getByTestId('fav-btn'))
    })

    expect(favoritesApi.add).not.toHaveBeenCalled()
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining('/(auth)/login')
    )
    expect(useToastStore.getState().current).toBeNull()
  })
})
