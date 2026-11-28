import React from 'react'
import { Keyboard, Platform, StyleSheet } from 'react-native'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ChatRoomScreen from '../../../app/chat/[id]'
import { ChatInput } from '../../components/chat/ChatInput'
import {
  CHAT_INPUT_BASE_BOTTOM_PAD,
  computeChatInputBottomPadding,
  isScrollNearBottom,
} from '../../hooks/useKeyboardVisible'
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

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
  requestCameraPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
}))

jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(),
}))

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
  requestRecordingPermissionsAsync: jest.fn(async () => ({ granted: true })),
  setAudioModeAsync: jest.fn(async () => undefined),
  useAudioPlayer: () => ({ play: jest.fn(), pause: jest.fn(), replace: jest.fn() }),
  useAudioPlayerStatus: () => ({ playing: false, currentTime: 0, duration: 0 }),
  AudioModule: {
    requestRecordingPermissionsAsync: jest.fn(async () => ({ granted: true })),
    setAudioModeAsync: jest.fn(async () => undefined),
  },
  RecordingPresets: { HIGH_QUALITY: {} },
  useAudioRecorder: () => ({
    prepareToRecordAsync: jest.fn(),
    record: jest.fn(),
    stop: jest.fn(),
    uri: null,
  }),
  useAudioRecorderState: () => ({ isRecording: false, durationMillis: 0 }),
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
  useLocalSearchParams: () => ({ id: 'room-d405', otherUserName: 'سعيد' }),
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

let lastFlashListProps: any = null

jest.mock('@shopify/flash-list', () => {
  const React = require('react')
  const { View } = require('react-native')
  return {
    FlashList: React.forwardRef((props: any, _ref: any) => {
      lastFlashListProps = props
      return (
        <View testID="mock-flash-list">
          {props.data?.map((item: any, idx: number) => (
            <View key={item.id || idx} testID={`flashlist-item-${item.id}`}>
              {props.renderItem({ item, index: idx })}
            </View>
          ))}
        </View>
      )
    }),
  }
})

const mockScrollToEnd = jest.fn()
let mockMessages: LocalMessage[] = [
  {
    id: 'm1',
    senderId: 'user-other',
    content: 'مرحبا',
    createdAt: '2026-11-28T10:00:00.000Z',
    type: 'TEXT',
  },
  {
    id: 'm2',
    senderId: 'user-me',
    content: 'أهلا بك',
    createdAt: '2026-11-28T10:01:00.000Z',
    type: 'TEXT',
  },
]

jest.mock('../../hooks/useChatRoomLogic', () => ({
  useChatRoomLogic: () => ({
    messages: mockMessages,
    isLoading: false,
    isError: false,
    error: null,
    isRefetchError: false,
    isRefetching: false,
    refetch: jest.fn(),
    otherUser: { id: 'user-other', name: 'سعيد' },
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
    scrollRef: { current: { scrollToEnd: mockScrollToEnd } },
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

function setupKeyboardListenersSpy() {
  const listeners: Record<string, Array<() => void>> = {}
  const removeFns: Array<{ event: string; remove: jest.Mock }> = []

  const addSpy = jest
    .spyOn(Keyboard, 'addListener')
    .mockImplementation((event: any, cb: any) => {
      if (!listeners[event]) listeners[event] = []
      listeners[event].push(cb)
      const remove = jest.fn()
      removeFns.push({ event, remove })
      return { remove } as any
    })

  return { listeners, removeFns, addSpy }
}

describe('D-405 chat room keyboard behavior (mocked unit/component checks)', () => {
  const originalPlatformOS = Platform.OS
  const originalRaf = global.requestAnimationFrame
  const originalCancelRaf = global.cancelAnimationFrame

  beforeEach(() => {
    jest.clearAllMocks()
    lastFlashListProps = null
    global.requestAnimationFrame = ((cb: FrameRequestCallback) => {
      cb(0)
      return 1
    }) as any
    global.cancelAnimationFrame = jest.fn()
  })

  afterEach(() => {
    cleanup()
    jest.restoreAllMocks()
    Object.defineProperty(Platform, 'OS', { value: originalPlatformOS, configurable: true })
    global.requestAnimationFrame = originalRaf
    global.cancelAnimationFrame = originalCancelRaf
  })

  it('computes safe-area padding when keyboard hidden and base padding (8) when visible', () => {
    expect(computeChatInputBottomPadding(34, false)).toBe(34)
    expect(computeChatInputBottomPadding(0, false)).toBe(CHAT_INPUT_BASE_BOTTOM_PAD)
    expect(computeChatInputBottomPadding(34, true)).toBe(CHAT_INPUT_BASE_BOTTOM_PAD)
    expect(computeChatInputBottomPadding(0, true)).toBe(CHAT_INPUT_BASE_BOTTOM_PAD)
  })

  it('removes bottom gap on ChatInput when iOS keyboardWillShow fires, restores on keyboardWillHide, and cleans up listeners on unmount', async () => {
    Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true })
    const { listeners, removeFns } = setupKeyboardListenersSpy()

    const { toJSON, unmount } = await render(
      <ChatInput
        msgText=""
        onChangeText={jest.fn()}
        onSend={jest.fn()}
        insetsBottom={34}
      />
    )

    expect(listeners.keyboardWillShow).toHaveLength(1)
    expect(listeners.keyboardWillHide).toHaveLength(1)

    const getWrapperPad = () => {
      const tree = toJSON() as any
      return StyleSheet.flatten(tree?.props?.style)?.paddingBottom
    }

    expect(getWrapperPad()).toBe(34)

    await act(async () => {
      listeners.keyboardWillShow.forEach((cb) => cb())
    })
    expect(getWrapperPad()).toBe(CHAT_INPUT_BASE_BOTTOM_PAD)

    await act(async () => {
      listeners.keyboardWillHide.forEach((cb) => cb())
    })
    expect(getWrapperPad()).toBe(34)

    await unmount()
    expect(removeFns).toHaveLength(2)
    removeFns.forEach((entry) => expect(entry.remove).toHaveBeenCalledTimes(1))
  })

  it('uses keyboardDidShow/Hide on Android and keeps voice recorder padding consistent', async () => {
    Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true })
    const { listeners } = setupKeyboardListenersSpy()

    const { toJSON } = await render(
      <ChatInput
        msgText=""
        onChangeText={jest.fn()}
        onSend={jest.fn()}
        insetsBottom={24}
      />
    )

    expect(listeners.keyboardDidShow).toHaveLength(1)
    expect(listeners.keyboardDidHide).toHaveLength(1)

    const getWrapperPad = () => {
      const tree = toJSON() as any
      return StyleSheet.flatten(tree?.props?.style)?.paddingBottom
    }

    await act(async () => {
      listeners.keyboardDidShow.forEach((cb) => cb())
    })
    expect(getWrapperPad()).toBe(CHAT_INPUT_BASE_BOTTOM_PAD)

    // Switch to voice recorder branch while keyboard is visible: no stale gap
    await fireEvent.press(screen.getByTestId('chat_mic_btn'))
    expect(getWrapperPad()).toBe(CHAT_INPUT_BASE_BOTTOM_PAD)

    await act(async () => {
      listeners.keyboardDidHide.forEach((cb) => cb())
    })
    expect(getWrapperPad()).toBe(24)
  })

  it('handleSend does NOT call Keyboard.dismiss so keyboard stays open after sending', async () => {
    const dismissSpy = jest.spyOn(Keyboard, 'dismiss').mockImplementation(jest.fn())
    const onSend = jest.fn()

    await render(
      <ChatInput
        msgText="مرحبا"
        onChangeText={jest.fn()}
        onSend={onSend}
        insetsBottom={34}
      />
    )

    await fireEvent.press(screen.getByTestId('chat_send_btn'))
    expect(onSend).toHaveBeenCalledWith('مرحبا')
    expect(dismissSpy).not.toHaveBeenCalled()
  })

  it('configures FlashList dismiss/tap props and KeyboardAvoidingView behavior="padding" on iOS', async () => {
    Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true })
    const { listeners } = setupKeyboardListenersSpy()

    const Wrapper = createWrapper()
    await render(
      <Wrapper>
        <ChatRoomScreen />
      </Wrapper>
    )

    expect(lastFlashListProps).toBeTruthy()
    expect(lastFlashListProps.keyboardDismissMode).toBe('interactive')
    expect(lastFlashListProps.keyboardShouldPersistTaps).toBe('handled')

    const kav = screen.getByTestId('chat-keyboard-avoiding-view')
    await act(async () => {
      kav.props.onLayout?.({
        persist: jest.fn(),
        nativeEvent: { layout: { x: 0, y: 700, width: 390, height: 60 } },
      })
    })
    await act(async () => {
      ;(listeners.keyboardWillShow ?? []).forEach((cb: any) =>
        cb({ endCoordinates: { screenY: 460, height: 300, width: 390, screenX: 0 }, duration: 0 })
      )
      await new Promise((r) => setTimeout(r, 0))
    })
    expect(StyleSheet.flatten(kav.props.style)?.paddingBottom).toBe(300)
  })

  it('configures FlashList keyboardDismissMode="on-drag", keyboardShouldPersistTaps="handled", and KeyboardAvoidingView behavior="padding" on Android', async () => {
    Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true })
    const { listeners } = setupKeyboardListenersSpy()

    const Wrapper = createWrapper()
    await render(
      <Wrapper>
        <ChatRoomScreen />
      </Wrapper>
    )

    expect(lastFlashListProps).toBeTruthy()
    expect(lastFlashListProps.keyboardDismissMode).toBe('on-drag')
    expect(lastFlashListProps.keyboardShouldPersistTaps).toBe('handled')

    const kav = screen.getByTestId('chat-keyboard-avoiding-view')
    await act(async () => {
      kav.props.onLayout?.({
        persist: jest.fn(),
        nativeEvent: { layout: { x: 0, y: 700, width: 390, height: 60 } },
      })
    })
    await act(async () => {
      ;(listeners.keyboardDidShow ?? []).forEach((cb: any) =>
        cb({ endCoordinates: { screenY: 460, height: 300, width: 390, screenX: 0 }, duration: 0 })
      )
      await new Promise((r) => setTimeout(r, 0))
    })
    expect(StyleSheet.flatten(kav.props.style)?.paddingBottom).toBe(300)
  })

  it('scrolls to end when keyboard opens near bottom and does NOT jump when scrolled far up, and cleans up listener on unmount', async () => {
    Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true })
    const { listeners, removeFns } = setupKeyboardListenersSpy()

    const Wrapper = createWrapper()
    const { unmount } = await render(
      <Wrapper>
        <ChatRoomScreen />
      </Wrapper>
    )

    // Near bottom initially -> keyboard open scrolls to end
    await act(async () => {
      listeners.keyboardWillShow.forEach((cb) => cb())
    })
    expect(mockScrollToEnd).toHaveBeenCalledWith({ animated: true })
    mockScrollToEnd.mockClear()

    // Simulate user scrolled far up (distanceFromBottom = 600 > 500 * 0.2 = 100)
    await act(async () => {
      lastFlashListProps.onScroll({
        nativeEvent: {
          contentOffset: { y: 100 },
          contentSize: { height: 1200 },
          layoutMeasurement: { height: 500 },
        },
      })
    })

    await act(async () => {
      listeners.keyboardWillShow.forEach((cb) => cb())
    })
    expect(mockScrollToEnd).not.toHaveBeenCalled()

    // Scroll back near bottom (distanceFromBottom = 40 <= 100)
    await act(async () => {
      lastFlashListProps.onScroll({
        nativeEvent: {
          contentOffset: { y: 660 },
          contentSize: { height: 1200 },
          layoutMeasurement: { height: 500 },
        },
      })
    })

    await act(async () => {
      listeners.keyboardWillShow.forEach((cb) => cb())
    })
    expect(mockScrollToEnd).toHaveBeenCalledWith({ animated: true })

    await unmount()
    expect(removeFns.some((r) => r.event === 'keyboardWillShow' && r.remove.mock.calls.length === 1)).toBe(true)
  })

  it('isScrollNearBottom respects 0.2 viewport threshold', () => {
    expect(
      isScrollNearBottom({
        contentOffset: { y: 600 },
        contentSize: { height: 1200 },
        layoutMeasurement: { height: 500 },
      })
    ).toBe(true) // 100 <= 100

    expect(
      isScrollNearBottom({
        contentOffset: { y: 599 },
        contentSize: { height: 1200 },
        layoutMeasurement: { height: 500 },
      })
    ).toBe(false) // 101 > 100
  })
})
