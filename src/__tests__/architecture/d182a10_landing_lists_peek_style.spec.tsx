import React from 'react'
import { StyleSheet, Dimensions, I18nManager } from 'react-native'
import { render, cleanup, act } from '@testing-library/react-native'
import fs from 'fs'
import path from 'path'
import * as PeekCarousel from '../../constants/peekCarousel'
import * as HomeIndex from '../../../app/(tabs)/index'
import { CarHorizontalList } from '../../components/cars/CarHorizontalList'
import { PartHorizontalList } from '../../components/parts/PartHorizontalList'
import { ServiceHorizontalList } from '../../components/services/ServiceHorizontalList'
import { BusHorizontalList } from '../../components/buses/landing/BusHorizontalList'
import { EquipmentHorizontalList } from '../../components/equipment/landing/EquipmentHorizontalList'
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

jest.mock('../../features/favorites/useFavoriteToggle', () => ({
  useFavoriteToggle: jest.fn(() => ({
    isFavorite: false,
    toggle: jest.fn(),
    toggleFavorite: jest.fn(),
    isLoading: false,
  })),
}))

jest.mock('../../hooks/useCars', () => ({
  useBrands: () => ({ data: [] }),
}))

const { width: SW } = Dimensions.get('window')

const sampleCar: Listing = {
  id: 'car-1',
  title: 'تويوتا لاندكروزر 2024',
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

const samplePart: UnifiedCardItem = {
  id: 'part-1',
  category: 'part',
  title: 'طقم فرامل سيراميك أصلي',
  price: 45,
  currency: 'OMR',
  governorate: 'مسقط',
  images: ['https://example.com/part1.jpg'],
  raw: {
    id: 'part-1',
    city: 'المعبيلة',
    createdAt: '2026-10-30T10:00:00Z',
    partCategory: 'BRAKES',
    condition: 'NEW',
    isOriginal: true,
    isPriceNegotiable: true,
    compatibleMakes: ['toyota'],
    compatibleModels: 'كامري',
    yearFrom: 2020,
    yearTo: 2024,
  },
}

const sampleService: UnifiedCardItem = {
  id: 'svc-1',
  category: 'service',
  title: 'فحص كمبيوتر وصيانة شاملة',
  price: 25,
  currency: 'OMR',
  governorate: 'مسقط',
  images: ['https://example.com/svc1.jpg'],
  raw: {
    id: 'svc-1',
    city: 'بوشر',
    createdAt: '2026-10-30T10:00:00Z',
    providerName: 'مركز النخبة',
    providerType: 'WORKSHOP',
    serviceType: 'MAINTENANCE',
    isHomeService: true,
  },
}

const sampleBus: Listing = {
  id: 'bus-1',
  title: 'حافلة تويوتا كوستر 2023',
  description: 'حافلة نظيفة',
  price: 18500,
  currency: 'OMR',
  listingType: 'BUS_SALE',
  condition: 'USED',
  status: 'ACTIVE',
  images: ['https://example.com/bus1.jpg'],
  governorate: 'مسقط',
  city: 'غلا',
  createdAt: '2026-10-30T10:00:00Z',
  updatedAt: '2026-10-30T10:00:00Z',
  userId: 'user-2',
  viewsCount: 8,
  isPremium: false,
  raw: {
    id: 'bus-1',
    make: 'تويوتا',
    year: 2023,
    mileage: 45000,
    capacity: 30,
    busType: 'COASTER',
    transmission: 'MANUAL',
    condition: 'USED',
  },
} as unknown as Listing

const sampleEquip: Listing = {
  id: 'eq-1',
  title: 'حفار كاتربيلر 320D',
  description: 'معدة جاهزة',
  price: 32000,
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
    id: 'eq-1',
    make: 'كاتربيلر',
    model: '320D',
    year: 2021,
    hoursUsed: 3200,
    condition: 'USED',
  },
} as unknown as Listing

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

describe('D-182a10 — Landing Horizontal Lists Peek Style & 250pt Parity', () => {
  beforeEach(() => {
    I18nManager.isRTL = true
  })

  afterEach(async () => {
    await act(async () => {
      cleanup()
    })
  })

  describe('1. Extracted Constants Module (src/constants/peekCarousel.ts) & Home Re-export Parity', () => {
    it('exports exact peek constants (80%, 6, 133, 20) and re-exports them identically from app/(tabs)/index.tsx', () => {
      expect(PeekCarousel.CARS_PEEK_WIDTH_RATIO).toBe(0.8)
      expect(PeekCarousel.CARS_PEEK_GAP).toBe(6)
      expect(PeekCarousel.CARS_PEEK_IMAGE_HEIGHT).toBe(133)
      expect(PeekCarousel.getPeekLeadingInset()).toBe(Spacing.space5)
      expect(PeekCarousel.getPeekLeadingInset()).toBe(20)

      expect(PeekCarousel.getPeekCardWidth(390)).toBe(312)
      expect(PeekCarousel.getPeekSideInset(390)).toBe(39)
      expect(PeekCarousel.getPeekLeftRemainder(390)).toBe(52)

      expect(HomeIndex.CARS_PEEK_WIDTH_RATIO).toBe(PeekCarousel.CARS_PEEK_WIDTH_RATIO)
      expect(HomeIndex.CARS_PEEK_GAP).toBe(PeekCarousel.CARS_PEEK_GAP)
      expect(HomeIndex.CARS_PEEK_IMAGE_HEIGHT).toBe(PeekCarousel.CARS_PEEK_IMAGE_HEIGHT)
      expect(HomeIndex.getPeekCardWidth).toBe(PeekCarousel.getPeekCardWidth)
      expect(HomeIndex.getPeekSideInset).toBe(PeekCarousel.getPeekSideInset)
      expect(HomeIndex.getPeekLeadingInset).toBe(PeekCarousel.getPeekLeadingInset)
      expect(HomeIndex.getPeekLeftRemainder).toBe(PeekCarousel.getPeekLeftRemainder)
    })

    it('ensures all 5 landing list components import from constants/peekCarousel (not from app/(tabs)/index) and pass paging, showDots, depthEffect, trackPendingIndex, maxChips=4, titleNumberOfLines=1', () => {
      const files = [
        'src/components/cars/CarHorizontalList.tsx',
        'src/components/parts/PartHorizontalList.tsx',
        'src/components/services/ServiceHorizontalList.tsx',
        'src/components/buses/landing/BusHorizontalList.tsx',
        'src/components/equipment/landing/EquipmentHorizontalList.tsx',
      ]
      for (const rel of files) {
        const content = fs.readFileSync(path.resolve(process.cwd(), rel), 'utf-8')
        expect(content).toContain('constants/peekCarousel')
        expect(content).not.toContain('app/(tabs)')
        expect(content).toMatch(/\bpaging\b/)
        expect(content).toMatch(/\bshowDots\b/)
        expect(content).toMatch(/\bdepthEffect\b/)
        expect(content).toMatch(/\btrackPendingIndex\b/)
        expect(content).toMatch(/maxChips=\{4\}/)
        expect(content).toMatch(/titleNumberOfLines=\{1\}/)
      }
    })
  })

  describe('2. Teeth: All 5 Landing Horizontal Lists Render Peek Geometry & 250pt Cards (Loaded State)', () => {
    type GenericListProps = {
      title: string
      subTitle: string
      data: unknown[]
      isLoading: boolean
      emptyText: string
      onSeeAll: () => void
      onPressItem: (item: unknown) => void
    }

    const expectedWidth = PeekCarousel.getPeekCardWidth(SW)
    const expectedGap = PeekCarousel.CARS_PEEK_GAP
    const expectedStep = expectedWidth + expectedGap
    const expectedPaddingEnd = PeekCarousel.getPeekLeadingInset()

    const cases: ReadonlyArray<{
      name: string
      Component: React.ComponentType<GenericListProps>
      items: unknown[]
    }> = [
      {
        name: 'CarHorizontalList',
        Component: CarHorizontalList as unknown as React.ComponentType<GenericListProps>,
        items: [sampleCar, { ...sampleCar, id: 'car-2' }],
      },
      {
        name: 'PartHorizontalList',
        Component: PartHorizontalList as unknown as React.ComponentType<GenericListProps>,
        items: [samplePart, { ...samplePart, id: 'part-2' }],
      },
      {
        name: 'ServiceHorizontalList',
        Component: ServiceHorizontalList as unknown as React.ComponentType<GenericListProps>,
        items: [sampleService, { ...sampleService, id: 'svc-2' }],
      },
      {
        name: 'BusHorizontalList',
        Component: BusHorizontalList as unknown as React.ComponentType<GenericListProps>,
        items: [sampleBus, { ...sampleBus, id: 'bus-2' }],
      },
      {
        name: 'EquipmentHorizontalList',
        Component: EquipmentHorizontalList as unknown as React.ComponentType<GenericListProps>,
        items: [sampleEquip, { ...sampleEquip, id: 'eq-2' }],
      },
    ]

    it.each(cases)(
      '$name renders 80% peek cardWidth, gap=6, paddingEnd=20, depthEffect, see-all end card, and 250pt total height (133 image + 115 compact body + 2 border)',
      async ({ Component, items }) => {
        const onSeeAll = jest.fn()
        const onPressItem = jest.fn()

        const { getByTestId, getAllByTestId } = await render(
          <Component
            title="قسم تجريبي"
            subTitle="وصف تجريبي"
            data={items}
            isLoading={false}
            emptyText="فارغ"
            onSeeAll={onSeeAll}
            onPressItem={onPressItem}
          />
        )

        const slot0 = StyleSheet.flatten(getByTestId('card-slot-0').props.style)
        const slot1 = StyleSheet.flatten(getByTestId('card-slot-1').props.style)
        const slotSeeAll = StyleSheet.flatten(getByTestId('card-slot-see-all').props.style)

        expect(slot0.width).toBe(expectedWidth)
        expect(slot0.left).toBe(expectedPaddingEnd)
        expect(slot1.width).toBe(expectedWidth)
        expect(slot1.left).toBe(expectedPaddingEnd + expectedStep)
        expect(slotSeeAll.width).toBe(expectedWidth)
        expect(slotSeeAll.left).toBe(expectedPaddingEnd + 2 * expectedStep)

        // Depth wrapper present (proves depthEffect={true})
        expect(getByTestId('card-slot-0-depth')).toBeTruthy()
        expect(getByTestId('card-slot-1-depth')).toBeTruthy()
        expect(getByTestId('card-slot-see-all-depth')).toBeTruthy()

        // Measure rendered card dimensions: 133 image + 115 compact body + 2 border = 250pt
        const roots = getAllByTestId('listing-card-root')
        const details = getAllByTestId('listing-card-details')
        expect(roots).toHaveLength(2)
        expect(details).toHaveLength(2)

        for (const idx of [0, 1]) {
          const dims = measureRenderedPeekCard(roots[idx] as never, details[idx] as never)
          expect(dims.rootWidth).toBe('100%')
          expect(dims.imageContainerHeight).toBe(133)
          expect(dims.detailsPaddingTop).toBe(7)
          expect(dims.detailsPaddingBottom).toBe(5)
          expect(dims.staticBodyHeight).toBe(115)
          expect(dims.borderWidth).toBe(1)
          expect(dims.totalStaticHeight).toBe(250)
          expect(dims.borderRadius).toBe(CardSystem.radius.outer)
        }

        // Right-edge reconciliation: landing screen content has paddingHorizontal=Spacing.space5 (20),
        // list wrapper has marginHorizontal=-Spacing.space5 (-20), and slot0.left=getPeekLeadingInset() (20)
        // -> net physical right edge distance = 20 - 20 + 20 = 20 (Spacing.space5), identical to Home
        const netRightEdgeDistance =
          Spacing.space5 + -Spacing.space5 + Number(slot0.left)
        expect(netRightEdgeDistance).toBe(Spacing.space5)
      }
    )
  })

  describe('3. Skeleton Parity Across All 5 Landing Lists (isLoading=true)', () => {
    type GenericListProps = {
      title: string
      subTitle: string
      data: unknown[]
      isLoading: boolean
      emptyText: string
      onSeeAll: () => void
      onPressItem: (item: unknown) => void
    }

    const expectedWidth = PeekCarousel.getPeekCardWidth(SW)
    const expectedGap = PeekCarousel.CARS_PEEK_GAP
    const expectedStep = expectedWidth + expectedGap
    const expectedPaddingEnd = PeekCarousel.getPeekLeadingInset()

    const listComponents: ReadonlyArray<{
      name: string
      Component: React.ComponentType<GenericListProps>
    }> = [
      {
        name: 'CarHorizontalList',
        Component: CarHorizontalList as unknown as React.ComponentType<GenericListProps>,
      },
      {
        name: 'PartHorizontalList',
        Component: PartHorizontalList as unknown as React.ComponentType<GenericListProps>,
      },
      {
        name: 'ServiceHorizontalList',
        Component: ServiceHorizontalList as unknown as React.ComponentType<GenericListProps>,
      },
      {
        name: 'BusHorizontalList',
        Component: BusHorizontalList as unknown as React.ComponentType<GenericListProps>,
      },
      {
        name: 'EquipmentHorizontalList',
        Component: EquipmentHorizontalList as unknown as React.ComponentType<GenericListProps>,
      },
    ]

    it.each(listComponents)(
      '$name renders 3 SkeletonCards in peek slots (width=80%, gap=6, paddingEnd=20, depthEffect) with 250pt compact geometry',
      async ({ Component }) => {
        const { getByTestId, getAllByTestId } = await render(
          <Component
            title="قسم تجريبي"
            subTitle="وصف تجريبي"
            data={[]}
            isLoading={true}
            emptyText="فارغ"
            onSeeAll={jest.fn()}
            onPressItem={jest.fn()}
          />
        )

        const slot0 = StyleSheet.flatten(getByTestId('card-slot-0').props.style)
        const slot1 = StyleSheet.flatten(getByTestId('card-slot-1').props.style)
        const slot2 = StyleSheet.flatten(getByTestId('card-slot-2').props.style)

        expect(slot0.width).toBe(expectedWidth)
        expect(slot0.left).toBe(expectedPaddingEnd)
        expect(slot1.left).toBe(expectedPaddingEnd + expectedStep)
        expect(slot2.left).toBe(expectedPaddingEnd + 2 * expectedStep)

        expect(getByTestId('card-slot-0-depth')).toBeTruthy()

        const skeletonBodies = getAllByTestId('skeleton-card-body')
        expect(skeletonBodies).toHaveLength(3)

        const staticSkeletonBodyCompact = computeStaticSkeletonBodyHeight(
          skeletonCardStyles,
          true
        )
        expect(staticSkeletonBodyCompact).toBe(115)
        expect(PeekCarousel.CARS_PEEK_IMAGE_HEIGHT + staticSkeletonBodyCompact + 2).toBe(250)

        for (const bodyNode of skeletonBodies) {
          const bodyFlat = StyleSheet.flatten(bodyNode.props.style)
          expect(bodyFlat.paddingTop).toBe(7)
          expect(bodyFlat.paddingBottom).toBe(5)
        }
      }
    )
  })
})
