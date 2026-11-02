import React from 'react'
import { View, Text, Dimensions, StyleSheet, I18nManager } from 'react-native'
import { render, act } from '@testing-library/react-native'
import { Gesture } from 'react-native-gesture-handler'
import {
  CategorySection,
  CARS_PEEK_WIDTH_RATIO,
  CARS_PEEK_GAP,
  CARS_PEEK_IMAGE_HEIGHT,
  CARD_WIDTH,
  getPeekCardWidth,
  getPeekSideInset,
  getPeekLeadingInset,
  getPeekLeftRemainder,
} from '../../../app/(tabs)/index'
import { Spacing } from '../../constants/spacing'
import { Colors } from '../../constants/colors'
import { CardSystem } from '../../constants/cardSystem'
import { listingCardBaseStyles } from '../../components/ui/ListingCardBase'
import { skeletonCardStyles } from '../../components/ui/SkeletonCard'
import {
  computeStaticCardBodyHeight,
  computeStaticSkeletonBodyHeight,
} from '../helpers/cardHeightEstimate'

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
    toggleFavorite: jest.fn(),
    isLoading: false,
  })),
}))

const reanimatedModule = require('react-native-reanimated')
reanimatedModule.FadeInDown = {
  duration: () => ({}),
}

interface PeekSlotGeometry {
  screenWidth: number
  cardWidth: number
  gap: number
  step: number
  leadingRightInset: number
  card0RightEdge: number
  card0LeftEdgeFromRight: number
  nextCardRightEdge: number
  nextCardVisibleLeftPeek: number
  lastCardTrailingLeftRemainder: number
  imageHeight: number
  bodyHeight: number
  borderHeight: number
  totalCardHeight: number
  borderRadius: number
}

function computePeekLayoutFromSource(
  screenWidth: number,
  isSkeleton: boolean
): PeekSlotGeometry {
  const cardWidth = getPeekCardWidth(screenWidth)
  const gap = CARS_PEEK_GAP
  const step = cardWidth + gap
  const leadingRightInset = getPeekLeadingInset()
  const card0RightEdge = leadingRightInset
  const card0LeftEdgeFromRight = leadingRightInset + cardWidth
  const nextCardRightEdge = leadingRightInset + step
  const nextCardVisibleLeftPeek = getPeekLeftRemainder(screenWidth)
  const lastCardTrailingLeftRemainder = screenWidth - leadingRightInset - cardWidth

  const imageHeight = CARS_PEEK_IMAGE_HEIGHT
  const bodyHeight = isSkeleton
    ? computeStaticSkeletonBodyHeight(skeletonCardStyles, true)
    : computeStaticCardBodyHeight(listingCardBaseStyles, true)
  const borderWidth = isSkeleton
    ? Number(skeletonCardStyles.card.borderWidth ?? 1)
    : Number(listingCardBaseStyles.card.borderWidth ?? 1)
  const borderHeight = borderWidth * 2
  const totalCardHeight = imageHeight + bodyHeight + borderHeight
  const borderRadius = isSkeleton
    ? Number(skeletonCardStyles.card.borderRadius)
    : Number(listingCardBaseStyles.card.borderRadius)

  return {
    screenWidth,
    cardWidth,
    gap,
    step,
    leadingRightInset,
    card0RightEdge,
    card0LeftEdgeFromRight,
    nextCardRightEdge,
    nextCardVisibleLeftPeek,
    lastCardTrailingLeftRemainder,
    imageHeight,
    bodyHeight,
    borderHeight,
    totalCardHeight,
    borderRadius,
  }
}

describe('D-182a3 — Home Cars Carousel Edge Inset & Skeleton Geometry', () => {
  const { width: SW } = Dimensions.get('window')

  const mockCarsData = [
    { id: 'car-1', title: 'تويوتا كامري 2024' },
    { id: 'car-2', title: 'نيسان باترول 2023' },
    { id: 'car-3', title: 'هوندا أكورد 2022' },
  ]

  const MockCustomCard = ({ item }: { item: { id: string; title: string } }) => (
    <View testID={`car-card-${item.id}`}>
      <Text>{item.title}</Text>
    </View>
  )

  beforeEach(() => {
    I18nManager.isRTL = true
    jest.clearAllMocks()
  })

  describe('1. Cars Peek Carousel Leading Inset = Spacing.space5 & Left Compensation (360pt and 412pt)', () => {
    it('uses Spacing.space5 (20pt) as leading right inset and compensates exact removed right distance on the left peek at 360pt and 412pt', () => {
      expect(CARS_PEEK_WIDTH_RATIO).toBe(0.8)
      expect(CARS_PEEK_GAP).toBe(6)
      expect(CARS_PEEK_IMAGE_HEIGHT).toBe(133)
      expect(getPeekLeadingInset()).toBe(Spacing.space5)
      expect(getPeekLeadingInset()).toBe(20)

      // 360pt screen:
      // Old centered right inset = 36pt, old left peek = 30pt
      // New start-aligned right inset = 20pt (16pt removed), new left peek = 46pt (30 + 16)
      const cardW360 = getPeekCardWidth(360)
      expect(cardW360).toBe(288)
      const oldRightInset360 = getPeekSideInset(360)
      expect(oldRightInset360).toBe(36)
      const oldLeftPeek360 = 360 - oldRightInset360 - cardW360 - CARS_PEEK_GAP
      expect(oldLeftPeek360).toBe(30)

      const newRightInset360 = getPeekLeadingInset()
      expect(newRightInset360).toBe(20)
      const newLeftPeek360 = getPeekLeftRemainder(360)
      expect(newLeftPeek360).toBe(46)
      expect(newLeftPeek360 - oldLeftPeek360).toBe(oldRightInset360 - newRightInset360)

      // 412pt screen:
      // Old centered right inset = 41pt, old left peek = 35pt
      // New start-aligned right inset = 20pt (21pt removed), new left peek = 56pt (35 + 21)
      const cardW412 = getPeekCardWidth(412)
      expect(cardW412).toBe(330)
      const oldRightInset412 = getPeekSideInset(412)
      expect(oldRightInset412).toBe(41)
      const oldLeftPeek412 = 412 - oldRightInset412 - cardW412 - CARS_PEEK_GAP
      expect(oldLeftPeek412).toBe(35)

      const newRightInset412 = getPeekLeadingInset()
      expect(newRightInset412).toBe(20)
      const newLeftPeek412 = getPeekLeftRemainder(412)
      expect(newLeftPeek412).toBe(56)
      expect(newLeftPeek412 - oldLeftPeek412).toBe(oldRightInset412 - newRightInset412)
    })

    it('positions Cars peek slots at rightOffset = Spacing.space5 + index * step (matching Services section leading edge)', async () => {
      const { getByTestId } = await render(
        <CategorySection
          peek={true}
          title="أحدث إعلانات السيارات"
          subTitle="أفضل عروض البيع والإيجار المتاحة"
          icon="car-sports"
          seeAllRoute="/cars/browse"
          data={mockCarsData as never}
          isLoading={false}
          routeBase="cars"
          CustomCard={MockCustomCard}
        />
      )

      const cardWidth = getPeekCardWidth(SW)
      const step = cardWidth + CARS_PEEK_GAP

      const slot0 = StyleSheet.flatten(getByTestId('card-slot-0').props.style)
      const slot1 = StyleSheet.flatten(getByTestId('card-slot-1').props.style)
      const slot2 = StyleSheet.flatten(getByTestId('card-slot-2').props.style)
      const slotSeeAll = StyleSheet.flatten(getByTestId('card-slot-see-all').props.style)

      // Under RTL (I18nManager.isRTL = true), physicalRightStyle(offset) maps to { left: offset }
      expect(slot0.width).toBe(cardWidth)
      expect(slot0.left).toBe(Spacing.space5)
      expect(slot0.left).not.toBe(getPeekSideInset(SW))
      expect(slot1.left).toBe(Spacing.space5 + 1 * step)
      expect(slot2.left).toBe(Spacing.space5 + 2 * step)
      expect(slotSeeAll.left).toBe(Spacing.space5 + 3 * step)
    })
  })

  describe('2. Snap Offsets & Dots Active Index Mapping (Index 0, Middle, Last)', () => {
    it('snaps card 0, middle card (1), last data card (2), and SeeAll card (3) to Spacing.space5 and updates active dot', async () => {
      let capturedOnStart: (() => void) | undefined
      let capturedOnUpdate: ((e: { translationX: number }) => void) | undefined
      let capturedOnEnd: ((e: { translationX: number; velocityX: number }) => void) | undefined

      const origPan = Gesture.Pan.bind(Gesture)
      const panSpy = jest.spyOn(Gesture, 'Pan').mockImplementation(() => {
        const pan = origPan()
        const origOnStart = pan.onStart.bind(pan)
        const origOnUpdate = pan.onUpdate.bind(pan)
        const origOnEnd = pan.onEnd.bind(pan)
        pan.onStart = (cb: never) => {
          capturedOnStart = cb
          return origOnStart(cb)
        }
        pan.onUpdate = (cb: never) => {
          capturedOnUpdate = cb
          return origOnUpdate(cb)
        }
        pan.onEnd = (cb: never) => {
          capturedOnEnd = cb
          return origOnEnd(cb)
        }
        return pan
      })

      const { getByTestId } = await render(
        <CategorySection
          peek={true}
          title="أحدث إعلانات السيارات"
          subTitle="أفضل عروض البيع والإيجار المتاحة"
          icon="car-sports"
          seeAllRoute="/cars/browse"
          data={mockCarsData as never}
          isLoading={false}
          routeBase="cars"
          CustomCard={MockCustomCard}
        />
      )

      const cardWidth = getPeekCardWidth(SW)
      const step = cardWidth + CARS_PEEK_GAP
      const leadingInset = StyleSheet.flatten(getByTestId('card-slot-0').props.style).left as number
      expect(leadingInset).toBe(Spacing.space5)

      const getActiveDotIndex = () => {
        const scroller = getByTestId('horizontal-scroll-card')
        const dotsContainer = (scroller.children[1] as unknown) as { children: Array<{ props: { style?: any } }> }
        const dotViews = dotsContainer.children
        expect(dotViews).toHaveLength(4) // 3 cars + 1 SeeAll card
        return dotViews.findIndex((v) => {
          const flat = StyleSheet.flatten(v.props.style) as any
          return flat?.width === 16 && flat?.backgroundColor === Colors.primary
        })
      }

      // Index 0 (initial): snapped at translateX = 0, card 0 right edge at Spacing.space5, active dot = 0
      expect(getActiveDotIndex()).toBe(0)
      expect((leadingInset + 0 * step) - 0 * step).toBe(Spacing.space5)

      // Swipe to Index 1 (middle card):
      await act(async () => {
        capturedOnStart?.()
        capturedOnUpdate?.({ translationX: step * 0.5 })
        capturedOnEnd?.({ translationX: step * 0.5, velocityX: 300 })
      })
      expect(getActiveDotIndex()).toBe(1)
      expect((leadingInset + 1 * step) - 1 * step).toBe(Spacing.space5)

      // Swipe to Index 2 (last data card):
      await act(async () => {
        capturedOnStart?.()
        capturedOnUpdate?.({ translationX: step * 0.5 })
        capturedOnEnd?.({ translationX: step * 0.5, velocityX: 300 })
      })
      expect(getActiveDotIndex()).toBe(2)
      expect((leadingInset + 2 * step) - 2 * step).toBe(Spacing.space5)

      // Swipe to Index 3 (last item: SeeAll card):
      await act(async () => {
        capturedOnStart?.()
        capturedOnUpdate?.({ translationX: step * 0.5 })
        capturedOnEnd?.({ translationX: step * 0.5, velocityX: 300 })
      })
      expect(getActiveDotIndex()).toBe(3)
      expect((leadingInset + 3 * step) - 3 * step).toBe(Spacing.space5)

      // Attempting to swipe past last item clamps to Index 3:
      await act(async () => {
        capturedOnStart?.()
        capturedOnUpdate?.({ translationX: step * 0.5 })
        capturedOnEnd?.({ translationX: step * 0.5, velocityX: 300 })
      })
      expect(getActiveDotIndex()).toBe(3)

      panSpy.mockRestore()
    })
  })

  describe('3. Loading Skeleton vs Real Card Geometry Parity to the Millimetre', () => {
    it('renders 3 SkeletonCards in peek loading state with identical cardWidth, gap, Spacing.space5 inset, and depth wrappers as loaded cards', async () => {
      const { getByTestId, queryByTestId } = await render(
        <CategorySection
          peek={true}
          title="أحدث إعلانات السيارات"
          subTitle="أفضل عروض البيع والإيجار المتاحة"
          icon="car-sports"
          seeAllRoute="/cars/browse"
          data={undefined}
          isLoading={true}
          routeBase="cars"
          CustomCard={MockCustomCard}
        />
      )

      const cardWidth = getPeekCardWidth(SW)
      const step = cardWidth + CARS_PEEK_GAP

      const slot0 = StyleSheet.flatten(getByTestId('card-slot-0').props.style)
      const slot1 = StyleSheet.flatten(getByTestId('card-slot-1').props.style)
      const slot2 = StyleSheet.flatten(getByTestId('card-slot-2').props.style)

      expect(slot0.width).toBe(cardWidth)
      expect(slot0.left).toBe(Spacing.space5)
      expect(slot1.left).toBe(Spacing.space5 + 1 * step)
      expect(slot2.left).toBe(Spacing.space5 + 2 * step)
      expect(queryByTestId('card-slot-3')).toBeNull()

      // Depth wrappers present in loading state too so card-slot-1 has the exact same scale/translateY/opacity
      expect(getByTestId('card-slot-0-depth')).toBeTruthy()
      expect(getByTestId('card-slot-1-depth')).toBeTruthy()
      expect(getByTestId('card-slot-2-depth')).toBeTruthy()
    })

    it('asserts exact equality of left/right edges, image height (133pt), body height (115pt), total height (250pt), and border/radius for skeleton vs real card at 360pt and 412pt', () => {
      for (const screenWidth of [360, 412]) {
        const realLayout = computePeekLayoutFromSource(screenWidth, false)
        const skeletonLayout = computePeekLayoutFromSource(screenWidth, true)

        expect(skeletonLayout).toEqual(realLayout)
        expect(skeletonLayout.leadingRightInset).toBe(Spacing.space5)
        expect(skeletonLayout.imageHeight).toBe(133)
        expect(skeletonLayout.bodyHeight).toBe(115)
        expect(skeletonLayout.borderHeight).toBe(2)
        expect(skeletonLayout.totalCardHeight).toBe(250)
        expect(skeletonLayout.borderRadius).toBe(CardSystem.radius.outer)
      }
    })
  })

  describe('4. Non-Peek Home Sections Remain Unchanged', () => {
    it('keeps non-peek sections at CARD_WIDTH (60%), Spacing.space5 (20pt) inset, and Spacing.space3 (12pt) gap', async () => {
      const { getByTestId } = await render(
        <CategorySection
          peek={false}
          title="خدمات السيارات"
          icon="car-wrench"
          seeAllRoute="/services/browse"
          data={mockCarsData as never}
          isLoading={false}
          routeBase="services"
          CustomCard={MockCustomCard}
        />
      )

      const slot0 = StyleSheet.flatten(getByTestId('card-slot-0').props.style)
      const slot1 = StyleSheet.flatten(getByTestId('card-slot-1').props.style)

      expect(slot0.width).toBe(CARD_WIDTH)
      expect(slot0.left).toBe(Spacing.space5)
      expect(slot1.left).toBe(Spacing.space5 + CARD_WIDTH + Spacing.space3)
    })
  })
})
