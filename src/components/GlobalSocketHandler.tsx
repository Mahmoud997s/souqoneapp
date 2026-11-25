import { useEffect } from 'react'
import { AppState, AppStateStatus } from 'react-native'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { socketService } from '../services/socket'
import { ChatSyncService, type SocketIncomingMessagePayload } from '../services/ChatSyncService'
import { CHAT_ROOMS_QUERY_KEY } from '../hooks/useChat'

export interface SocketNotificationEvent {
  type?: string
  payload?: SocketIncomingMessagePayload
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

    const handleNotification = (data: SocketNotificationEvent) => {
      if (data?.type === 'MESSAGE' || data?.type === 'NEW_MESSAGE') {
        const payload = data.payload ?? (data as unknown as SocketIncomingMessagePayload)
        ChatSyncService.handleIncomingMessage(payload)
      }
    }

    const handleReconnect = () => {
      void queryClient.invalidateQueries({ queryKey: CHAT_ROOMS_QUERY_KEY })
    }

    socketService.listen<SocketNotificationEvent>('notification', handleNotification)
    socketService.listen('connect', handleReconnect)
    void socketService.connect()

    return () => {
      socketService.off('notification', handleNotification)
      socketService.off('connect', handleReconnect)
    }
  }, [isLoggedIn, queryClient])

  return null
}
