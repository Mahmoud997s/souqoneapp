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
    getAll: jest.fn(),
    check: jest.fn(),
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
    ;(favoritesApi.check as jest.Mock).mockResolvedValue({ data: { favorited: false } })
  })

  afterEach(() => {
    cleanup()
  })

  it('hydrated true shows favorite when logged in', async () => {
    ;(favoritesApi.check as jest.Mock).mockResolvedValue({ data: { favorited: true } })

    await render(
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(TestFavoriteHarness, { initialIsFavorite: false })
      )
    )

    await waitFor(() => expect(screen.getByText('FAVORITED')).toBeTruthy())
    expect(favoritesApi.check).toHaveBeenCalledWith('LISTING', 'car-123')
  })

  it('guest makes NO check call and remains at initial state', async () => {
    useAuthStore.setState({ isLoggedIn: false, user: null })

    await render(
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(TestFavoriteHarness, { initialIsFavorite: false })
      )
    )

    expect(screen.getByText('UNFAVORITED')).toBeTruthy()
    expect(favoritesApi.check).not.toHaveBeenCalled()
  })

  it('after check returns true, the first tap sends toggle once and flips to unfavorited', async () => {
    ;(favoritesApi.check as jest.Mock).mockResolvedValue({ data: { favorited: true } })
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

    // Wait for hydration to complete
    await waitFor(() => expect(screen.getByText('FAVORITED')).toBeTruthy())

    // Tap to toggle
    await act(async () => {
      fireEvent.press(screen.getByTestId('fav-btn'))
    })

    // Flips to UNFAVORITED and BUSY
    expect(screen.getByText('UNFAVORITED')).toBeTruthy()
    expect(screen.getByText('BUSY')).toBeTruthy()
    expect(favoritesApi.add).toHaveBeenCalledTimes(1)
    expect(favoritesApi.add).toHaveBeenCalledWith('LISTING', 'car-123')

    // Resolve API
    await act(async () => {
      resolveApi({ data: { favorited: false } })
    })

    await waitFor(() => expect(screen.getByText('IDLE')).toBeTruthy())
    expect(screen.getByText('UNFAVORITED')).toBeTruthy()
  })

  it('treats failed check query safely as unfavorited without throwing', async () => {
    ;(favoritesApi.check as jest.Mock).mockRejectedValue(new Error('500 Server Error'))

    await render(
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(TestFavoriteHarness, { initialIsFavorite: false })
      )
    )

    expect(screen.getByText('UNFAVORITED')).toBeTruthy()
    expect(screen.getByText('IDLE')).toBeTruthy()
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
      resolveApi({ data: { favorited: true } })
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

  it('guest with explicit redirectPath (/cars/${id}) is routed to that path â€” CarDetailScreen use case', async () => {
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
      resolveApi({ data: { favorited: true } })
    })
    await waitFor(() => expect(screen.getByText('IDLE')).toBeTruthy())
  })

  it('teeth test 1: preserves stable toggle callback identity across re-renders when props do not change', async () => {
    const capturedToggles: Array<() => void> = []

    function IdentityHarness({ count }: { count: number }) {
      const { toggle } = useFavoriteToggle('EQUIPMENT', 'eq-1', false)
      capturedToggles.push(toggle)
      return React.createElement(Text, { testID: 'count' }, String(count))
    }

    const { rerender } = await render(
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(IdentityHarness, { count: 1 })
      )
    )

    await act(async () => {
      rerender(
        React.createElement(
          QueryClientProvider,
          { client: queryClient },
          React.createElement(IdentityHarness, { count: 2 })
        )
      )
    })

    expect(capturedToggles.length).toBeGreaterThanOrEqual(2)
    // Toggle identity must remain strictly stable across re-renders
    expect(capturedToggles[0]).toBe(capturedToggles[capturedToggles.length - 1])
  })

  it('teeth test 2: resets hydration and favorite state when entity identity changes (id prop change)', async () => {
    ;(favoritesApi.check as jest.Mock).mockImplementation((_entity, id) => {
      if (id === 'item-A') return Promise.resolve({ data: { favorited: true } })
      if (id === 'item-B') return Promise.resolve({ data: { favorited: false } })
      return Promise.resolve({ data: { favorited: false } })
    })

    const { rerender } = await render(
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(TestFavoriteHarness, {
          entityType: 'EQUIPMENT',
          id: 'item-A',
          initialIsFavorite: false,
        })
      )
    )

    // item-A hydrates to FAVORITED
    await waitFor(() => expect(screen.getByText('FAVORITED')).toBeTruthy())
    expect(favoritesApi.check).toHaveBeenCalledWith('EQUIPMENT', 'item-A')

    // Now switch id to item-B with initialIsFavorite=false
    await act(async () => {
      rerender(
        React.createElement(
          QueryClientProvider,
          { client: queryClient },
          React.createElement(TestFavoriteHarness, {
            entityType: 'EQUIPMENT',
            id: 'item-B',
            initialIsFavorite: false,
          })
        )
      )
    })

    // Immediately resets to UNFAVORITED (item-B initial)
    expect(screen.getByText('UNFAVORITED')).toBeTruthy()

    // And check query runs for item-B
    await waitFor(() => {
      expect(favoritesApi.check).toHaveBeenCalledWith('EQUIPMENT', 'item-B')
    })
  })

  it('teeth test 3: user tap before slow check resolves wins and is not overwritten by late check response', async () => {
    let resolveCheck: (value: any) => void = () => {}
    const slowCheckPromise = new Promise((resolve) => {
      resolveCheck = resolve
    })
    ;(favoritesApi.check as jest.Mock).mockReturnValue(slowCheckPromise)

    let resolveAdd: (value: any) => void = () => {}
    const addPromise = new Promise((resolve) => {
      resolveAdd = resolve
    })
    ;(favoritesApi.add as jest.Mock).mockReturnValue(addPromise)

    await render(
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(TestFavoriteHarness, {
          entityType: 'EQUIPMENT',
          id: 'eq-race',
          initialIsFavorite: false,
        })
      )
    )

    expect(screen.getByText('UNFAVORITED')).toBeTruthy()

    // User taps immediately BEFORE check resolves
    await act(async () => {
      fireEvent.press(screen.getByTestId('fav-btn'))
    })

    // Flips optimistically to FAVORITED
    expect(screen.getByText('FAVORITED')).toBeTruthy()
    expect(screen.getByText('BUSY')).toBeTruthy()

    // Now slow check resolves with conflicting server state (favorited: false)
    await act(async () => {
      resolveCheck({ data: { favorited: false } })
    })

    // User's optimistic tap MUST STILL WIN — not overwritten to UNFAVORITED
    expect(screen.getByText('FAVORITED')).toBeTruthy()

    // Now complete the add/toggle API call
    await act(async () => {
      resolveAdd({ data: { favorited: true } })
    })

    await waitFor(() => expect(screen.getByText('IDLE')).toBeTruthy())
    expect(screen.getByText('FAVORITED')).toBeTruthy()
  })
})