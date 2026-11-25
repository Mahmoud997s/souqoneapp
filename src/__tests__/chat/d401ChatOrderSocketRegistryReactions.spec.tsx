import React from 'react'
import { AppState, type AppStateStatus } from 'react-native'
import { render, cleanup, act } from '@testing-library/react-native'
import type { ChatRoom } from '../../types/listing.types'
import type { LocalMessage } from '../../hooks/useChatRoomLogic'

jest.setTimeout(30000)

type SocketCallback = (...args: unknown[]) => void

interface MockSocket {
  id: string
  connected: boolean
  io: { opts: { reconnection: boolean } }
  auth: Record<string, unknown>
  handlers: Map<string, SocketCallback[]>
  on: jest.Mock
  off: jest.Mock
  emit: jest.Mock
  connect: jest.Mock
  disconnect: jest.Mock
  trigger: (event: string, ...args: unknown[]) => void
}

const mockCreatedSockets: MockSocket[] = []

function mockCreateSocket(): MockSocket {
  const handlers = new Map<string, SocketCallback[]>()
  const sock: MockSocket = {
    id: `sock-${mockCreatedSockets.length + 1}`,
    connected: false,
    io: { opts: { reconnection: true } },
    auth: {},
    handlers,
    on: jest.fn((event: string, cb: SocketCallback) => {
      const list = handlers.get(event) ?? []
      list.push(cb)
      handlers.set(event, list)
      return sock
    }),
    off: jest.fn((event: string, cb?: SocketCallback) => {
      if (!cb) {
        handlers.delete(event)
      } else {
        const list = (handlers.get(event) ?? []).filter((fn) => fn !== cb)
        if (list.length > 0) handlers.set(event, list)
        else handlers.delete(event)
      }
      return sock
    }),
    emit: jest.fn(),
    connect: jest.fn(() => {
      sock.connected = true
      sock.trigger('connect')
      return sock
    }),
    disconnect: jest.fn(() => {
      sock.connected = false
      return sock
    }),
    trigger: (event: string, ...args: unknown[]) => {
      const list = handlers.get(event) ?? []
      list.forEach((fn) => fn(...args))
    },
  }
  mockCreatedSockets.push(sock)
  return sock
}

jest.mock('socket.io-client', () => ({
  io: jest.fn(() => mockCreateSocket()),
}))

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve('test-token')),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}))

jest.mock('@expo/vector-icons', () => {
  const React = require('react')
  const { Text } = require('react-native')
  return {
    Ionicons: (props: { name: string }) => <Text testID={`ionicon-${props.name}`} />,
  }
})

jest.mock('expo-image', () => {
  const React = require('react')
  const { View } = require('react-native')
  return {
    Image: (props: Record<string, unknown>) => <View testID="expo-image" {...props} />,
  }
})

jest.mock('expo-linear-gradient', () => {
  const React = require('react')
  const { View } = require('react-native')
  return {
    LinearGradient: (props: Record<string, unknown>) => <View {...props} />,
  }
})

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
}))

jest.mock('expo-audio', () => ({
  useAudioPlayer: () => ({ play: jest.fn(), pause: jest.fn(), replace: jest.fn() }),
  useAudioPlayerStatus: () => ({ playing: false, currentTime: 0, duration: 0 }),
}))

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(),
}))

jest.mock('@gorhom/bottom-sheet', () => {
  const React = require('react')
  const { View } = require('react-native')
  const BottomSheetModal = React.forwardRef((props: { children?: React.ReactNode }, ref: React.Ref<unknown>) => {
    React.useImperativeHandle(ref, () => ({
      present: jest.fn(),
      dismiss: jest.fn(),
      close: jest.fn(),
      snapToIndex: jest.fn(),
    }))
    return <View testID="mock-bottom-sheet-modal">{props.children}</View>
  })
  return {
    BottomSheetModal,
    BottomSheetModalProvider: ({ children }: { children: React.ReactNode }) => children,
    BottomSheetBackdrop: View,
    BottomSheetView: View,
  }
})

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn() },
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({ id: 'room-order-1', otherUserName: 'سالم' }),
}))

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}))

const mockUseChatRoomLogic = jest.fn()
jest.mock('../../hooks/useChatRoomLogic', () => ({
  useChatRoomLogic: (...args: unknown[]) => mockUseChatRoomLogic(...args),
}))

let mockCapturedFlashListProps: Record<string, unknown> | null = null

jest.mock('@shopify/flash-list', () => {
  const actual = jest.requireActual('@shopify/flash-list')
  const React = require('react')
  return {
    ...actual,
    FlashList: React.forwardRef((props: Record<string, unknown>, ref: React.Ref<unknown>) => {
      mockCapturedFlashListProps = props
      return React.createElement(actual.FlashList, { ...props, ref })
    }),
  }
})

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ChatRoomScreen from '../../../app/chat/[id]'
import { socketService } from '../../services/socket'
import { ChatSyncService } from '../../services/ChatSyncService'
import { GlobalSocketHandler } from '../../components/GlobalSocketHandler'
import { useChatMessagesStore } from '../../store/chatMessagesStore'
import { useChatStore } from '../../store/chatStore'
import { useAuthStore } from '../../store/authStore'
import { useSocketStore } from '../../store/socketStore'
import { CHAT_POLL_FALLBACK_MS, getChatRoomsRefetchInterval } from '../../hooks/useChat'

function collectTextNodes(node: unknown, out: string[] = []): string[] {
  if (typeof node === 'string') {
    out.push(node)
    return out
  }
  if (!node || typeof node !== 'object') return out
  const record = node as { children?: unknown[] }
  if (Array.isArray(record.children)) {
    record.children.forEach((child) => collectTextNodes(child, out))
  }
  return out
}

describe('D-401 — Chat Room Order, Socket Registry, Single Unread, Reactions & Polling', () => {
  beforeEach(() => {
    mockCapturedFlashListProps = null
    mockCreatedSockets.length = 0
    socketService.disconnect()
    useChatMessagesStore.getState().reset()
    useChatStore.setState({ activeRoomId: null })
    useSocketStore.setState({ isConnected: false, lastError: null, retryCount: 0 })
    useAuthStore.setState({
      isLoggedIn: true,
      user: { id: 'user-me', username: 'me', displayName: 'أنا' } as never,
    })
  })

  afterEach(async () => {
    await cleanup()
  })

  it('(b) socketService registry re-attaches listeners across disconnect + connect and fires once after 5 cycles', async () => {
    const handler = jest.fn()
    socketService.listen('message', handler)

    try {
      await socketService.connect()
      expect(mockCreatedSockets).toHaveLength(1)
      const sock1 = mockCreatedSockets[0]
      await act(async () => {
        sock1.trigger('message', { id: 'e1' })
      })
      expect(handler).toHaveBeenCalledTimes(1)

      for (let i = 0; i < 5; i++) {
        socketService.disconnect()
        await socketService.connect()
      }

      const latestSocket = mockCreatedSockets[mockCreatedSockets.length - 1]
      expect(latestSocket).not.toBe(sock1)

      await act(async () => {
        latestSocket.trigger('message', { id: 'e2' })
      })
      // 1 from sock1 + 1 from latestSocket = 2 total (NOT 6)
      expect(handler).toHaveBeenCalledTimes(2)
    } finally {
      socketService.off('message', handler)
    }
  })

  it('(c)+(e) single unread +1 on incoming message, own-sender leaves unread unchanged, and MESSAGE notification dedupes by id', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const initialRooms: ChatRoom[] = [
      {
        id: 'room-bg',
        entityType: 'CAR',
        entityId: 'car-1',
        participants: [
          { id: 'user-me', username: 'me' },
          { id: 'user-other', username: 'other' },
        ],
        unreadCount: 2,
        archived: false,
        updatedAt: '2026-11-24T10:00:00.000Z',
        lastMessage: {
          id: 'prev-1',
          senderId: 'user-other',
          content: 'قديمة',
          createdAt: '2026-11-24T10:00:00.000Z',
        },
      },
    ]
    qc.setQueryData(['chat-rooms'], initialRooms)

    ChatSyncService.init(qc)

    await render(
      <QueryClientProvider client={qc}>
        <GlobalSocketHandler />
      </QueryClientProvider>
    )

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0))
      await socketService.connect()
    })

    const sock = mockCreatedSockets[mockCreatedSockets.length - 1]
    expect(sock).toBeDefined()
    expect(Array.from(sock.handlers.keys())).toContain('notification')

    // Incoming message from other user -> unread 2 -> 3 (NOT 4)
    await act(async () => {
      sock.trigger('message', {
        id: 'msg-incoming-1',
        conversationId: 'room-bg',
        senderId: 'user-other',
        content: 'صورة جديدة',
        type: 'IMAGE',
        mediaUrl: 'https://cdn.example/img.jpg',
        createdAt: '2026-11-24T10:05:00.000Z',
      })
    })

    let rooms = qc.getQueryData<ChatRoom[]>(['chat-rooms'])!
    expect(rooms[0].unreadCount).toBe(3)
    expect(rooms[0].lastMessage?.type).toBe('IMAGE')
    expect(rooms[0].lastMessage?.mediaUrl).toBe('https://cdn.example/img.jpg')

    // Backend notification with type === 'MESSAGE' for the SAME message id -> deduped (stays 3)
    await act(async () => {
      sock.trigger('notification', {
        type: 'MESSAGE',
        payload: {
          id: 'msg-incoming-1',
          conversationId: 'room-bg',
          senderId: 'user-other',
          content: 'صورة جديدة',
          createdAt: '2026-11-24T10:05:00.000Z',
        },
      })
    })

    rooms = qc.getQueryData<ChatRoom[]>(['chat-rooms'])!
    expect(rooms[0].unreadCount).toBe(3)

    // Backend notification with type === 'MESSAGE' for a NEW message id -> increments once (3 -> 4)
    await act(async () => {
      sock.trigger('notification', {
        type: 'MESSAGE',
        payload: {
          id: 'msg-notif-2',
          conversationId: 'room-bg',
          senderId: 'user-other',
          content: 'من الإشعار',
          createdAt: '2026-11-24T10:06:00.000Z',
        },
      })
    })

    rooms = qc.getQueryData<ChatRoom[]>(['chat-rooms'])!
    expect(rooms[0].unreadCount).toBe(4)

    // Own-sender message from another device -> MUST NOT zero unreadCount (stays 4)
    await act(async () => {
      sock.trigger('message', {
        id: 'msg-own-3',
        conversationId: 'room-bg',
        senderId: 'user-me',
        content: 'من جهازي الثاني',
        createdAt: '2026-11-24T10:07:00.000Z',
      })
    })

    rooms = qc.getQueryData<ChatRoom[]>(['chat-rooms'])!
    expect(rooms[0].unreadCount).toBe(4)
  })

  it('(d) reaction action === "removed" removes that user reaction from store', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    ChatSyncService.init(qc)
    await socketService.connect()

    useChatMessagesStore.getState().addMessage('room-react', {
      id: 'm-react-1',
      senderId: 'user-other',
      content: 'مرحبا',
      createdAt: '2026-11-24T12:00:00.000Z',
      reactions: [
        { emoji: '👍', userId: 'user-me' },
        { emoji: '❤️', userId: 'user-other' },
      ],
    })

    const sock = mockCreatedSockets[mockCreatedSockets.length - 1]
    await act(async () => {
      sock.trigger('message-reaction', {
        conversationId: 'room-react',
        messageId: 'm-react-1',
        emoji: '👍',
        userId: 'user-me',
        action: 'removed',
      })
    })

    const updated = useChatMessagesStore.getState().messagesByRoom['room-react'][0]
    expect(updated.reactions).toEqual([{ emoji: '❤️', userId: 'user-other' }])
  })

  it('(f) polling interval is false when socket connected + app active, and 60000ms fallback otherwise', () => {
    expect(CHAT_POLL_FALLBACK_MS).toBe(60000)
    expect(getChatRoomsRefetchInterval(true, 'active')).toBe(false)
    expect(getChatRoomsRefetchInterval(false, 'active')).toBe(60000)
    expect(getChatRoomsRefetchInterval(true, 'background')).toBe(60000)
    expect(getChatRoomsRefetchInterval(false, 'inactive' as AppStateStatus)).toBe(60000)
  })

  it('(a)+(g) real FlashList renders oldest message first, newest last, with ascending date dividers', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const day1 = '2026-11-20T09:00:00.000Z'
    const day1Later = '2026-11-20T10:30:00.000Z'
    const day2 = '2026-11-21T08:00:00.000Z'

    const ascendingMessages: LocalMessage[] = [
      { id: 'm1', senderId: 'user-other', content: 'OLDEST_MSG_1', createdAt: day1 },
      { id: 'm2', senderId: 'user-me', content: 'MIDDLE_MSG_2', createdAt: day1Later },
      { id: 'm3', senderId: 'user-other', content: 'NEWEST_MSG_3', createdAt: day2 },
    ]

    mockUseChatRoomLogic.mockReturnValue({
      messages: ascendingMessages,
      isLoading: false,
      isError: false,
      error: null,
      isRefetchError: false,
      isRefetching: false,
      refetch: jest.fn(),
      otherUser: { id: 'user-other', name: 'سالم' },
      isOtherUserTyping: false,
      isOtherUserOnline: true,
      msgText: '',
      handleTextChange: jest.fn(),
      handleSend: jest.fn(),
      handleCancelUpload: jest.fn(),
      handleRetry: jest.fn(),
      handleRemoveFailedMessage: jest.fn(),
      handleDeleteMessage: jest.fn(),
      handleReact: jest.fn(),
      activeReactMsgId: null,
      setActiveReactMsgId: jest.fn(),
      scrollRef: { current: null },
      user: { id: 'user-me' },
      replyingToMessage: null,
      setReplyingToMessage: jest.fn(),
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    })

    const view = await render(
      <QueryClientProvider client={qc}>
        <ChatRoomScreen />
      </QueryClientProvider>
    )

    expect(mockCapturedFlashListProps).not.toBeNull()
    expect(mockCapturedFlashListProps?.inverted).toBeUndefined()
    expect((mockCapturedFlashListProps?.data as LocalMessage[]).map((m) => m.id)).toEqual([
      'm1',
      'm2',
      'm3',
    ])
    expect(mockCapturedFlashListProps?.maintainVisibleContentPosition).toEqual({
      autoscrollToBottomThreshold: 0.2,
      startRenderingFromBottom: true,
    })
    expect(typeof mockCapturedFlashListProps?.onStartReached).toBe('function')
    expect(mockCapturedFlashListProps?.onEndReached).toBeUndefined()

    const treeText = collectTextNodes(view.toJSON()).join(' | ')
    expect(treeText).toContain('OLDEST_MSG_1')
    expect(treeText).toContain('MIDDLE_MSG_2')
    expect(treeText).toContain('NEWEST_MSG_3')

    // Date dividers: Day 1 has divider before m1, NO divider between m1 & m2 (same day), Day 2 has divider before m3
    const dividers = view.getAllByTestId('chat-date-divider')
    expect(dividers).toHaveLength(2)
  })
})
