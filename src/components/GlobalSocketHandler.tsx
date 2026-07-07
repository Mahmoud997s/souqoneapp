import React, { useEffect } from 'react'
import { AppState, AppStateStatus } from 'react-native'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { useChatStore } from '../store/chatStore'
import { socketService } from '../services/socket'
import { ChatRoom } from '../types/listing.types'

export function GlobalSocketHandler() {
  const { isLoggedIn, user } = useAuthStore()
  const queryClient = useQueryClient()

  // AppState for socket reconnection
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (!isLoggedIn) return
      if (nextAppState === 'active') {
        socketService.connect()
      } else if (nextAppState === 'background') {
        socketService.disconnect()
      }
    })
    return () => subscription.remove()
  }, [isLoggedIn])

  useEffect(() => {
    if (!isLoggedIn) {
      socketService.disconnect()
      return
    }

    let active = true

    socketService.connect().then(() => {
      if (!active) return

      const handleGlobalMessage = (data: any) => {
        const conversationId = data.roomId ?? data.conversationId
        if (!conversationId) return

        queryClient.setQueryData<ChatRoom[]>(['chat-rooms'], (oldRooms) => {
          if (!oldRooms) return oldRooms

          const roomIndex = oldRooms.findIndex(r => r.id === conversationId)
          let updatedRooms = [...oldRooms]

          if (roomIndex > -1) {
            const room = updatedRooms[roomIndex]
            
            const isSender = data.senderId === user?.id || data.sender?.id === user?.id
            // Get active room from store directly to avoid stale closures
            const activeRoomId = useChatStore.getState().activeRoomId
            const isViewingThisRoom = activeRoomId === conversationId
            
            const shouldIncrementUnread = !isSender && !isViewingThisRoom

            const updatedRoom = {
              ...room,
              lastMessage: {
                id: data.id ?? String(Date.now()),
                roomId: conversationId,
                content: data.content,
                sender: data.sender || { id: data.senderId || '' },
                createdAt: data.createdAt ?? new Date().toISOString(),
                isRead: isSender || isViewingThisRoom ? true : false,
              },
              updatedAt: new Date().toISOString(),
              unreadCount: shouldIncrementUnread ? (room.unreadCount + 1) : room.unreadCount,
            }

            updatedRooms.splice(roomIndex, 1)
            updatedRooms.unshift(updatedRoom)
          } else {
            queryClient.invalidateQueries({ queryKey: ['chat-rooms'] })
          }

          return updatedRooms
        })
      }

      const handleNotification = (data: any) => {
        if (data.type === 'NEW_MESSAGE') {
          handleGlobalMessage(data.payload)
        }
      }

      const handleReconnect = () => {
        queryClient.invalidateQueries({ queryKey: ['chat-rooms'] })
      }

      socketService.listen('message', handleGlobalMessage)
      socketService.listen('notification', handleNotification)
      socketService.listen('connect', handleReconnect)
      
      // Cleanup attached to the Promise resolution
      return () => {
        socketService.off('message', handleGlobalMessage)
        socketService.off('notification', handleNotification)
        socketService.off('connect', handleReconnect)
      }
    })

    return () => {
      active = false
      // Fallback cleanup will happen when unmounted due to component scope,
      // but the exact listeners are cleaned inside the promise.
    }
  }, [isLoggedIn, queryClient, user?.id])

  return null
}
