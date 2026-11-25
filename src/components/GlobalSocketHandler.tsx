import { useEffect } from 'react'
import { AppState, AppStateStatus } from 'react-native'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { socketService } from '../services/socket'
import { CHAT_ROOMS_QUERY_KEY } from '../hooks/useChat'

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

    // Chat messages arrive on the 'message' socket event via ChatSyncService; 'notification' carries a notification record without a message payload.
    const handleReconnect = () => {
      void queryClient.invalidateQueries({ queryKey: CHAT_ROOMS_QUERY_KEY })
    }

    socketService.listen('connect', handleReconnect)
    void socketService.connect()

    return () => {
      socketService.off('connect', handleReconnect)
    }
  }, [isLoggedIn, queryClient])

  return null
}
