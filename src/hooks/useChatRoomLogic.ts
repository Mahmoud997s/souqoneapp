import { useState, useEffect, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { getSocket, socketService } from '../services/socket'
import { chatApi } from '../api/chat'
import { useChatMessagesInfinite } from './useChat'
import { uploadsApi } from '../api/uploads'
import { useChatMessagesStore } from '../store/chatMessagesStore'
import { ChatSyncService } from '../services/ChatSyncService'
import { FlashListRef } from '@shopify/flash-list'
import { ChatRoom, ChatMessage } from '../types/listing.types'
import { UserSummary } from '../types/auth.types'
import { ChatFileInfo } from '../components/chat/ChatInput'
import { logError } from '../utils/safeLog'
import { toastService } from '../store/toastStore'
import {
  fromWireType,
  buildSendMessagePayload,
  getReplyQuoteForMessage,
  type LocalChatMessageType,
} from '../utils/chatMessageType'

function extractSendErrorReason(err: unknown): string | undefined {
  if (!err || typeof err !== 'object') return undefined
  const anyErr = err as { code?: string; response?: { status?: number; data?: { message?: string | string[] } }; message?: string }
  const status = anyErr.response?.status
  if (status === 413) return 'حجم الملف كبير'
  if (anyErr.code === 'ERR_NETWORK' || anyErr.message === 'Network Error' || anyErr.message === 'Network request failed') {
    return 'تعذّر الاتصال'
  }
  const serverMsg = anyErr.response?.data?.message
  if (Array.isArray(serverMsg) && typeof serverMsg[0] === 'string' && serverMsg[0].trim()) {
    return serverMsg[0].trim()
  }
  if (typeof serverMsg === 'string' && serverMsg.trim()) {
    return serverMsg.trim()
  }
  return undefined
}

function isAbortError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const anyErr = err as { code?: string; name?: string }
  return anyErr.code === 'ERR_CANCELED' || anyErr.name === 'CanceledError' || anyErr.name === 'AbortError'
}

export interface LocalMessage {
  id: string
  senderId: string
  content: string
  createdAt: string
  pending?: boolean
  error?: boolean
  errorReason?: string
  uploadProgress?: number
  isRead?: boolean
  isDelivered?: boolean
  reactions?: { emoji: string; userId: string; username?: string }[]
  type?: LocalChatMessageType
  mediaUrl?: string
  fileName?: string
  fileSize?: number
  duration?: number
  pendingDelete?: boolean
  deleteError?: boolean
}

export interface TypingSocketEvent {
  userId: string
  conversationId: string
}

export function useChatRoomLogic(roomId: string, initialText?: string, otherUserName?: string, otherUserAvatar?: string) {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const scrollRef = useRef<FlashListRef<LocalMessage>>(null)
  
  const [msgText, setMsgText] = useState(initialText || '')
  
  // Read messages from our new Persistent Store
  const messages = useChatMessagesStore(state => state.messagesByRoom[roomId] || [])
  const addMessages = useChatMessagesStore(state => state.addMessages)
  const addMessage = useChatMessagesStore(state => state.addMessage)
  const updateMessage = useChatMessagesStore(state => state.updateMessage)
  const removeMessage = useChatMessagesStore(state => state.removeMessage)
  
  const [otherUser, setOtherUser] = useState<{ id?: string; name: string; avatar?: string } | null>(() => {
    if (otherUserName) return { name: otherUserName, avatar: otherUserAvatar }
    const cachedRooms = queryClient.getQueryData<ChatRoom[]>(['chat-rooms'])
    const cachedRoom = cachedRooms?.find((r) => r.id === roomId)
    const otherParticipant = cachedRoom?.participants?.find((p: UserSummary) => p.id !== user?.id)
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
  const deletingIdsRef = useRef<Set<string>>(new Set())
  const deleteTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const uploadControllersRef = useRef<Map<string, AbortController>>(new Map())

  useEffect(() => {
    return () => {
      deleteTimeoutsRef.current.forEach((t) => clearTimeout(t))
      deleteTimeoutsRef.current.clear()
      deletingIdsRef.current.clear()
      uploadControllersRef.current.forEach((c) => c.abort())
      uploadControllersRef.current.clear()
    }
  }, [])

  const {
    data: initialMessagesData,
    isLoading,
    isError,
    error,
    isRefetchError,
    isRefetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useChatMessagesInfinite(roomId)

  // Join room via sync service when mounted
  useEffect(() => {
    if (roomId) {
      ChatSyncService.joinRoom(roomId)
      
      // Clear unread count locally and find other user if missing
      queryClient.setQueryData<ChatRoom[]>(['chat-rooms'], (old) => {
        if (!Array.isArray(old)) return old
        return old.map((room) => {
          if (room.id === roomId) {
            const otherP = room.participants?.find((p: UserSummary) => p.id !== user?.id)
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
      const mapped: LocalMessage[] = initialMessages.map((m: ChatMessage) => ({
        id: m.id,
        senderId: m.senderId ?? m.sender?.id ?? '',
        content: m.content ?? '',
        createdAt: m.createdAt,
        reactions: (m as { reactions?: { emoji: string; userId: string; username?: string }[] }).reactions ?? [],
        isRead: m.isRead ?? false,
        type: fromWireType(m.type),
        mediaUrl: m.mediaUrl,
      }))
      
      addMessages(roomId, mapped)

      // Extract other user info
      const other = initialMessages.find((m: ChatMessage) => {
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

  // Listen to typing events specific to this screen via registry so reconnects keep them
  useEffect(() => {
    if (!roomId) return

    const onUserTyping = (data: TypingSocketEvent) => {
      if (data.userId !== user?.id && data.conversationId === roomId) {
        setIsOtherUserTyping(true)
        if (otherTypingTimeoutRef.current) clearTimeout(otherTypingTimeoutRef.current)
        otherTypingTimeoutRef.current = setTimeout(() => {
          setIsOtherUserTyping(false)
        }, 3000)
      }
    }
    
    const onUserStopTyping = (data: TypingSocketEvent) => {
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

    socketService.listen<TypingSocketEvent>('user-typing', onUserTyping)
    socketService.listen<TypingSocketEvent>('user-stop-typing', onUserStopTyping)
    socketService.listen<{ userId: string; online: boolean }>('online-status', onOnlineStatus)

    return () => {
      socketService.off('user-typing', onUserTyping)
      socketService.off('user-stop-typing', onUserStopTyping)
      socketService.off('online-status', onOnlineStatus)
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

  const handleSend = useCallback(async (textOverride?: string, mediaUri?: string, mediaType?: 'IMAGE' | 'FILE' | 'VOICE', fileInfo?: ChatFileInfo) => {
    let text = (textOverride ?? msgText).trim().substring(0, 2000)
    text = text.replace(/[\r\n]{3,}/g, '\n\n')
    
    if (!text && !mediaUri) return

    let finalContent = text
    if (replyingToMessage) {
      const shortQuote = getReplyQuoteForMessage(replyingToMessage)
      const senderName = replyingToMessage.senderId === user?.id ? 'أنت' : (otherUser?.name || 'مستخدم')
      finalContent = `[REPLY|${replyingToMessage.id}|${senderName}|${shortQuote}]\n${finalContent}`
      setReplyingToMessage(null)
    }

    setMsgText('')
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    getSocket()?.emit('stop-typing', { conversationId: roomId })

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    const localType: LocalChatMessageType = mediaType || 'TEXT'
    
    const newMessage: LocalMessage = {
      id: tempId,
      senderId: user?.id ?? '',
      content: finalContent,
      createdAt: new Date().toISOString(),
      reactions: [],
      isRead: false,
      pending: true,
      error: false,
      uploadProgress: mediaUri ? 0 : undefined,
      type: localType,
      mediaUrl: mediaUri,
      fileName: fileInfo?.name,
      fileSize: fileInfo?.size,
      duration: fileInfo?.duration,
    }
    
    addMessage(roomId, newMessage)

    const controller = new AbortController()
    if (mediaUri) {
      uploadControllersRef.current.set(tempId, controller)
    }

    try {
      let finalMediaUrl: string | undefined = undefined
      if (mediaUri) {
        const filename = fileInfo?.name || mediaUri.split('/').pop() || 'upload.jpg'
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
        } as unknown as Blob)
        
        const uploadRes = await uploadsApi.single(
          formData,
          controller.signal,
          (progress) => updateMessage(roomId, tempId, { uploadProgress: progress })
        )
        finalMediaUrl = uploadRes.data.url
      }

      uploadControllersRef.current.delete(tempId)

      const payload = buildSendMessagePayload({
        content: finalContent,
        type: localType,
        mediaUrl: finalMediaUrl,
      })

      const res = await chatApi.sendMessage(roomId, payload)
      
      const realMessage = res.data
      
      // We check if it arrived via socket first
      const currentMessages = useChatMessagesStore.getState().messagesByRoom[roomId] || []
      const alreadyArrived = currentMessages.some(m => m.id === realMessage.id)
      
      if (alreadyArrived) {
         removeMessage(roomId, tempId)
      } else {
         removeMessage(roomId, tempId)
         addMessage(roomId, {
           ...realMessage,
           content: realMessage.content ?? '',
           type: fromWireType(realMessage.type),
           senderId: realMessage.senderId ?? realMessage.sender?.id ?? '',
           pending: false,
           error: false,
         })
      }

    } catch (err) {
      uploadControllersRef.current.delete(tempId)
      if (controller.signal.aborted || isAbortError(err)) {
        return
      }
      logError('ChatRoom:SendMessage', err)
      updateMessage(roomId, tempId, {
        pending: false,
        error: true,
        errorReason: extractSendErrorReason(err),
        uploadProgress: undefined,
      })
    }
  }, [msgText, roomId, user?.id, replyingToMessage, addMessage, removeMessage, updateMessage, otherUser?.name])

  const handleCancelUpload = useCallback((msgId: string) => {
    const controller = uploadControllersRef.current.get(msgId)
    if (controller) {
      controller.abort()
      uploadControllersRef.current.delete(msgId)
    }
    removeMessage(roomId, msgId)
  }, [roomId, removeMessage])

  const handleRemoveFailedMessage = useCallback((msgId: string) => {
    removeMessage(roomId, msgId)
  }, [roomId, removeMessage])

  const handleDeleteMessage = useCallback((msgId: string) => {
    const currentMessages = useChatMessagesStore.getState().messagesByRoom[roomId] || []
    const msg = currentMessages.find(m => m.id === msgId)
    if (!msg) return

    // Only allow deleting own messages
    if (msg.senderId !== user?.id) return

    // Single-flight check
    if (deletingIdsRef.current.has(msgId) || msg.pendingDelete) {
      return
    }

    const socket = getSocket()
    if (!socket || !socket.connected) {
      toastService.show({
        kind: 'error',
        title: 'لا يمكن حذف الرسالة أثناء انقطاع الاتصال الفوري',
      })
      return
    }

    updateMessage(roomId, msgId, { pendingDelete: true, deleteError: false })
    deletingIdsRef.current.add(msgId)

    const timeoutId = setTimeout(() => {
      deleteTimeoutsRef.current.delete(msgId)
      if (deletingIdsRef.current.has(msgId)) {
        deletingIdsRef.current.delete(msgId)
        updateMessage(roomId, msgId, { pendingDelete: false })
        refetch()
      }
    }, 8000)

    deleteTimeoutsRef.current.set(msgId, timeoutId)

    socket.emit(
      'delete-message',
      { messageId: msgId, conversationId: roomId },
      (ack?: { success?: boolean; error?: string; message?: string }) => {
        const storedTimeout = deleteTimeoutsRef.current.get(msgId)
        if (storedTimeout) {
          clearTimeout(storedTimeout)
          deleteTimeoutsRef.current.delete(msgId)
        }
        deletingIdsRef.current.delete(msgId)

        if (ack?.success) {
          removeMessage(roomId, msgId)
        } else {
          updateMessage(roomId, msgId, { pendingDelete: false, deleteError: true })
          const reason = ack?.message || ack?.error || 'فشل حذف الرسالة من الخادم. هل تريد إعادة المحاولة؟'
          toastService.confirm({
            title: 'تعذر حذف الرسالة',
            message: reason,
            intent: 'primary',
            confirmLabel: 'إعادة المحاولة',
            cancelLabel: 'إلغاء',
            onConfirm: () => handleDeleteMessage(msgId),
          })
        }
      }
    )
  }, [roomId, user?.id, updateMessage, removeMessage, refetch])

  const handleRetry = useCallback(async (msgId: string) => {
    const failedMsg = useChatMessagesStore.getState().messagesByRoom[roomId]?.find(m => m.id === msgId)
    if (!failedMsg) return

    updateMessage(roomId, msgId, { pending: true, error: false, errorReason: undefined })

    const controller = new AbortController()
    const isLocalFile = !!failedMsg.mediaUrl && failedMsg.mediaUrl.startsWith('file://')
    if (isLocalFile) {
      uploadControllersRef.current.set(msgId, controller)
    }

    try {
      let finalMediaUrl = failedMsg.mediaUrl
      if (isLocalFile && failedMsg.mediaUrl) {
        const filename = failedMsg.fileName || failedMsg.mediaUrl.split('/').pop() || 'upload.jpg'
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
        } as unknown as Blob)
        
        const uploadRes = await uploadsApi.single(
          formData,
          controller.signal,
          (progress) => updateMessage(roomId, msgId, { uploadProgress: progress })
        )
        finalMediaUrl = uploadRes.data.url
      }

      uploadControllersRef.current.delete(msgId)

      const payload = buildSendMessagePayload({
        content: failedMsg.content,
        type: failedMsg.type || 'TEXT',
        mediaUrl: finalMediaUrl,
      })

      const res = await chatApi.sendMessage(roomId, payload)
      const realMessage = res.data
      
      removeMessage(roomId, msgId)
      addMessage(roomId, {
        ...realMessage,
        content: realMessage.content ?? '',
        type: fromWireType(realMessage.type),
        senderId: realMessage.senderId ?? realMessage.sender?.id ?? '',
        pending: false,
        error: false,
      })
      
    } catch (err) {
      uploadControllersRef.current.delete(msgId)
      if (controller.signal.aborted || isAbortError(err)) {
        return
      }
      logError('ChatRoom:RetryMessage', err)
      updateMessage(roomId, msgId, {
        pending: false,
        error: true,
        errorReason: extractSendErrorReason(err),
        uploadProgress: undefined,
      })
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
    isError,
    error,
    isRefetchError,
    isRefetching,
    refetch,
    replyingToMessage,
    setReplyingToMessage,
    otherUser,
    isOtherUserTyping,
    isOtherUserOnline,
    msgText,
    handleTextChange,
    handleSend,
    handleCancelUpload,
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
