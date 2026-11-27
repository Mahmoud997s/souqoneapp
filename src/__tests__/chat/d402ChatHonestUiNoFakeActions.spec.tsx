import React from 'react'
import fs from 'fs'
import path from 'path'
import { render, fireEvent, cleanup } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ChatRoom } from '../../types/listing.types'

jest.setTimeout(30000)

const mockRouterPush = jest.fn()
const mockShowActionSheet = jest.fn()

jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockRouterPush(...args), back: jest.fn() },
  useRouter: () => ({ push: (...args: unknown[]) => mockRouterPush(...args), back: jest.fn() }),
  useLocalSearchParams: () => ({ id: 'room-d402', otherUserName: 'سالم' }),
}))

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
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

jest.mock('../../hooks/useChatRoomLogic', () => ({
  useChatRoomLogic: () => ({
    messages: [],
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
  }),
}))

jest.mock('../../store/toastStore', () => {
  const actual = jest.requireActual('../../store/toastStore')
  return {
    ...actual,
    toastService: {
      ...actual.toastService,
      showActionSheet: (...args: unknown[]) => mockShowActionSheet(...args),
    },
  }
})

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  setNotificationChannelAsync: jest.fn(() => Promise.resolve()),
  getExpoPushTokenAsync: jest.fn(() => Promise.resolve({ data: 'ExponentPushToken[test]' })),
  AndroidImportance: { MAX: 5 },
}))

import * as Notifications from 'expo-notifications'
import ChatRoomScreen, { getDateLabel } from '../../../app/chat/[id]'
import { shouldShowNotificationInForeground } from '../../services/notifications'
import { useChatStore } from '../../store/chatStore'
import { chatApi } from '../../api/chat'
import { apiClient } from '../../api/client'

describe('D-402 — Honest Chat UI, Foreground Notification Filter, skipErrorDialog & Latin Date', () => {
  beforeEach(() => {
    mockRouterPush.mockClear()
    mockShowActionSheet.mockClear()
    useChatStore.setState({ activeRoomId: null })
  })

  afterEach(async () => {
    await cleanup()
  })

  it('1a. app/chat/[id].tsx has zero emoji and zero fake mute/report/block strings', () => {
    const repoRoot = path.resolve(__dirname, '..', '..', '..')
    const chatRoomSrc = fs.readFileSync(path.join(repoRoot, 'app', 'chat', '[id].tsx'), 'utf8')
    const emojiRegex = /[\u{1F300}-\u{1FAFF}]/u
    expect(emojiRegex.test(chatRoomSrc)).toBe(false)

    const forbiddenFakeActions = [
      'كتم الإشعارات',
      'تم كتم إشعارات المحادثة',
      'إبلاغ عن مستخدم',
      'تم إرسال البلاغ للإدارة للمراجعة',
      'حظر المستخدم',
      'تم حظر المستخدم',
    ]
    for (const str of forbiddenFakeActions) {
      expect(chatRoomSrc).not.toContain(str)
    }
  })

  it('1b. hides header action button when room has no listing, and opens listing directly without ActionSheet when listing exists', async () => {
    const qcNoListing = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const roomNoListing: ChatRoom = {
      id: 'room-d402',
      entityType: 'CAR',
      entityId: 'car-1',
      participants: [
        { id: 'user-me', username: 'me' },
        { id: 'user-other', username: 'other' },
      ],
      unreadCount: 0,
      archived: false,
      updatedAt: '2026-11-27T10:00:00.000Z',
    }
    qcNoListing.setQueryData(['chat-rooms'], [roomNoListing])

    const view1 = await render(
      <QueryClientProvider client={qcNoListing}>
        <ChatRoomScreen />
      </QueryClientProvider>
    )
    expect(view1.queryByTestId('chat-room-view-listing-btn')).toBeNull()
    expect(view1.queryByTestId('chat-room-options-btn')).toBeNull()
    await cleanup()

    const qcWithListing = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const roomWithListing: ChatRoom = {
      ...roomNoListing,
      listing: { id: 'car-99', title: 'تويوتا كامري' },
    }
    qcWithListing.setQueryData(['chat-rooms'], [roomWithListing])

    const view2 = await render(
      <QueryClientProvider client={qcWithListing}>
        <ChatRoomScreen />
      </QueryClientProvider>
    )
    const btn = view2.getByTestId('chat-room-view-listing-btn')
    fireEvent.press(btn)

    expect(mockShowActionSheet).not.toHaveBeenCalled()
    expect(mockRouterPush).toHaveBeenCalledTimes(1)
  })

  it('2. suppresses foreground push banner/sound/alert only when conversationId matches activeRoomId', async () => {
    expect(shouldShowNotificationInForeground({ conversationId: 'room-1' }, 'room-1')).toBe(false)
    expect(shouldShowNotificationInForeground({ conversationId: 'room-2' }, 'room-1')).toBe(true)
    expect(shouldShowNotificationInForeground(undefined, 'room-1')).toBe(true)
    expect(shouldShowNotificationInForeground({ conversationId: 'room-1' }, null)).toBe(true)

    const handlerArg = (Notifications.setNotificationHandler as jest.Mock).mock.calls[0]?.[0] as {
      handleNotification: (n: { request: { content: { data?: Record<string, unknown> } } }) => Promise<Record<string, boolean>>
    }
    expect(handlerArg?.handleNotification).toBeDefined()
    useChatStore.setState({ activeRoomId: 'room-1' })

    const sameRoomResult = await handlerArg.handleNotification({
      request: { content: { data: { conversationId: 'room-1' } } },
    })
    expect(sameRoomResult).toEqual({
      shouldShowAlert: false,
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: false,
      shouldShowList: false,
    })

    const otherRoomResult = await handlerArg.handleNotification({
      request: { content: { data: { conversationId: 'room-2' } } },
    })
    expect(otherRoomResult).toEqual({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    })
  })

  it('3. chatApi passes skipErrorDialog: true on inline/silent calls and omits it on createRoom', async () => {
    const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValue({ data: [] } as never)
    const postSpy = jest.spyOn(apiClient, 'post').mockResolvedValue({ data: {} } as never)
    const patchSpy = jest.spyOn(apiClient, 'patch').mockResolvedValue({ data: {} } as never)

    try {
      await chatApi.getRooms({ includeArchived: true })
      expect(getSpy).toHaveBeenCalledWith('/chat/conversations', {
        params: { includeArchived: true },
        skipErrorDialog: true,
      })

      await chatApi.getRooms()
      expect(getSpy).toHaveBeenCalledWith('/chat/conversations', { skipErrorDialog: true })

      await chatApi.getMessages('r1', 2, 30)
      expect(getSpy).toHaveBeenCalledWith('/chat/conversations/r1?page=2&limit=30', {
        skipErrorDialog: true,
      })

      await chatApi.markRoomRead('r1')
      expect(patchSpy).toHaveBeenCalledWith('/chat/conversations/r1/read', undefined, {
        skipErrorDialog: true,
      })

      await chatApi.archiveRoom('r1', true)
      expect(patchSpy).toHaveBeenCalledWith(
        '/chat/conversations/r1/archive',
        { archive: true },
        { skipErrorDialog: true }
      )

      await chatApi.sendMessage('r1', { content: 'مرحبا', type: 'TEXT' })
      expect(postSpy).toHaveBeenCalledWith(
        '/chat/conversations/r1/messages',
        { content: 'مرحبا', type: 'TEXT' },
        { skipErrorDialog: true }
      )

      await chatApi.createRoom({ entityType: 'CAR', entityId: 'c1' })
      expect(postSpy).toHaveBeenCalledWith('/chat/conversations', {
        entityType: 'CAR',
        entityId: 'c1',
      })
    } finally {
      getSpy.mockRestore()
      postSpy.mockRestore()
      patchSpy.mockRestore()
    }
  })

  it('4. getDateLabel formats non-today/yesterday dates with Latin digits (ar-OM-u-nu-latn)', () => {
    const label = getDateLabel('2026-11-20T09:00:00.000Z')
    expect(label).toMatch(/[0-9]/)
    expect(label).not.toMatch(/[\u0660-\u0669]/)
  })
})
