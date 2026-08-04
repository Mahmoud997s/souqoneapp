import { useState, useEffect, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { getSocket } from '../services/socket'
import { chatApi } from '../api/chat'
import { useChatMessagesInfinite } from './useChat'
import { uploadsApi } from '../api/uploads'
import { useChatMessagesStore } from '../store/chatMessagesStore'
import { ChatSyncService } from '../services/ChatSyncService'
import { FlashList } from '@shopify/flash-list'

export interface LocalMessage {
  id: string
  senderId: string
  content: string
  createdAt: string
  pending?: boolean
  error?: boolean
  isRead?: boolean
  isDelivered?: boolean
  reactions?: { emoji: string; userId: string; username?: string }[]
  type?: 'TEXT' | 'IMAGE' | 'FILE' | 'VOICE'
  mediaUrl?: string
}

export function useChatRoomLogic(roomId: string, initialText?: string, otherUserName?: string, otherUserAvatar?: string) {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const scrollRef = useRef<any>(null)
  
  const [msgText, setMsgText] = useState(initialText || '')
  
  // Read messages from our new Persistent Store
  const messages = useChatMessagesStore(state => state.messagesByRoom[roomId] || [])
  const addMessages = useChatMessagesStore(state => state.addMessages)
  const addMessage = useChatMessagesStore(state => state.addMessage)
  const updateMessage = useChatMessagesStore(state => state.updateMessage)
  const removeMessage = useChatMessagesStore(state => state.removeMessage)
  
  const [otherUser, setOtherUser] = useState<{ id?: string; name: string; avatar?: string } | null>(() => {
    if (otherUserName) return { name: otherUserName, avatar: otherUserAvatar }
    const cachedRooms = queryClient.getQueryData<any[]>(['chat-rooms'])
    const cachedRoom = cachedRooms?.find((r) => r.id === roomId)
    const otherParticipant = cachedRoom?.participants?.find((p: any) => p.id !== user?.id)
    if (otherParticipant) {
      return {
        id: otherParticipant.id,
        name: otherParticipant.displayName || otherParticipant.username || 'مستخدم',
        avatar: otherParticipant.avatarUrl || otherParticipant.avatar || undefined,
      }
    }
    return null
  })

  // Sync otherUserName if params change
  useEffect(() => {
    if (otherUserName) {
      setOtherUser(prev => ({
        id: prev?.id,
        name: otherUserName,
        avatar: otherUserAvatar || prev?.avatar,
      }))
    }
  }, [otherUserName, otherUserAvatar])
  const [activeReactMsgId, setActiveReactMsgId] = useState<string | null>(null)
  const [replyingToMessage, setReplyingToMessage] = useState<LocalMessage | null>(null)
  
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false)
  const [isOtherUserOnline, setIsOtherUserOnline] = useState(false)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const otherTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { data: initialMessagesData, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useChatMessagesInfinite(roomId)

  // Join room via sync service when mounted
  useEffect(() => {
    if (roomId) {
      ChatSyncService.joinRoom(roomId)
      
      // Clear unread count locally and find other user if missing
      queryClient.setQueryData(['chat-rooms'], (old: any) => {
        if (!Array.isArray(old)) return old
        return old.map((room) => {
          if (room.id === roomId) {
            const otherP = room.participants?.find((p: any) => p.id !== user?.id)
            if (otherP) {
              setOtherUser(prev => prev?.name ? prev : {
                id: otherP.id,
                name: otherP.displayName || otherP.username || 'مستخدم',
                avatar: otherP.avatarUrl || otherP.avatar || undefined,
              })
            }
            return { ...room, unreadCount: 0 }
          }
          return room
        })
      })
      
      return () => {
        ChatSyncService.leaveRoom(roomId)
      }
    }
  }, [roomId, queryClient, user?.id])

  // Process initial messages from API and seed the store
  useEffect(() => {
    if (initialMessagesData) {
      const initialMessages = initialMessagesData.pages.flat()
      const mapped: LocalMessage[] = (initialMessages as any[]).map((m: any) => ({
        id: m.id,
        senderId: m.senderId ?? m.sender?.id ?? '',
        content: m.content,
        createdAt: m.createdAt,
        reactions: m.reactions ?? [],
        isRead: m.isRead ?? false,
        type: m.type,
        mediaUrl: m.mediaUrl,
      }))
      
      addMessages(roomId, mapped)

      // Extract other user info
      const other = (initialMessages as any[]).find((m: any) => {
        const sid = m.senderId ?? m.sender?.id
        return sid !== user?.id
      })
      if (other?.sender) {
        setOtherUser({
          id: other.sender.id,
          name: other.sender.displayName ?? other.sender.username ?? 'مجهول',
          avatar: other.sender.avatarUrl || other.sender.avatar || undefined,
        })
      }
    }
  }, [initialMessagesData, roomId, addMessages, user?.id])

  // Listen to typing events specific to this screen
  useEffect(() => {
    const socket = getSocket()
    if (!socket || !roomId) return

    const onUserTyping = (data: any) => {
      if (data.userId !== user?.id && data.conversationId === roomId) {
        setIsOtherUserTyping(true)
        if (otherTypingTimeoutRef.current) clearTimeout(otherTypingTimeoutRef.current)
        otherTypingTimeoutRef.current = setTimeout(() => {
          setIsOtherUserTyping(false)
        }, 3000)
      }
    }
    
    const onUserStopTyping = (data: any) => {
      if (data.userId !== user?.id && data.conversationId === roomId) {
        setIsOtherUserTyping(false)
        if (otherTypingTimeoutRef.current) clearTimeout(otherTypingTimeoutRef.current)
      }
    }

    const onOnlineStatus = (data: { userId: string; online: boolean }) => {
      if (data.userId === otherUser?.id) {
        setIsOtherUserOnline(data.online)
      }
    }

    socket.on('user-typing', onUserTyping)
    socket.on('user-stop-typing', onUserStopTyping)
    socket.on('online-status', onOnlineStatus)

    return () => {
      socket.off('user-typing', onUserTyping)
      socket.off('user-stop-typing', onUserStopTyping)
      socket.off('online-status', onOnlineStatus)
      if (otherTypingTimeoutRef.current) clearTimeout(otherTypingTimeoutRef.current)
    }
  }, [roomId, user?.id, otherUser?.id])

  // Check online status
  useEffect(() => {
    const socket = getSocket()
    if (socket?.connected && otherUser?.id) {
      socket.emit('check-online', { userId: otherUser.id })
    }
  }, [otherUser?.id])

  // Auto-scroll when messages change (only needed for FlatList, but keeping basic logic for FlashList too)
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToOffset({ offset: 0, animated: true }), 50)
    }
  }, [messages.length])

  const handleSend = useCallback(async (textOverride?: string, mediaUri?: string, mediaType?: 'IMAGE' | 'FILE' | 'VOICE', fileInfo?: any) => {
    let text = (textOverride ?? msgText).trim().substring(0, 2000)
    text = text.replace(/[\r\n]{3,}/g, '\n\n')
    
    if (!text && !mediaUri) return

    let finalContent = text
    if (replyingToMessage) {
      const shortQuote = (replyingToMessage.type === 'IMAGE' ? '📷 صورة' : replyingToMessage.type === 'VOICE' ? '🎤 رسالة صوتية' : replyingToMessage.content).replace(/\n/g, ' ').substring(0, 100)
      const senderName = replyingToMessage.senderId === user?.id ? 'أنت' : (otherUser?.name || 'مستخدم')
      finalContent = `[REPLY|${replyingToMessage.id}|${senderName}|${shortQuote}]\n${finalContent}`
      setReplyingToMessage(null)
    }

    setMsgText('')
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    getSocket()?.emit('stop-typing', { conversationId: roomId })

    const tempId = `temp-${Date.now()}`
    
    const newMessage: LocalMessage = {
      id: tempId,
      senderId: user?.id ?? '',
      content: finalContent,
      createdAt: new Date().toISOString(),
      reactions: [],
      isRead: false,
      pending: true,
      error: false,
      type: mediaType || 'TEXT',
      mediaUrl: mediaUri,
    }
    
    addMessage(roomId, newMessage)

    try {
      let finalMediaUrl = undefined
      if (mediaUri) {
        const filename = mediaUri.split('/').pop() || 'upload.jpg'
        const ext = filename.split('.').pop()?.toLowerCase() || 'jpg'
        let mime = 'image/jpeg'
        if (ext === 'm4a') mime = 'audio/m4a'
        if (ext === 'mp4') mime = 'video/mp4'
        if (ext === 'pdf') mime = 'application/pdf'
        
        const formData = new FormData()
        formData.append('file', {
          uri: mediaUri,
          type: mime,
          name: filename,
        } as any)
        
        const uploadRes = await uploadsApi.single(formData)
        finalMediaUrl = uploadRes.data.url
      }

      const res = await chatApi.sendMessage(roomId, { 
        content: finalContent, 
        type: mediaType || 'TEXT', 
        mediaUrl: finalMediaUrl 
      })
      
      const realMessage = res.data
      
      // We check if it arrived via socket first
      const currentMessages = useChatMessagesStore.getState().messagesByRoom[roomId] || []
      const alreadyArrived = currentMessages.some(m => m.id === realMessage.id)
      
      if (alreadyArrived) {
         removeMessage(roomId, tempId)
      } else {
         removeMessage(roomId, tempId)
         addMessage(roomId, { ...realMessage, senderId: (realMessage as any).senderId ?? realMessage.sender?.id ?? '', pending: false, error: false })
      }

    } catch (err) {
      console.error('Send message error:', err)
      updateMessage(roomId, tempId, { pending: false, error: true })
    }
  }, [msgText, roomId, user?.id, replyingToMessage, addMessage, removeMessage, updateMessage, otherUser?.name])

  const handleRemoveFailedMessage = useCallback((msgId: string) => {
    removeMessage(roomId, msgId)
  }, [roomId, removeMessage])

  const handleDeleteMessage = useCallback((msgId: string) => {
    removeMessage(roomId, msgId)
    const socket = getSocket()
    if (socket) {
      socket.emit('delete-message', { messageId: msgId, conversationId: roomId })
    }
  }, [roomId, removeMessage])

  const handleRetry = useCallback(async (msgId: string) => {
    const failedMsg = useChatMessagesStore.getState().messagesByRoom[roomId]?.find(m => m.id === msgId)
    if (!failedMsg) return

    updateMessage(roomId, msgId, { pending: true, error: false })

    try {
      let finalMediaUrl = failedMsg.mediaUrl
      if (failedMsg.mediaUrl && failedMsg.mediaUrl.startsWith('file://')) {
        const filename = failedMsg.mediaUrl.split('/').pop() || 'upload.jpg'
        const ext = filename.split('.').pop()?.toLowerCase() || 'jpg'
        let mime = 'image/jpeg'
        if (ext === 'm4a') mime = 'audio/m4a'
        if (ext === 'mp4') mime = 'video/mp4'
        if (ext === 'pdf') mime = 'application/pdf'
        
        const formData = new FormData()
        formData.append('file', {
          uri: failedMsg.mediaUrl,
          type: mime,
          name: filename,
        } as any)
        
        const uploadRes = await uploadsApi.single(formData)
        finalMediaUrl = uploadRes.data.url
      }

      const res = await chatApi.sendMessage(roomId, { 
        content: failedMsg.content, 
        type: failedMsg.type || 'TEXT', 
        mediaUrl: finalMediaUrl 
      })
      const realMessage = res.data
      
      removeMessage(roomId, msgId)
      addMessage(roomId, { ...realMessage, senderId: (realMessage as any).senderId ?? realMessage.sender?.id ?? '', pending: false, error: false })
      
    } catch (err) {
      console.error('Retry send message error:', err)
      updateMessage(roomId, msgId, { pending: false, error: true })
    }
  }, [roomId, updateMessage, removeMessage, addMessage])

  const handleReact = useCallback((msgId: string, emojiRaw: string) => {
    const emoji = emojiRaw.trim().substring(0, 10)
    setActiveReactMsgId(null)
    
    // Optimistic Update
    const currentMessages = useChatMessagesStore.getState().messagesByRoom[roomId] || []
    const m = currentMessages.find(m => m.id === msgId)
    if (m) {
      let newReactions = m.reactions ? [...m.reactions] : []
      const existing = newReactions.find((r) => r.userId === user?.id)
      
      if (existing && existing.emoji === emoji) {
        newReactions = newReactions.filter((r) => r.userId !== user?.id)
      } else {
        newReactions = newReactions.filter((r) => r.userId !== user?.id)
        newReactions.push({ emoji, userId: user?.id ?? '', username: user?.username })
      }
      updateMessage(roomId, msgId, { reactions: newReactions })
      getSocket()?.emit('react-to-message', { messageId: msgId, emoji, conversationId: roomId })
    }
  }, [roomId, user?.id, user?.username, updateMessage])

  const handleTextChange = (txt: string) => {
    setMsgText(txt)
    
    if (!typingTimeoutRef.current) {
      const socket = getSocket()
      if (socket?.connected && roomId) {
        socket.emit('typing', { conversationId: roomId })
      }
    } else {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      getSocket()?.emit('stop-typing', { conversationId: roomId })
      typingTimeoutRef.current = null
    }, 3000)
  }

  return {
    messages,
    isLoading,
    replyingToMessage,
    setReplyingToMessage,
    otherUser,
    isOtherUserTyping,
    isOtherUserOnline,
    msgText,
    handleTextChange,
    handleSend,
    handleRetry,
    handleRemoveFailedMessage,
    handleDeleteMessage,
    handleReact,
    activeReactMsgId,
    setActiveReactMsgId,
    scrollRef,
    user,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  }
}
