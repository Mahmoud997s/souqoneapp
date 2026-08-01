import { useState, useEffect, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { connectSocket, getSocket } from '../services/socket'
import { chatApi } from '../api/chat'
import { useChatMessagesInfinite } from './useChat'
import { uploadsApi } from '../api/uploads'
import { FlatList } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

export interface LocalMessage {
  id: string
  senderId: string
  content: string
  createdAt: string
  pending?: boolean
  isRead?: boolean
  reactions?: { emoji: string; userId: string; username?: string }[]
  type?: 'TEXT' | 'IMAGE' | 'FILE' | 'VOICE'
  mediaUrl?: string
}

export function useChatRoomLogic(roomId: string, initialText?: string, otherUserName?: string, otherUserAvatar?: string) {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const scrollRef = useRef<FlatList>(null)
  
  const [msgText, setMsgText] = useState(initialText || '')
  const [messages, setMessages] = useState<LocalMessage[]>([])
  const [otherUser, setOtherUser] = useState<{ id?: string; name: string; avatar?: string } | null>(
    otherUserName ? { name: otherUserName, avatar: otherUserAvatar } : null
  )
  const [activeReactMsgId, setActiveReactMsgId] = useState<string | null>(null)
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false)
  const [isOtherUserOnline, setIsOtherUserOnline] = useState(false)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const otherTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { data: initialMessagesData, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useChatMessagesInfinite(roomId)

  // Optimistically mark as read in local cache
  useEffect(() => {
    if (roomId) {
      queryClient.setQueryData(['chat-rooms'], (old: any) => {
        if (!Array.isArray(old)) return old
        return old.map((room) => room.id === roomId ? { ...room, unreadCount: 0 } : room)
      })
    }
  }, [roomId, queryClient])

  // Seed messages from API
  useEffect(() => {
    if (!initialMessagesData) {
      // Spec 11: Offline Storage - Load from cache if API is loading/offline
      AsyncStorage.getItem(`chat_${roomId}`).then((str) => {
        if (str) {
          try {
            const cached = JSON.parse(str)
            if (messages.length === 0) setMessages(cached)
          } catch (e) {}
        }
      })
      return
    }
    const initialMessages = initialMessagesData.pages.flat()
    const mapped: LocalMessage[] = (initialMessages as any[])
      .map((m: any) => ({
        id: m.id,
        senderId: m.senderId ?? m.sender?.id ?? '',
        content: m.content,
        createdAt: m.createdAt,
        reactions: m.reactions ?? [],
        isRead: m.isRead ?? false,
        type: m.type,
        mediaUrl: m.mediaUrl,
      }))
      
    setMessages((prev) => {
      // Spec 6: Reconnection State Preservation
      // Keep messages that are still pending upload/sending
      const pendingMsgs = prev.filter((m) => m.pending)
      const merged = [...mapped, ...pendingMsgs]
      return merged.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    })

    // Extract other user info from first message
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
  }, [initialMessagesData, user?.id])

  // Socket.IO
  useEffect(() => {
    if (!roomId) return
    let active = true
    let joinRoomFn: (() => void) | null = null
    let onNewMessage: ((data: any) => void) | null = null

    connectSocket().then((socket) => {
      if (!active) return

      joinRoomFn = () => {
        socket.emit('join-conversation', { conversationId: roomId })
        socket.emit('mark-read', { conversationId: roomId })
        socket.emit('read_messages', { conversationId: roomId }) // fallback for common event names
      }

      // Join immediately if already connected
      if (socket.connected) joinRoomFn()

      const onConnect = () => {
        if (joinRoomFn) joinRoomFn()
        queryClient.invalidateQueries({ queryKey: ['chat-messages', roomId] })
      }
      // Also rejoin whenever the socket reconnects
      socket.on('connect', onConnect)

      onNewMessage = (data: any) => {
        if (!active) return
        const msg: LocalMessage = {
          id: data.id ?? String(Date.now()),
          senderId: data.senderId ?? data.sender?.id ?? '',
          content: data.content,
          createdAt: data.createdAt ?? new Date().toISOString(),
          reactions: data.reactions ?? [],
          type: data.type,
          mediaUrl: data.mediaUrl,
        }
        
        // Spec 7: Foreground Read Sync
        if (msg.senderId !== user?.id) {
          socket.emit('mark-read', { conversationId: roomId })
        }
        
        setMessages((prev) => {
          if (prev.find((m) => m.id === msg.id)) return prev
          
          let foundTemp = false
          const next = prev.filter(m => {
            if (!foundTemp && m.id.startsWith('temp-') && m.content === msg.content && m.senderId === msg.senderId && m.type === msg.type) {
              foundTemp = true
              return false // Spec 3: Remove only the first matching temp message
            }
            return true
          })
          return [...next, msg]
        })
        
        // Update React Query caches for received messages
        queryClient.setQueryData(['chat-messages', roomId], (old: any) => {
          if (!old || !old.pages || old.pages.length === 0) return old
          const newPages = [...old.pages]
          const firstPage = { ...newPages[0] }
          if (!firstPage.messages.find((m: any) => m.id === msg.id)) {
            firstPage.messages = [msg, ...firstPage.messages]
            newPages[0] = firstPage
          }
          return { ...old, pages: newPages }
        })

        queryClient.setQueryData(['chat-rooms'], (old: any) => {
          if (!old) return old
          return old.map((room: any) => {
            if (room.id === roomId) {
              return {
                ...room,
                lastMessage: msg,
                updatedAt: msg.createdAt,
                unreadCount: msg.senderId !== user?.id ? room.unreadCount + 1 : room.unreadCount
              }
            }
            return room
          }).sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        })

        // Update other user if missing
        if (data.sender && data.senderId !== user?.id) {
          setOtherUser({
            id: data.sender.id,
            name: data.sender.displayName ?? data.sender.username ?? 'مجهول',
            avatar: data.sender.avatarUrl || data.sender.avatar || undefined,
          })
        }
        // In FlatList inverted, to scroll to newest message we scroll to offset 0
        scrollRef.current?.scrollToOffset({ offset: 0, animated: true })
      }

      socket.on('message', onNewMessage)
      socket.on('new_message', onNewMessage)
      
      const onUserTyping = (data: any) => {
        if (data.userId !== user?.id) {
          setIsOtherUserTyping(true)
          // Spec 5: Sticky Typing Indicator Fix
          if (otherTypingTimeoutRef.current) clearTimeout(otherTypingTimeoutRef.current)
          otherTypingTimeoutRef.current = setTimeout(() => {
            setIsOtherUserTyping(false)
          }, 3000)
        }
      }
      socket.on('user-typing', onUserTyping)
      
      const onUserStopTyping = (data: any) => {
        if (data.userId !== user?.id) {
          setIsOtherUserTyping(false)
          if (otherTypingTimeoutRef.current) clearTimeout(otherTypingTimeoutRef.current)
        }
      }
      socket.on('user-stop-typing', onUserStopTyping)

      // Bug 2 fix: Listen for online-status response
      const onOnlineStatus = (data: { userId: string; online: boolean }) => {
        if (data.userId === otherUser?.id) {
          setIsOtherUserOnline(data.online)
        }
      }
      socket.on('online-status', onOnlineStatus)

      const onMessagesRead = () => {
        setMessages((prev) => prev.map((m) => m.senderId === user?.id ? { ...m, isRead: true } : m))
      }
      socket.on('messages-read', onMessagesRead)

      const onMessageDeleted = (data: any) => {
        setMessages((prev) => prev.filter((m) => m.id !== data.messageId))
      }
      socket.on('message-deleted', onMessageDeleted)

      const onMessageReaction = (data: any) => {
        setMessages((prev) => prev.map((m) => {
          if (m.id !== data.messageId) return m
          let newReactions = m.reactions ? [...m.reactions] : []
          if (data.action === 'remove') {
            newReactions = newReactions.filter((r) => !(r.userId === data.userId && r.emoji === data.emoji))
          } else {
            // Server might not enforce single reaction per user, but local UI should for consistency
            newReactions = newReactions.filter((r) => r.userId !== data.userId)
            newReactions.push({ emoji: data.emoji, userId: data.userId })
          }
          return { ...m, reactions: newReactions }
        }))
      }
      socket.on('message-reaction', onMessageReaction)
      
      // Spec 2: Socket Event Cleanup Architecture
      return () => {
        active = false
        if (otherTypingTimeoutRef.current) clearTimeout(otherTypingTimeoutRef.current)
        if (getSocket()?.connected) {
          const s = getSocket()!
          if (onNewMessage) {
            s.off('message', onNewMessage)
            s.off('new_message', onNewMessage)
          }
          s.off('message-reaction', onMessageReaction)
          s.off('user-typing', onUserTyping)
          s.off('user-stop-typing', onUserStopTyping)
          s.off('messages-read', onMessagesRead)
          s.off('message-deleted', onMessageDeleted)
          s.off('online-status', onOnlineStatus)
          s.off('connect', onConnect)
          s.emit('leave-conversation', { conversationId: roomId })
        }
      }
    })
  }, [roomId, user?.id])

  // Bug 2 fix: Emit check-online once when otherUser's id is known and socket is ready
  useEffect(() => {
    const socket = getSocket()
    if (socket?.connected && otherUser?.id) {
      socket.emit('check-online', { userId: otherUser.id })
    }
  }, [otherUser?.id])

  // Auto-scroll when messages change
  useEffect(() => {
    if (messages.length > 0) {
      // Spec 11: Offline Storage - Save latest messages to cache
      AsyncStorage.setItem(`chat_${roomId}`, JSON.stringify(messages.slice(-50))).catch(() => {})
      
      setTimeout(() => scrollRef.current?.scrollToOffset({ offset: 0, animated: false }), 50)
    }
  }, [messages.length, roomId])

  const handleSend = useCallback(async (textOverride?: string, mediaUri?: string, mediaType?: 'IMAGE' | 'FILE' | 'VOICE', fileInfo?: any) => {
    // Spec 10: Payload Sanitization
    // Limit to 2000 characters and trim excessive spaces/newlines
    let text = (textOverride ?? msgText).trim().substring(0, 2000)
    text = text.replace(/[\r\n]{3,}/g, '\n\n') // Max 2 consecutive newlines
    
    if (!text && !mediaUri) return
    setMsgText('')
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    getSocket()?.emit('stop-typing', { conversationId: roomId })

    const tempId = `temp-${Date.now()}`
    const optimistic: LocalMessage = {
      id: tempId,
      senderId: user?.id ?? '',
      content: text,
      createdAt: new Date().toISOString(),
      pending: true,
      reactions: [],
      type: mediaType ? mediaType : 'TEXT',
      mediaUrl: mediaUri,
    }
    setMessages((prev) => [...prev, optimistic])

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
        content: text, 
        type: mediaType ? mediaType : 'TEXT', 
        mediaUrl: finalMediaUrl 
      })
      const realMessage = res.data
      setMessages((prev) => prev.map((m) => m.id === tempId ? { ...m, pending: false, id: realMessage.id, mediaUrl: realMessage.mediaUrl || m.mediaUrl } : m))
      
      // Update React Query caches
      queryClient.setQueryData(['chat-messages', roomId], (old: any) => {
        if (!old || !old.pages || old.pages.length === 0) return old
        const newPages = [...old.pages]
        const firstPage = { ...newPages[0] }
        firstPage.messages = [realMessage, ...firstPage.messages]
        newPages[0] = firstPage
        return { ...old, pages: newPages }
      })

      queryClient.setQueryData(['chat-rooms'], (old: any) => {
        if (!old) return old
        return old.map((room: any) => {
          if (room.id === roomId) {
            return {
              ...room,
              lastMessage: realMessage,
              updatedAt: realMessage.createdAt
            }
          }
          return room
        }).sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      })

    } catch (err) {
      console.error('Send message error:', err)
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
    }
  }, [msgText, roomId, user?.id])

  const handleReact = useCallback((msgId: string, emojiRaw: string) => {
    // Spec 10: Sanitize emoji
    const emoji = emojiRaw.trim().substring(0, 10)
    
    setActiveReactMsgId(null)
    setMessages((prev) => prev.map((m) => {
      if (m.id !== msgId) return m
      let newReactions = m.reactions ? [...m.reactions] : []
      const existing = newReactions.find((r) => r.userId === user?.id)
      
      // Spec 4: Emoji Reaction Consistency
      if (existing && existing.emoji === emoji) {
        newReactions = newReactions.filter((r) => r.userId !== user?.id)
      } else {
        newReactions = newReactions.filter((r) => r.userId !== user?.id)
        newReactions.push({ emoji, userId: user?.id ?? '', username: user?.username })
      }
      return { ...m, reactions: newReactions }
    }))
    getSocket()?.emit('react-to-message', { messageId: msgId, emoji })
  }, [user?.id, user?.username])

  const handleTextChange = (txt: string) => {
    setMsgText(txt)
    
    // Debounce typing event (only emit if not typed in last 2 seconds)
    if (!typingTimeoutRef.current) {
      const socket = getSocket()
      if (socket?.connected && roomId) {
        socket.emit('typing', { conversationId: roomId })
      }
    } else {
      clearTimeout(typingTimeoutRef.current)
    }

    // Auto-stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      getSocket()?.emit('stop-typing', { conversationId: roomId })
      typingTimeoutRef.current = null
    }, 3000)
  }

  return {
    messages,
    isLoading,
    otherUser,
    isOtherUserTyping,
    isOtherUserOnline,
    msgText,
    handleTextChange,
    handleSend,
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




