import React from 'react'
import { render, fireEvent, waitFor, act } from '@testing-library/react-native'
import { renderHook } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { useNotifications } from '../../hooks/useProfile'
import NotificationsScreen from '../../../app/profile/notifications'
import { notificationsApi } from '../../api/notifications'

jest.setTimeout(30000)

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}))

jest.mock('react-native-gesture-handler', () => {
  const { View } = require('react-native')
  return {
    Swipeable: ({ children }: any) => <View>{children}</View>,
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

jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(),
  notificationAsync: jest.fn(),
  impactAsync: jest.fn(),
  NotificationFeedbackType: { Success: 'success' },
  ImpactFeedbackStyle: { Light: 'light' },
}))

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}))

jest.mock('react-native-reanimated', () => {
  const reanimated = require('react-native-reanimated/mock')
  return {
    ...reanimated,
    FadeInDown: {
      delay: () => ({ springify: () => ({ damping: () => ({}) }) }),
      duration: () => ({}),
    },
    Layout: { springify: () => ({}) },
    useSharedValue: jest.fn((init) => ({ value: init })),
    useAnimatedStyle: jest.fn((cb) => cb()),
    withTiming: jest.fn((val) => val),
    withRepeat: jest.fn((val) => val),
    withSequence: jest.fn((val) => val),
    Easing: { out: jest.fn(() => ({})), quad: {} },
  }
})

jest.mock('../../components/ui/AppHeader', () => ({
  AppHeader: ({ title }: any) => {
    const { Text } = require('react-native')
    return <Text testID="mock-app-header">{title}</Text>
  },
}))

function createWrapper(customClient?: QueryClient) {
  const queryClient =
    customClient ??
    new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: Infinity,
        },
      },
    })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('Notifications Error & Stale States (R7-1)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('useNotifications envelope handling', () => {
    it('parses { items, meta }, legacy { data }, plain array, and throws on corrupt envelope', async () => {
      ;(notificationsApi.getAll as jest.Mock).mockResolvedValueOnce({
        data: {
          items: [{ id: 'notif-1', title: 'إشعار جديد', type: 'system', isRead: false, createdAt: new Date().toISOString() }],
          meta: { total: 10, page: 1, limit: 15, totalPages: 2 },
        },
      })

      const hook1 = await renderHook(() => useNotifications(), { wrapper: createWrapper() })
      await waitFor(() => {
        expect(hook1.result.current.isSuccess).toBe(true)
      })
      expect(hook1.result.current.data?.pages?.[0]?.items?.[0]?.id).toBe('notif-1')

      ;(notificationsApi.getAll as jest.Mock).mockResolvedValueOnce({
        data: {
          data: [{ id: 'notif-2', title: 'إشعار 2', type: 'system', isRead: true, createdAt: new Date().toISOString() }],
        },
      })
      const hook2 = await renderHook(() => useNotifications(), { wrapper: createWrapper() })
      await waitFor(() => {
        expect(hook2.result.current.isSuccess).toBe(true)
      })
      expect(hook2.result.current.data?.pages?.[0]?.items?.[0]?.id).toBe('notif-2')

      ;(notificationsApi.getAll as jest.Mock).mockResolvedValueOnce({
        data: [{ id: 'notif-3', title: 'إشعار 3', type: 'system', isRead: false, createdAt: new Date().toISOString() }],
      })
      const hook3 = await renderHook(() => useNotifications(), { wrapper: createWrapper() })
      await waitFor(() => {
        expect(hook3.result.current.isSuccess).toBe(true)
      })
      expect(hook3.result.current.data?.pages?.[0]?.items?.[0]?.id).toBe('notif-3')

      ;(notificationsApi.getAll as jest.Mock).mockResolvedValueOnce({
        data: { corruptContract: true },
      })
      const hook4 = await renderHook(() => useNotifications(), { wrapper: createWrapper() })
      await waitFor(() => {
        expect(hook4.result.current.isError).toBe(true)
      })
    })
  })

  describe('NotificationsScreen (app/profile/notifications.tsx)', () => {
    it('renders classified empty error state with retry on initial failure', async () => {
      ;(notificationsApi.getAll as jest.Mock).mockRejectedValueOnce(new AxiosError('Network Error', 'ERR_NETWORK'))

      const Wrapper = createWrapper()
      const screen = await render(
        <Wrapper>
          <NotificationsScreen />
        </Wrapper>
      )

      await waitFor(() => {
        expect(screen.getByTestId('notifications-error-state')).toBeTruthy()
      })
      expect(screen.getByText('لا يوجد اتصال بالإنترنت')).toBeTruthy()

      ;(notificationsApi.getAll as jest.Mock).mockResolvedValue({
        data: {
          items: [{ id: 'n-ok', title: 'تم تفعيل حسابك', type: 'system', isRead: true, createdAt: new Date().toISOString() }],
          meta: { total: 1, page: 1, limit: 15, totalPages: 1 },
        },
      })

      fireEvent.press(screen.getByTestId('notifications-retry-btn'))

      await waitFor(() => {
        expect(notificationsApi.getAll).toHaveBeenCalledTimes(2)
      })
    })

    it('mounts StaleDataBanner above cached notifications when refetch fails', async () => {
      const mockGetAll = notificationsApi.getAll as jest.Mock
      mockGetAll.mockReset()
      mockGetAll.mockResolvedValue({
        data: {
          items: [{ id: 'n-cached', title: 'تم استلام دفعتك', type: 'system', isRead: false, createdAt: new Date().toISOString() }],
          meta: { total: 1, page: 1, limit: 15, totalPages: 1 },
        },
      })

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false, gcTime: Infinity } },
      })

      const screen = await render(
        <QueryClientProvider client={queryClient}>
          <NotificationsScreen />
        </QueryClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('تم استلام دفعتك')).toBeTruthy()
      })

      // Refetch fails while keeping cache
      mockGetAll.mockRejectedValue(
        new AxiosError('Server Error', 'ERR_BAD_RESPONSE', undefined, undefined, { status: 500 } as any)
      )

      await act(async () => {
        await queryClient.refetchQueries({ queryKey: ['notifications'] })
      })

      await waitFor(() => {
        expect(screen.getByTestId('notifications-stale-banner')).toBeTruthy()
        expect(screen.getByTestId('stale-data-banner')).toBeTruthy()
      })
    })
  })
})
