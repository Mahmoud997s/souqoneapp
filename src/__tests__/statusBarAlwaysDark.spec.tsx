import React from 'react'
import ReactTestRenderer from 'react-test-renderer'
import { StatusBar, I18nManager } from 'react-native'
import RootLayout from '../../app/_layout'
import { useAuthStore } from '../../src/store/authStore'

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
  Stack: () => null,
  useRouter: () => ({ replace: jest.fn() }),
  useSegments: () => ['(tabs)'],
}))

jest.mock('@gorhom/bottom-sheet', () => ({
  BottomSheetModalProvider: ({ children }: any) => <>{children}</>,
}))

jest.mock('../../src/services/notifications', () => ({
  registerForPushNotifications: jest.fn().mockResolvedValue(null),
}))

jest.mock('../../src/services/ChatSyncService', () => ({
  ChatSyncService: { init: jest.fn() },
}))

jest.mock('../../src/components/GlobalSocketHandler', () => ({
  GlobalSocketHandler: () => null,
}))

jest.mock('../../src/components/ui/GlobalDialog', () => ({
  GlobalDialog: () => null,
}))

jest.mock('../../src/components/ui/GlobalToast', () => ({
  GlobalToast: () => null,
}))

jest.mock('react-native-gesture-handler', () => {
  const { View } = require('react-native')
  return {
    GestureHandlerRootView: ({ children, ...props }: any) => <View {...props}>{children}</View>,
  }
})

describe('Status Bar Always Dark Policy (D-132)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    I18nManager.isRTL = true
    useAuthStore.setState({ isLoading: false, isLoggedIn: false, isGuest: true })
    useAuthStore.getState().initialize = jest.fn()
  })

  it('renders global StatusBar with barStyle="dark-content" in RootLayout', () => {
    let testRenderer: any
    ReactTestRenderer.act(() => {
      testRenderer = ReactTestRenderer.create(<RootLayout />)
    })
    const statusBar = testRenderer.root.findByType(StatusBar)
    expect(statusBar).toBeTruthy()
    expect(statusBar.props.barStyle).toBe('dark-content')
  })
})
