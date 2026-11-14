import React from 'react'
import { renderHook, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { socketService } from '../../services/socket'
import {
  useMarkAllRead,
  useMarkNotificationRead,
  useDeleteNotification,
  useDeleteAllReadNotifications,
} from '../../hooks/useProfile'
import { useProfileOverview } from '../../hooks/useProfileOverview'
import { notificationsApi } from '../../api/notifications'
import { authApi } from '../../api/auth'
import { listingsApi } from '../../api/listings'
import { favoritesApi } from '../../api/favorites'
import { useToastStore } from '../../store/toastStore'
import { useAuthStore } from '../../store/authStore'
import { io } from 'socket.io-client'

jest.setTimeout(30000)

jest.mock('socket.io-client', () => {
  const mSocket = {
    connected: false,
    connect: jest.fn(),
    on: jest.fn(),
    once: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
  }
  const mIo = jest.fn(() => mSocket)
  return {
    io: mIo,
    Socket: jest.fn(),
  }
})

jest.mock('expo-router', () => {
  const { useEffect } = require('react')
  return {
    router: {
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
      canGoBack: jest.fn(() => true),
    },
    useFocusEffect: (cb: () => void) => {
      useEffect(() => {
        cb()
      }, [cb])
    },
  }
})

jest.mock('../../api/notifications', () => ({
  notificationsApi: {
    getAll: jest.fn(),
    readAll: jest.fn(),
    markRead: jest.fn(),
    deleteOne: jest.fn(),
    deleteAllRead: jest.fn(),
  },
}))

jest.mock('../../api/auth', () => ({
  authApi: {
    me: jest.fn(),
  },
}))

jest.mock('../../api/listings', () => ({
  listingsApi: {
    getMy: jest.fn(),
    getAll: jest.fn(),
    getById: jest.fn(),
  },
}))

jest.mock('../../api/favorites', () => ({
  favoritesApi: {
    getAll: jest.fn(),
  },
}))

jest.mock('../../api/locations', () => ({
  locationsApi: {
    getGovernorates: jest.fn().mockResolvedValue([]),
    getWilayas: jest.fn().mockResolvedValue([]),
  },
}))

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

function createWrapper(qc?: QueryClient) {
  const queryClient = qc ?? createQueryClient()
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('G6 / D-287: Socket Single-Flight, Mutation Toast Feedback, Profile Stale State', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useToastStore.setState({ current: null })
    useAuthStore.setState({
      user: {
        id: 'u1',
        phone: '96891234567',
        role: 'USER',
        username: 'ahmed',
        displayName: 'Ahmed',
        isVerified: true,
      } as any,
      token: 'test-token',
      isAuthenticated: true,
      isLoading: false,
    } as any)
  })

  describe('1. Socket Connect Single-Flight', () => {
    it('concurrent socketService.connect() calls return the identical promise/socket instance without creating duplicate sockets', async () => {
      socketService.disconnect()

      let socketInstanceCount = 0
      const mockedSocket: any = {
        connected: false,
        connect: jest.fn(() => {
          mockedSocket.connected = true
        }),
        on: jest.fn((event: string, cb: () => void): any => {
          if (event === 'connect') {
            setTimeout(() => {
              mockedSocket.connected = true
              cb()
            }, 10)
          }
          return mockedSocket
        }),
        once: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
        disconnect: jest.fn(() => {
          mockedSocket.connected = false
        }),
      }

      const mockedIo = io as unknown as jest.Mock
      mockedIo.mockImplementation(() => {
        socketInstanceCount++
        return mockedSocket
      })

      // Initiate 3 concurrent connect calls
      const p1 = socketService.connect()
      const p2 = socketService.connect()
      const p3 = socketService.connect()

      const [s1, s2, s3] = await Promise.all([p1, p2, p3])

      expect(s1).toBe(mockedSocket)
      expect(s2).toBe(mockedSocket)
      expect(s3).toBe(mockedSocket)
      expect(socketInstanceCount).toBe(1)
    })

    it('disconnecting clears connectPromise and allows clean subsequent connection', async () => {
      socketService.disconnect()

      const mockedSocket: any = {
        connected: false,
        connect: jest.fn(),
        on: jest.fn((event: string, cb: () => void): any => {
          if (event === 'connect') cb()
          return mockedSocket
        }),
        once: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
        disconnect: jest.fn(),
      }
      const mockedIo = io as unknown as jest.Mock
      mockedIo.mockImplementation(() => mockedSocket)

      await socketService.connect()
      socketService.disconnect()
      expect(socketService.getSocket()).toBeNull()

      const s2 = await socketService.connect()
      expect(s2).toBe(mockedSocket)
    })
  })

  describe('2. Notification Mutation Error Feedback (Toast)', () => {
    it('useMarkAllRead() displays error toast on mutation failure', async () => {
      ;(notificationsApi.readAll as jest.Mock).mockRejectedValueOnce(
        new AxiosError('Network Error', 'ERR_NETWORK')
      )

      const queryClient = createQueryClient()
      const hook = await renderHook(() => useMarkAllRead(), {
        wrapper: createWrapper(queryClient),
      })

      hook.result.current.mutate()

      await waitFor(() => {
        const toast = useToastStore.getState().current
        expect(toast).toBeTruthy()
        expect(toast?.kind).toBe('error')
        expect(toast?.title).toContain('تعذر الاتصال بالإنترنت')
      })
    })

    it('useMarkNotificationRead() displays error toast on mutation failure', async () => {
      ;(notificationsApi.markRead as jest.Mock).mockRejectedValueOnce(
        new Error('Failed to update')
      )

      const queryClient = createQueryClient()
      const hook = await renderHook(() => useMarkNotificationRead(), {
        wrapper: createWrapper(queryClient),
      })

      hook.result.current.mutate('notif-1')

      await waitFor(() => {
        const toast = useToastStore.getState().current
        expect(toast).toBeTruthy()
        expect(toast?.kind).toBe('error')
        expect(toast?.title).toContain('تعذر تحديث حالة الإشعار')
      })
    })

    it('useDeleteNotification() displays error toast on mutation failure', async () => {
      ;(notificationsApi.deleteOne as jest.Mock).mockRejectedValueOnce(
        new Error('Delete error')
      )

      const queryClient = createQueryClient()
      const hook = await renderHook(() => useDeleteNotification(), {
        wrapper: createWrapper(queryClient),
      })

      hook.result.current.mutate('notif-99')

      await waitFor(() => {
        const toast = useToastStore.getState().current
        expect(toast).toBeTruthy()
        expect(toast?.kind).toBe('error')
        expect(toast?.title).toContain('تعذر حذف الإشعار')
      })
    })

    it('useDeleteAllReadNotifications() displays error toast on mutation failure', async () => {
      ;(notificationsApi.deleteAllRead as jest.Mock).mockRejectedValueOnce(
        new Error('Server 500')
      )

      const queryClient = createQueryClient()
      const hook = await renderHook(() => useDeleteAllReadNotifications(), {
        wrapper: createWrapper(queryClient),
      })

      hook.result.current.mutate()

      await waitFor(() => {
        const toast = useToastStore.getState().current
        expect(toast).toBeTruthy()
        expect(toast?.kind).toBe('error')
        expect(toast?.title).toContain('تعذر حذف الإشعارات المقروءة')
      })
    })
  })

  describe('3. Profile Overview Stale State & Retry', () => {
    it('sets isStaleError=true when authApi.me() fails on focus', async () => {
      ;(authApi.me as jest.Mock).mockRejectedValue(new Error('Network error'))
      ;(listingsApi.getMy as jest.Mock).mockResolvedValue({ data: [] })
      ;(favoritesApi.getAll as jest.Mock).mockResolvedValue({ data: [] })

      const queryClient = createQueryClient()
      const hook = await renderHook(() => useProfileOverview(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(hook.result.current.isStaleError).toBe(true)
      })

      // Verify retry resets stale error when subsequent attempt succeeds
      ;(authApi.me as jest.Mock).mockResolvedValue({
        data: { user: { id: 'u1', username: 'ahmed_updated' } },
      })

      await hook.result.current.handleRetryProfile()

      await waitFor(() => {
        expect(hook.result.current.isStaleError).toBe(false)
      })
    })

    it('sets isStaleError=true when useMyListings query fails', async () => {
      ;(authApi.me as jest.Mock).mockResolvedValue({
        data: { user: { id: 'u1', username: 'ahmed' } },
      })
      ;(listingsApi.getMy as jest.Mock).mockRejectedValue(new Error('Failed listings'))
      ;(favoritesApi.getAll as jest.Mock).mockResolvedValue({ data: [] })

      const queryClient = createQueryClient()
      const hook = await renderHook(() => useProfileOverview(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(hook.result.current.isStaleError).toBe(true)
      })
    })
  })
})
