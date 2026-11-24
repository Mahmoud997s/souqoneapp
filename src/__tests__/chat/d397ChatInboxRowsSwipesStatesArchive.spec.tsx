import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { chatApi } from '../../api/chat'
import ChatListScreen from '../../../app/(tabs)/chat'
import { toastService } from '../../store/toastStore'
import type { ChatRoom } from '../../types/listing.types'

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn() },
}))

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'Light', Medium: 'Medium' },
}))

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}))

jest.mock('../../components/navigation/glassSupport', () => ({
  GlassSurface: 'GlassSurface',
  useGlassSupport: () => ({ mode: 'solid' }),
}))

jest.mock('../../store/authStore', () => ({
  useAuthStore: () => ({ user: { id: 'user-1' } }),
}))

jest.mock('../../store/pinStore', () => ({
  usePinStore: () => ({ pinnedIds: [], togglePin: jest.fn() }),
}))

jest.mock('../../store/socketStore', () => ({
  useSocketStore: (sel: (s: { isConnected: boolean }) => boolean) => sel({ isConnected: true }),
}))

jest.mock('../../api/chat', () => ({
  chatApi: {
    getRooms: jest.fn(),
    getMessages: jest.fn(),
    createRoom: jest.fn(),
    sendMessage: jest.fn(),
    archiveRoom: jest.fn(),
    markRoomRead: jest.fn(),
  },
}))

const createRoom = (overrides: Partial<ChatRoom> = {}): ChatRoom => ({
  id: 'room-1',
  entityType: 'CAR',
  entityId: 'car-1',
  archived: false,
  unreadCount: 2,
  updatedAt: new Date().toISOString(),
  participants: [
    { id: 'user-1', username: 'me', displayName: 'أنا' },
    { id: 'user-2', username: 'mohammed', displayName: 'محمد الكندي' },
  ],
  listing: {
    id: 'car-1',
    title: 'تويوتا كامري 2022',
    price: 9500,
    userId: 'user-2',
  },
  lastMessage: {
    id: 'msg-1',
    senderId: 'user-2',
    content: 'هل السيارة متاحة؟',
    createdAt: new Date().toISOString(),
    type: 'TEXT',
  },
  ...overrides,
})

async function renderWithQuery(ui: React.ReactElement) {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  })
  const view = await render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
  return { qc, ...view }
}

jest.setTimeout(30000)

describe('D-397 — Chat Inbox Rows, Swipes, States & Server Archive', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('4. end-swipe archive optimistically removes room and calls archiveRoom(id, true), rolling back with error toast on failure', async () => {
    const room = createRoom({ id: 'room-arch-1', archived: false })
    ;(chatApi.getRooms as jest.Mock).mockResolvedValue({ data: [room] })
    ;(chatApi.archiveRoom as jest.Mock).mockRejectedValueOnce(new Error('network error'))
    const toastSpy = jest.spyOn(toastService, 'show')

    const { getByTestId } = await renderWithQuery(<ChatListScreen />)
    await waitFor(() => expect(getByTestId('chat-row-room-arch-1')).toBeTruthy(), { timeout: 10000 })

    const archiveBtn = getByTestId('chat-swipe-archive-room-arch-1')
    fireEvent.press(archiveBtn)

    await waitFor(() => expect(chatApi.archiveRoom).toHaveBeenCalledWith('room-arch-1', true))
    await waitFor(() =>
      expect(toastSpy).toHaveBeenCalledWith(
        expect.objectContaining({ kind: 'error' })
      )
    )
    await waitFor(() => expect(getByTestId('chat-row-room-arch-1')).toBeTruthy())
    await waitFor(() => expect(chatApi.getRooms).toHaveBeenCalledTimes(2))
    toastSpy.mockRestore()
  })

  it('5. Archive tab lists only archived rooms and shows استعادة calling archiveRoom(id, false)', async () => {
    const activeRoom = createRoom({ id: 'room-active', archived: false })
    const archivedRoom = createRoom({ id: 'room-archived', archived: true })
    ;(chatApi.getRooms as jest.Mock).mockResolvedValue({ data: [activeRoom, archivedRoom] })
    ;(chatApi.archiveRoom as jest.Mock).mockResolvedValue({ data: { message: 'تم إلغاء الأرشفة' } })

    const { getByTestId, queryByTestId, getByText } = await renderWithQuery(<ChatListScreen />)
    await waitFor(() => expect(getByTestId('chat-row-room-active')).toBeTruthy(), { timeout: 10000 })
    expect(queryByTestId('chat-row-room-archived')).toBeNull()

    fireEvent.press(getByTestId('chat-filter-tab-archived'))

    await waitFor(() => expect(getByTestId('chat-row-room-archived')).toBeTruthy())
    expect(queryByTestId('chat-row-room-active')).toBeNull()
    expect(getByText('استعادة')).toBeTruthy()

    fireEvent.press(getByTestId('chat-swipe-archive-room-archived'))
    await waitFor(() => expect(chatApi.archiveRoom).toHaveBeenCalledWith('room-archived', false))
  })

  it('6a. each empty state renders its single 44px button with the expected label', async () => {
    ;(chatApi.getRooms as jest.Mock).mockResolvedValue({ data: [] })
    const { getByTestId, getByText } = await renderWithQuery(<ChatListScreen />)

    await waitFor(() => expect(getByTestId('chat-empty-default')).toBeTruthy(), { timeout: 10000 })
    expect(getByText('تصفح الإعلانات')).toBeTruthy()

    fireEvent.press(getByTestId('chat-filter-tab-unread'))
    await waitFor(() => expect(getByTestId('chat-empty-unread')).toBeTruthy())
    expect(getByText('عرض كل المحادثات')).toBeTruthy()

    fireEvent.changeText(getByTestId('chat-search-input'), 'بورش')
    await waitFor(() => expect(getByTestId('chat-empty-search')).toBeTruthy())
    expect(getByText('مسح البحث')).toBeTruthy()
  })

  it('6b. error state renders its single 44px button with the expected label', async () => {
    ;(chatApi.getRooms as jest.Mock).mockRejectedValueOnce(new Error('500'))
    const { getByTestId, getByText } = await renderWithQuery(<ChatListScreen />)
    await waitFor(() => expect(getByTestId('chat-list-error-state')).toBeTruthy(), { timeout: 10000 })
    expect(getByText('إعادة المحاولة')).toBeTruthy()
  })
})
