import React from 'react'
import fs from 'fs'
import path from 'path'
import { render, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  cleanNotificationTitle,
  resolveNotificationVisualConfig,
} from '../../../app/profile/notifications'
import NotificationsScreen from '../../../app/profile/notifications'
import { routeForNotification } from '../../utils/notificationRouter'
import { notificationsApi } from '../../api/notifications'
import { CardSystem } from '../../constants/cardSystem'
import { Colors } from '../../constants/colors'
import { TopBarTokens } from '../../constants/topBarTokens'

jest.setTimeout(30000)

const capturedSwipeableProps: any[] = []
const capturedGlassSurfaceProps: any[] = []
const capturedTopBarGlassProps: any[] = []

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  useFocusEffect: jest.fn(),
  router: { push: jest.fn(), back: jest.fn() },
}))

jest.mock('react-native-gesture-handler', () => {
  const { View } = require('react-native')
  return {
    Swipeable: (props: any) => {
      capturedSwipeableProps.push(props)
      return <View testID="mock-swipeable">{props.children}</View>
    },
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
    FadeInDown: {
      delay: () => ({ springify: () => ({ damping: () => ({}) }) }),
      duration: () => ({}),
    },
    Layout: { springify: () => ({}) },
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
  GlassSurface: (props: any) => {
    const { View } = require('react-native')
    capturedGlassSurfaceProps.push(props)
    return <View testID={props.testID ?? 'mock-glass-surface'} />
  },
  useGlassSupport: () => ({ kind: 'liquid', GlassView: 'GlassView' }),
}))

jest.mock('../../components/ui/TopBarGlassSurface', () => ({
  TopBarGlassSurface: (props: any) => {
    const { View } = require('react-native')
    capturedTopBarGlassProps.push(props)
    return <View testID={props.testID ?? 'mock-topbar-glass'} />
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

describe('S-06 Notifications Liquid Glass, Icons, Title Cleanup & Router (D-326)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    capturedSwipeableProps.length = 0
    capturedGlassSurfaceProps.length = 0
    capturedTopBarGlassProps.length = 0
  })

  describe('resolveNotificationVisualConfig', () => {
    it('maps all backend uppercase types and preserves lowercase compatibility', () => {
      const expected: Array<[string, string, string]> = [
        ['LISTING_CREATED', 'add-circle-outline', Colors.primary],
        ['LISTING_UPDATED', 'refresh-circle-outline', Colors.primary],
        ['LISTING_SOLD', 'bag-check-outline', Colors.primary],
        ['LISTING_DELETED', 'trash-outline', Colors.error],
        ['LISTING_STATUS_CHANGED', 'swap-horizontal-outline', Colors.primary],
        ['LISTING_FAVORITED', 'heart-outline', Colors.primary],
        ['PRICE_DROP', 'pricetag-outline', Colors.primary],
        ['MESSAGE', 'chatbubble-ellipses-outline', Colors.primary],
        ['PAYMENT_SUCCESS', 'card-outline', Colors.primary],
        ['SUBSCRIPTION_ACTIVATED', 'card-outline', Colors.primary],
        ['REVIEW_RECEIVED', 'star-outline', Colors.primary],
        ['REVIEW_REMINDER', 'star-outline', Colors.primary],
        ['SYSTEM', 'notifications-outline', Colors.primary],
        ['UNKNOWN_FUTURE_TYPE', 'notifications-outline', Colors.primary],
        ['message', 'chatbubble-ellipses-outline', Colors.primary],
        ['listing', 'megaphone-outline', Colors.primary],
        ['payment', 'card-outline', Colors.primary],
        ['approval', 'checkmark-circle-outline', Colors.primary],
        ['warning', 'warning-outline', Colors.error],
        ['system', 'notifications-outline', Colors.primary],
      ]

      for (const [type, icon, color] of expected) {
        const cfg = resolveNotificationVisualConfig(type)
        expect(cfg.icon).toBe(icon)
        expect(cfg.color).toBe(color)
      }
    })
  })

  describe('cleanNotificationTitle', () => {
    it('removes ✅ and collapses extra spaces without truncating text', () => {
      expect(cleanNotificationTitle('تم نشر سيارة - تويوتا كامري بنجاح ✅')).toBe(
        'تم نشر سيارة - تويوتا كامري بنجاح'
      )
      expect(cleanNotificationTitle('✅ تم نشر الإعلان')).toBe('تم نشر الإعلان')
      expect(cleanNotificationTitle('تم ✅  تحديث الإعلان بنجاح')).toBe('تم تحديث الإعلان بنجاح')
      expect(cleanNotificationTitle('')).toBe('')
    })
  })

  describe('notificationRouter OPERATOR_LISTING support', () => {
    it('routes OPERATOR_LISTING to /equipment/operators/:id', () => {
      expect(
        routeForNotification({ entityType: 'OPERATOR_LISTING', entityId: 'op-42' })
      ).toBe('/equipment/operators/op-42')
      expect(
        routeForNotification({ entityType: 'EQUIPMENT_LISTING', entityId: 'eq-9' })
      ).toBe('/equipment/eq-9')
    })
  })

  describe('NotificationsScreen UI & Motion Rules', () => {
    it('renders GlassSurface cards, ice-control checkmark-done, stripped title, and single delete swipe only', async () => {
      ;(notificationsApi.getAll as jest.Mock).mockResolvedValueOnce({
        data: {
          items: [
            {
              id: 'n-1',
              type: 'LISTING_CREATED',
              title: 'تم نشر سيارة - سكودا أوكتافيا بنجاح ✅',
              body: 'إعلانك متاح الآن للمشترين.',
              isRead: false,
              createdAt: new Date().toISOString(),
            },
          ],
          meta: { total: 1, page: 1, limit: 15, totalPages: 1 },
        },
      })

      const Wrapper = createWrapper()
      const screen = await render(
        <Wrapper>
          <NotificationsScreen />
        </Wrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('تم نشر سيارة - سكودا أوكتافيا بنجاح')).toBeTruthy()
      })

      expect(screen.queryByText(/✅/)).toBeNull()

      // GlassSurface card background
      expect(capturedGlassSurfaceProps.length).toBeGreaterThanOrEqual(1)
      const cardGlass = capturedGlassSurfaceProps[0]
      expect(cardGlass.borderRadius).toBe(CardSystem.radius.outer)
      expect(cardGlass.glassEffectStyle).toBe('clear')
      expect(cardGlass.tintOverlayColor).toBe(CardSystem.glass.unreadTint)

      // TopBarGlassSurface for mark-all-read button
      const markAllBtn = screen.getByLabelText('تحديد الكل كمقروء')
      expect(markAllBtn).toBeTruthy()
      expect(
        capturedTopBarGlassProps.some((p) => p.kind === 'ice-control')
      ).toBe(true)

      // Single delete swipe only (no renderLeftActions)
      expect(capturedSwipeableProps.length).toBe(1)
      expect(typeof capturedSwipeableProps[0].renderRightActions).toBe('function')
      expect(capturedSwipeableProps[0].renderLeftActions).toBeUndefined()
    })

    it('uses calm motion (no springify/FadeInDown/BlurView in SectionList) and respects useReducedMotion', () => {
      const source = fs.readFileSync(
        path.resolve(__dirname, '../../../app/profile/notifications.tsx'),
        'utf8'
      )
      expect(source).not.toMatch(/springify/)
      expect(source).not.toMatch(/FadeInDown/)
      expect(source).not.toMatch(/BlurView/)
      expect(source).toMatch(/useReducedMotion/)
      expect(source).toMatch(/FadeIn\.duration\(180\)/)
      expect(source).toMatch(/TopBarTokens\.buttonIconColor/)
      expect(source).toMatch(/height:\s*isFilterVisible\.value\s*\?\s*48\s*:\s*0/)
      // Verify TopBarTokens.buttonIconColor is imported & referenced
      expect(TopBarTokens.buttonIconColor).toBeTruthy()
    })
  })
})
