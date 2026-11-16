import React from 'react'
import fs from 'fs'
import path from 'path'
import { StyleSheet } from 'react-native'
import { render, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import NotificationsScreen, {
  resolveNotificationVisualConfig,
} from '../../../app/profile/notifications'
import { notificationsApi } from '../../api/notifications'
import { Colors } from '../../constants/colors'
import { CardSystem } from '../../constants/cardSystem'

jest.setTimeout(30000)

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  useFocusEffect: (cb: () => void) => {
    const ReactModule = require('react')
    ReactModule.useEffect(() => {
      cb()
    }, [cb])
  },
}))

jest.mock('react-native-gesture-handler', () => {
  const { View } = require('react-native')
  return {
    Swipeable: ({ children }: any) => <View>{children}</View>,
  }
})

jest.mock('../../api/notifications', () => ({
  notificationsApi: {
    getAll: jest.fn(),
    readAll: jest.fn(),
    markRead: jest.fn(),
    deleteOne: jest.fn(),
    deleteAllRead: jest.fn(),
  },
}))

jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(),
  notificationAsync: jest.fn(),
  impactAsync: jest.fn(),
  NotificationFeedbackType: { Success: 'success' },
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
}))

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}))

jest.mock('react-native-reanimated', () => {
  const reanimated = require('react-native-reanimated/mock')
  return {
    ...reanimated,
    FadeIn: { duration: () => ({}) },
    useReducedMotion: jest.fn(() => false),
    useSharedValue: jest.fn((init) => ({ value: init })),
    useAnimatedStyle: jest.fn((cb) => cb()),
    withTiming: jest.fn((val) => val),
    withRepeat: jest.fn((val) => val),
    withSequence: jest.fn((val) => val),
    Easing: { out: jest.fn(() => ({})), quad: {}, ease: {} },
  }
})

jest.mock('../../components/navigation/glassSupport', () => ({
  GlassSurface: ({ testID }: any) => {
    const { View } = require('react-native')
    return <View testID={testID ?? 'mock-glass-surface'} />
  },
  useGlassSupport: () => ({ kind: 'fallback', GlassView: null }),
}))

jest.mock('../../components/ui/TopBarGlassSurface', () => ({
  TopBarGlassSurface: ({ testID }: any) => {
    const { View } = require('react-native')
    return <View testID={testID ?? 'mock-topbar-glass'} />
  },
}))

jest.mock('../../components/ui/AppHeader', () => ({
  AppHeader: ({ title, rightSlot }: any) => {
    const { View, Text } = require('react-native')
    return (
      <View testID="mock-app-header">
        <Text>{title}</Text>
        {rightSlot}
      </View>
    )
  },
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('D-343 Notifications Premium Redesign', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('uses exactly 2 icon tones: error only for LISTING_DELETED & WARNING, primary for all others', () => {
    const errorTypes = ['LISTING_DELETED', 'WARNING', 'warning']
    const primaryTypes = [
      'LISTING_CREATED',
      'LISTING_UPDATED',
      'LISTING_SOLD',
      'LISTING_STATUS_CHANGED',
      'LISTING_FAVORITED',
      'PRICE_DROP',
      'MESSAGE',
      'PAYMENT_SUCCESS',
      'SUBSCRIPTION_ACTIVATED',
      'REVIEW_RECEIVED',
      'REVIEW_REMINDER',
      'SYSTEM',
      'LISTING',
      'PAYMENT',
      'APPROVAL',
      'UNKNOWN_TYPE',
    ]

    for (const type of errorTypes) {
      const cfg = resolveNotificationVisualConfig(type)
      expect(cfg.color).toBe(Colors.error)
      expect(cfg.bg).toBe(Colors.errorSoftBg)
    }

    for (const type of primaryTypes) {
      const cfg = resolveNotificationVisualConfig(type)
      expect(cfg.color).toBe(Colors.primary)
      expect(cfg.bg).toBe(Colors.paleMint)
    }
  })

  it('contains zero hardcoded hex or rgb/rgba color literals in notifications.tsx and notificationDates.ts', () => {
    const notifSrc = fs.readFileSync(
      path.resolve(__dirname, '../../../app/profile/notifications.tsx'),
      'utf8'
    )
    const datesSrc = fs.readFileSync(
      path.resolve(__dirname, '../../utils/notificationDates.ts'),
      'utf8'
    )

    expect(notifSrc.match(/#[0-9a-fA-F]{3,8}|rgba?\(/g)).toBeNull()
    expect(datesSrc.match(/#[0-9a-fA-F]{3,8}|rgba?\(/g)).toBeNull()
  })

  it('renders a single unread indicator (dot, no unreadBar, calm uniform border) and centered sticky date pill', async () => {
    const nowIso = new Date().toISOString()
    ;(notificationsApi.getAll as jest.Mock).mockResolvedValueOnce({
      data: {
        items: [
          {
            id: 'unread-1',
            type: 'MESSAGE',
            title: 'رسالة جديدة',
            body: 'مرحباً بك',
            isRead: false,
            createdAt: nowIso,
          },
          {
            id: 'read-1',
            type: 'LISTING_FAVORITED',
            title: 'تمت إضافة إعلانك للمفضلة',
            body: 'شخص ما أعجب بإعلانك',
            isRead: true,
            createdAt: nowIso,
          },
        ],
        meta: { total: 2, page: 1, limit: 15, totalPages: 1 },
      },
    })

    const Wrapper = createWrapper()
    const screen = await render(
      <Wrapper>
        <NotificationsScreen />
      </Wrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('رسالة جديدة')).toBeTruthy()
    })

    // Single unread dot only on unread item
    const unreadDot = screen.getByTestId('notification-unread-dot-unread-1')
    expect(StyleSheet.flatten(unreadDot.props.style).backgroundColor).toBe(Colors.primary)
    expect(screen.queryByTestId('notification-unread-dot-read-1')).toBeNull()

    // No legacy unreadBar
    expect(screen.queryByTestId('notification-unread-bar-unread-1')).toBeNull()

    // Calm uniform card border (no strong borderColor)
    const unreadCard = screen.getByTestId('notification-card-unread-1')
    const readCard = screen.getByTestId('notification-card-read-1')
    expect(StyleSheet.flatten(unreadCard.props.style).borderColor).toBe(
      CardSystem.glass.cardBorderColor
    )
    expect(StyleSheet.flatten(readCard.props.style).borderColor).toBe(
      CardSystem.glass.cardBorderColor
    )

    // Centered sticky date pill inside transparent box-none wrapper
    const sectionContainer = screen.getByTestId('notification-section-header-container')
    expect(sectionContainer.props.pointerEvents).toBe('box-none')
    expect(StyleSheet.flatten(sectionContainer.props.style).backgroundColor).toBe('transparent')

    const sectionPill = screen.getByTestId('notification-section-pill')
    expect(StyleSheet.flatten(sectionPill.props.style).alignSelf).toBe('center')
    expect(StyleSheet.flatten(sectionPill.props.style).backgroundColor).toBe(
      CardSystem.glass.capsuleBlurWashBg
    )

    // Vertical centering of card time
    const timeText = screen.getByTestId('notification-time-unread-1')
    expect(StyleSheet.flatten(timeText.props.style).alignSelf).toBe('center')
  })
})
