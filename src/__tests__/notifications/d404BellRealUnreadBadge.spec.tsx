import React from 'react'
import { AccessibilityInfo, AppState } from 'react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, renderHook, waitFor } from '@testing-library/react-native'
import fs from 'fs'
import path from 'path'
import { AnimatedHeroHeader } from '../../components/ui/AnimatedHeroHeader'
import { GlobalSocketHandler } from '../../components/GlobalSocketHandler'
import { notificationsApi, UNREAD_COUNT_ALLOWED_PARAMS } from '../../api/notifications'
import { apiClient } from '../../api/client'
import {
  NOTIFICATIONS_QUERY_KEY,
  UNREAD_NOTIFICATIONS_COUNT_QUERY_KEY,
  useDeleteNotification,
  useMarkAllRead,
  useMarkNotificationRead,
  useUnreadNotificationsCount,
} from '../../hooks/useProfile'
import { useAuthStore } from '../../store/authStore'
import { socketService } from '../../services/socket'
import { isChatPushNotification } from '../../services/notifications'
import { clearAllUserData } from '../../utils/clearUserData'
import { queryClient as appQueryClient } from '../../api/queryClient'

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}))

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
  },
}))

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: { Light: 'light' },
}))

jest.mock('expo-blur', () => {
  const ReactLib = require('react')
  const { View } = require('react-native')
  return {
    BlurView: (props: Record<string, unknown>) =>
      ReactLib.createElement(View, { testID: 'mock-blur-view', ...props }),
  }
})

jest.mock('expo-image', () => {
  const ReactLib = require('react')
  const { View } = require('react-native')
  return {
    Image: (props: Record<string, unknown>) =>
      ReactLib.createElement(View, { testID: 'mock-expo-image', ...props }),
  }
})

jest.mock('@expo/vector-icons', () => {
  const ReactLib = require('react')
  const { View } = require('react-native')
  return {
    Ionicons: (props: { name: string }) =>
      ReactLib.createElement(View, { testID: `icon-Ionicons-${props.name}`, ...props }),
  }
})

function createWrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}

describe('D-404 — Bell Real Unread Badge & Live Updates', () => {
  let qc: QueryClient

  beforeEach(() => {
    qc = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: Infinity },
        mutations: { retry: false },
      },
    })
    jest.spyOn(AccessibilityInfo, 'isReduceTransparencyEnabled').mockResolvedValue(true)
    useAuthStore.setState({
      isLoggedIn: true,
      user: { id: 'user-1', name: 'Test User' } as any,
    })
  })

  afterEach(() => {
    qc.clear()
    appQueryClient.clear()
    jest.restoreAllMocks()
  })

  it('1. Bell UI: no badge at 0, "3" at 3, "99+" at 120, and accessibilityLabel updates with count', async () => {
    jest.spyOn(notificationsApi, 'getUnreadCount').mockResolvedValue({ data: { count: 0 } } as any)

    const view = await render(
      <QueryClientProvider client={qc}>
        <AnimatedHeroHeader title="سوق ون" onHeaderIconPress={jest.fn()} />
      </QueryClientProvider>
    )
    await act(async () => {})
    expect(view.queryByTestId('notification-bell-badge')).toBeNull()
    expect(view.getByTestId('hero-header-notification-btn').props.accessibilityLabel).toBe(
      'الإشعارات'
    )

    await view.rerender(
      <QueryClientProvider client={qc}>
        <AnimatedHeroHeader
          title="سوق ون"
          onHeaderIconPress={jest.fn()}
          headerIconBadgeCount={3}
        />
      </QueryClientProvider>
    )
    await act(async () => {})
    expect(view.getByTestId('notification-bell-badge')).toBeTruthy()
    expect(view.getByText('3')).toBeTruthy()
    expect(view.getByTestId('hero-header-notification-btn').props.accessibilityLabel).toBe(
      'الإشعارات، 3 غير مقروءة'
    )

    await view.rerender(
      <QueryClientProvider client={qc}>
        <AnimatedHeroHeader
          title="سوق ون"
          onHeaderIconPress={jest.fn()}
          headerIconBadgeCount={120}
        />
      </QueryClientProvider>
    )
    await act(async () => {})
    expect(view.getByText('99+')).toBeTruthy()
    expect(view.getByTestId('hero-header-notification-btn').props.accessibilityLabel).toBe(
      'الإشعارات، 120 غير مقروءة'
    )
    await view.unmount()
  })

  it('2. Contract: notificationsApi.getUnreadCount sends GET /notifications/unread-count with exactly { excludeChat: true } and skipErrorDialog: true', async () => {
    const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValue({ data: { count: 4 } } as any)

    await notificationsApi.getUnreadCount()

    expect(getSpy).toHaveBeenCalledTimes(1)
    const [url, config] = getSpy.mock.calls[0]
    expect(url).toBe('/notifications/unread-count')
    expect(config?.skipErrorDialog).toBe(true)
    const paramKeys = Object.keys((config?.params as Record<string, unknown>) ?? {})
    expect(paramKeys).toEqual([...UNREAD_COUNT_ALLOWED_PARAMS])
    expect((config?.params as Record<string, unknown>).excludeChat).toBe(true)
  })

  it('3. Silent failure: API error returns count 0 with skipErrorDialog: true and no dialog', async () => {
    const getSpy = jest
      .spyOn(apiClient, 'get')
      .mockRejectedValue(new Error('Network Error'))

    const { result, unmount } = await renderHook(() => useUnreadNotificationsCount(), {
      wrapper: createWrapper(qc),
    })

    await waitFor(() => {
      expect(getSpy).toHaveBeenCalled()
    })
    expect(getSpy.mock.calls[0][1]?.skipErrorDialog).toBe(true)
    expect(result.current).toBe(0)
    await unmount()
  })

  it('4. Socket notification event: SYSTEM triggers refetch, MESSAGE does NOT', async () => {
    const listeners = new Map<string, (...args: unknown[]) => void>()
    jest.spyOn(socketService, 'connect').mockResolvedValue({} as any)
    jest.spyOn(socketService, 'disconnect').mockImplementation(() => {})
    jest.spyOn(socketService, 'listen').mockImplementation((event, cb) => {
      listeners.set(event, cb as (...args: unknown[]) => void)
    })
    jest.spyOn(socketService, 'off').mockImplementation((event) => {
      listeners.delete(event)
    })

    const invalidateSpy = jest.spyOn(qc, 'invalidateQueries')

    const view = await render(
      <QueryClientProvider client={qc}>
        <GlobalSocketHandler />
      </QueryClientProvider>
    )
    await act(async () => {})

    const onNotification = listeners.get('notification')
    expect(onNotification).toBeDefined()

    // MESSAGE type must be ignored
    await act(async () => {
      onNotification?.({ id: 'n1', type: 'MESSAGE' })
    })
    expect(invalidateSpy).not.toHaveBeenCalledWith({
      queryKey: UNREAD_NOTIFICATIONS_COUNT_QUERY_KEY,
    })

    // SYSTEM type must trigger refetch of count + notifications
    await act(async () => {
      onNotification?.({ id: 'n2', type: 'SYSTEM' })
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: UNREAD_NOTIFICATIONS_COUNT_QUERY_KEY,
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: NOTIFICATIONS_QUERY_KEY,
    })
    await view.unmount()
  })

  it('5. Foreground push & AppState: non-chat push passes filter, chat push is excluded; AppState active refetches count', async () => {
    expect(isChatPushNotification({ type: 'SYSTEM' })).toBe(false)
    expect(isChatPushNotification(undefined)).toBe(false)
    expect(isChatPushNotification({ type: 'MESSAGE' })).toBe(true)
    expect(isChatPushNotification({ conversationId: 'conv-1' })).toBe(true)

    let appStateCb: ((state: string) => void) | undefined
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, cb) => {
      appStateCb = cb as (state: string) => void
      return { remove: jest.fn() } as any
    })
    jest.spyOn(socketService, 'connect').mockResolvedValue({} as any)
    jest.spyOn(socketService, 'disconnect').mockImplementation(() => {})
    jest.spyOn(socketService, 'listen').mockImplementation(() => {})
    jest.spyOn(socketService, 'off').mockImplementation(() => {})

    const invalidateSpy = jest.spyOn(qc, 'invalidateQueries')

    const view = await render(
      <QueryClientProvider client={qc}>
        <GlobalSocketHandler />
      </QueryClientProvider>
    )
    await act(async () => {})

    await act(async () => {
      appStateCb?.('active')
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: UNREAD_NOTIFICATIONS_COUNT_QUERY_KEY,
    })
    await view.unmount()
  })

  it('6. Mark-read / mark-all-read / delete never go below 0', async () => {
    jest.spyOn(notificationsApi, 'markRead').mockResolvedValue({} as any)
    jest.spyOn(notificationsApi, 'readAll').mockResolvedValue({} as any)
    jest.spyOn(notificationsApi, 'deleteOne').mockResolvedValue({} as any)

    qc.setQueryData(UNREAD_NOTIFICATIONS_COUNT_QUERY_KEY, 0)
    const { result, unmount } = await renderHook(
      () => ({
        markOne: useMarkNotificationRead(),
        del: useDeleteNotification(),
        markAll: useMarkAllRead(),
      }),
      { wrapper: createWrapper(qc) }
    )

    // Starting at 0: markRead keeps it at 0 (never -1)
    await act(async () => {
      await result.current.markOne.mutateAsync('n-missing')
    })
    expect(qc.getQueryData(UNREAD_NOTIFICATIONS_COUNT_QUERY_KEY)).toBe(0)

    // Starting at 2 with unread notification: markRead decrements to 1
    qc.setQueryData(UNREAD_NOTIFICATIONS_COUNT_QUERY_KEY, 2)
    qc.setQueryData(NOTIFICATIONS_QUERY_KEY, {
      pages: [{ items: [{ id: 'n-unread', isRead: false }], meta: { page: 1, totalPages: 1 } }],
      pageParams: [1],
    })
    await act(async () => {
      await result.current.markOne.mutateAsync('n-unread')
    })
    expect(qc.getQueryData(UNREAD_NOTIFICATIONS_COUNT_QUERY_KEY)).toBe(1)

    // Delete unread at 1 -> 0, delete again at 0 -> stays 0
    await act(async () => {
      await result.current.del.mutateAsync('n-unread-2')
    })
    expect(qc.getQueryData(UNREAD_NOTIFICATIONS_COUNT_QUERY_KEY)).toBe(0)

    // Mark all read sets count to 0
    qc.setQueryData(UNREAD_NOTIFICATIONS_COUNT_QUERY_KEY, 5)
    await act(async () => {
      await result.current.markAll.mutateAsync()
    })
    expect(qc.getQueryData(UNREAD_NOTIFICATIONS_COUNT_QUERY_KEY)).toBe(0)
    await unmount()
  })

  it('7. Logout clears the unread count so next user never sees stale count', async () => {
    jest.spyOn(notificationsApi, 'getUnreadCount').mockResolvedValue({ data: { count: 7 } } as any)
    appQueryClient.setQueryData(UNREAD_NOTIFICATIONS_COUNT_QUERY_KEY, 7)
    qc.setQueryData(UNREAD_NOTIFICATIONS_COUNT_QUERY_KEY, 7)

    const { result, unmount } = await renderHook(() => useUnreadNotificationsCount(), {
      wrapper: createWrapper(qc),
    })
    expect(result.current).toBe(7)

    await act(async () => {
      await clearAllUserData()
      useAuthStore.setState({ isLoggedIn: false, user: null })
    })

    expect(appQueryClient.getQueryData(UNREAD_NOTIFICATIONS_COUNT_QUERY_KEY)).toBeUndefined()
    expect(result.current).toBe(0)
    await unmount()
  })

  it('8. Regression guard: old always-on greenDot JSX/style no longer exists in AnimatedHeroHeader', () => {
    const heroHeaderPath = path.resolve(
      __dirname,
      '../../components/ui/AnimatedHeroHeader.tsx'
    )
    const source = fs.readFileSync(heroHeaderPath, 'utf8')
    expect(source).not.toContain('greenDot')
  })
})
