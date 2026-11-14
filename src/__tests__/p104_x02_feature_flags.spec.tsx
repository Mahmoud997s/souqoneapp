import React from 'react'
import { render, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { FEATURES } from '../constants/features'
import ProfileScreen from '../../app/(tabs)/profile'
import SubscriptionScreen from '../../app/profile/subscription'
import NotificationsScreen from '../../app/profile/notifications'
import { notificationsApi } from '../api/notifications'
import { CarCard } from '../components/cars/CarCard'
import { BusCard } from '../components/buses/BusCard'
import { EquipCard } from '../components/cards/EquipCard'
import { PartCard } from '../components/parts/PartCard'
import BusesLandingScreen from '../../app/buses/index'
import { NavVisibilityProvider } from '../context/NavVisibilityContext'
import { Listing } from '../types/listing.types'
import { UnifiedCardItem } from '../types/unified-card.types'

jest.mock('expo-glass-effect', () => ({
  GlassView: () => null,
  GlassContainer: () => null,
  isLiquidGlassAvailable: () => false,
  isGlassEffectAPIAvailable: () => false,
}))

jest.mock('expo-blur', () => ({
  BlurView: () => null,
}))

jest.mock('../store/authStore', () => ({
  useAuthStore: () => ({ user: { id: 'viewer-1' } }),
}))

jest.mock('../features/favorites/useFavoriteToggle', () => ({
  useFavoriteToggle: () => ({
    isFavorite: false,
    toggle: jest.fn(),
  }),
}))

jest.mock('../hooks/useCars', () => ({
  useBrands: () => ({ data: [] }),
}))

jest.mock('../hooks/useBuses', () => ({
  useBuses: () => ({
    data: [
      {
        id: 'bus-premium-1',
        title: 'حافلة سياحية مميزة',
        price: 15000,
        currency: 'OMR',
        images: ['https://example.com/bus.jpg'],
        listingType: 'BUS_SALE',
        condition: 'NEW',
        isPremium: true,
      },
    ],
    isLoading: false,
    isError: false,
    error: null,
    refetch: jest.fn(),
    isRefetchError: false,
    isRefetching: false,
  }),
}))

jest.mock('../components/buses/BusesBottomBar', () => ({
  BusesBottomBar: () => null,
}))

jest.mock('../components/ui/AnimatedHeroHeader', () => ({
  AnimatedHeroHeader: ({ title }: { title: string }) => {
    const ReactLib = require('react')
    const { Text } = require('react-native')
    return ReactLib.createElement(Text, null, title)
  },
}))

const mockReplace = jest.fn()

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: (...args: unknown[]) => mockReplace(...args),
    back: jest.fn(),
  },
  useRouter: () => ({
    push: jest.fn(),
    replace: (...args: unknown[]) => mockReplace(...args),
    back: jest.fn(),
  }),
}))

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}))

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: { children?: React.ReactNode }) => children ?? null,
}))

jest.mock('react-native-svg', () => ({
  __esModule: true,
  default: 'Svg',
  Defs: 'Defs',
  Pattern: 'Pattern',
  Path: 'Path',
  Rect: 'Rect',
}))

jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(),
  notificationAsync: jest.fn(),
  impactAsync: jest.fn(),
  NotificationFeedbackType: { Success: 'success' },
  ImpactFeedbackStyle: { Light: 'light' },
}))

jest.mock('react-native-gesture-handler', () => {
  const { View } = require('react-native')
  const makePanChain = () => {
    const chain: Record<string, () => unknown> = {}
    for (const method of ['activeOffsetX', 'failOffsetY', 'onStart', 'onUpdate', 'onEnd']) {
      chain[method] = () => chain
    }
    return chain
  }
  return {
    Swipeable: ({ children }: { children?: React.ReactNode }) => <View>{children}</View>,
    GestureDetector: ({ children }: { children?: React.ReactNode }) => <View>{children}</View>,
    Gesture: {
      Pan: () => makePanChain(),
    },
  }
})

jest.mock('react-native-reanimated', () => {
  const reanimated = require('react-native-reanimated/mock')
  return {
    ...reanimated,
    FadeInDown: {
      delay: () => ({ springify: () => ({ damping: () => ({}) }) }),
      duration: () => ({}),
    },
    Layout: { springify: () => ({}) },
    useSharedValue: jest.fn((init: number) => ({ value: init })),
    useAnimatedStyle: jest.fn((cb: () => Record<string, unknown>) => cb()),
    withTiming: jest.fn((val: number) => val),
    withRepeat: jest.fn((val: number) => val),
    withSequence: jest.fn((val: number) => val),
    Easing: { out: jest.fn(() => ({})), quad: {} },
  }
})

jest.mock('../components/ui/GlassNavBar', () => ({
  GlassNavBar: () => null,
}))

jest.mock('../components/ui/AppHeader', () => ({
  AppHeader: ({ title }: { title?: string }) => {
    const { Text } = require('react-native')
    return <Text testID="mock-app-header">{title}</Text>
  },
}))

jest.mock('../components/profile/DeletionScheduledBanner', () => ({
  DeletionScheduledBanner: () => null,
}))

jest.mock('../components/ui/SupportHelpButton', () => ({
  SupportHelpButton: () => null,
}))

jest.mock('../components/profile/ProfileLogoutSection', () => ({
  ProfileLogoutSection: () => null,
}))

jest.mock('../hooks/useProfileOverview', () => ({
  useProfileOverview: () => ({
    user: { id: 'u-test', username: 'tester', isVerified: true },
    locationName: 'مسقط',
    displayName: 'أحمد الاختباري',
    handle: '@tester',
    avatarUrl: null,
    firstLetter: 'أ',
    myListings: [],
    favorites: [],
    handleBack: jest.fn(),
    handleLogout: jest.fn(),
    activitiesItems: [{ icon: 'grid-outline', title: 'إعلاناتي', route: '/profile/my-listings' }],
    accountItems: [{ icon: 'person-outline', title: 'تعديل الملف الشخصي', route: '/profile/edit-profile' }],
    isStaleError: false,
    isRefreshing: false,
    handleRetryProfile: jest.fn(),
  }),
}))

jest.mock('../api/notifications', () => ({
  notificationsApi: {
    getAll: jest.fn(),
    readAll: jest.fn(),
    markRead: jest.fn(),
    deleteOne: jest.fn(),
    deleteAllRead: jest.fn(),
  },
}))

jest.mock('../api/payments', () => ({
  paymentsApi: {
    subscribe: jest.fn(),
    featureListing: jest.fn(),
  },
}))

describe('P1-04 + X-02: Feature Flags & Hidden Payments Surfaces (D-322)', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    jest.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: Infinity,
        },
      },
    })
    ;(notificationsApi.getAll as jest.Mock).mockResolvedValue({
      data: { items: [], meta: { total: 0, page: 1, limit: 15, totalPages: 1 } },
    })
  })

  afterEach(() => {
    queryClient.clear()
  })

  it('defines PAYMENTS_ENABLED=false alongside JOBS_ENABLED=false and TRANSPORT_ENABLED=false', () => {
    const flags = FEATURES as Record<string, unknown>
    expect(flags.PAYMENTS_ENABLED).toBe(false)
    expect(FEATURES.JOBS_ENABLED).toBe(false)
    expect(FEATURES.TRANSPORT_ENABLED).toBe(false)
  })

  it('ProfileScreen does not render ProfilePremiumBanner when PAYMENTS_ENABLED is false', async () => {
    const screen = await render(<ProfileScreen />)
    expect(screen.queryByText('عضوية سوق ون الذهبية')).toBeNull()
    expect(screen.getByText('أحمد الاختباري')).toBeTruthy()
    expect(screen.getByText('نشاطي وإعلاناتي')).toBeTruthy()
  })

  it('SubscriptionScreen renders null and redirects safely to /(tabs)/profile when PAYMENTS_ENABLED is false', async () => {
    const screen = await render(<SubscriptionScreen />)

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/(tabs)/profile')
    })
    expect(screen.queryByText('الاشتراك المميز')).toBeNull()
    expect(screen.queryByText('اشتراك الآن')).toBeNull()
  })

  it('NotificationsScreen hides the مدفوعات filter chip when PAYMENTS_ENABLED is false', async () => {
    const screen = await render(
      <QueryClientProvider client={queryClient}>
        <NotificationsScreen />
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('الكل')).toBeTruthy()
    })
    expect(screen.queryByText('مدفوعات')).toBeNull()
    expect(screen.getByText('رسائل')).toBeTruthy()
    expect(screen.getByText('إعلانات')).toBeTruthy()
  })
})

describe('M-033: Premium badge and buses premium section gating', () => {
  const premiumListing: Listing = {
    id: 'item-premium-1',
    title: 'مركبة اختبارية مميزة',
    description: 'وصف اختباري',
    price: 12000,
    currency: 'OMR',
    listingType: 'SALE',
    condition: 'NEW',
    governorate: 'مسقط',
    city: 'السيب',
    isPremium: true,
    views: 10,
    user: { id: 'seller-1', username: 'seller1' },
    images: [{ id: 'img-1', url: 'https://example.com/item.jpg', isPrimary: true, order: 0 }],
    createdAt: '2026-11-14T12:00:00Z',
  }

  const premiumPartItem: UnifiedCardItem = {
    id: 'part-premium-1',
    title: 'مركبة اختبارية مميزة',
    price: 12000,
    currency: 'OMR',
    images: ['https://example.com/item.jpg'],
    listingType: 'SALE',
    condition: 'NEW',
    isPremium: true,
  }

  it('CarCard hides the "مميز" badge when isPremium is true and PAYMENTS_ENABLED is false', async () => {
    expect(FEATURES.PAYMENTS_ENABLED).toBe(false)
    const screen = await render(<CarCard item={premiumListing} onPress={jest.fn()} />)
    expect(screen.getByText('مركبة اختبارية مميزة')).toBeTruthy()
    expect(screen.queryByText('مميز')).toBeNull()
  })

  it('BusCard hides the "مميز" badge when isPremium is true and PAYMENTS_ENABLED is false', async () => {
    expect(FEATURES.PAYMENTS_ENABLED).toBe(false)
    const screen = await render(<BusCard item={premiumListing} onPress={jest.fn()} />)
    expect(screen.getByText('مركبة اختبارية مميزة')).toBeTruthy()
    expect(screen.queryByText('مميز')).toBeNull()
  })

  it('EquipCard hides the "مميز" badge when isPremium is true and PAYMENTS_ENABLED is false', async () => {
    expect(FEATURES.PAYMENTS_ENABLED).toBe(false)
    const screen = await render(<EquipCard item={premiumListing} onPress={jest.fn()} />)
    expect(screen.getByText('مركبة اختبارية مميزة')).toBeTruthy()
    expect(screen.queryByText('مميز')).toBeNull()
  })

  it('PartCard hides the "مميز" badge when isPremium is true and PAYMENTS_ENABLED is false', async () => {
    expect(FEATURES.PAYMENTS_ENABLED).toBe(false)
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const screen = await render(
      <QueryClientProvider client={client}>
        <PartCard item={premiumPartItem} onPress={jest.fn()} />
      </QueryClientProvider>
    )
    expect(screen.getByText('مركبة اختبارية مميزة')).toBeTruthy()
    expect(screen.getAllByText('جديد').length).toBeGreaterThan(0)
    expect(screen.queryByText('مميز')).toBeNull()
  })

  it('hides the "حافلات مميزة" section on BusesLandingScreen when PAYMENTS_ENABLED is false', async () => {
    expect(FEATURES.PAYMENTS_ENABLED).toBe(false)

    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    const screen = await render(
      <QueryClientProvider client={client}>
        <NavVisibilityProvider>
          <BusesLandingScreen />
        </NavVisibilityProvider>
      </QueryClientProvider>
    )

    await waitFor(
      () => {
        expect(screen.getByText('أحدث اعلانات الحافلات')).toBeTruthy()
      },
      { timeout: 3000 }
    )

    expect(screen.queryByText('حافلات مميزة')).toBeNull()
    expect(screen.queryByText('إعلانات موثوقة ومختارة بعناية')).toBeNull()
  })
})
