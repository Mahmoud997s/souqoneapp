import React from 'react'
import ReactTestRenderer from 'react-test-renderer'
import { StatusBar, I18nManager } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { ImageViewerModal } from '../components/listing-detail/ImageViewerModal'
import RouteImageViewerModal from '../../app/(modals)/image-viewer'
import RootLayout from '../../app/_layout'
import { useAuthStore } from '../store/authStore'

let mockSegments: string[] = ['(tabs)']
let mockPathname = '/'
let mockSearchParams: Record<string, string> = {
  url: 'https://example.com/photo.jpg',
}

jest.mock('@expo-google-fonts/almarai', () => ({
  useFonts: () => [true],
  Almarai_400Regular: 'Almarai_400Regular',
  Almarai_700Bold: 'Almarai_700Bold',
  Almarai_800ExtraBold: 'Almarai_800ExtraBold',
}))

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn().mockResolvedValue(true),
}))

jest.mock('expo-updates', () => ({
  reloadAsync: jest.fn().mockResolvedValue(true),
}))

jest.mock('expo-notifications', () => ({
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
}))

jest.mock('expo-router', () => ({
  Stack: Object.assign(
    ({ children }: { children?: React.ReactNode }) => <>{children}</>,
    { Screen: () => null }
  ),
  router: { back: jest.fn(), replace: jest.fn() },
  useRouter: () => ({ replace: jest.fn(), back: jest.fn() }),
  useSegments: () => mockSegments,
  usePathname: () => mockPathname,
  useGlobalSearchParams: () => ({}),
  useLocalSearchParams: () => mockSearchParams,
}))

jest.mock('@gorhom/bottom-sheet', () => ({
  BottomSheetModalProvider: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}))

jest.mock('../services/notifications', () => ({
  registerForPushNotifications: jest.fn().mockResolvedValue(null),
}))

jest.mock('../services/ChatSyncService', () => ({
  ChatSyncService: { init: jest.fn() },
}))

jest.mock('../components/GlobalSocketHandler', () => ({
  GlobalSocketHandler: () => null,
}))

jest.mock('../components/ui/GlobalToast', () => ({
  GlobalToast: () => null,
}))

jest.mock('expo-image', () => {
  const ReactMock = require('react')
  const { View: RNView } = require('react-native')
  return {
    Image: (props: Record<string, unknown>) => ReactMock.createElement(RNView, props),
  }
})

jest.mock('@expo/vector-icons', () => {
  const ReactMock = require('react')
  const { View: RNView } = require('react-native')
  return {
    Ionicons: (props: Record<string, unknown>) => ReactMock.createElement(RNView, props),
  }
})

jest.mock('react-native-gesture-handler', () => {
  const ReactMock = require('react')
  const { View: RNView } = require('react-native')
  const chainable = () => {
    const obj: Record<string, unknown> = {}
    const methods = [
      'numberOfTaps',
      'minPointers',
      'maxPointers',
      'activeOffsetX',
      'activeOffsetY',
      'onStart',
      'onUpdate',
      'onEnd',
      'onBegin',
      'onFinalize',
    ]
    for (const m of methods) {
      obj[m] = () => obj
    }
    return obj
  }
  return {
    GestureHandlerRootView: ({
      children,
      ...props
    }: {
      children?: React.ReactNode
      [key: string]: unknown
    }) => ReactMock.createElement(RNView, props, children),
    GestureDetector: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
    Gesture: {
      Tap: chainable,
      Pan: chainable,
      Simultaneous: () => chainable(),
    },
  }
})

const SAFE_AREA_METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 44, left: 0, right: 0, bottom: 34 },
}

describe('F-06: StatusBar Always Dark Restore & Route Sync', () => {
  let setBarStyleSpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    I18nManager.isRTL = true
    mockSegments = ['(tabs)']
    mockPathname = '/'
    mockSearchParams = { url: 'https://example.com/photo.jpg' }
    setBarStyleSpy = jest
      .spyOn(StatusBar, 'setBarStyle')
      .mockImplementation(() => {})
    ReactTestRenderer.act(() => {
      useAuthStore.setState({ isLoading: false, isLoggedIn: false, isGuest: true })
    })
    useAuthStore.getState().initialize = jest.fn()
  })

  afterEach(() => {
    setBarStyleSpy.mockRestore()
  })

  it('restores StatusBar to dark-content when ImageViewerModal closes (visible: true -> false) and on unmount', () => {
    const images = [{ id: '1', url: 'https://example.com/1.jpg', order: 0, isPrimary: true }]
    const onClose = jest.fn()
    let testRenderer!: ReactTestRenderer.ReactTestRenderer

    ReactTestRenderer.act(() => {
      testRenderer = ReactTestRenderer.create(
        <SafeAreaProvider initialMetrics={SAFE_AREA_METRICS}>
          <ImageViewerModal visible images={images} initialIndex={0} onClose={onClose} />
        </SafeAreaProvider>
      )
    })

    // Keeps light-content strictly during dark fullscreen viewer display
    const viewerStatusBar = testRenderer.root.findByType(StatusBar)
    expect(viewerStatusBar.props.barStyle).toBe('light-content')
    expect(setBarStyleSpy).not.toHaveBeenCalledWith('dark-content')

    // Closing modal restores dark-content immediately
    ReactTestRenderer.act(() => {
      testRenderer.update(
        <SafeAreaProvider initialMetrics={SAFE_AREA_METRICS}>
          <ImageViewerModal visible={false} images={images} initialIndex={0} onClose={onClose} />
        </SafeAreaProvider>
      )
    })
    expect(setBarStyleSpy).toHaveBeenCalledWith('dark-content')

    setBarStyleSpy.mockClear()
    ReactTestRenderer.act(() => {
      testRenderer.unmount()
    })
    expect(setBarStyleSpy).toHaveBeenCalledWith('dark-content')
  })

  it('restores StatusBar to dark-content when route (modals)/image-viewer unmounts', () => {
    let testRenderer!: ReactTestRenderer.ReactTestRenderer
    ReactTestRenderer.act(() => {
      testRenderer = ReactTestRenderer.create(<RouteImageViewerModal />)
    })

    expect(testRenderer.root.findByType(StatusBar).props.barStyle).toBe('light-content')
    expect(setBarStyleSpy).not.toHaveBeenCalledWith('dark-content')

    ReactTestRenderer.act(() => {
      testRenderer.unmount()
    })
    expect(setBarStyleSpy).toHaveBeenCalledWith('dark-content')
  })

  it('RootLayout enforces StatusBar.setBarStyle("dark-content") on non-viewer routes and yields on (modals)/image-viewer', () => {
    mockSegments = ['(tabs)']
    mockPathname = '/(tabs)'
    let testRenderer!: ReactTestRenderer.ReactTestRenderer

    ReactTestRenderer.act(() => {
      testRenderer = ReactTestRenderer.create(<RootLayout />)
    })
    expect(testRenderer.root.findByType(StatusBar).props.barStyle).toBe('dark-content')
    expect(setBarStyleSpy).toHaveBeenCalledWith('dark-content')

    // Entering route image-viewer must NOT overwrite light-content while viewing fullscreen dark photo
    setBarStyleSpy.mockClear()
    mockSegments = ['(modals)', 'image-viewer']
    mockPathname = '/image-viewer'
    ReactTestRenderer.act(() => {
      testRenderer.update(<RootLayout />)
    })
    expect(setBarStyleSpy).not.toHaveBeenCalledWith('dark-content')

    // Returning to normal route restores dark-content regardless of OS theme
    mockSegments = ['cars', '123']
    mockPathname = '/cars/123'
    ReactTestRenderer.act(() => {
      testRenderer.update(<RootLayout />)
    })
    expect(setBarStyleSpy).toHaveBeenCalledWith('dark-content')

    ReactTestRenderer.act(() => {
      testRenderer.unmount()
    })
  })
})
