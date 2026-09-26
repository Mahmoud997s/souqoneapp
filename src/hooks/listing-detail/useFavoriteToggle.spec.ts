import React from 'react'
import { View, TouchableOpacity, Text } from 'react-native'
import { render, screen, fireEvent, waitFor, act, cleanup } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useFavoriteToggle } from './useFavoriteToggle'
import { favoritesApi } from '../../api/favorites'
import { useAuthStore } from '../../store/authStore'

const mockPush = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

jest.mock('../../api/favorites', () => ({
  favoritesApi: {
    add: jest.fn(),
    remove: jest.fn(),
  },
}))

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
}

function TestFavoriteHarness({
  entityType = 'LISTING',
  id = 'car-123',
  initialIsFavorite = false,
  redirectPath,
}: {
  entityType?: string
  id?: string
  initialIsFavorite?: boolean
  redirectPath?: string
}) {
  const { isFavorite, isBusy, toggle } = useFavoriteToggle(
    entityType,
    id,
    initialIsFavorite,
    redirectPath !== undefined ? { redirectPath } : {}
  )

  return React.createElement(
    View,
    null,
    React.createElement(
      TouchableOpacity,
      {
        testID: 'fav-btn',
        onPress: toggle,
      },
      React.createElement(Text, { testID: 'fav-status' }, isFavorite ? 'FAVORITED' : 'UNFAVORITED'),
      React.createElement(Text, { testID: 'busy-status' }, isBusy ? 'BUSY' : 'IDLE')
    )
  )
}

describe('useFavoriteToggle', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    jest.clearAllMocks()
    queryClient = createTestQueryClient()
    useAuthStore.setState({ isLoggedIn: true, user: { id: 'u1' } as any })
  })

  afterEach(() => {
    cleanup()
  })

  it('optimistic flip happens synchronously on toggle() and keeps state on success', async () => {
    let resolveApi: (value: any) => void = () => {}
    const apiPromise = new Promise((resolve) => {
      resolveApi = resolve
    })
    ;(favoritesApi.add as jest.Mock).mockReturnValue(apiPromise)
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries')

    await render(
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(TestFavoriteHarness, { initialIsFavorite: false })
      )
    )

    expect(screen.getByText('UNFAVORITED')).toBeTruthy()
    expect(screen.getByText('IDLE')).toBeTruthy()

    // Press toggle inside act to flush synchronous optimistic state update
    await act(async () => {
      fireEvent.press(screen.getByTestId('fav-btn'))
    })

    // Synchronous optimistic flip
    expect(screen.getByText('FAVORITED')).toBeTruthy()
    expect(screen.getByText('BUSY')).toBeTruthy()
    expect(favoritesApi.add).toHaveBeenCalledWith('LISTING', 'car-123')

    // Resolve API
    await act(async () => {
      resolveApi({ data: { success: true } })
    })

    // Await completion
    await waitFor(() => expect(screen.getByText('IDLE')).toBeTruthy())
    expect(screen.getByText('FAVORITED')).toBeTruthy()
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['favorites'] })
  })

  it('failure reverts to original state and resets busy status', async () => {
    let rejectApi: (error: any) => void = () => {}
    const apiPromise = new Promise((_, reject) => {
      rejectApi = reject
    })
    ;(favoritesApi.add as jest.Mock).mockReturnValue(apiPromise)

    await render(
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(TestFavoriteHarness, { initialIsFavorite: false })
      )
    )

    expect(screen.getByText('UNFAVORITED')).toBeTruthy()

    // Press toggle
    await act(async () => {
      fireEvent.press(screen.getByTestId('fav-btn'))
    })

    // Initially flips to FAVORITED and BUSY
    expect(screen.getByText('FAVORITED')).toBeTruthy()
    expect(screen.getByText('BUSY')).toBeTruthy()

    // Reject API
    await act(async () => {
      rejectApi(new Error('Network error'))
    })

    // After failure, reverts back to UNFAVORITED and IDLE
    await waitFor(() => expect(screen.getByText('UNFAVORITED')).toBeTruthy())
    expect(screen.getByText('IDLE')).toBeTruthy()
  })

  it('guest without explicit redirectPath defaults to /listings/${id} (backward-compat)', async () => {
    useAuthStore.setState({ isLoggedIn: false, user: null })

    await render(
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(TestFavoriteHarness, { initialIsFavorite: false })
      )
    )

    expect(screen.getByText('UNFAVORITED')).toBeTruthy()

    // Guest presses toggle
    await act(async () => {
      fireEvent.press(screen.getByTestId('fav-btn'))
    })

    // State is untouched
    expect(screen.getByText('UNFAVORITED')).toBeTruthy()
    expect(screen.getByText('IDLE')).toBeTruthy()

    // API was never called
    expect(favoritesApi.add).not.toHaveBeenCalled()

    // Routed to login with the default /listings/${id} path
    expect(mockPush).toHaveBeenCalledWith('/(auth)/login?redirect=%2Flistings%2Fcar-123')
  })

  it('guest with explicit redirectPath (/cars/${id}) is routed to that path — CarDetailScreen use case', async () => {
    useAuthStore.setState({ isLoggedIn: false, user: null })

    await render(
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(TestFavoriteHarness, {
          id: 'car-456',
          initialIsFavorite: false,
          redirectPath: '/cars/car-456',
        })
      )
    )

    await act(async () => {
      fireEvent.press(screen.getByTestId('fav-btn'))
    })

    // Must redirect to the NEW car detail route, not the old /listings route
    expect(mockPush).toHaveBeenCalledWith('/(auth)/login?redirect=%2Fcars%2Fcar-456')
    expect(favoritesApi.add).not.toHaveBeenCalled()
  })

  it('ignores subsequent toggle calls while busy', async () => {
    let resolveApi: (value: any) => void = () => {}
    const apiPromise = new Promise((resolve) => {
      resolveApi = resolve
    })
    ;(favoritesApi.add as jest.Mock).mockReturnValue(apiPromise)

    await render(
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(TestFavoriteHarness, { initialIsFavorite: false })
      )
    )

    // First press
    await act(async () => {
      fireEvent.press(screen.getByTestId('fav-btn'))
    })
    expect(screen.getByText('FAVORITED')).toBeTruthy()
    expect(screen.getByText('BUSY')).toBeTruthy()
    expect(favoritesApi.add).toHaveBeenCalledTimes(1)

    // Second press while busy -> should be ignored
    await act(async () => {
      fireEvent.press(screen.getByTestId('fav-btn'))
    })
    expect(favoritesApi.add).toHaveBeenCalledTimes(1)

    // Complete request
    await act(async () => {
      resolveApi({ data: { success: true } })
    })
    await waitFor(() => expect(screen.getByText('IDLE')).toBeTruthy())
  })
})
