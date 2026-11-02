import React from 'react'
import { View, StyleSheet, Dimensions, I18nManager } from 'react-native'
import { render } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import HomeScreen, {
  CategorySection,
  CARD_WIDTH,
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
import { SkeletonCard, skeletonCardStyles } from '../../components/ui/SkeletonCard'
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

const sampleBusItem: UnifiedCardItem = {
  id: 'bus-1',
  category: 'bus',
  title: 'حافلة تويوتا كوستر 30 راكب',
  price: 12000,
  currency: 'OMR',
  governorate: 'مسقط',
  images: ['https://example.com/bus1.jpg'],
}

const sampleEquipItem: UnifiedCardItem = {
  id: 'eq-1',
  category: 'equipment',
  title: 'حفار كاتربيلر 320',
  price: 28000,
  currency: 'OMR',
  governorate: 'صحار',
  images: ['https://example.com/eq1.jpg'],
}

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
    data: mockLoadingState ? undefined : [sampleBusItem, { ...sampleBusItem, id: 'bus-2' }],
    isLoading: mockLoadingState,
  }),
}))

jest.mock('../../hooks/useEquipment', () => ({
  useEquipment: () => ({
    data: mockLoadingState ? undefined : [sampleEquipItem, { ...sampleEquipItem, id: 'eq-2' }],
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

  // Find image container child (the child View that has height = imageHeight or aspectRatioHeight)
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

describe('D-182a5 — Home Services & Parts Sections in Cars Peek Style & Size', () => {
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

  describe('1. Same Size Proof: CarCard, ServiceCard & PartCard Peek Geometry (Width & 250pt Height)', () => {
    it('renders CarCard, ServiceCard, and PartCard with identical peek width constant and identical 250pt total height (133 image + 115 compact body + 2 borders)', async () => {
      const peekWidth = getPeekCardWidth(SW)
      expect(peekWidth).toBe(Math.round(SW * CARS_PEEK_WIDTH_RATIO))
      expect(getPeekCardWidth(360)).toBe(288)
      expect(getPeekCardWidth(390)).toBe(312)
      expect(getPeekCardWidth(412)).toBe(330)

      const carRender = await render(
        <QueryClientProvider client={queryClient}>
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
        </QueryClientProvider>
      )

      const serviceRender = await render(
        <QueryClientProvider client={queryClient}>
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
        </QueryClientProvider>
      )

      const partRender = await render(
        <QueryClientProvider client={queryClient}>
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
        </QueryClientProvider>
      )

      const carSlotStyle = StyleSheet.flatten(carRender.getByTestId('car-peek-slot').props.style)
      const serviceSlotStyle = StyleSheet.flatten(serviceRender.getByTestId('service-peek-slot').props.style)
      const partSlotStyle = StyleSheet.flatten(partRender.getByTestId('part-peek-slot').props.style)

      expect(carSlotStyle.width).toBe(peekWidth)
      expect(serviceSlotStyle.width).toBe(peekWidth)
      expect(partSlotStyle.width).toBe(peekWidth)

      const carDims = measureRenderedPeekCard(
        carRender.getByTestId('listing-card-root') as never,
        carRender.getByTestId('listing-card-details') as never
      )
      const serviceDims = measureRenderedPeekCard(
        serviceRender.getByTestId('listing-card-root') as never,
        serviceRender.getByTestId('listing-card-details') as never
      )
      const partDims = measureRenderedPeekCard(
        partRender.getByTestId('listing-card-root') as never,
        partRender.getByTestId('listing-card-details') as never
      )

      // Exact equality across CarCard, ServiceCard, and PartCard:
      expect(serviceDims).toEqual(carDims)
      expect(partDims).toEqual(carDims)

      // Explicit numeric proof: 133 image + 115 compact body + 2 borders = 250pt
      expect(carDims.rootWidth).toBe('100%')
      expect(carDims.imageContainerHeight).toBe(133)
      expect(carDims.detailsPaddingTop).toBe(7)
      expect(carDims.detailsPaddingBottom).toBe(5)
      expect(carDims.staticBodyHeight).toBe(115)
      expect(carDims.borderWidth).toBe(1)
      expect(carDims.totalStaticHeight).toBe(250)
      expect(carDims.borderRadius).toBe(CardSystem.radius.outer)

      expect(serviceDims.imageContainerHeight).toBe(133)
      expect(serviceDims.staticBodyHeight).toBe(115)
      expect(serviceDims.totalStaticHeight).toBe(250)

      expect(partDims.imageContainerHeight).toBe(133)
      expect(partDims.staticBodyHeight).toBe(115)
      expect(partDims.totalStaticHeight).toBe(250)
    })

    it('preserves non-peek defaults for ServiceCard and PartCard (landing lists, search results, my listings unchanged)', async () => {
      // 1. Default horizontal card (fullWidth=false, imageHeight=undefined, compactBody=false, maxChips=3):
      const svcDefault = await render(
        <QueryClientProvider client={queryClient}>
          <ServiceCard item={sampleServiceItem} onPress={jest.fn()} />
        </QueryClientProvider>
      )
      const svcDefaultDims = measureRenderedPeekCard(
        svcDefault.getByTestId('listing-card-root') as never,
        svcDefault.getByTestId('listing-card-details') as never
      )
      expect(svcDefaultDims.rootWidth).toBe(SW * 0.6)
      expect(svcDefaultDims.imageContainerHeight).toBe(CardSystem.aspectRatioHeight) // 140
      expect(svcDefaultDims.detailsPaddingTop).toBe(8)
      expect(svcDefaultDims.detailsPaddingBottom).toBe(6)
      expect(svcDefaultDims.staticBodyHeight).toBe(121)

      const partDefault = await render(
        <QueryClientProvider client={queryClient}>
          <PartCard item={samplePartItem} onPress={jest.fn()} />
        </QueryClientProvider>
      )
      const partDefaultDims = measureRenderedPeekCard(
        partDefault.getByTestId('listing-card-root') as never,
        partDefault.getByTestId('listing-card-details') as never
      )
      expect(partDefaultDims.rootWidth).toBe(SW * 0.6)
      expect(partDefaultDims.imageContainerHeight).toBe(CardSystem.aspectRatioHeight) // 140
      expect(partDefaultDims.detailsPaddingTop).toBe(8)
      expect(partDefaultDims.detailsPaddingBottom).toBe(6)
      expect(partDefaultDims.staticBodyHeight).toBe(121)

      // 2. Landing / Search / My Listings fullWidth card (fullWidth=true, imageHeight=undefined, compactBody=false):
      const svcFullWidth = await render(
        <QueryClientProvider client={queryClient}>
          <ServiceCard item={sampleServiceItem} onPress={jest.fn()} fullWidth />
        </QueryClientProvider>
      )
      const svcFullDims = measureRenderedPeekCard(
        svcFullWidth.getByTestId('listing-card-root') as never,
        svcFullWidth.getByTestId('listing-card-details') as never
      )
      expect(svcFullDims.rootWidth).toBe('100%')
      expect(svcFullDims.imageContainerHeight).toBe(CardSystem.fullWidthHeight) // 180
      expect(svcFullDims.staticBodyHeight).toBe(121)
      expect(svcFullDims.totalStaticHeight).toBe(303)

      const partFullWidth = await render(
        <QueryClientProvider client={queryClient}>
          <PartCard item={samplePartItem} onPress={jest.fn()} fullWidth maxChips={5} />
        </QueryClientProvider>
      )
      const partFullDims = measureRenderedPeekCard(
        partFullWidth.getByTestId('listing-card-root') as never,
        partFullWidth.getByTestId('listing-card-details') as never
      )
      expect(partFullDims.rootWidth).toBe('100%')
      expect(partFullDims.imageContainerHeight).toBe(CardSystem.fullWidthHeight) // 180
      expect(partFullDims.staticBodyHeight).toBe(121)
      expect(partFullDims.totalStaticHeight).toBe(303)
    })
  })

  describe('2. HomeScreen Integration: Cars, Services, and Parts Peek Sections & Skeleton Parity', () => {
    it('renders Cars, Services, and Parts sections in peek mode (80% width, 6pt gap, 20pt leading inset, dots, depth, 133pt image, compact 115pt body) while Buses and Equipment stay at 60% non-peek', async () => {
      const { getAllByTestId } = await render(
        <QueryClientProvider client={queryClient}>
          <HomeScreen />
        </QueryClientProvider>
      )

      const peekWidth = getPeekCardWidth(SW)
      const peekStep = peekWidth + CARS_PEEK_GAP

      // 5 CategorySections -> 5 HorizontalScrollCards in order:
      // [0] Cars (peek=true), [1] Services (peek=true), [2] Parts (peek=true), [3] Buses (peek=false), [4] Equipment (peek=false)
      const slot0Nodes = getAllByTestId('card-slot-0')
      const slot1Nodes = getAllByTestId('card-slot-1')
      expect(slot0Nodes).toHaveLength(5)
      expect(slot1Nodes).toHaveLength(5)

      for (const peekSectionIdx of [0, 1, 2]) {
        const slot0 = StyleSheet.flatten(slot0Nodes[peekSectionIdx].props.style)
        const slot1 = StyleSheet.flatten(slot1Nodes[peekSectionIdx].props.style)
        expect(slot0.width).toBe(peekWidth)
        expect(slot0.left).toBe(Spacing.space5)
        expect(slot1.width).toBe(peekWidth)
        expect(slot1.left).toBe(Spacing.space5 + peekStep)
      }

      // Buses [3] and Equipment [4] remain non-peek (60% CARD_WIDTH, Spacing.space3 gap):
      for (const nonPeekSectionIdx of [3, 4]) {
        const slot0 = StyleSheet.flatten(slot0Nodes[nonPeekSectionIdx].props.style)
        const slot1 = StyleSheet.flatten(slot1Nodes[nonPeekSectionIdx].props.style)
        expect(slot0.width).toBe(CARD_WIDTH)
        expect(slot0.left).toBe(Spacing.space5)
        expect(slot1.width).toBe(CARD_WIDTH)
        expect(slot1.left).toBe(Spacing.space5 + CARD_WIDTH + Spacing.space3)
      }

      // Depth wrappers exist only on the 3 peek sections (Cars, Services, Parts):
      const depthSlot0Nodes = getAllByTestId('card-slot-0-depth')
      expect(depthSlot0Nodes).toHaveLength(3)

      // Verify rendered cards inside HomeScreen:
      // Each of the 5 sections renders 2 items = 10 listing-card-root and 10 listing-card-details nodes.
      // Indices 0..1 = Cars, 2..3 = Services, 4..5 = Parts, 6..7 = Buses, 8..9 = Equipment
      const cardRoots = getAllByTestId('listing-card-root')
      const cardDetails = getAllByTestId('listing-card-details')
      expect(cardRoots).toHaveLength(10)
      expect(cardDetails).toHaveLength(10)

      for (const cardIdx of [0, 1, 2, 3, 4, 5]) {
        const dims = measureRenderedPeekCard(
          cardRoots[cardIdx] as never,
          cardDetails[cardIdx] as never
        )
        expect(dims.rootWidth).toBe('100%')
        expect(dims.imageContainerHeight).toBe(CARS_PEEK_IMAGE_HEIGHT)
        expect(dims.staticBodyHeight).toBe(115)
        expect(dims.totalStaticHeight).toBe(250)
      }

      // Buses and Equipment cards in HomeScreen remain standard non-peek height (140 image + 121 body + 2 borders = 263):
      for (const cardIdx of [6, 7, 8, 9]) {
        const dims = measureRenderedPeekCard(
          cardRoots[cardIdx] as never,
          cardDetails[cardIdx] as never
        )
        expect(dims.imageContainerHeight).toBe(CardSystem.aspectRatioHeight)
        expect(dims.staticBodyHeight).toBe(121)
      }
    })

    it('renders identical skeleton geometry for Cars, Services, and Parts sections in loading state from single-source constants', async () => {
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

      // Cars [0], Services [1], Parts [2] skeleton slots have identical width and positions:
      const carsSlot0 = StyleSheet.flatten(slot0Nodes[0].props.style)
      const carsSlot1 = StyleSheet.flatten(slot1Nodes[0].props.style)
      const carsSlot2 = StyleSheet.flatten(slot2Nodes[0].props.style)

      for (const peekIdx of [1, 2]) {
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

      // Skeleton body styles for Cars (0..2), Services (3..5), and Parts (6..8) all use compactBody (115pt body + 133pt image + 2pt border = 250pt):
      const skeletonBodies = getAllByTestId('skeleton-card-body')
      expect(skeletonBodies).toHaveLength(15) // 5 sections * 3 skeletons

      const staticSkeletonBodyCompact = computeStaticSkeletonBodyHeight(skeletonCardStyles, true)
      expect(staticSkeletonBodyCompact).toBe(115)
      expect(CARS_PEEK_IMAGE_HEIGHT + staticSkeletonBodyCompact + 2).toBe(250)

      for (const skelIdx of [0, 1, 2, 3, 4, 5, 6, 7, 8]) {
        const bodyFlat = StyleSheet.flatten(skeletonBodies[skelIdx].props.style)
        expect(bodyFlat.paddingTop).toBe(7)
        expect(bodyFlat.paddingBottom).toBe(5)
      }

      // Buses (9..11) and Equipment (12..14) skeletons remain non-compact:
      for (const skelIdx of [9, 10, 11, 12, 13, 14]) {
        const bodyFlat = StyleSheet.flatten(skeletonBodies[skelIdx].props.style)
        expect(bodyFlat.paddingTop).toBe(8)
        expect(bodyFlat.paddingBottom).toBe(6)
      }
    })
  })
})
