import { socketService, getSocket } from './socket'
import { useChatMessagesStore } from '../store/chatMessagesStore'
import { LocalMessage } from '../hooks/useChatRoomLogic'
import { fromWireType, type WireChatMessageType } from '../utils/chatMessageType'
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
  sender?: {
    id?: string
    displayName?: string
    username?: string
    avatarUrl?: string
    avatar?: string
  }
  content?: string
  createdAt?: string
  reactions?: Array<{ emoji: string; userId: string }>
  type?: WireChatMessageType | 'VOICE'
  mediaUrl?: string
}

export interface SocketReactionPayload {
  conversationId?: string
  messageId?: string
  emoji: string
  userId: string
  action?: 'add' | 'remove' | 'removed'
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
    globalQueryClient = queryClient
    if (initialized) return
    initialized = true

    socketService.listen('connect', () => {
      // Automatically rejoin active room if any
      const activeRoomId = useChatStore.getState().activeRoomId
      if (activeRoomId) {
        getSocket()?.emit('join-conversation', { conversationId: activeRoomId })
      }
    })

    socketService.listen<SocketIncomingMessagePayload>('message', (data) =>
      ChatSyncService.handleIncomingMessage(data)
    )

    socketService.listen<SocketReactionPayload>('message-reaction', (data) => {
      const { conversationId, messageId, emoji, userId, action } = data
      if (!conversationId || !messageId) return

      const store = useChatMessagesStore.getState()
      const roomMessages = store.messagesByRoom[conversationId] || []
      const msg = roomMessages.find((m) => m.id === messageId)

      if (msg) {
        let newReactions = msg.reactions ? [...msg.reactions] : []
        if (action === 'remove' || action === 'removed') {
          newReactions = newReactions.filter((r) => !(r.userId === userId && r.emoji === emoji))
        } else {
          newReactions = newReactions.filter((r) => r.userId !== userId)
          newReactions.push({ emoji, userId })
        }
        store.updateMessage(conversationId, messageId, { reactions: newReactions })
      }
    })

    socketService.listen<SocketMessageDeletedPayload>('message-deleted', (data) => {
      const { conversationId, messageId } = data
      if (conversationId && messageId) {
        useChatMessagesStore.getState().removeMessage(conversationId, messageId)
      }
    })

    socketService.listen<SocketMessagesReadPayload>('messages-read', (data) => {
      const { conversationId } = data
      if (conversationId) {
        const user = useAuthStore.getState().user
        if (user?.id) {
          useChatMessagesStore.getState().markRoomAsRead(conversationId, user.id)
        }
      }
    })
  },

  handleIncomingMessage: (data: SocketIncomingMessagePayload) => {
    const roomId = data.conversationId || data.room || data.roomId // Fallbacks depending on backend
    if (!roomId) return

    // Dedupe when both 'message' and 'notification' arrive for the same message id
    if (data.id) {
      const existing = useChatMessagesStore.getState().messagesByRoom[roomId]
      if (existing?.some((m) => m.id === data.id)) {
        return
      }
    }

    const msg: LocalMessage = {
      id: data.id ?? String(Date.now()),
      senderId: data.senderId ?? data.sender?.id ?? '',
      content: data.content ?? '',
      createdAt: data.createdAt ?? new Date().toISOString(),
      reactions: data.reactions ?? [],
      type: fromWireType(data.type),
      mediaUrl: data.mediaUrl,
    }

    const activeRoomId = useChatStore.getState().activeRoomId
    const user = useAuthStore.getState().user
    const isSender = msg.senderId === user?.id
    const isViewingThisRoom = activeRoomId === roomId

    // If we are currently in this room and it's from the other person, emit mark-read
    if (isViewingThisRoom && !isSender) {
      const socket = getSocket()
      if (socket?.connected) {
        socket.emit('mark-read', { conversationId: roomId })
        msg.isRead = true
      }
    }

    // Add to persistent store
    useChatMessagesStore.getState().addMessage(roomId, msg)

    // Update query client for rooms list so the unread badge and last message update once
    if (globalQueryClient) {
      const cachedRooms = globalQueryClient.getQueryData<ChatRoom[]>(['chat-rooms'])
      if (cachedRooms && !cachedRooms.some((r) => r.id === roomId)) {
        void globalQueryClient.invalidateQueries({ queryKey: ['chat-rooms'] })
        return
      }

      globalQueryClient.setQueryData<ChatRoom[]>(['chat-rooms'], (old) => {
        if (!old) return old
        const shouldIncrementUnread = !isSender && !isViewingThisRoom
        return old
          .map((room: ChatRoom) => {
            if (room.id !== roomId) return room
            return {
              ...room,
              lastMessage: {
                id: msg.id,
                senderId: msg.senderId,
                content: msg.content,
                type: msg.type,
                mediaUrl: msg.mediaUrl,
                sender: data.sender?.username
                  ? {
                      id: data.sender.id ?? msg.senderId,
                      displayName: data.sender.displayName,
                      username: data.sender.username,
                      avatarUrl: data.sender.avatarUrl,
                      avatar: data.sender.avatar,
                    }
                  : undefined,
                createdAt: msg.createdAt,
                isRead: isSender || isViewingThisRoom,
              },
              updatedAt: msg.createdAt,
              unreadCount: shouldIncrementUnread
                ? (room.unreadCount || 0) + 1
                : isViewingThisRoom
                  ? 0
                  : room.unreadCount || 0,
            }
          })
          .sort((a: ChatRoom, b: ChatRoom) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
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
