import React from 'react'
import { renderHook, waitFor, cleanup } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useFavoriteIds } from './useFavoriteIds'
import { favoritesApi } from '../../api/favorites'
import { useAuthStore } from '../../store/authStore'

jest.mock('../../api/favorites', () => ({
  favoritesApi: {
    ids: jest.fn(),
  },
}))

describe('useFavoriteIds', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    jest.clearAllMocks()
    useAuthStore.setState({ isLoggedIn: false })
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    })
  })

  afterEach(() => {
    queryClient.clear()
    cleanup()
  })

  function createWrapper() {
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }

  it('is disabled and returns empty Set when logged out', async () => {
    const wrapper = createWrapper()
    const { result } = await renderHook(() => useFavoriteIds(), { wrapper })

    expect(result.current.ids).toBeInstanceOf(Set)
    expect(result.current.ids.size).toBe(0)
    expect(favoritesApi.ids).not.toHaveBeenCalled()
  })

  it('fetches IDs and parses into a Set when logged in', async () => {
    useAuthStore.setState({ isLoggedIn: true })
    ;(favoritesApi.ids as jest.Mock).mockResolvedValueOnce({
      data: ['BUS_LISTING:b1', 'LISTING:c1', 'EQUIPMENT_LISTING:eq9'],
    })

    const wrapper = createWrapper()
    const { result } = await renderHook(() => useFavoriteIds(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
      expect(result.current.ids.size).toBe(3)
    })

    expect(result.current.ids.has('BUS_LISTING:b1')).toBe(true)
    expect(result.current.ids.has('LISTING:c1')).toBe(true)
    expect(result.current.ids.has('EQUIPMENT_LISTING:eq9')).toBe(true)
    expect(result.current.ids.has('BUS_LISTING:other')).toBe(false)
    expect(favoritesApi.ids).toHaveBeenCalledTimes(1)
  })
})
