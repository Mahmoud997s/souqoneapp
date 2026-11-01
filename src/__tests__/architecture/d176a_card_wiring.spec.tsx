import React from 'react'
import { render, cleanup } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CarCard } from '../../components/cars/CarCard'
import { BusCard } from '../../components/buses/BusCard'
import { EquipCard } from '../../components/cards/EquipCard'
import { ServiceCard } from '../../components/services/ServiceCard'
import type { Listing } from '../../types/listing.types'
import type { UnifiedCardItem } from '../../types/unified-card.types'

// Mock expo-blur
jest.mock('expo-blur', () => {
  const ReactLib = require('react')
  const { View: RNView } = require('react-native')
  return {
    BlurView: (props: Record<string, unknown>) =>
      ReactLib.createElement(RNView, { testID: 'mock-blur-view', ...props }),
  }
})

// Mock expo-glass-effect
jest.mock('expo-glass-effect', () => ({
  GlassView: (props: Record<string, unknown>) => {
    const ReactLib = require('react')
    const { View: RNView } = require('react-native')
    return ReactLib.createElement(RNView, { testID: 'mock-glass-view', ...props })
  },
  GlassContainer: (props: Record<string, unknown>) => {
    const ReactLib = require('react')
    const { View: RNView } = require('react-native')
    return ReactLib.createElement(RNView, { testID: 'mock-glass-container', ...props })
  },
  isLiquidGlassAvailable: () => true,
  isGlassEffectAPIAvailable: () => true,
}))

// Mock vector icons
jest.mock('@expo/vector-icons', () => {
  const ReactLib = require('react')
  const { View: RNView } = require('react-native')
  return {
    Ionicons: (props: Record<string, unknown>) =>
      ReactLib.createElement(RNView, { testID: `icon-${String(props.name)}`, ...props }),
    MaterialCommunityIcons: (props: Record<string, unknown>) =>
      ReactLib.createElement(RNView, { testID: `m-icon-${String(props.name)}`, ...props }),
  }
})

// Mock expo-image
jest.mock('expo-image', () => {
  const ReactLib = require('react')
  const { View: RNView } = require('react-native')
  return {
    Image: (props: Record<string, unknown>) =>
      ReactLib.createElement(RNView, { testID: 'mock-expo-image', ...props }),
  }
})

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  router: { push: jest.fn(), back: jest.fn() },
}))

// Mock favorites API & store
jest.mock('../../api/favorites', () => ({
  favoritesApi: {
    add: jest.fn().mockResolvedValue({ data: { favorited: true } }),
    ids: jest.fn().mockResolvedValue({ data: [] }),
    check: jest.fn().mockResolvedValue({ data: { favorited: false } }),
  },
}))

jest.mock('../../store/authStore', () => ({
  useAuthStore: () => ({ user: { id: 'test-user-id' }, isLoggedIn: true }),
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('D-176a Card Helper Wiring Tests (Proves Cards Consume Shared Helpers)', () => {
  afterEach(() => {
    cleanup()
  })

  describe('1. CarCard helper wiring', () => {
    it('(a) renders negotiable badge when isPriceNegotiable is provided ONLY in raw', async () => {
      const item: Listing = {
        id: 'car-wire-1',
        title: 'تويوتا كامري 2024',
        description: 'سيارة بحالة الوكالة',
        price: 12000,
        currency: 'OMR',
        listingType: 'SALE',
        condition: 'NEW',
        governorate: 'مسقط',
        city: 'السيب',
        isPremium: false,
        views: 10,
        user: { id: 'u1', username: 'ahmed', displayName: 'أحمد' },
        images: [],
        createdAt: '2026-11-01',
        raw: {
          isPriceNegotiable: true,
        },
      }

      const { getByText } = await render(<CarCard item={item} onPress={jest.fn()} />, {
        wrapper: createWrapper(),
      })

      expect(getByText('قابل للتفاوض')).toBeTruthy()
    })

    it('(b) renders verified badge when seller is verified ONLY in raw.seller.isVerified', async () => {
      const item: Listing = {
        id: 'car-wire-2',
        title: 'هوندا أكورد 2023',
        description: 'سيارة نظيفة',
        price: 9500,
        currency: 'OMR',
        listingType: 'SALE',
        condition: 'USED',
        governorate: 'مسقط',
        city: 'بوشر',
        isPremium: false,
        views: 5,
        user: { id: 'u2', username: 'salem', displayName: 'سالم' },
        images: [],
        createdAt: '2026-11-01',
        raw: {
          seller: { isVerified: true },
        },
      }

      const { getByTestId } = await render(<CarCard item={item} onPress={jest.fn()} />, {
        wrapper: createWrapper(),
      })

      expect(getByTestId('verified-badge-3d-image')).toBeTruthy()
    })
  })

  describe('2. BusCard helper wiring', () => {
    it('(a) renders negotiable badge when isPriceNegotiable is provided ONLY in raw', async () => {
      const item: Listing = {
        id: 'bus-wire-1',
        title: 'تويوتا كوستر 2022',
        description: 'حافلة 30 راكب',
        price: 18000,
        currency: 'OMR',
        listingType: 'SALE',
        condition: 'NEW',
        governorate: 'مسقط',
        city: 'السيب',
        isPremium: false,
        views: 20,
        user: { id: 'u3', username: 'khalid', displayName: 'خالد' },
        images: [],
        createdAt: '2026-11-01',
        raw: {
          isPriceNegotiable: true,
        },
      }

      const { getByText } = await render(<BusCard item={item} onPress={jest.fn()} />, {
        wrapper: createWrapper(),
      })

      expect(getByText('قابل للتفاوض')).toBeTruthy()
    })

    it('(b) renders verified badge when seller is verified ONLY in raw.user.isVerified', async () => {
      const item: Listing = {
        id: 'bus-wire-2',
        title: 'ميتسوبيشي روزا 2021',
        description: 'حافلة نظيفة',
        price: 16000,
        currency: 'OMR',
        listingType: 'SALE',
        condition: 'USED',
        governorate: 'ظفار',
        city: 'صلالة',
        isPremium: false,
        views: 8,
        user: { id: 'u4', username: 'ali', displayName: 'علي' },
        images: [],
        createdAt: '2026-11-01',
        raw: {
          user: { isVerified: true },
        },
      }

      const { getByTestId } = await render(<BusCard item={item} onPress={jest.fn()} />, {
        wrapper: createWrapper(),
      })

      expect(getByTestId('verified-badge-3d-image')).toBeTruthy()
    })
  })

  describe('3. EquipCard helper wiring', () => {
    it('(a) renders negotiable badge when isPriceNegotiable is provided ONLY in raw', async () => {
      const item: Listing = {
        id: 'eq-wire-1',
        title: 'حفار كاتربيلر 320',
        description: 'حفار مجنزرة بحالة ممتازة',
        price: 32000,
        currency: 'OMR',
        listingType: 'SALE',
        condition: 'NEW',
        governorate: 'مسقط',
        city: 'غلا',
        isPremium: false,
        views: 45,
        user: { id: 'u5', username: 'saeed', displayName: 'سعيد' },
        images: [],
        createdAt: '2026-11-01',
        raw: {
          isPriceNegotiable: true,
        },
      }

      const { getByText } = await render(<EquipCard item={item} onPress={jest.fn()} />, {
        wrapper: createWrapper(),
      })

      expect(getByText('قابل للتفاوض')).toBeTruthy()
    })

    it('(b) renders verified badge when seller is verified via top-level isVerified', async () => {
      const item: Listing = {
        id: 'eq-wire-2',
        title: 'شيول كوماتسو WA380',
        description: 'شيول نظيف وجاهز للعمل',
        price: 28000,
        currency: 'OMR',
        listingType: 'SALE',
        condition: 'USED',
        governorate: 'شمال الباطنة',
        city: 'صحار',
        isPremium: false,
        views: 12,
        user: { id: 'u6', username: 'mohammed', displayName: 'محمد' },
        images: [],
        createdAt: '2026-11-01',
        isVerified: true,
        raw: {},
      }

      const { getByTestId } = await render(<EquipCard item={item} onPress={jest.fn()} />, {
        wrapper: createWrapper(),
      })

      expect(getByTestId('verified-badge-3d-image')).toBeTruthy()
    })
  })

  describe('4. ServiceCard helper wiring', () => {
    it('(a) renders verified badge when seller is verified ONLY in raw.user.isVerified', async () => {
      const item: UnifiedCardItem = {
        id: 'svc-wire-1',
        title: 'فحص كمبيوتر سيارات وبرمجة',
        priceText: 'تبدأ من 10 ر.ع',
        images: [],
        raw: {
          user: { isVerified: true },
        },
      }

      const { getByTestId } = await render(<ServiceCard item={item} onPress={jest.fn()} />, {
        wrapper: createWrapper(),
      })

      expect(getByTestId('verified-badge-3d-image')).toBeTruthy()
    })

    it('(b) renders verified badge when seller is verified ONLY in raw.isVerified', async () => {
      const item: UnifiedCardItem = {
        id: 'svc-wire-2',
        title: 'تظليل وحماية نانو سيراميك',
        priceText: 'تبدأ من 50 ر.ع',
        images: [],
        raw: {
          isVerified: true,
        },
      }

      const { getByTestId } = await render(<ServiceCard item={item} onPress={jest.fn()} />, {
        wrapper: createWrapper(),
      })

      expect(getByTestId('verified-badge-3d-image')).toBeTruthy()
    })
  })
})
