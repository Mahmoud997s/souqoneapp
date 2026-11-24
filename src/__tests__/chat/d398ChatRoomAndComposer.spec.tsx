import React from 'react'
import { StyleSheet } from 'react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { ChatInput } from '../../components/chat/ChatInput'
import { MessageBubble } from '../../components/chat/MessageBubble'
import ChatRoomScreen from '../../../app/chat/[id]'
import { chatApi } from '../../api/chat'
import { useChatMessagesStore } from '../../store/chatMessagesStore'
import type { LocalMessage } from '../../hooks/useChatRoomLogic'

let mockInsetsTop = 44
let mockSocketConnected = true

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
  useSocketStore: (sel: (s: { isConnected: boolean }) => boolean) => sel({ isConnected: mockSocketConnected }),
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

jest.setTimeout(30000)

describe('D-398 — Chat Room Empty State & Composer Controls', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSocketConnected = true
    useChatMessagesStore.getState().reset()
  })

  it('4. full-screen image close button top follows insets.top + 8', async () => {
    const msg: LocalMessage = {
      id: 'img-fs-1',
      senderId: 'user-me',
      content: '',
      type: 'IMAGE',
      mediaUrl: 'https://cdn.example.com/car.jpg',
      createdAt: new Date().toISOString(),
    }

    mockInsetsTop = 20
    const first = await render(
      <MessageBubble msg={msg} isOwn={true} isActiveReactMsgId={false} onLongPress={jest.fn()} />
    )
    fireEvent.press(first.getByTestId('chat-image-tap'))
    await waitFor(() => expect(first.getByTestId('chat-fullscreen-close-btn')).toBeTruthy())
    expect(StyleSheet.flatten(first.getByTestId('chat-fullscreen-close-btn').props.style).top).toBe(28)

    mockInsetsTop = 59
    const second = await render(
      <MessageBubble msg={msg} isOwn={true} isActiveReactMsgId={false} onLongPress={jest.fn()} />
    )
    fireEvent.press(second.getByTestId('chat-image-tap'))
    await waitFor(() => expect(second.getByTestId('chat-fullscreen-close-btn')).toBeTruthy())
    expect(StyleSheet.flatten(second.getByTestId('chat-fullscreen-close-btn').props.style).top).toBe(67)
  })

  it('5. composer controls have accessibilityLabel and >= 44pt touch target', async () => {
    const { getByTestId } = await render(
      <ChatInput msgText="" onChangeText={jest.fn()} onSend={jest.fn()} insetsBottom={34} />
    )
    for (const id of ['chat_emoji_btn', 'chat_attach_btn', 'chat_camera_btn', 'chat_mic_btn']) {
      const btn = getByTestId(id)
      expect(btn.props.accessibilityLabel).toBeTruthy()
      const flat = StyleSheet.flatten(btn.props.style)
      expect(flat.width).toBeGreaterThanOrEqual(44)
      expect(flat.height).toBeGreaterThanOrEqual(44)
    }
  })

  it('6. empty-state quick-reply chip fills composer and does not send', async () => {
    ;(chatApi.getMessages as jest.Mock).mockResolvedValue({ data: [] })
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } })
    const { getByTestId } = await render(
      <QueryClientProvider client={qc}>
        <ChatRoomScreen />
      </QueryClientProvider>
    )

    await waitFor(() => expect(getByTestId('chat-room-empty-state')).toBeTruthy(), { timeout: 10000 })
    const chip = getByTestId('chat-quick-reply-0')
    fireEvent.press(chip)

    await waitFor(() =>
      expect(getByTestId('chat_input_field').props.value).toBe('هل الإعلان ما زال متاحاً؟')
    )
    expect(chatApi.sendMessage).not.toHaveBeenCalled()
  })

  it('7. offline banner in ChatRoomScreen uses honest retry wording (no outbox promise)', async () => {
    mockSocketConnected = false
    ;(chatApi.getMessages as jest.Mock).mockResolvedValue({ data: [] })
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } })
    const { getByTestId, getByText } = await render(
      <QueryClientProvider client={qc}>
        <ChatRoomScreen />
      </QueryClientProvider>
    )

    await waitFor(() => expect(getByTestId('chat-connection-banner')).toBeTruthy(), { timeout: 10000 })
    expect(getByText('لا يوجد اتصال، قد تفشل الرسائل ويمكنك إعادة المحاولة')).toBeTruthy()
  })
})
