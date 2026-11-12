import { connectSocket, getSocket } from './socket'
import { useChatMessagesStore } from '../store/chatMessagesStore'
import { LocalMessage } from '../hooks/useChatRoomLogic'
import { QueryClient } from '@tanstack/react-query'
import { useChatStore } from '../store/chatStore'
import { useAuthStore } from '../store/authStore'
import { ChatRoom } from '../types/listing.types'

export interface SocketIncomingMessagePayload {
  id?: string
  conversationId?: string
  room?: string
  roomId?: string
  senderId?: string
  sender?: { id?: string }
  content?: string
  createdAt?: string
  reactions?: Array<{ emoji: string; userId: string }>
  type?: 'TEXT' | 'IMAGE' | 'FILE' | 'VOICE'
  mediaUrl?: string
}

export interface SocketReactionPayload {
  conversationId?: string
  messageId?: string
  emoji: string
  userId: string
  action?: 'add' | 'remove'
}

export interface SocketMessageDeletedPayload {
  conversationId?: string
  messageId?: string
}

export interface SocketMessagesReadPayload {
  conversationId?: string
}

let initialized = false
let globalQueryClient: QueryClient | null = null

export const ChatSyncService = {
  init: (queryClient: QueryClient) => {
    if (initialized) return
    initialized = true
    globalQueryClient = queryClient

    connectSocket().then((socket) => {
      socket.on('connect', () => {
        // Automatically rejoin active room if any
        const activeRoomId = useChatStore.getState().activeRoomId
        if (activeRoomId) {
          socket.emit('join-conversation', { conversationId: activeRoomId })
        }
      })

      socket.on('message', (data: SocketIncomingMessagePayload) => ChatSyncService.handleIncomingMessage(data))
      socket.on('new_message', (data: SocketIncomingMessagePayload) => ChatSyncService.handleIncomingMessage(data))

      socket.on('message-reaction', (data: SocketReactionPayload) => {
        const { conversationId, messageId, emoji, userId, action } = data
        if (!conversationId || !messageId) return
        
        const store = useChatMessagesStore.getState()
        const roomMessages = store.messagesByRoom[conversationId] || []
        const msg = roomMessages.find(m => m.id === messageId)
        
        if (msg) {
          let newReactions = msg.reactions ? [...msg.reactions] : []
          if (action === 'remove') {
            newReactions = newReactions.filter((r) => !(r.userId === userId && r.emoji === emoji))
          } else {
            newReactions = newReactions.filter((r) => r.userId !== userId)
            newReactions.push({ emoji, userId })
          }
          store.updateMessage(conversationId, messageId, { reactions: newReactions })
        }
      })

      socket.on('message-deleted', (data: SocketMessageDeletedPayload) => {
        const { conversationId, messageId } = data
        if (conversationId && messageId) {
          useChatMessagesStore.getState().removeMessage(conversationId, messageId)
        }
      })
      
      socket.on('messages-read', (data: SocketMessagesReadPayload) => {
         const { conversationId } = data
         if (conversationId) {
             const user = useAuthStore.getState().user
             if (user?.id) {
                 useChatMessagesStore.getState().markRoomAsRead(conversationId, user.id)
             }
         }
      })
    })
  },

  handleIncomingMessage: (data: SocketIncomingMessagePayload) => {
    const roomId = data.conversationId || data.room || data.roomId // Fallbacks depending on backend
    if (!roomId) return

    const msg: LocalMessage = {
      id: data.id ?? String(Date.now()),
      senderId: data.senderId ?? data.sender?.id ?? '',
      content: data.content ?? '',
      createdAt: data.createdAt ?? new Date().toISOString(),
      reactions: data.reactions ?? [],
      type: data.type,
      mediaUrl: data.mediaUrl,
    }

    const activeRoomId = useChatStore.getState().activeRoomId
    const user = useAuthStore.getState().user

    // If we are currently in this room and it's from the other person, emit mark-read
    if (activeRoomId === roomId && msg.senderId !== user?.id) {
      const socket = getSocket()
      if (socket?.connected) {
        socket.emit('mark-read', { conversationId: roomId })
        msg.isRead = true
      }
    }

    // Add to persistent store
    useChatMessagesStore.getState().addMessage(roomId, msg)

    // Update query client for rooms list so the unread badge and last message update instantly
    if (globalQueryClient) {
      globalQueryClient.setQueryData<ChatRoom[]>(['chat-rooms'], (old) => {
        if (!old) return old
        return old.map((room: ChatRoom) => {
          if (room.id === roomId) {
            return {
              ...room,
              lastMessage: msg,
              updatedAt: msg.createdAt,
              unreadCount: (msg.senderId !== user?.id && activeRoomId !== roomId) ? (room.unreadCount || 0) + 1 : 0
            }
          }
          return room
        }).sort((a: ChatRoom, b: ChatRoom) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      })
    }
  },

  joinRoom: (roomId: string) => {
    const socket = getSocket()
    if (socket?.connected) {
      socket.emit('join-conversation', { conversationId: roomId })
      socket.emit('mark-read', { conversationId: roomId })
    }
  },

  leaveRoom: (roomId: string) => {
    const socket = getSocket()
    if (socket?.connected) {
      socket.emit('leave-conversation', { conversationId: roomId })
    }
  }
}
