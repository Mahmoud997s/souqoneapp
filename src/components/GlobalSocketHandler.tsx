import { useEffect } from 'react'
import { AppState, AppStateStatus } from 'react-native'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { socketService } from '../services/socket'
import { CHAT_ROOMS_QUERY_KEY } from '../hooks/useChat'
import { NOTIFICATIONS_QUERY_KEY, UNREAD_NOTIFICATIONS_COUNT_QUERY_KEY } from '../hooks/useProfile'

export function isChatNotificationPayload(payload: unknown): boolean {
  if (!payload || typeof payload !== 'object') return false
  const record = payload as Record<string, unknown>
  const nested =
    record.notification && typeof record.notification === 'object'
      ? (record.notification as Record<string, unknown>)
      : null
  const rawType =
    typeof record.type === 'string'
      ? record.type
      : typeof nested?.type === 'string'
        ? nested.type
        : undefined
  return rawType?.toUpperCase() === 'MESSAGE'
}

export function GlobalSocketHandler() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const queryClient = useQueryClient()

  // AppState for socket reconnection & single catch-up refetch on foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (!isLoggedIn) return
      if (nextAppState === 'active') {
        void socketService.connect()
        void queryClient.invalidateQueries({ queryKey: CHAT_ROOMS_QUERY_KEY })
        void queryClient.invalidateQueries({ queryKey: UNREAD_NOTIFICATIONS_COUNT_QUERY_KEY })
        void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY })
      } else if (nextAppState === 'background') {
        socketService.disconnect()
      }
    })
    return () => subscription.remove()
  }, [isLoggedIn, queryClient])

  useEffect(() => {
    if (!isLoggedIn) {
      socketService.disconnect()
      return
    }

    // Chat messages arrive on the 'message' socket event via ChatSyncService; 'notification' carries a notification record without a message payload.
    const handleReconnect = () => {
      void queryClient.invalidateQueries({ queryKey: CHAT_ROOMS_QUERY_KEY })
    }

    const handleNotification = (payload: unknown) => {
      if (isChatNotificationPayload(payload)) return
      void queryClient.invalidateQueries({ queryKey: UNREAD_NOTIFICATIONS_COUNT_QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY })
    }

    socketService.listen('connect', handleReconnect)
    socketService.listen('notification', handleNotification)
    void socketService.connect()

    return () => {
      socketService.off('connect', handleReconnect)
      socketService.off('notification', handleNotification)
    }
  }, [isLoggedIn, queryClient])

  return null
}
