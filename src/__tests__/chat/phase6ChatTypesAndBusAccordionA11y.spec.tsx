import React from 'react'
import { render, fireEvent, screen } from '@testing-library/react-native'
import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { BusContractSection } from '../../components/buses/detail/BusContractSection'
import { ChatItemCard } from '../../components/chat/ChatItemCard'
import { ChatHeader } from '../../components/chat/ChatHeader'
import { ChatRoomHeader } from '../../components/chat/ChatRoomHeader'
import { MessageBubble } from '../../components/chat/MessageBubble'
import { AttachmentCard } from '../../components/chat/AttachmentCard'
import { ChatSkeleton } from '../../components/chat/ChatSkeleton'
import { ChatSyncService, SocketIncomingMessagePayload, SocketReactionPayload, SocketMessageDeletedPayload, SocketMessagesReadPayload } from '../../services/ChatSyncService'
import { useChatMessagesStore } from '../../store/chatMessagesStore'
import { ChatRoom, ChatMessage } from '../../types/listing.types'
import { UserSummary } from '../../types/auth.types'
import { QueryClient } from '@tanstack/react-query'
import { BusContractView } from '../../types/busDetailViewModel.types'
import { PriceView } from '../../types/listingDetail.types'

jest.mock('expo-audio', () => ({
  useAudioPlayer: () => ({ play: jest.fn(), pause: jest.fn(), replace: jest.fn() }),
  useAudioPlayerStatus: () => ({ isPlaying: false, currentTime: 0, duration: 0 }),
}))

jest.mock('expo-linear-gradient', () => {
  const React = require('react')
  const { View } = require('react-native')
  return {
    LinearGradient: ({ children, ...props }: any) => React.createElement(View, props, children),
  }
})

jest.mock('react-native-svg', () => {
  const React = require('react')
  const { View } = require('react-native')
  const MockSvg = (props: any) => React.createElement(View, props)
  return {
    __esModule: true,
    default: MockSvg,
    Svg: MockSvg,
    Defs: MockSvg,
    Pattern: MockSvg,
    Rect: MockSvg,
    Path: MockSvg,
    Circle: MockSvg,
    G: MockSvg,
    Text: MockSvg,
  }
})

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
}))

jest.mock('expo-image', () => {
  const React = require('react')
  const { View } = require('react-native')
  return {
    Image: (props: any) => React.createElement(View, { testID: 'mock-expo-image', ...props }),
  }
})

const mockSocketInstance = {
  connected: true,
  emit: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
}

jest.mock('../../services/socket', () => ({
  getSocket: () => mockSocketInstance,
  connectSocket: () => Promise.resolve(mockSocketInstance),
}))

const mockUser: UserSummary = { id: 'user-me', username: 'tester', displayName: 'أنا' }

jest.mock('../../store/authStore', () => ({
  useAuthStore: Object.assign(
    (selector?: any) => (selector ? selector({ user: mockUser }) : { user: mockUser }),
    {
      getState: () => ({ user: mockUser }),
      setState: jest.fn(),
    }
  ),
}))

const defaultPrice: PriceView = {
  amount: 20000,
  formattedAmount: '20,000',
  currency: 'ر.ع',
  fullPriceLabel: '20,000 ر.ع',
  isNegotiable: false,
  listingType: 'BUS_SALE_WITH_CONTRACT',
}

const visibleContract: BusContractView = {
  access: 'visible',
  typeLabel: 'نقل مدرسي / جامعي',
  clientName: 'وزارة التربية والتعليم',
  withDriver: true,
  monthlyIncome: 600,
  durationMonths: 24,
  expiryIso: '2027-10-20T12:00:00.000Z',
}

describe('Phase 6 Chat Type Safety & Bus Accordion Accessibility (D-289)', () => {
  describe('Part B: BusContractSection Accordion Accessibility (A-023 OBS-3)', () => {
    it('exposes accessibilityRole="button", accessibilityLabel, and toggles accessibilityState.expanded', async () => {
      const onRequireLogin = jest.fn()
      await render(
        <BusContractSection
          contract={visibleContract}
          price={defaultPrice}
          busListingType="BUS_SALE_WITH_CONTRACT"
          onRequireLogin={onRequireLogin}
          now={new Date('2026-10-20T00:00:00.000Z')}
        />
      )

      const accordionBtn = screen.getByTestId('btn-toggle-contract-accordion')
      expect(accordionBtn).toBeTruthy()

      // 1. Verify accessibilityRole is "button"
      expect(accordionBtn.props.accessibilityRole).toBe('button')

      // 2. Verify accessibilityLabel
      expect(accordionBtn.props.accessibilityLabel).toBe('عرض التفاصيل المالية وحسابات السداد')

      // 3. Verify initially collapsed: accessibilityState.expanded === false
      expect(accordionBtn.props.accessibilityState).toEqual({ expanded: false })
      expect(screen.queryByTestId('contract-accordion-body')).toBeNull()

      // 4. Press to expand
      await fireEvent.press(accordionBtn)

      // 5. Verify expanded: accessibilityState.expanded === true and body is shown
      expect(accordionBtn.props.accessibilityState).toEqual({ expanded: true })
      expect(screen.getByTestId('contract-accordion-body')).toBeTruthy()

      // 6. Press to collapse again
      await fireEvent.press(accordionBtn)
      expect(accordionBtn.props.accessibilityState).toEqual({ expanded: false })
      expect(screen.queryByTestId('contract-accordion-body')).toBeNull()
    })
  })

  describe('Part A: Chat Components Strict Typing (A-029 F8)', () => {
    it('renders ChatItemCard cleanly with strictly typed ChatRoom and UserSummary', async () => {
      const mockOtherUser: UserSummary = {
        id: 'user-other',
        username: 'ahmed99',
        displayName: 'أحمد الحارثي',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
        isVerified: true,
      }

      const mockRoom: ChatRoom = {
        id: 'room-101',
        entityType: 'listing',
        entityId: 'list-555',
        participants: [mockUser, mockOtherUser],
        lastMessage: {
          id: 'msg-999',
          roomId: 'room-101',
          content: 'السلام عليكم ورحمة الله',
          sender: mockOtherUser,
          senderId: 'user-other',
          createdAt: new Date().toISOString(),
          isRead: false,
          type: 'TEXT',
        },
        unreadCount: 3,
        updatedAt: new Date().toISOString(),
        listing: {
          id: 'list-555',
          title: 'تويوتا لاندكروزر 2023 V8',
          userId: 'user-other',
          price: 24500,
          currency: 'OMR',
          images: [{ url: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d' }],
        },
      }

      const onPress = jest.fn()
      await render(
        <ChatItemCard
          room={mockRoom}
          currentUserId={mockUser.id}
          onPress={onPress}
        />
      )

      expect(screen.getByText('أحمد الحارثي')).toBeTruthy()
      expect(screen.getByText('السلام عليكم ورحمة الله')).toBeTruthy()
      expect(screen.getByText('تويوتا لاندكروزر 2023 V8')).toBeTruthy()
      expect(screen.getByText('3')).toBeTruthy()
    })

    it('renders ChatHeader and ChatRoomHeader cleanly with strictly typed props and Gradients', async () => {
      const sharedScrollY = { value: 0 } as any
      const onSearchChange = jest.fn()

      await render(
        <ChatHeader
          scrollY={sharedScrollY}
          searchText="ابحث"
          onSearchChange={onSearchChange}
          unreadCount={5}
        />
      )

      expect(screen.getByText('الرسائل')).toBeTruthy()

      await render(
        <ChatRoomHeader
          displayName="خالد الشعيلي"
          isOnline={true}
          isTyping={false}
        />
      )

      expect(screen.getByText('خالد الشعيلي')).toBeTruthy()
      expect(screen.getByText('متصل الآن')).toBeTruthy()
    })

    it('renders MessageBubble cleanly with strictly typed LocalMessage and ImageResizeMode', async () => {
      const textMsg = {
        id: 'msg-1',
        senderId: mockUser.id,
        content: 'مرحباً، هل السعر نهائي؟',
        createdAt: new Date().toISOString(),
        pending: false,
        isDelivered: true,
        isRead: true,
      }

      await render(
        <MessageBubble
          msg={textMsg}
          isOwn={true}
          isActiveReactMsgId={false}
          onLongPress={jest.fn()}
        />
      )

      expect(screen.getByText('مرحباً، هل السعر نهائي؟')).toBeTruthy()

      const imageMsg = {
        id: 'msg-2',
        senderId: 'user-other',
        content: '',
        createdAt: new Date().toISOString(),
        type: 'IMAGE' as const,
        mediaUrl: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d',
      }

      await render(
        <MessageBubble
          msg={imageMsg}
          isOwn={false}
          isActiveReactMsgId={false}
          onLongPress={jest.fn()}
        />
      )

      expect(screen.getByTestId('chat_message_bubble')).toBeTruthy()
    })

    it('renders AttachmentCard cleanly with strictly typed TYPE_STYLES and IoniconsName', async () => {
      await render(
        <AttachmentCard
          fileName="مواصفات_المعدة.pdf"
          fileSize="1.5 MB"
          fileType="pdf"
          url="https://example.com/spec.pdf"
          isOwn={false}
        />
      )

      expect(screen.getByText('مواصفات_المعدة.pdf')).toBeTruthy()
      expect(screen.getByText('1.5 MB')).toBeTruthy()
    })

    it('renders ChatSkeleton cleanly with typed SkeletonBubble and DimensionValue', async () => {
      const { toJSON } = await render(<ChatSkeleton />)
      expect(toJSON()).toBeTruthy()
    })

    it('processes typed SocketIncomingMessagePayload in ChatSyncService without runtime errors', () => {
      const queryClient = new QueryClient()
      ChatSyncService.init(queryClient)

      const incomingPayload: SocketIncomingMessagePayload = {
        id: 'msg-socket-1',
        conversationId: 'room-101',
        senderId: 'user-other',
        content: 'تم تأكيد الحجز',
        createdAt: new Date().toISOString(),
        reactions: [{ emoji: '👍', userId: 'user-other' }],
        type: 'TEXT',
      }

      // Handle message
      ChatSyncService.handleIncomingMessage(incomingPayload)

      const roomMessages = useChatMessagesStore.getState().messagesByRoom['room-101']
      expect(roomMessages).toBeDefined()
      expect(roomMessages.some((m) => m.id === 'msg-socket-1')).toBe(true)

      // Test reaction payload type
      const reactionPayload: SocketReactionPayload = {
        conversationId: 'room-101',
        messageId: 'msg-socket-1',
        emoji: '❤️',
        userId: 'user-me',
        action: 'add',
      }
      expect(reactionPayload.emoji).toBe('❤️')

      // Test deletion payload type
      const deletePayload: SocketMessageDeletedPayload = {
        conversationId: 'room-101',
        messageId: 'msg-socket-1',
      }
      expect(deletePayload.conversationId).toBe('room-101')

      // Test read payload type
      const readPayload: SocketMessagesReadPayload = {
        conversationId: 'room-101',
      }
      expect(readPayload.conversationId).toBe('room-101')
    })
  })
})
