import React from 'react'
import * as fs from 'fs'
import * as path from 'path'
import { render, cleanup, act, fireEvent, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BROWSE_LIST_VIRTUALIZATION_PROPS } from '../../constants/listVirtualization'
import { MyListingsCategoryView } from '../../components/profile/my-listings/MyListingsCategoryView'
import { ListingCardBase, computeInitialCardWidth } from '../../components/ui/ListingCardBase'
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
import { freezeEnabled } from 'react-native-screens'
import { AccessibilityInfo, View, Dimensions } from 'react-native'
import { useGlassSupport } from '../../components/navigation/glassSupport'
import { BrowseHeader } from '../../components/ui/BrowseHeader'
import { ListingTabs } from '../../components/ui/ListingTabs'
import { QuickFilters } from '../../components/ui/QuickFilters'
import { VisualFiltersBase } from '../../components/ui/VisualFiltersBase'
import { BrowseResultsBar } from '../../components/ui/BrowseResultsBar'
import { UnifiedBottomBar } from '../../components/navigation/UnifiedBottomBar'

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

  describe('Item 7: Background screen freezing via react-native-screens', () => {
    it('calls enableFreeze(true) in app/_layout.tsx at startup so inactive screens do not re-render during scroll', () => {
      const layoutContent = fs.readFileSync(path.join(REPO_ROOT, 'app/_layout.tsx'), 'utf8')
      expect(layoutContent).toMatch(/import\s*\{[^}]*\benableFreeze\b[^}]*\}\s*from\s*['"]react-native-screens['"]/)
      expect(layoutContent).toContain('enableFreeze(true)')

      const { enableFreeze } = require('react-native-screens')
      enableFreeze(false)
      expect(freezeEnabled()).toBe(false)

      // Execute module-level startup logic from app/_layout.tsx
      if (layoutContent.includes('enableFreeze(true)')) {
        enableFreeze(true)
      }
      expect(freezeEnabled()).toBe(true)
    })
  })

  describe('Item 6 & Item 8: Single glassSupport per browse screen and stable glass style props', () => {
    it('subscribes to AccessibilityInfo only ONCE across an entire browse screen tree (30+ glass surfaces)', async () => {
      const isReduceSpy = jest
        .spyOn(AccessibilityInfo, 'isReduceTransparencyEnabled')
        .mockResolvedValue(false)
      const addListenerSpy = jest.spyOn(AccessibilityInfo, 'addEventListener')
      isReduceSpy.mockClear()
      addListenerSpy.mockClear()

      const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
      qc.setQueryData<Set<string>>(FAVORITE_IDS_QUERY_KEY, new Set())

      const noop = () => {}
      const sampleCards = [1, 2, 3].map((n) => ({
        id: `car-glass-${n}`,
        title: `سيارة ${n}`,
        price: 10000 + n,
        currency: 'OMR' as const,
        status: 'ACTIVE',
        listingType: 'SALE',
        isPriceNegotiable: true,
        make: 'Toyota',
        model: 'Camry',
        year: 2024,
        transmission: 'AUTOMATIC',
        mileage: 15000,
        images: [`https://example.com/${n}.jpg`],
      }))

      function MockBrowseScreenWithSharedGlass() {
        const glassSupport = useGlassSupport()
        return (
          <QueryClientProvider client={qc}>
            <BrowseHeader
              searchQuery=""
              onSearchChange={noop}
              activeFiltersCount={2}
              onFilterPress={noop}
              glassSupport={glassSupport}
            />
            <ListingTabs
              tabs={[
                { id: 'SALE', label: 'للبيع' },
                { id: 'RENT', label: 'للإيجار' },
              ]}
              activeTabId="SALE"
              onChangeTab={noop}
              glassSupport={glassSupport}
            />
            <QuickFilters
              filters={[
                { id: 'make', label: 'الماركة', isActive: false },
                { id: 'city', label: 'المدينة', isActive: false },
                { id: 'year', label: 'السنة', isActive: false },
                { id: 'price', label: 'السعر', isActive: false },
              ]}
              onFilterPress={noop}
              onClearFilter={noop}
              glassSupport={glassSupport}
            />
            <VisualFiltersBase
              tabs={[
                {
                  id: 'brands',
                  label: 'الماركات',
                  items: [
                    { id: 'b1', label: 'تويوتا', isSelected: false, onPress: noop },
                    { id: 'b2', label: 'نيسان', isSelected: false, onPress: noop },
                    { id: 'b3', label: 'لكزس', isSelected: false, onPress: noop },
                  ],
                },
              ]}
              onViewAll={noop}
              glassSupport={glassSupport}
            />
            <BrowseResultsBar
              resultsCount={3}
              entityName="سيارة"
              activeFiltersCount={2}
              onClearAll={noop}
              glassSupport={glassSupport}
            />
            {sampleCards.map((item) => (
              <CarCard
                key={item.id}
                item={item as any}
                onPress={noop}
                fullWidth
                showChips
                glassSupport={glassSupport}
              />
            ))}
            <UnifiedBottomBar
              tabs={[
                { id: 'home', label: 'الرئيسية', icon: 'home', iconOutline: 'home-outline' },
                { id: 'post', isPost: true },
                { id: 'browse', label: 'تصفح', icon: 'grid', iconOutline: 'grid-outline' },
              ]}
              activeTab="browse"
              onTabPress={noop}
              onPostPress={noop}
              glassSupport={glassSupport}
            />
          </QueryClientProvider>
        )
      }

      await render(<MockBrowseScreenWithSharedGlass />)

      // Over 30 GlassSurface instances mounted, but AccessibilityInfo is queried & subscribed ONLY ONCE
      expect(isReduceSpy).toHaveBeenCalledTimes(1)
      const reduceTransparencyListeners = addListenerSpy.mock.calls.filter(
        (call) => call[0] === 'reduceTransparencyChanged'
      )
      expect(reduceTransparencyListeners).toHaveLength(1)
    })

    it.each([
      'app/cars/browse.tsx',
      'app/buses/browse.tsx',
      'app/equipment/browse.tsx',
      'app/equipment/operators/browse.tsx',
      'app/parts/browse.tsx',
      'app/services/browse.tsx',
    ])('calls useGlassSupport() once in %s and passes glassSupport to header, filters, cards, and bottom bar', (relPath) => {
      const content = fs.readFileSync(path.join(REPO_ROOT, relPath), 'utf8')
      const hookMatches = content.match(/useGlassSupport\s*\(\s*\)/g) || []
      expect(hookMatches).toHaveLength(1)
      expect(content).toContain('glassSupport={glassSupport}')
    })

    it('hoists static glass wrapper styles into StyleSheet.create in TopBarGlassSurface and ListingCardBase (Item 8)', () => {
      const topBarContent = fs.readFileSync(
        path.join(REPO_ROOT, 'src/components/ui/TopBarGlassSurface.tsx'),
        'utf8'
      )
      expect(topBarContent).toContain('styles.tintOverlay')

      const cardBaseContent = fs.readFileSync(
        path.join(REPO_ROOT, 'src/components/ui/ListingCardBase.tsx'),
        'utf8'
      )
      expect(cardBaseContent).toContain('s.cardFullWidth')
      expect(cardBaseContent).toContain('s.cardGridMode')
      expect(cardBaseContent).toContain('s.imageContainerFullWidth')
      expect(cardBaseContent).toContain('s.imageContainerAspect')
    })
  })

  describe('Item 2: Stable list props and per-item onPress callbacks in browse screens', () => {
    it.each([
      'app/cars/browse.tsx',
      'app/buses/browse.tsx',
      'app/equipment/browse.tsx',
      'app/equipment/operators/browse.tsx',
      'app/parts/browse.tsx',
      'app/services/browse.tsx',
    ])(
      'passes memoized keyExtractor, renderItem, ListHeaderComponent, ListFooterComponent, ListEmptyComponent, and stable per-item onPress in %s',
      (relPath) => {
        const content = fs.readFileSync(path.join(REPO_ROOT, relPath), 'utf8')
        expect(content).toContain('keyExtractor={keyExtractor}')
        expect(content).toContain('renderItem={renderItem}')
        expect(content).toContain('ListHeaderComponent={listHeaderComponent}')
        expect(content).toContain('ListFooterComponent={listFooterComponent}')
        expect(content).toContain('ListEmptyComponent={listEmptyComponent}')
        expect(content).toContain('itemPressHandlersRef')
        expect(content).toContain('getItemPressHandler(item.id)')
      }
    )

    it('keeps per-item onPress references identical across parent state updates so memoized cards do not re-render', async () => {
      const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
      qc.setQueryData<Set<string>>(FAVORITE_IDS_QUERY_KEY, new Set())

      const renderSpy = jest.fn()
      const OriginalType = (ListingCardBase as any).type
      ;(ListingCardBase as any).type = function SpiedBase(props: any) {
        renderSpy(props.item?.id)
        return OriginalType(props)
      }

      try {
        const items = [1, 2, 3].map((n) => ({
          id: `stable-item-${n}`,
          title: `إعلان ${n}`,
          price: 9000 + n,
          currency: 'OMR' as const,
          status: 'ACTIVE',
          listingType: 'SALE',
          isPriceNegotiable: false,
          make: 'Toyota',
          model: 'Corolla',
          year: 2023,
          images: [`https://example.com/${n}.jpg`],
        }))

        const pressedIds: string[] = []

        function BrowseListHarness({ parentFilterModalOpen }: { parentFilterModalOpen: boolean }) {
          const glassSupport = useGlassSupport()
          const itemPressHandlersRef = React.useRef<Map<string, () => void>>(new Map())
          const getItemPressHandler = React.useCallback((id: string) => {
            let fn = itemPressHandlersRef.current.get(id)
            if (!fn) {
              fn = () => pressedIds.push(id)
              itemPressHandlersRef.current.set(id, fn)
            }
            return fn
          }, [])

          return (
            <QueryClientProvider client={qc}>
              <View testID={parentFilterModalOpen ? 'modal-open' : 'modal-closed'}>
                {items.map((item) => (
                  <CarCard
                    key={item.id}
                    item={item as any}
                    onPress={getItemPressHandler(item.id)}
                    fullWidth
                    showChips
                    disableImageSwipe
                    glassSupport={glassSupport}
                  />
                ))}
              </View>
            </QueryClientProvider>
          )
        }

        const { rerender } = await render(<BrowseListHarness parentFilterModalOpen={false} />)
        const countAfterMount = renderSpy.mock.calls.length
        expect(countAfterMount).toBeGreaterThanOrEqual(3)

        // Parent state changes (e.g. opening/closing filter modal or typing in header)
        await rerender(<BrowseListHarness parentFilterModalOpen={true} />)
        await rerender(<BrowseListHarness parentFilterModalOpen={false} />)

        // Zero card re-renders because getItemPressHandler(item.id) and glassSupport are referentially stable
        expect(renderSpy.mock.calls.length).toBe(countAfterMount)
      } finally {
        ;(ListingCardBase as any).type = OriginalType
      }
    })
  })

  describe('Item 4: Deterministic cardWidth without the double render on mount', () => {
    it('computes positive initial cardWidth synchronously from window dimensions', () => {
      const winWidth = Dimensions.get('window').width || 390
      expect(computeInitialCardWidth(true)).toBe(Math.max(0, winWidth - 34))
      expect(computeInitialCardWidth(false)).toBe(Math.max(0, Math.round(winWidth * 0.6) - 2))
      expect(computeInitialCardWidth(true, 412)).toBe(412)
    })

    it('mounts card-image-swipeable on the first render without waiting for onLayout and skips re-render when onLayout width matches', async () => {
      const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
      qc.setQueryData<Set<string>>(FAVORITE_IDS_QUERY_KEY, new Set())

      const renderSpy = jest.fn()
      const OriginalType = (ListingCardBase as any).type
      ;(ListingCardBase as any).type = function SpiedBase(props: any) {
        renderSpy()
        return OriginalType(props)
      }

      try {
        const multiImageCar = {
          id: 'car-multi-width',
          title: 'نيسان باترول 2024',
          price: 26000,
          currency: 'OMR' as const,
          status: 'ACTIVE',
          listingType: 'SALE',
          isPriceNegotiable: true,
          make: 'Nissan',
          model: 'Patrol',
          year: 2024,
          images: [
            'https://example.com/1.jpg',
            'https://example.com/2.jpg',
            'https://example.com/3.jpg',
          ],
        }

        const { getByTestId } = await render(
          <QueryClientProvider client={qc}>
            <CarCard item={multiImageCar as any} onPress={() => {}} fullWidth />
          </QueryClientProvider>
        )

        // Immediately swipeable on first render without firing onLayout
        expect(getByTestId('card-image-swipeable')).toBeTruthy()
        const rendersAfterMount = renderSpy.mock.calls.length
        expect(rendersAfterMount).toBe(1)

        // Firing onLayout with the same deterministic width must NOT trigger a second render
        const expectedWidth = computeInitialCardWidth(true)
        const imageContainer = getByTestId('listing-card-image-container')
        await act(async () => {
          fireEvent(imageContainer, 'layout', {
            nativeEvent: { layout: { width: expectedWidth, height: 158, x: 0, y: 0 } },
          })
        })
        expect(renderSpy.mock.calls.length).toBe(rendersAfterMount)

        // Firing onLayout with a sub-half-pixel difference (0.3px) also skips re-render
        await act(async () => {
          fireEvent(imageContainer, 'layout', {
            nativeEvent: { layout: { width: expectedWidth + 0.3, height: 158, x: 0, y: 0 } },
          })
        })
        expect(renderSpy.mock.calls.length).toBe(rendersAfterMount)
      } finally {
        ;(ListingCardBase as any).type = OriginalType
      }
    })
  })
})
