import React from 'react'
import { View, StyleSheet, Dimensions, I18nManager } from 'react-native'
import { render } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import HomeScreen, {
  CARS_PEEK_WIDTH_RATIO,
  CARS_PEEK_GAP,
  CARS_PEEK_IMAGE_HEIGHT,
  getPeekCardWidth,
  getPeekLeadingInset,
  getPeekLeftRemainder,
} from '../../../app/(tabs)/index'
import { CarCard } from '../../components/cars/CarCard'
import { ServiceCard } from '../../components/services/ServiceCard'
import { PartCard } from '../../components/parts/PartCard'
import { BusCard } from '../../components/buses/BusCard'
import { EquipCard } from '../../components/cards/EquipCard'
import { skeletonCardStyles } from '../../components/ui/SkeletonCard'
import { listingCardBaseStyles } from '../../components/ui/ListingCardBase'
import { Spacing } from '../../constants/spacing'
import { CardSystem } from '../../constants/cardSystem'
import {
  computeStaticCardBodyHeight,
  computeStaticSkeletonBodyHeight,
} from '../helpers/cardHeightEstimate'
import type { Listing } from '../../types/listing.types'
import type { UnifiedCardItem } from '../../types/unified-card.types'

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
  },
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}))

jest.mock('../../features/favorites/useFavoriteToggle', () => ({
  useFavoriteToggle: jest.fn(() => ({
    isFavorite: false,
    toggle: jest.fn(),
    toggleFavorite: jest.fn(),
    isLoading: false,
  })),
}))

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}))

jest.mock('../../context/NavVisibilityContext', () => ({
  useNavVisibility: () => ({
    navHidden: { value: 0 },
  }),
  TAB_BAR_H: 60,
}))

jest.mock('../../store/authStore', () => ({
  useAuthStore: () => ({
    user: null,
  }),
}))

jest.mock('../../components/profile/DeletionScheduledBanner', () => ({
  DeletionScheduledBanner: () => null,
}))

jest.mock('../../hooks/useCars', () => ({
  useBrands: () => ({ data: [] }),
}))

const reanimatedModule = require('react-native-reanimated')
reanimatedModule.FadeInDown = {
  duration: () => ({}),
}

let mockLoadingState = false

const sampleCarItem: Listing = {
  id: 'car-peek-1',
  title: 'تويوتا لاندكروزر 2024 فل كامل',
  description: 'بحالة الوكالة',
  price: 24500,
  currency: 'OMR',
  listingType: 'SALE',
  condition: 'NEW',
  status: 'ACTIVE',
  images: ['https://example.com/car1.jpg'],
  governorate: 'مسقط',
  city: 'السيب',
  createdAt: '2026-10-30T10:00:00Z',
  updatedAt: '2026-10-30T10:00:00Z',
  userId: 'user-1',
  viewsCount: 10,
  isPremium: false,
  raw: {
    make: 'تويوتا',
    model: 'لاندكروزر',
    year: 2024,
    mileage: 12000,
    transmission: 'AUTOMATIC',
  },
} as unknown as Listing

const sampleServiceItem: UnifiedCardItem = {
  id: 'svc-peek-1',
  category: 'service',
  title: 'فحص كمبيوتر وصيانة شاملة للسيارات',
  price: 25,
  currency: 'OMR',
  governorate: 'مسقط',
  images: ['https://example.com/svc1.jpg'],
  raw: {
    id: 'svc-peek-1',
    city: 'بوشر',
    createdAt: '2026-10-30T10:00:00Z',
    providerName: 'مركز النخبة لصيانة السيارات',
    providerType: 'WORKSHOP',
    serviceType: 'MAINTENANCE',
    isHomeService: true,
    workingHoursOpen: '08:00',
    workingHoursClose: '22:00',
  },
}

const samplePartItem: UnifiedCardItem = {
  id: 'part-peek-1',
  category: 'part',
  title: 'كمبروسر مكيف تويوتا كامري أصلي وكالة',
  price: 95,
  currency: 'OMR',
  governorate: 'مسقط',
  images: ['https://example.com/part1.jpg'],
  raw: {
    id: 'part-peek-1',
    city: 'المعبيلة',
    createdAt: '2026-10-30T10:00:00Z',
    partCategory: 'ELECTRICAL',
    partNumber: '88310-06440',
    condition: 'NEW',
    isOriginal: true,
    isPriceNegotiable: true,
    compatibleMakes: ['toyota'],
    compatibleModels: 'كامري',
    yearFrom: 2019,
    yearTo: 2024,
    hasWarranty: true,
    warrantyDuration: 'SIX_MONTHS',
    compatibleVehicleTypes: ['SEDAN', 'SUV'],
  },
}

const sampleBusItem: Listing = {
  id: 'bus-peek-1',
  title: 'حافلة تويوتا كوستر 30 راكب موديل 2023',
  description: 'حافلة نظيفة جداً',
  price: 12500,
  currency: 'OMR',
  listingType: 'BUS_SALE',
  condition: 'USED',
  status: 'ACTIVE',
  images: ['https://example.com/bus1.jpg'],
  governorate: 'مسقط',
  city: 'روي',
  createdAt: '2026-10-30T10:00:00Z',
  updatedAt: '2026-10-30T10:00:00Z',
  userId: 'user-2',
  viewsCount: 8,
  isPremium: false,
  raw: {
    id: 'bus-peek-1',
    make: 'تويوتا',
    year: 2023,
    mileage: 45000,
    capacity: 30,
    busType: 'COASTER',
    transmission: 'MANUAL',
    condition: 'USED',
  },
} as unknown as Listing

const sampleEquipItem: Listing = {
  id: 'eq-peek-1',
  title: 'حفار كاتربيلر 320 بحالة ممتازة',
  description: 'معدة جاهزة للعمل',
  price: 28000,
  currency: 'OMR',
  listingType: 'EQUIPMENT_SALE',
  condition: 'USED',
  status: 'ACTIVE',
  images: ['https://example.com/eq1.jpg'],
  governorate: 'شمال الباطنة',
  city: 'صحار',
  createdAt: '2026-10-30T10:00:00Z',
  updatedAt: '2026-10-30T10:00:00Z',
  userId: 'user-3',
  viewsCount: 14,
  isPremium: false,
  raw: {
    id: 'eq-peek-1',
    make: 'كاتربيلر',
    model: '320D',
    year: 2021,
    hoursUsed: 3200,
    condition: 'USED',
  },
} as unknown as Listing

jest.mock('../../hooks/useListings', () => ({
  useListings: () => ({
    data: mockLoadingState ? undefined : [sampleCarItem, { ...sampleCarItem, id: 'car-peek-2' }],
    isLoading: mockLoadingState,
  }),
}))

jest.mock('../../hooks/useServices', () => ({
  useServices: () => ({
    data: mockLoadingState ? undefined : [sampleServiceItem, { ...sampleServiceItem, id: 'svc-peek-2' }],
    isLoading: mockLoadingState,
  }),
}))

jest.mock('../../hooks/useParts', () => ({
  useParts: () => ({
    data: mockLoadingState ? undefined : [samplePartItem, { ...samplePartItem, id: 'part-peek-2' }],
    isLoading: mockLoadingState,
  }),
}))

jest.mock('../../hooks/useBuses', () => ({
  useBuses: () => ({
    data: mockLoadingState ? undefined : [sampleBusItem, { ...sampleBusItem, id: 'bus-peek-2' }],
    isLoading: mockLoadingState,
  }),
}))

jest.mock('../../hooks/useEquipment', () => ({
  useEquipment: () => ({
    data: mockLoadingState ? undefined : [sampleEquipItem, { ...sampleEquipItem, id: 'eq-peek-2' }],
    isLoading: mockLoadingState,
  }),
}))

interface RenderedCardDimensions {
  rootWidth: string | number | undefined
  borderRadius: number
  borderWidth: number
  imageContainerHeight: number
  detailsPaddingTop: number
  detailsPaddingBottom: number
  staticBodyHeight: number
  totalStaticHeight: number
}

function measureRenderedPeekCard(
  rootNode: {
    props: { style?: unknown }
    children: Array<unknown>
  },
  detailsNode: {
    props: { style?: unknown }
  }
): RenderedCardDimensions {
  const flatRoot = StyleSheet.flatten(rootNode.props.style as never) as Record<string, unknown>
  const flatDetails = StyleSheet.flatten(detailsNode.props.style as never) as Record<string, unknown>

  const viewChildren = rootNode.children.filter(
    (c): c is { props: { style?: unknown; testID?: string } } =>
      Boolean(c && typeof c === 'object' && 'props' in c)
  )
  const imageContainerNode = viewChildren.find((c) => {
    const st = StyleSheet.flatten(c.props.style as never) as Record<string, unknown> | undefined
    return st && typeof st.height === 'number' && c.props.testID !== 'listing-card-surface'
  })
  const flatImageContainer = StyleSheet.flatten(
    imageContainerNode?.props.style as never
  ) as Record<string, unknown>

  const imageContainerHeight = Number(flatImageContainer?.height ?? 0)
  const detailsPaddingTop = Number(flatDetails?.paddingTop ?? 0)
  const detailsPaddingBottom = Number(flatDetails?.paddingBottom ?? 0)
  const isCompact =
    detailsPaddingTop === listingCardBaseStyles.cardDetailsCompact.paddingTop &&
    detailsPaddingBottom === listingCardBaseStyles.cardDetailsCompact.paddingBottom
  const staticBodyHeight = computeStaticCardBodyHeight(listingCardBaseStyles, isCompact)
  const borderWidth = Number(flatRoot?.borderWidth ?? 1)
  const totalStaticHeight = imageContainerHeight + staticBodyHeight + borderWidth * 2

  return {
    rootWidth: flatRoot?.width as string | number | undefined,
    borderRadius: Number(flatRoot?.borderRadius ?? 0),
    borderWidth,
    imageContainerHeight,
    detailsPaddingTop,
    detailsPaddingBottom,
    staticBodyHeight,
    totalStaticHeight,
  }
}

describe('D-182a6 — Home Buses & Equipment Sections in Cars Peek Style & 250pt Size (All 5 Home Sections Unified)', () => {
  jest.setTimeout(30000)
  const { width: SW } = Dimensions.get('window')
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  beforeEach(() => {
    I18nManager.isRTL = true
    mockLoadingState = false
    jest.clearAllMocks()
  })

  describe('1. Five-Card Same-Size Proof: CarCard, ServiceCard, PartCard, BusCard & EquipCard (Width & 250pt Height)', () => {
    it('renders all 5 Home card types with identical peek width constant and identical 250pt total height (133 image + 115 compact body + 2 borders)', async () => {
      const peekWidth = getPeekCardWidth(SW)
      expect(peekWidth).toBe(Math.round(SW * CARS_PEEK_WIDTH_RATIO))
      expect(getPeekCardWidth(360)).toBe(288)
      expect(getPeekCardWidth(390)).toBe(312)
      expect(getPeekCardWidth(412)).toBe(330)

      const { getByTestId, getAllByTestId } = await render(
        <QueryClientProvider client={queryClient}>
          <View>
            <View testID="car-peek-slot" style={{ width: peekWidth }}>
              <CarCard
                item={sampleCarItem}
                onPress={jest.fn()}
                fullWidth={true}
                imageHeight={CARS_PEEK_IMAGE_HEIGHT}
                compactBody={true}
                maxChips={4}
                disableImageSwipe={true}
                titleNumberOfLines={1}
              />
            </View>
            <View testID="service-peek-slot" style={{ width: peekWidth }}>
              <ServiceCard
                item={sampleServiceItem}
                onPress={jest.fn()}
                fullWidth={true}
                imageHeight={CARS_PEEK_IMAGE_HEIGHT}
                compactBody={true}
                maxChips={4}
                disableImageSwipe={true}
                titleNumberOfLines={1}
              />
            </View>
            <View testID="part-peek-slot" style={{ width: peekWidth }}>
              <PartCard
                item={samplePartItem}
                onPress={jest.fn()}
                fullWidth={true}
                imageHeight={CARS_PEEK_IMAGE_HEIGHT}
                compactBody={true}
                maxChips={4}
                disableImageSwipe={true}
                titleNumberOfLines={1}
              />
            </View>
            <View testID="bus-peek-slot" style={{ width: peekWidth }}>
              <BusCard
                item={sampleBusItem}
                onPress={jest.fn()}
                fullWidth={true}
                imageHeight={CARS_PEEK_IMAGE_HEIGHT}
                compactBody={true}
                maxChips={4}
                disableImageSwipe={true}
                titleNumberOfLines={1}
              />
            </View>
            <View testID="equip-peek-slot" style={{ width: peekWidth }}>
              <EquipCard
                item={sampleEquipItem}
                onPress={jest.fn()}
                fullWidth={true}
                imageHeight={CARS_PEEK_IMAGE_HEIGHT}
                compactBody={true}
                maxChips={4}
                disableImageSwipe={true}
                titleNumberOfLines={1}
              />
            </View>
          </View>
        </QueryClientProvider>
      )

      for (const testId of [
        'car-peek-slot',
        'service-peek-slot',
        'part-peek-slot',
        'bus-peek-slot',
        'equip-peek-slot',
      ] as const) {
        const slotStyle = StyleSheet.flatten(getByTestId(testId).props.style)
        expect(slotStyle.width).toBe(peekWidth)
      }

      const roots = getAllByTestId('listing-card-root')
      const details = getAllByTestId('listing-card-details')
      expect(roots).toHaveLength(5)
      expect(details).toHaveLength(5)

      const carDims = measureRenderedPeekCard(roots[0] as never, details[0] as never)
      const serviceDims = measureRenderedPeekCard(roots[1] as never, details[1] as never)
      const partDims = measureRenderedPeekCard(roots[2] as never, details[2] as never)
      const busDims = measureRenderedPeekCard(roots[3] as never, details[3] as never)
      const equipDims = measureRenderedPeekCard(roots[4] as never, details[4] as never)

      // Exact equality across all 5 cards in one place:
      expect(serviceDims).toEqual(carDims)
      expect(partDims).toEqual(carDims)
      expect(busDims).toEqual(carDims)
      expect(equipDims).toEqual(carDims)

      // Explicit numeric proof: 133 image + 115 compact body + 2 borders = 250pt
      expect(carDims.rootWidth).toBe('100%')
      expect(carDims.imageContainerHeight).toBe(133)
      expect(carDims.detailsPaddingTop).toBe(7)
      expect(carDims.detailsPaddingBottom).toBe(5)
      expect(carDims.staticBodyHeight).toBe(115)
      expect(carDims.borderWidth).toBe(1)
      expect(carDims.totalStaticHeight).toBe(250)
      expect(carDims.borderRadius).toBe(CardSystem.radius.outer)

      expect(busDims.imageContainerHeight).toBe(133)
      expect(busDims.staticBodyHeight).toBe(115)
      expect(busDims.totalStaticHeight).toBe(250)

      expect(equipDims.imageContainerHeight).toBe(133)
      expect(equipDims.staticBodyHeight).toBe(115)
      expect(equipDims.totalStaticHeight).toBe(250)
    })

    it('preserves non-peek defaults for BusCard and EquipCard (landing lists, search results, my listings unchanged)', async () => {
      const { getAllByTestId } = await render(
        <QueryClientProvider client={queryClient}>
          <View>
            <BusCard item={sampleBusItem} onPress={jest.fn()} />
            <EquipCard item={sampleEquipItem} onPress={jest.fn()} />
            <BusCard item={sampleBusItem} onPress={jest.fn()} fullWidth showChips />
            <EquipCard item={sampleEquipItem} onPress={jest.fn()} fullWidth showChips maxChips={3} />
          </View>
        </QueryClientProvider>
      )

      const roots = getAllByTestId('listing-card-root')
      const details = getAllByTestId('listing-card-details')
      expect(roots).toHaveLength(4)
      expect(details).toHaveLength(4)

      // 1. Default horizontal card (fullWidth=false, imageHeight=undefined, compactBody=false, maxChips=3):
      const busDefaultDims = measureRenderedPeekCard(roots[0] as never, details[0] as never)
      expect(busDefaultDims.rootWidth).toBe(SW * 0.6)
      expect(busDefaultDims.imageContainerHeight).toBe(CardSystem.aspectRatioHeight) // 140
      expect(busDefaultDims.detailsPaddingTop).toBe(8)
      expect(busDefaultDims.detailsPaddingBottom).toBe(6)
      expect(busDefaultDims.staticBodyHeight).toBe(121)

      const equipDefaultDims = measureRenderedPeekCard(roots[1] as never, details[1] as never)
      expect(equipDefaultDims.rootWidth).toBe(SW * 0.6)
      expect(equipDefaultDims.imageContainerHeight).toBe(CardSystem.aspectRatioHeight) // 140
      expect(equipDefaultDims.detailsPaddingTop).toBe(8)
      expect(equipDefaultDims.detailsPaddingBottom).toBe(6)
      expect(equipDefaultDims.staticBodyHeight).toBe(121)

      // 2. Landing / Search / My Listings fullWidth card (fullWidth=true, imageHeight=undefined, compactBody=false):
      const busFullDims = measureRenderedPeekCard(roots[2] as never, details[2] as never)
      expect(busFullDims.rootWidth).toBe('100%')
      expect(busFullDims.imageContainerHeight).toBe(CardSystem.fullWidthHeight) // 180
      expect(busFullDims.staticBodyHeight).toBe(121)
      expect(busFullDims.totalStaticHeight).toBe(303)

      const equipFullDims = measureRenderedPeekCard(roots[3] as never, details[3] as never)
      expect(equipFullDims.rootWidth).toBe('100%')
      expect(equipFullDims.imageContainerHeight).toBe(CardSystem.fullWidthHeight) // 180
      expect(equipFullDims.staticBodyHeight).toBe(121)
      expect(equipFullDims.totalStaticHeight).toBe(303)
    })
  })

  describe('2. HomeScreen Integration: All 5 Sections (Cars, Services, Parts, Buses, Equipment) in Peek Mode & Skeleton Parity', () => {
    it('renders all 5 Home sections in peek mode (80% width, 6pt gap, 20pt leading inset, dots, depth, 133pt image, compact 115pt body = 250pt total)', async () => {
      const { getAllByTestId } = await render(
        <QueryClientProvider client={queryClient}>
          <HomeScreen />
        </QueryClientProvider>
      )

      const peekWidth = getPeekCardWidth(SW)
      const peekStep = peekWidth + CARS_PEEK_GAP

      // 5 CategorySections -> 5 HorizontalScrollCards in order:
      // [0] Cars, [1] Services, [2] Parts, [3] Buses, [4] Equipment (all peek=true)
      const slot0Nodes = getAllByTestId('card-slot-0')
      const slot1Nodes = getAllByTestId('card-slot-1')
      expect(slot0Nodes).toHaveLength(5)
      expect(slot1Nodes).toHaveLength(5)

      for (const peekSectionIdx of [0, 1, 2, 3, 4]) {
        const slot0 = StyleSheet.flatten(slot0Nodes[peekSectionIdx].props.style)
        const slot1 = StyleSheet.flatten(slot1Nodes[peekSectionIdx].props.style)
        expect(slot0.width).toBe(peekWidth)
        expect(slot0.left).toBe(Spacing.space5)
        expect(slot1.width).toBe(peekWidth)
        expect(slot1.left).toBe(Spacing.space5 + peekStep)
      }

      // Depth wrappers exist on all 5 peek sections:
      const depthSlot0Nodes = getAllByTestId('card-slot-0-depth')
      expect(depthSlot0Nodes).toHaveLength(5)

      // All 10 rendered cards (2 per section across 5 sections) have 133pt image + 115pt compact body + 2pt border = 250pt:
      const cardRoots = getAllByTestId('listing-card-root')
      const cardDetails = getAllByTestId('listing-card-details')
      expect(cardRoots).toHaveLength(10)
      expect(cardDetails).toHaveLength(10)

      for (const cardIdx of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]) {
        const dims = measureRenderedPeekCard(
          cardRoots[cardIdx] as never,
          cardDetails[cardIdx] as never
        )
        expect(dims.rootWidth).toBe('100%')
        expect(dims.imageContainerHeight).toBe(CARS_PEEK_IMAGE_HEIGHT)
        expect(dims.staticBodyHeight).toBe(115)
        expect(dims.totalStaticHeight).toBe(250)
      }
    })

    it('renders identical skeleton geometry across all 5 Home sections in loading state from single-source constants', async () => {
      mockLoadingState = true

      const { getAllByTestId } = await render(
        <QueryClientProvider client={queryClient}>
          <HomeScreen />
        </QueryClientProvider>
      )

      const peekWidth = getPeekCardWidth(SW)
      const peekStep = peekWidth + CARS_PEEK_GAP
      const leadingInset = getPeekLeadingInset()
      const leftRemainder = getPeekLeftRemainder(SW)

      expect(leadingInset).toBe(Spacing.space5)
      expect(leftRemainder).toBe(SW - Spacing.space5 - peekWidth - CARS_PEEK_GAP)

      const slot0Nodes = getAllByTestId('card-slot-0')
      const slot1Nodes = getAllByTestId('card-slot-1')
      const slot2Nodes = getAllByTestId('card-slot-2')
      expect(slot0Nodes).toHaveLength(5)

      const carsSlot0 = StyleSheet.flatten(slot0Nodes[0].props.style)
      const carsSlot1 = StyleSheet.flatten(slot1Nodes[0].props.style)
      const carsSlot2 = StyleSheet.flatten(slot2Nodes[0].props.style)

      for (const peekIdx of [1, 2, 3, 4]) {
        const secSlot0 = StyleSheet.flatten(slot0Nodes[peekIdx].props.style)
        const secSlot1 = StyleSheet.flatten(slot1Nodes[peekIdx].props.style)
        const secSlot2 = StyleSheet.flatten(slot2Nodes[peekIdx].props.style)

        expect(secSlot0.width).toBe(carsSlot0.width)
        expect(secSlot0.left).toBe(carsSlot0.left)
        expect(secSlot1.left).toBe(carsSlot1.left)
        expect(secSlot2.left).toBe(carsSlot2.left)
        expect(secSlot0.width).toBe(peekWidth)
        expect(secSlot0.left).toBe(leadingInset)
        expect(secSlot1.left).toBe(leadingInset + peekStep)
        expect(secSlot2.left).toBe(leadingInset + 2 * peekStep)
      }

      // All 15 skeletons (5 sections * 3 skeletons) use compactBody (115pt body + 133pt image + 2pt border = 250pt):
      const skeletonBodies = getAllByTestId('skeleton-card-body')
      expect(skeletonBodies).toHaveLength(15)

      const staticSkeletonBodyCompact = computeStaticSkeletonBodyHeight(skeletonCardStyles, true)
      expect(staticSkeletonBodyCompact).toBe(115)
      expect(CARS_PEEK_IMAGE_HEIGHT + staticSkeletonBodyCompact + 2).toBe(250)

      for (let skelIdx = 0; skelIdx < 15; skelIdx++) {
        const bodyFlat = StyleSheet.flatten(skeletonBodies[skelIdx].props.style)
        expect(bodyFlat.paddingTop).toBe(7)
        expect(bodyFlat.paddingBottom).toBe(5)
      }
    })
  })
})
