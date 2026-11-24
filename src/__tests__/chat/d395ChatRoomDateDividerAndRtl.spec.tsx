import React from 'react'
import { StyleSheet } from 'react-native'
import { render, cleanup, screen } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ChatRoomScreen from '../../../app/chat/[id]'
import { MessageBubble } from '../../components/chat/MessageBubble'
import { AttachmentCard } from '../../components/chat/AttachmentCard'
import type { LocalMessage } from '../../hooks/useChatRoomLogic'

jest.setTimeout(30000)

jest.mock('@expo/vector-icons', () => {
  const React = require('react')
  const { Text } = require('react-native')
  return {
    Ionicons: (props: any) => <Text testID={`ionicon-${props.name}`} {...props} />,
  }
})

jest.mock('expo-image', () => {
  const React = require('react')
  const { View } = require('react-native')
  return {
    Image: (props: any) => <View testID="expo-image" {...props} />,
  }
})

jest.mock('expo-linear-gradient', () => {
  const React = require('react')
  const { View } = require('react-native')
  return {
    LinearGradient: (props: any) => <View {...props} />,
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
  useLocalSearchParams: () => ({ id: 'room-d395', otherUserName: 'أحمد' }),
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

jest.mock('react-native-gesture-handler', () => {
  const React = require('react')
  const { View } = require('react-native')
  return {
    Swipeable: ({ children }: any) => <View>{children}</View>,
  }
})

jest.mock('@shopify/flash-list', () => {
  const React = require('react')
  const { View } = require('react-native')
  return {
    FlashList: ({ data, renderItem, ListFooterComponent }: any) => (
      <View testID="mock-flash-list">
        {data?.map((item: any, idx: number) => (
          <View key={item.id || idx} testID={`flashlist-item-${item.id}`}>
            {renderItem({ item, index: idx })}
          </View>
        ))}
        {ListFooterComponent}
      </View>
    ),
  }
})

let mockMessages: LocalMessage[] = []

jest.mock('../../hooks/useChatRoomLogic', () => ({
  useChatRoomLogic: () => ({
    messages: mockMessages,
    isLoading: false,
    isError: false,
    error: null,
    isRefetchError: false,
    isRefetching: false,
    refetch: jest.fn(),
    otherUser: { id: 'user-other', name: 'أحمد' },
    isOtherUserTyping: false,
    isOtherUserOnline: true,
    msgText: '',
    handleTextChange: jest.fn(),
    handleSend: jest.fn(),
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

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

function flattenTreeOrder(node: any, out: Array<{ testID?: string; text?: string }> = []) {
  if (!node || typeof node !== 'object') return out
  if (Array.isArray(node)) {
    for (const child of node) flattenTreeOrder(child, out)
    return out
  }
  if (node.props?.testID) {
    out.push({ testID: node.props.testID })
  }
  if (typeof node.children === 'string') {
    out.push({ text: node.children })
  } else if (Array.isArray(node.children)) {
    for (const child of node.children) {
      if (typeof child === 'string') {
        out.push({ text: child })
      } else {
        flattenTreeOrder(child, out)
      }
    }
  }
  return out
}

describe('D-395: Chat Room Date Divider Order & Explicit RTL Sides', () => {
  afterEach(async () => {
    await cleanup()
  })

  it('renders exactly ONE date divider per day and places it BEFORE (above) the first message of each day', async () => {
    const now = new Date()
    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)

    const y1 = new Date(yesterday)
    y1.setHours(10, 0, 0, 0)
    const y2 = new Date(yesterday)
    y2.setHours(11, 30, 0, 0)
    const t1 = new Date(now)
    t1.setHours(9, 15, 0, 0)
    const t2 = new Date(now)
    t2.setHours(10, 45, 0, 0)

    // Store keeps messages sorted ascending (oldest first)
    mockMessages = [
      {
        id: 'msg-y1',
        senderId: 'user-other',
        content: 'أول رسالة أمس',
        type: 'TEXT',
        createdAt: y1.toISOString(),
      },
      {
        id: 'msg-y2',
        senderId: 'user-me',
        content: 'ثاني رسالة أمس',
        type: 'TEXT',
        createdAt: y2.toISOString(),
      },
      {
        id: 'msg-t1',
        senderId: 'user-other',
        content: 'أول رسالة اليوم',
        type: 'TEXT',
        createdAt: t1.toISOString(),
      },
      {
        id: 'msg-t2',
        senderId: 'user-me',
        content: 'ثاني رسالة اليوم',
        type: 'TEXT',
        createdAt: t2.toISOString(),
      },
    ]

    const Wrapper = createWrapper()
    const { getAllByTestId, getByTestId } = await render(
      <Wrapper>
        <ChatRoomScreen />
      </Wrapper>
    )

    // Exactly 1 divider per day across 2 days (4 messages -> 2 dividers)
    expect(getAllByTestId('chat-date-divider')).toHaveLength(2)
    expect(screen.getAllByText('أمس')).toHaveLength(1)
    expect(screen.getAllByText('اليوم')).toHaveLength(1)

    // First message of Yesterday (msg-y1): divider MUST appear BEFORE message bubble
    const y1Tokens = flattenTreeOrder(getByTestId('flashlist-item-msg-y1'))
    const y1DividerIdx = y1Tokens.findIndex((t) => t.testID === 'chat-date-divider')
    const y1BubbleIdx = y1Tokens.findIndex((t) => t.testID === 'chat_message_bubble')
    expect(y1DividerIdx).toBeGreaterThanOrEqual(0)
    expect(y1BubbleIdx).toBeGreaterThan(y1DividerIdx)

    // Second message of Yesterday (msg-y2): NO divider
    const y2Tokens = flattenTreeOrder(getByTestId('flashlist-item-msg-y2'))
    expect(y2Tokens.some((t) => t.testID === 'chat-date-divider')).toBe(false)

    // First message of Today (msg-t1): divider MUST appear BEFORE message bubble
    const t1Tokens = flattenTreeOrder(getByTestId('flashlist-item-msg-t1'))
    const t1DividerIdx = t1Tokens.findIndex((t) => t.testID === 'chat-date-divider')
    const t1BubbleIdx = t1Tokens.findIndex((t) => t.testID === 'chat_message_bubble')
    expect(t1DividerIdx).toBeGreaterThanOrEqual(0)
    expect(t1BubbleIdx).toBeGreaterThan(t1DividerIdx)

    // Second message of Today (msg-t2): NO divider
    const t2Tokens = flattenTreeOrder(getByTestId('flashlist-item-msg-t2'))
    expect(t2Tokens.some((t) => t.testID === 'chat-date-divider')).toBe(false)
  })

  it('MessageBubble uses explicit start/end for reactionsBadge and marginStart for read-receipt checkmarks', async () => {
    const baseMsg: LocalMessage = {
      id: 'm1',
      senderId: 'user-me',
      content: 'مرحبا',
      type: 'TEXT',
      createdAt: new Date().toISOString(),
      isRead: true,
      reactions: [{ emoji: '👍', userId: 'user-other' }],
    }

    const ownRes = await render(
      <MessageBubble
        msg={baseMsg}
        isOwn={true}
        isActiveReactMsgId={false}
        onLongPress={jest.fn()}
      />
    )
    const ownBadge = ownRes.getByText('👍').parent
    const ownBadgeStyle = StyleSheet.flatten(ownBadge?.props.style)
    expect(ownBadgeStyle.start).toBe(16)
    expect(ownBadgeStyle.left).toBeUndefined()

    const checkmarks = ownRes.getAllByTestId('ionicon-checkmark')
    expect(checkmarks).toHaveLength(2)
    const secondCheckStyle = StyleSheet.flatten(checkmarks[1].props.style)
    expect(secondCheckStyle.marginStart).toBe(-6)
    expect(secondCheckStyle.marginLeft).toBeUndefined()

    await cleanup()

    const otherRes = await render(
      <MessageBubble
        msg={baseMsg}
        isOwn={false}
        isActiveReactMsgId={false}
        onLongPress={jest.fn()}
      />
    )
    const otherBadge = otherRes.getByText('👍').parent
    const otherBadgeStyle = StyleSheet.flatten(otherBadge?.props.style)
    expect(otherBadgeStyle.end).toBe(16)
    expect(otherBadgeStyle.right).toBeUndefined()
  })

  it('AttachmentCard uses marginEnd (not marginLeft) on iconBox so gap sits between icon and filename in RTL', async () => {
    const { getByTestId } = await render(
      <AttachmentCard
        fileName="invoice.pdf"
        fileSize="120 KB"
        fileType="application/pdf"
        url="https://example.com/invoice.pdf"
        isOwn={true}
      />
    )
    const icon = getByTestId('ionicon-document-text')
    const iconBoxStyle = StyleSheet.flatten(icon.parent?.props.style)
    expect(iconBoxStyle.marginEnd).toBe(10)
    expect(iconBoxStyle.marginLeft).toBeUndefined()
  })
})
