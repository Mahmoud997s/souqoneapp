import React from 'react'
import { render, fireEvent, waitFor, act } from '@testing-library/react-native'
import { renderHook } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { useChatRooms } from '../../hooks/useChat'
import ChatListScreen from '../../../app/(tabs)/chat'
import ChatRoomScreen from '../../../app/chat/[id]'
import { chatApi } from '../../api/chat'

jest.setTimeout(30000)

jest.mock('expo-audio', () => ({
  useAudioPlayer: () => ({ play: jest.fn(), pause: jest.fn(), replace: jest.fn() }),
  useAudioPlayerStatus: () => ({ isPlaying: false, currentTime: 0, duration: 0 }),
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
  useLocalSearchParams: () => ({ id: 'room-1' }),
}))

jest.mock('../../api/chat', () => ({
  chatApi: {
    getRooms: jest.fn(),
    getMessages: jest.fn(),
    createRoom: jest.fn(),
    sendMessage: jest.fn(),
  },
}))

jest.mock('../../store/authStore', () => ({
  useAuthStore: () => ({ user: { id: 'user-1' } }),
}))

jest.mock('../../store/archiveStore', () => ({
  useArchiveStore: () => ({ archivedIds: [], toggleArchive: jest.fn() }),
}))

jest.mock('../../store/pinStore', () => ({
  usePinStore: () => ({ pinnedIds: [], togglePin: jest.fn() }),
}))

jest.mock('../../hooks/useScrollAwareNav', () => ({
  useScrollAwareNav: () => ({ scrollHandler: jest.fn(), scrollY: { value: 0 } }),
}))

jest.mock('../../context/NavVisibilityContext', () => ({
  useNavVisibility: () => ({ navHidden: { value: 0 } }),
}))

jest.mock('../../services/ChatSyncService', () => ({
  ChatSyncService: {
    joinRoom: jest.fn(),
    leaveRoom: jest.fn(),
  },
}))

jest.mock('../../services/socket', () => ({
  getSocket: () => ({
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
  }),
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

describe('Chat Error & Stale States (R7-1)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('useChatRooms parseListEnvelope contract', () => {
    it('parses { items }, legacy { data }, plain array, and rejects corrupt envelope', async () => {
      ;(chatApi.getRooms as jest.Mock).mockResolvedValueOnce({
        data: { items: [{ id: 'room-items', unreadCount: 0 }] },
      })

      const hook1 = await renderHook(() => useChatRooms(), { wrapper: createWrapper() })
      await waitFor(() => {
        expect(hook1.result.current.data?.[0]?.id).toBe('room-items')
      })

      ;(chatApi.getRooms as jest.Mock).mockResolvedValueOnce({
        data: { data: [{ id: 'room-data', unreadCount: 0 }] },
      })
      const hook2 = await renderHook(() => useChatRooms(), { wrapper: createWrapper() })
      await waitFor(() => {
        expect(hook2.result.current.data?.[0]?.id).toBe('room-data')
      })

      ;(chatApi.getRooms as jest.Mock).mockResolvedValueOnce({
        data: [{ id: 'room-array', unreadCount: 0 }],
      })
      const hook3 = await renderHook(() => useChatRooms(), { wrapper: createWrapper() })
      await waitFor(() => {
        expect(hook3.result.current.data?.[0]?.id).toBe('room-array')
      })

      ;(chatApi.getRooms as jest.Mock).mockResolvedValueOnce({
        data: { corruptPayload: true },
      })
      const hook4 = await renderHook(() => useChatRooms(), { wrapper: createWrapper() })
      await waitFor(() => {
        expect(hook4.result.current.isError).toBe(true)
      })
    })
  })

  describe('ChatListScreen (app/(tabs)/chat.tsx)', () => {
    it('renders classified empty error state with retry when isError and allRooms is empty', async () => {
      ;(chatApi.getRooms as jest.Mock)
        .mockRejectedValueOnce(new AxiosError('Network Error', 'ERR_NETWORK'))
        .mockResolvedValueOnce({
          data: [{ id: 'room-recovered', unreadCount: 0, participants: [] }],
        })

      const Wrapper = createWrapper()
      const { getByTestId, getByText } = await render(
        <Wrapper>
          <ChatListScreen />
        </Wrapper>
      )

      await waitFor(() => {
        expect(getByTestId('chat-list-error-state')).toBeTruthy()
      })
      expect(getByText('لا يوجد اتصال بالإنترنت')).toBeTruthy()

      fireEvent.press(getByText('إعادة المحاولة'))

      await waitFor(() => {
        expect(chatApi.getRooms).toHaveBeenCalledTimes(2)
      })
    })

    it('renders StaleDataBanner above cached rooms when isRefetchError occurs', async () => {
      ;(chatApi.getRooms as jest.Mock)
        .mockResolvedValueOnce({
          data: [
            {
              id: 'room-1',
              unreadCount: 0,
              updatedAt: new Date().toISOString(),
              participants: [{ id: 'user-2', displayName: 'سالم المعمري' }],
              lastMessage: { content: 'السلام عليكم', createdAt: new Date().toISOString() },
            },
          ],
        })
        .mockRejectedValueOnce(new AxiosError('Server Error', 'ERR_BAD_RESPONSE', undefined, undefined, { status: 500 } as any))

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false, gcTime: Infinity } },
      })

      const { getByTestId, getByText } = await render(
        <QueryClientProvider client={queryClient}>
          <ChatListScreen />
        </QueryClientProvider>
      )

      await waitFor(() => {
        expect(getByText('سالم المعمري')).toBeTruthy()
      })

      // Refetch that fails
      await act(async () => {
        await queryClient.refetchQueries({ queryKey: ['chat-rooms'] })
      })

      await waitFor(() => {
        expect(getByTestId('chat-list-stale-banner')).toBeTruthy()
        expect(getByTestId('stale-data-banner')).toBeTruthy()
      })
      expect(getByText('سالم المعمري')).toBeTruthy()
    })
  })

  describe('ChatRoomScreen (app/chat/[id].tsx)', () => {
    it('shows classified error state with retry when messages fail to load initially', async () => {
      ;(chatApi.getMessages as jest.Mock)
        .mockRejectedValueOnce(new AxiosError('Server Error', 'ERR_BAD_RESPONSE', undefined, undefined, { status: 500 } as any))
        .mockResolvedValueOnce({
          data: {
            items: [{ id: 'm-1', content: 'أهلاً بك', senderId: 'user-2', createdAt: new Date().toISOString() }],
            meta: { total: 1, page: 1, limit: 30, totalPages: 1 },
          },
        })

      const Wrapper = createWrapper()
      const { getByTestId, getByText } = await render(
        <Wrapper>
          <ChatRoomScreen />
        </Wrapper>
      )

      await waitFor(() => {
        expect(getByTestId('chat-room-error-state')).toBeTruthy()
      })
      expect(getByText('خطأ في الخادم')).toBeTruthy()

      fireEvent.press(getByTestId('chat-room-retry-btn'))

      await waitFor(() => {
        expect(chatApi.getMessages).toHaveBeenCalledTimes(2)
      })
    })
  })
})
