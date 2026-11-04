import React from 'react'
import * as fs from 'fs'
import * as path from 'path'
import { render, cleanup, act, fireEvent, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BROWSE_LIST_VIRTUALIZATION_PROPS } from '../../constants/listVirtualization'
import { MyListingsCategoryView } from '../../components/profile/my-listings/MyListingsCategoryView'
import { ListingCardBase } from '../../components/ui/ListingCardBase'
import { CarCard } from '../../components/cars/CarCard'
import { BusCard } from '../../components/buses/BusCard'
import { EquipCard } from '../../components/cards/EquipCard'
import { PartCard } from '../../components/parts/PartCard'
import { ServiceCard } from '../../components/services/ServiceCard'
import { OperatorCard } from '../../components/cards/OperatorCard'
import { FAVORITE_IDS_QUERY_KEY } from '../../features/favorites/useFavoriteIds'
import { useAuthStore } from '../../store/authStore'
import { Colors } from '../../constants/colors'
import * as cardItemHelpers from '../../utils/cardItemHelpers'
import {
  areCardPropsEqual,
  areListingCardBasePropsEqual,
} from '../../utils/cardMemoComparison'

let mockActiveFavoriteIds: string[] = []
jest.mock('../../api/favorites', () => ({
  favoritesApi: {
    add: jest.fn().mockImplementation(async (type: string, id: string) => {
      mockActiveFavoriteIds = [`${type}:${id}`]
      return { data: { favorited: true } }
    }),
    ids: jest.fn().mockImplementation(async () => ({ data: mockActiveFavoriteIds })),
    check: jest.fn().mockResolvedValue({ data: { favorited: false } }),
  },
}))

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn() },
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({}),
}))

jest.mock('@expo/vector-icons', () => {
  const ReactLib = require('react')
  const { View } = require('react-native')
  return {
    Ionicons: (props: Record<string, unknown>) =>
      ReactLib.createElement(View, { testID: `icon-${String(props.name)}`, ...props }),
    MaterialCommunityIcons: (props: Record<string, unknown>) =>
      ReactLib.createElement(View, { testID: `m-icon-${String(props.name)}`, ...props }),
  }
})

jest.mock('expo-image', () => {
  const ReactLib = require('react')
  const { View } = require('react-native')
  return {
    Image: (props: Record<string, unknown>) =>
      ReactLib.createElement(View, { testID: 'mock-expo-image', ...props }),
  }
})

jest.mock('expo-blur', () => {
  const ReactLib = require('react')
  const { View } = require('react-native')
  return {
    BlurView: ({ children, ...props }: Record<string, unknown>) =>
      ReactLib.createElement(View, { testID: 'mock-blur-view', ...props }, children),
  }
})

const REPO_ROOT = path.resolve(__dirname, '../../..')

describe('D-197 Scroll Performance Safe Fixes', () => {
  beforeEach(() => {
    mockActiveFavoriteIds = []
    useAuthStore.setState({ isLoggedIn: true })
  })

  afterEach(() => {
    cleanup()
    jest.restoreAllMocks()
  })

  describe('Item 3: List virtualization props on glass-bearing card lists', () => {
    it('defines tuned virtualization values minimizing mounted glass rows without removeClippedSubviews', () => {
      expect(BROWSE_LIST_VIRTUALIZATION_PROPS).toEqual({
        initialNumToRender: 4,
        maxToRenderPerBatch: 4,
        windowSize: 5,
        updateCellsBatchingPeriod: 50,
      })
      expect('removeClippedSubviews' in BROWSE_LIST_VIRTUALIZATION_PROPS).toBe(false)
    })

    it('passes BROWSE_LIST_VIRTUALIZATION_PROPS to rendered Animated.FlatList in MyListingsCategoryView', async () => {
      const { getByTestId } = await render(
        <MyListingsCategoryView
          data={[]}
          isLoading={false}
          isRefreshing={false}
          isFetchingNextPage={false}
          hasNextPage={false}
          fetchNextPage={jest.fn()}
          onRefresh={jest.fn()}
          onView={jest.fn()}
          onEdit={jest.fn()}
          onDelete={jest.fn()}
          isEditSupported={() => true}
          bottomInset={20}
          topInset={60}
        />
      )

      const flatList = getByTestId('my-listings-category-flat-list')
      expect(flatList.props.initialNumToRender).toBe(4)
      expect(flatList.props.maxToRenderPerBatch).toBe(4)
      expect(flatList.props.windowSize).toBe(5)
      expect(flatList.props.updateCellsBatchingPeriod).toBe(50)
      expect(flatList.props.removeClippedSubviews).toBe(false)
    })

    it.each([
      'app/cars/browse.tsx',
      'app/buses/browse.tsx',
      'app/equipment/browse.tsx',
      'app/equipment/operators/browse.tsx',
      'app/parts/browse.tsx',
      'app/services/browse.tsx',
      'app/profile/favorites.tsx',
      'src/components/profile/my-listings/MyListingsCategoryView.tsx',
    ])('wires BROWSE_LIST_VIRTUALIZATION_PROPS into %s without removeClippedSubviews', (relPath) => {
      const content = fs.readFileSync(path.join(REPO_ROOT, relPath), 'utf8')
      expect(content).toContain('BROWSE_LIST_VIRTUALIZATION_PROPS')
      expect(content).toMatch(/<Animated\.FlatList[\s\S]*?\.\.\.BROWSE_LIST_VIRTUALIZATION_PROPS/)
      expect(content).not.toMatch(/removeClippedSubviews\s*=\s*\{?\s*true/)
    })
  })

  describe('Item 1: Card memoization (React.memo + render-relevant comparator)', () => {
    const memoSymbol = Symbol.for('react.memo')

    it('wraps ListingCardBase, CarCard, BusCard, EquipCard, PartCard, ServiceCard, and OperatorCard in React.memo', () => {
      expect((ListingCardBase as unknown as { $$typeof: symbol }).$$typeof).toBe(memoSymbol)
      expect((ListingCardBase as unknown as { compare: unknown }).compare).toBe(
        areListingCardBasePropsEqual
      )

      for (const CardComp of [CarCard, BusCard, EquipCard, PartCard, ServiceCard, OperatorCard]) {
        expect((CardComp as unknown as { $$typeof: symbol }).$$typeof).toBe(memoSymbol)
        expect((CardComp as unknown as { compare: unknown }).compare).toBe(areCardPropsEqual)
      }
    })

    it('does NOT re-render CarCard when parent re-renders with identical props or shallowly cloned item', async () => {
      const renderSpy = jest.spyOn(cardItemHelpers, 'getCardSellerVerified')
      const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
      qc.setQueryData<Set<string>>(FAVORITE_IDS_QUERY_KEY, new Set())

      const onPress = jest.fn()
      const baseItem = {
        id: 'car-memo-1',
        title: 'تويوتا لاندكروزر 2024',
        price: 24000,
        currency: 'OMR' as const,
        status: 'ACTIVE',
        isFavorite: false,
        updatedAt: '2026-11-04T00:00:00Z',
        images: ['https://example.com/1.jpg'],
      }

      const { rerender } = await render(
        <QueryClientProvider client={qc}>
          <CarCard item={baseItem as any} onPress={onPress} fullWidth />
        </QueryClientProvider>
      )

      expect(renderSpy).toHaveBeenCalledTimes(1)

      // Re-render parent with exact same props -> CarCard must skip re-render
      await rerender(
        <QueryClientProvider client={qc}>
          <CarCard item={baseItem as any} onPress={onPress} fullWidth />
        </QueryClientProvider>
      )
      expect(renderSpy).toHaveBeenCalledTimes(1)

      // Re-render parent with shallowly cloned item having identical fields and image URLs -> still skips re-render
      await rerender(
        <QueryClientProvider client={qc}>
          <CarCard
            item={{ ...baseItem, images: ['https://example.com/1.jpg'] } as any}
            onPress={onPress}
            fullWidth
          />
        </QueryClientProvider>
      )
      expect(renderSpy).toHaveBeenCalledTimes(1)
    })

    it('re-renders CarCard on favourite toggle, status change, and image change', async () => {
      const renderSpy = jest.spyOn(cardItemHelpers, 'getCardSellerVerified')
      const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
      qc.setQueryData<Set<string>>(FAVORITE_IDS_QUERY_KEY, new Set())

      const onPress = jest.fn()
      const baseItem = {
        id: 'car-memo-2',
        title: 'نيسان باترول 2024',
        price: 22000,
        currency: 'OMR' as const,
        status: 'ACTIVE',
        isFavorite: false,
        updatedAt: '2026-11-04T00:00:00Z',
        images: ['https://example.com/a.jpg'],
      }

      const { rerender, getByTestId, queryAllByText, getAllByText, getAllByTestId } = await render(
        <QueryClientProvider client={qc}>
          <CarCard item={baseItem as any} onPress={onPress} fullWidth disableImageSwipe />
        </QueryClientProvider>
      )

      // 1. Initially outline heart, not sold, 1 image
      expect(renderSpy).toHaveBeenCalledTimes(1)
      expect(getByTestId('icon-heart-outline')).toBeTruthy()
      expect(queryAllByText('مباع')).toHaveLength(0)
      expect(getAllByTestId('mock-expo-image')[0].props.source).toEqual({
        uri: 'https://example.com/a.jpg',
      })

      // 2a. Favourite toggle via pressing heart button updates heart to filled
      await act(async () => {
        fireEvent.press(getByTestId('listing-card-favorite'))
      })
      await waitFor(() => {
        expect(getByTestId('icon-heart').props.color).toBe(Colors.error)
      })

      // 2b. Favourite prop change (item.isFavorite: false -> true) causes React.memo comparator to re-render CarCard
      const countBeforeFavProp = renderSpy.mock.calls.length
      await rerender(
        <QueryClientProvider client={qc}>
          <CarCard
            item={{ ...baseItem, isFavorite: true } as any}
            onPress={onPress}
            fullWidth
            disableImageSwipe
          />
        </QueryClientProvider>
      )
      expect(renderSpy.mock.calls.length).toBeGreaterThan(countBeforeFavProp)

      // 3. Status change (ACTIVE -> SOLD) re-renders card and shows 'مباع' overlay
      const countBeforeStatus = renderSpy.mock.calls.length
      await rerender(
        <QueryClientProvider client={qc}>
          <CarCard
            item={{ ...baseItem, isFavorite: true, status: 'SOLD' } as any}
            onPress={onPress}
            fullWidth
            disableImageSwipe
          />
        </QueryClientProvider>
      )
      expect(renderSpy.mock.calls.length).toBeGreaterThan(countBeforeStatus)
      expect(getAllByText('مباع').length).toBeGreaterThanOrEqual(1)

      // 4. Image change re-renders card with new image URI
      const countBeforeImage = renderSpy.mock.calls.length
      await rerender(
        <QueryClientProvider client={qc}>
          <CarCard
            item={
              {
                ...baseItem,
                isFavorite: true,
                status: 'SOLD',
                images: ['https://example.com/b.jpg'],
              } as any
            }
            onPress={onPress}
            fullWidth
            disableImageSwipe
          />
        </QueryClientProvider>
      )
      expect(renderSpy.mock.calls.length).toBeGreaterThan(countBeforeImage)
      expect(getAllByTestId('mock-expo-image')[0].props.source).toEqual({
        uri: 'https://example.com/b.jpg',
      })
    })
  })
})
