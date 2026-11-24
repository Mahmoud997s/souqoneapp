import React from 'react'
import fs from 'fs'
import path from 'path'
import { StyleSheet } from 'react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { Colors } from '../../constants/colors'
import { MessageBubble, parseMessageText } from '../../components/chat/MessageBubble'
import { ChatInput } from '../../components/chat/ChatInput'
import ChatRoomScreen from '../../../app/chat/[id]'
import { chatApi } from '../../api/chat'
import { useChatMessagesStore } from '../../store/chatMessagesStore'
import type { LocalMessage } from '../../hooks/useChatRoomLogic'

let mockInsetsTop = 44

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: mockInsetsTop, bottom: 34, left: 0, right: 0 }),
}))

jest.mock('@expo/vector-icons', () => {
  const React = require('react')
  const { Text } = require('react-native')
  return {
    Ionicons: (props: any) => <Text testID={`ionicon-${props.name}`} {...props} />,
  }
})

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn() },
  useLocalSearchParams: () => ({ id: 'room-d398', otherUserName: 'محمد الكندي' }),
}))

jest.mock('expo-image', () => {
  const React = require('react')
  const { View } = require('react-native')
  return {
    Image: (props: any) => <View testID="expo-image" {...props} />,
  }
})

jest.mock('react-native-gesture-handler', () => {
  const React = require('react')
  const Swipeable = React.forwardRef(({ children }: any, _ref: any) => <>{children}</>)
  return { Swipeable }
})

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'Light', Medium: 'Medium' },
}))

jest.mock('expo-audio', () => ({
  useAudioPlayer: () => ({ play: jest.fn(), pause: jest.fn(), seekTo: jest.fn() }),
  useAudioPlayerStatus: () => ({ playing: false, currentTime: 0, duration: 14 }),
  useAudioRecorder: () => ({ record: jest.fn(), stop: jest.fn(), uri: 'file:///rec.m4a' }),
  useAudioRecorderState: () => ({ isRecording: false }),
  RecordingPresets: { HIGH_QUALITY: {} },
  requestRecordingPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
}))

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true, assets: [] }),
  launchCameraAsync: jest.fn().mockResolvedValue({ canceled: true, assets: [] }),
}))

jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn().mockResolvedValue({ canceled: true, assets: [] }),
}))

jest.mock('@gorhom/bottom-sheet', () => {
  const React = require('react')
  const { View } = require('react-native')
  const BottomSheetModal = React.forwardRef((props: any, ref: any) => {
    React.useImperativeHandle(ref, () => ({ present: jest.fn(), dismiss: jest.fn() }))
    return <View testID="mock-bottom-sheet">{props.children}</View>
  })
  return {
    BottomSheetModal,
    BottomSheetView: View,
    BottomSheetBackdrop: View,
  }
})

jest.mock('../../components/navigation/glassSupport', () => ({
  GlassSurface: 'GlassSurface',
  useGlassSupport: () => ({ mode: 'solid' }),
}))

jest.mock('../../store/authStore', () => ({
  useAuthStore: () => ({ user: { id: 'user-me', username: 'me' } }),
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

function hexLuminance(hex: string): number {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16) / 255
  const g = parseInt(clean.slice(2, 4), 16) / 255
  const b = parseInt(clean.slice(4, 6), 16) / 255
  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
}

function contrastRatio(hexA: string, hexB: string): number {
  const l1 = hexLuminance(hexA)
  const l2 = hexLuminance(hexB)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

jest.setTimeout(30000)

describe('D-398 — Chat Room Bubbles, Composer & States', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockInsetsTop = 44
    useChatMessagesStore.getState().reset()
  })

  it('1. own-bubble text contrast and send button contrast meet WCAG AA >= 4.5', () => {
    expect(contrastRatio(Colors.primaryDeep, Colors.chatOwnBubbleBg)).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio(Colors.white, Colors.primaryStrong)).toBeGreaterThanOrEqual(4.5)
  })

  it('2. image-only message has zero bubble padding/border and renders exactly ONE status icon set', async () => {
    const msg: LocalMessage = {
      id: 'img-only-1',
      senderId: 'user-me',
      content: '',
      type: 'IMAGE',
      mediaUrl: 'https://cdn.example.com/car.jpg',
      createdAt: new Date().toISOString(),
      isRead: true,
    }
    const { getByTestId, getAllByTestId } = await render(
      <MessageBubble msg={msg} isOwn={true} isActiveReactMsgId={false} onLongPress={jest.fn()} />
    )
    const bubble = getByTestId('chat_message_bubble')
    const bubbleStyle = StyleSheet.flatten(bubble.props.style)
    expect(bubbleStyle.paddingHorizontal).toBe(0)
    expect(bubbleStyle.paddingTop).toBe(0)
    expect(bubbleStyle.borderWidth).toBe(0)
    expect(getByTestId('chat-image-only-time-pill')).toBeTruthy()
    // Exactly 1 set of read-receipt ticks (2 checkmark icons for read)
    expect(getAllByTestId('ionicon-checkmark')).toHaveLength(2)
  })

  it('3. failed message renders one indicator and two 30px capsules calling retry and remove', async () => {
    const onRetry = jest.fn()
    const onRemoveFailed = jest.fn()
    const failedMsg: LocalMessage = {
      id: 'fail-1',
      senderId: 'user-me',
      content: 'هل ما زلت معنا؟',
      type: 'TEXT',
      createdAt: new Date().toISOString(),
      error: true,
      errorReason: 'تعذّر الاتصال',
    }
    const { getAllByTestId, getByTestId, getByText } = await render(
      <MessageBubble
        msg={failedMsg}
        isOwn={true}
        isActiveReactMsgId={false}
        onLongPress={jest.fn()}
        onRetry={onRetry}
        onRemoveFailed={onRemoveFailed}
      />
    )
    expect(getAllByTestId('chat-message-error-indicator')).toHaveLength(1)
    expect(getByText(/لم تُرسل/)).toBeTruthy()
    expect(getByText(/تعذّر الاتصال/)).toBeTruthy()

    const retryBtn = getByTestId('chat-failed-retry-btn')
    const deleteBtn = getByTestId('chat-failed-delete-btn')
    expect(StyleSheet.flatten(retryBtn.props.style).height).toBe(30)
    expect(StyleSheet.flatten(deleteBtn.props.style).height).toBe(30)

    fireEvent.press(retryBtn)
    expect(onRetry).toHaveBeenCalledWith('fail-1')

    fireEvent.press(deleteBtn)
    expect(onRemoveFailed).toHaveBeenCalledWith('fail-1')
  })

  it('7. parseMessageText preserves legacy emoji replies and no emoji exist in action labels/files', () => {
    const legacy = parseMessageText('[REPLY|m1|أحمد|📷 صورة]\nأهلاً')
    expect(legacy.isReply).toBe(true)
    expect(legacy.replyText).toBe('📷 صورة')
    expect(legacy.text).toBe('أهلاً')

    const repoRoot = path.resolve(__dirname, '..', '..', '..')
    const checkedFiles = [
      path.join(repoRoot, 'src', 'components', 'chat', 'MessageBubble.tsx'),
      path.join(repoRoot, 'src', 'components', 'chat', 'AttachmentCard.tsx'),
      path.join(repoRoot, 'src', 'components', 'chat', 'AudioPlayer.tsx'),
      path.join(repoRoot, 'src', 'components', 'chat', 'VoiceRecorder.tsx'),
      path.join(repoRoot, 'src', 'utils', 'chatMessageType.ts'),
    ]
    const emojiRegex = /[\u{1F300}-\u{1FAFF}]/u
    for (const file of checkedFiles) {
      const content = fs.readFileSync(file, 'utf8')
      expect(emojiRegex.test(content)).toBe(false)
    }
    const chatRoomSrc = fs
      .readFileSync(path.join(repoRoot, 'app', 'chat', '[id].tsx'), 'utf8')
      .replace(/const handleRoomOptions = React\.useCallback[\s\S]*?\[room\?\.listing, room\?\.entityType\]\)/, '')
    expect(emojiRegex.test(chatRoomSrc)).toBe(false)
    const chatInputSrc = fs
      .readFileSync(path.join(repoRoot, 'src', 'components', 'chat', 'ChatInput.tsx'), 'utf8')
      .replace(/const QUICK_EMOJIS = \[[^\]]+\]/, '')
    expect(emojiRegex.test(chatInputSrc)).toBe(false)
  })
})
