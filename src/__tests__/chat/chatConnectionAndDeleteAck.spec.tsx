import fs from 'fs'
import path from 'path'
import React from 'react'
import { render, fireEvent, waitFor, act, renderHook } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { ChatConnectionBanner } from '../../components/chat/ChatConnectionBanner'
import { Colors } from '../../constants/colors'
import { MessageBubble } from '../../components/chat/MessageBubble'
import ChatRoomScreen from '../../../app/chat/[id]'
import { chatApi } from '../../api/chat'
import { useSocketStore } from '../../store/socketStore'
import { useChatMessagesStore } from '../../store/chatMessagesStore'
import { useChatRoomLogic, LocalMessage } from '../../hooks/useChatRoomLogic'
import { dialogService } from '../../store/dialogStore'

jest.setTimeout(30000)

let mockSocket: any = {
  connected: true,
  emit: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
}

jest.mock('../../services/socket', () => ({
  getSocket: () => mockSocket,
}))

jest.mock('expo-audio', () => ({
  useAudioPlayer: () => ({ play: jest.fn(), pause: jest.fn(), replace: jest.fn() }),
  useAudioPlayerStatus: () => ({ isPlaying: false, currentTime: 0, duration: 0 }),
}))

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(),
}))

jest.mock('@gorhom/bottom-sheet', () => {
  const React = require('react')
  const { View } = require('react-native')
  const BottomSheetModal = React.forwardRef((props: any, ref: any) => {
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
    BottomSheetModalProvider: ({ children }: any) => children,
    BottomSheetBackdrop: View,
    BottomSheetView: View,
  }
})

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn() },
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({ id: 'room-test-1' }),
}))

jest.mock('../../api/chat', () => ({
  chatApi: {
    getRooms: jest.fn(),
    getMessages: jest.fn(),
    createRoom: jest.fn(),
    sendMessage: jest.fn(),
  },
}))

jest.mock('../../api/uploads', () => ({
  uploadsApi: {
    single: jest.fn(),
  },
}))

const mockUser = { id: 'user-me', username: 'tester' }
jest.mock('../../store/authStore', () => ({
  useAuthStore: Object.assign(
    (selector?: any) => (selector ? selector({ user: mockUser }) : { user: mockUser }),
    {
      getState: () => ({ user: mockUser }),
      setState: jest.fn(),
    }
  ),
}))

jest.mock('../../store/dialogStore', () => ({
  dialogService: {
    alert: jest.fn(),
    confirm: jest.fn(),
    showOptions: jest.fn(),
  },
}))

jest.mock('../../services/ChatSyncService', () => ({
  ChatSyncService: {
    joinRoom: jest.fn(),
    leaveRoom: jest.fn(),
  },
}))

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}))

jest.mock('react-native-reanimated', () => {
  const reanimated = require('react-native-reanimated/mock')
  return {
    ...reanimated,
    FadeInDown: { duration: () => ({}) },
    useSharedValue: jest.fn((init) => ({ value: init })),
    useAnimatedScrollHandler: jest.fn(() => jest.fn()),
    useAnimatedStyle: jest.fn((cb) => cb()),
    withTiming: jest.fn((val) => val),
  }
})

jest.mock('@shopify/flash-list', () => {
  const { View } = require('react-native')
  return {
    FlashList: ({ data, renderItem, ListFooterComponent }: any) => (
      <View>
        {data?.map((item: any, idx: number) => (
          <View key={item.id || idx}>{renderItem({ item, index: idx })}</View>
        ))}
        {ListFooterComponent}
      </View>
    ),
  }
})

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('Phase 5 (G3 + G5): ChatConnectionBanner & Delete Ack/Rollback (D-286)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useChatMessagesStore.getState().reset()
    useSocketStore.setState({ isConnected: true, lastError: null })
    mockSocket = {
      connected: true,
      emit: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
    }
    ;(chatApi.getMessages as jest.Mock).mockResolvedValue({
      data: { items: [], meta: { total: 0, page: 1, limit: 30, totalPages: 0 } },
    })
  })

  describe('Part A — ChatConnectionBanner (G3 / S8b)', () => {
    it('renders alert banner with testID="chat-connection-banner" and Arabic warning when disconnected', async () => {
      const { getByTestId, getByText } = await render(<ChatConnectionBanner isConnected={false} />)
      expect(getByTestId('chat-connection-banner')).toBeTruthy()
      expect(getByText('الاتصال الفوري غير مستقر — قد يتأخر استلام الرسائل أو تحديث حالتها')).toBeTruthy()
    })

    it('returns null when isConnected is true', async () => {
      const { queryByTestId } = await render(<ChatConnectionBanner isConnected={true} />)
      expect(queryByTestId('chat-connection-banner')).toBeNull()
    })

    it('reads isConnected reactively from useSocketStore when prop is omitted', async () => {
      useSocketStore.setState({ isConnected: false })
      const { getByTestId, rerender, queryByTestId } = await render(<ChatConnectionBanner />)
      expect(getByTestId('chat-connection-banner')).toBeTruthy()

      await act(async () => {
        useSocketStore.setState({ isConnected: true })
      })
      await rerender(<ChatConnectionBanner />)
      expect(queryByTestId('chat-connection-banner')).toBeNull()
    })

    it('resolves semantic Colors tokens in ChatConnectionBanner with zero raw hex in source (D-298)', async () => {
      const { getByTestId, getByText } = await render(<ChatConnectionBanner isConnected={false} />)
      const banner = getByTestId('chat-connection-banner')
      const message = getByText('الاتصال الفوري غير مستقر — قد يتأخر استلام الرسائل أو تحديث حالتها')

      // Assert rendered styles match semantic tokens
      expect(banner.props.style).toEqual(
        expect.objectContaining({
          backgroundColor: Colors.warningBg,
          borderBottomColor: Colors.warningBorder,
        })
      )
      expect(message.props.style).toEqual(
        expect.objectContaining({
          color: Colors.warningText,
        })
      )

      // Source-level teeth verification: ensure no raw hex (#...) or rgb/rgba literals exist
      const sourcePath = path.resolve(__dirname, '../../components/chat/ChatConnectionBanner.tsx')
      const sourceCode = fs.readFileSync(sourcePath, 'utf8')
      const hexOrRgbMatches = sourceCode.match(/#[0-9a-fA-F]{3,8}|rgba?\(/g) || []
      expect(hexOrRgbMatches).toEqual([])
    })

    it('renders ChatConnectionBanner in ChatRoomScreen below header when socket is disconnected', async () => {
      useSocketStore.setState({ isConnected: false })
      ;(chatApi.getMessages as jest.Mock).mockResolvedValueOnce({
        data: {
          items: [{ id: 'm-1', content: 'مرحبا', senderId: 'user-other', createdAt: new Date().toISOString() }],
          meta: { total: 1, page: 1, limit: 30, totalPages: 1 },
        },
      })

      const Wrapper = createWrapper()
      const { getByTestId } = await render(
        <Wrapper>
          <ChatRoomScreen />
        </Wrapper>
      )

      await waitFor(() => {
        expect(getByTestId('chat-connection-banner')).toBeTruthy()
      })
    })
  })

  describe('Part A — Honest Pending & Failed Message State (S8b + A-029 F5)', () => {
    it('renders clock icon with testID="chat-message-pending-icon" and no checkmarks for pending messages', async () => {
      const pendingMsg: LocalMessage = {
        id: 'msg-pending',
        senderId: 'user-me',
        content: 'رسالة قيد الإرسال',
        createdAt: new Date().toISOString(),
        pending: true,
        error: false,
      }

      const { getByTestId, queryByTestId } = await render(
        <MessageBubble
          msg={pendingMsg}
          isOwn={true}
          isActiveReactMsgId={false}
          onLongPress={jest.fn()}
        />
      )

      expect(getByTestId('chat-message-pending-icon')).toBeTruthy()
      expect(queryByTestId('chat-message-error-indicator')).toBeNull()
    })

    it('surfaces visible error indicator and alerts user with getMutationErrorMessage on send failure (A-029 F5)', async () => {
      const roomId = 'room-test-1'
      ;(chatApi.sendMessage as jest.Mock).mockRejectedValueOnce(
        new AxiosError('Network Error', 'ERR_NETWORK')
      )

      const Wrapper = createWrapper()
      const { result } = await renderHook(() => useChatRoomLogic(roomId), { wrapper: Wrapper })

      await act(async () => {
        await result.current.handleSend('نص تجريبي للفشل')
      })

      const messages = useChatMessagesStore.getState().messagesByRoom[roomId] || []
      expect(messages.length).toBe(1)
      expect(messages[0].pending).toBe(false)
      expect(messages[0].error).toBe(true)

      // Verifies dialogService.alert was called with classified error so failure is never silent
      expect(dialogService.alert).toHaveBeenCalledWith(
        'فشل الإرسال',
        'تعذر الاتصال بالإنترنت. يرجى التحقق من اتصالك والمحاولة مجدداً.'
      )

      // Verifies error bubble renders error indicator
      const { getByTestId } = await render(
        <MessageBubble
          msg={messages[0]}
          isOwn={true}
          isActiveReactMsgId={false}
          onLongPress={jest.fn()}
        />
      )
      expect(getByTestId('chat-message-error-indicator')).toBeTruthy()
    })

    it('surfaces visible error indicator and alerts user on retry failure', async () => {
      const roomId = 'room-test-1'
      const failedMsg: LocalMessage = {
        id: 'failed-msg-1',
        senderId: 'user-me',
        content: 'إعادة محاولة',
        createdAt: new Date().toISOString(),
        pending: false,
        error: true,
      }
      useChatMessagesStore.getState().addMessage(roomId, failedMsg)

      ;(chatApi.sendMessage as jest.Mock).mockRejectedValueOnce(
        new AxiosError('Server Error', 'ERR_BAD_RESPONSE', undefined, undefined, { status: 500 } as any)
      )

      const Wrapper = createWrapper()
      const { result } = await renderHook(() => useChatRoomLogic(roomId), { wrapper: Wrapper })

      await act(async () => {
        await result.current.handleRetry('failed-msg-1')
      })

      const messages = useChatMessagesStore.getState().messagesByRoom[roomId] || []
      expect(messages[0].error).toBe(true)
      expect(messages[0].pending).toBe(false)
      expect(dialogService.alert).toHaveBeenCalledWith(
        'فشل الإرسال',
        expect.stringContaining('حدث خطأ في الخادم')
      )
    })
  })

  describe('Part B — Delete Message with Server Ack & Rollback (G5 / K9)', () => {
    it('blocks local deletion and alerts user when socket is disconnected', async () => {
      mockSocket.connected = false
      const roomId = 'room-test-1'
      const ownMsg: LocalMessage = {
        id: 'msg-del-1',
        senderId: 'user-me',
        content: 'رسالتي للحذف',
        createdAt: new Date().toISOString(),
      }
      useChatMessagesStore.getState().addMessage(roomId, ownMsg)

      const Wrapper = createWrapper()
      const { result } = await renderHook(() => useChatRoomLogic(roomId), { wrapper: Wrapper })

      await act(async () => {
        result.current.handleDeleteMessage('msg-del-1')
      })

      expect(dialogService.alert).toHaveBeenCalledWith(
        'تنبيه',
        'لا يمكن حذف الرسالة أثناء انقطاع الاتصال الفوري'
      )
      // Message must NOT be removed or marked pendingDelete
      const current = useChatMessagesStore.getState().messagesByRoom[roomId] || []
      expect(current.length).toBe(1)
      expect(current[0].pendingDelete).toBeFalsy()
      expect(mockSocket.emit).not.toHaveBeenCalled()
    })

    it('blocks deleting other users messages (author check)', async () => {
      const roomId = 'room-test-1'
      const otherMsg: LocalMessage = {
        id: 'msg-other-1',
        senderId: 'user-other',
        content: 'رسالة شخص آخر',
        createdAt: new Date().toISOString(),
      }
      useChatMessagesStore.getState().addMessage(roomId, otherMsg)

      const Wrapper = createWrapper()
      const { result } = await renderHook(() => useChatRoomLogic(roomId), { wrapper: Wrapper })

      await act(async () => {
        result.current.handleDeleteMessage('msg-other-1')
      })

      expect(mockSocket.emit).not.toHaveBeenCalled()
      const current = useChatMessagesStore.getState().messagesByRoom[roomId] || []
      expect(current.length).toBe(1)
      expect(current[0].pendingDelete).toBeFalsy()
    })

    it('applies pendingDelete: true, reduced opacity, testID="chat-message-pending-delete", and disables actions in flight', async () => {
      const roomId = 'room-test-1'
      const ownMsg: LocalMessage = {
        id: 'msg-inflight-1',
        senderId: 'user-me',
        content: 'رسالة قيد الحذف',
        createdAt: new Date().toISOString(),
      }
      useChatMessagesStore.getState().addMessage(roomId, ownMsg)

      const Wrapper = createWrapper()
      const { result } = await renderHook(() => useChatRoomLogic(roomId), { wrapper: Wrapper })

      await act(async () => {
        result.current.handleDeleteMessage('msg-inflight-1')
      })

      const updated = useChatMessagesStore.getState().messagesByRoom[roomId]?.[0]
      expect(updated.pendingDelete).toBe(true)

      const onLongPressMock = jest.fn()
      const { getByTestId } = await render(
        <MessageBubble
          msg={updated}
          isOwn={true}
          isActiveReactMsgId={false}
          onLongPress={onLongPressMock}
        />
      )

      const bubble = getByTestId('chat-message-pending-delete')
      expect(bubble).toBeTruthy()
      expect(bubble.props.style).toEqual(
        expect.objectContaining({ opacity: 0.45 })
      )

      // Long press must be disabled while deletion is in flight
      fireEvent(bubble, 'longPress')
      expect(onLongPressMock).not.toHaveBeenCalled()
    })

    it('single-flight: ignores duplicate delete clicks while deletion is in flight', async () => {
      const roomId = 'room-test-1'
      const ownMsg: LocalMessage = {
        id: 'msg-single-flight',
        senderId: 'user-me',
        content: 'رسالة واحدة فقط',
        createdAt: new Date().toISOString(),
      }
      useChatMessagesStore.getState().addMessage(roomId, ownMsg)

      const Wrapper = createWrapper()
      const { result } = await renderHook(() => useChatRoomLogic(roomId), { wrapper: Wrapper })

      await act(async () => {
        result.current.handleDeleteMessage('msg-single-flight')
        result.current.handleDeleteMessage('msg-single-flight')
      })

      // Must only emit delete-message once
      expect(mockSocket.emit).toHaveBeenCalledTimes(1)
    })

    it('Case 1 (Ack Success): clears timeout and permanently removes message from store', async () => {
      const roomId = 'room-test-1'
      const ownMsg: LocalMessage = {
        id: 'msg-ack-ok',
        senderId: 'user-me',
        content: 'رسالة ستُحذف بنجاح',
        createdAt: new Date().toISOString(),
      }
      useChatMessagesStore.getState().addMessage(roomId, ownMsg)

      let ackCallback: any
      mockSocket.emit.mockImplementation((event: string, payload: any, callback: any) => {
        if (event === 'delete-message') {
          ackCallback = callback
        }
      })

      const Wrapper = createWrapper()
      const { result } = await renderHook(() => useChatRoomLogic(roomId), { wrapper: Wrapper })

      await act(async () => {
        result.current.handleDeleteMessage('msg-ack-ok')
      })

      expect(ackCallback).toBeDefined()

      // Server acks success
      await act(async () => {
        ackCallback({ success: true })
      })

      const remaining = useChatMessagesStore.getState().messagesByRoom[roomId] || []
      expect(remaining.find(m => m.id === 'msg-ack-ok')).toBeUndefined()
    })

    it('Case 2 (Ack Failure / Error): rolls back message, sets deleteError: true, and offers retry dialog', async () => {
      const roomId = 'room-test-1'
      const ownMsg: LocalMessage = {
        id: 'msg-ack-fail',
        senderId: 'user-me',
        content: 'رسالة سيفشل حذفها',
        createdAt: new Date().toISOString(),
      }
      useChatMessagesStore.getState().addMessage(roomId, ownMsg)

      let ackCallback: any
      mockSocket.emit.mockImplementation((event: string, payload: any, callback: any) => {
        if (event === 'delete-message') {
          ackCallback = callback
        }
      })

      const Wrapper = createWrapper()
      const { result } = await renderHook(() => useChatRoomLogic(roomId), { wrapper: Wrapper })

      await act(async () => {
        result.current.handleDeleteMessage('msg-ack-fail')
      })

      expect(ackCallback).toBeDefined()

      // Server acks failure
      await act(async () => {
        ackCallback({ success: false, message: 'انتهت مهلة الحذف المسموحة' })
      })

      const rolledBack = useChatMessagesStore.getState().messagesByRoom[roomId]?.[0]
      expect(rolledBack).toBeDefined()
      expect(rolledBack.pendingDelete).toBe(false)
      expect(rolledBack.deleteError).toBe(true)

      expect(dialogService.confirm).toHaveBeenCalledWith(
        'تعذر حذف الرسالة',
        'انتهت مهلة الحذف المسموحة',
        expect.any(Function),
        'إعادة المحاولة',
        'إلغاء'
      )
    })

    it('Case 3 (Ack Timeout): resets pendingDelete: false and calls refetch when timeout expires (8000ms)', async () => {
      jest.useFakeTimers()
      const roomId = 'room-test-1'
      const ownMsg: LocalMessage = {
        id: 'msg-ack-timeout',
        senderId: 'user-me',
        content: 'رسالة ستنتهي مهلتها',
        createdAt: new Date().toISOString(),
      }
      useChatMessagesStore.getState().addMessage(roomId, ownMsg)

      const Wrapper = createWrapper()
      const { result } = await renderHook(() => useChatRoomLogic(roomId), { wrapper: Wrapper })

      await act(async () => {
        result.current.handleDeleteMessage('msg-ack-timeout')
      })

      expect(useChatMessagesStore.getState().messagesByRoom[roomId]?.[0].pendingDelete).toBe(true)

      // Fast-forward past 8000ms
      act(() => {
        jest.advanceTimersByTime(8000)
      })

      const resetMsg = useChatMessagesStore.getState().messagesByRoom[roomId]?.[0]
      expect(resetMsg.pendingDelete).toBe(false)

      jest.useRealTimers()
    })

    it('restoreMessageInOrder preserves chronological ordering when restoring a message', () => {
      const roomId = 'room-order-test'
      const msg1: LocalMessage = {
        id: 'm1',
        senderId: 'user-me',
        content: 'الأولى',
        createdAt: '2026-11-12T00:00:00.000Z',
      }
      const msg3: LocalMessage = {
        id: 'm3',
        senderId: 'user-me',
        content: 'الثالثة',
        createdAt: '2026-11-12T00:02:00.000Z',
      }
      useChatMessagesStore.getState().addMessages(roomId, [msg1, msg3])

      const msg2: LocalMessage = {
        id: 'm2',
        senderId: 'user-me',
        content: 'الثانية (مستعادة)',
        createdAt: '2026-11-12T00:01:00.000Z',
        pendingDelete: true,
      }

      useChatMessagesStore.getState().restoreMessageInOrder(roomId, msg2)

      const ordered = useChatMessagesStore.getState().messagesByRoom[roomId]
      expect(ordered.map(m => m.id)).toEqual(['m1', 'm2', 'm3'])
      expect(ordered[1].pendingDelete).toBe(false)
    })
  })
})
