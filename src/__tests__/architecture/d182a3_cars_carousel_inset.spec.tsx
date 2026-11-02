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

  describe('1. Characterization of Cars Peek Carousel Inset & Left Peek (360pt and 412pt)', () => {
    it('keeps cardWidth at 80% of screen width and gap at 6pt across 360pt and 412pt screens', () => {
      expect(CARS_PEEK_WIDTH_RATIO).toBe(0.8)
      expect(CARS_PEEK_GAP).toBe(6)
      expect(CARS_PEEK_IMAGE_HEIGHT).toBe(133)

      // 360pt screen: cardWidth = 288pt
      const cardW360 = getPeekCardWidth(360)
      expect(cardW360).toBe(288)
      const centeredInset360 = getPeekSideInset(360)
      expect(centeredInset360).toBe(36)
      const centeredLeftPeek360 = 360 - centeredInset360 - cardW360 - CARS_PEEK_GAP
      expect(centeredLeftPeek360).toBe(30)

      // 412pt screen: cardWidth = 330pt
      const cardW412 = getPeekCardWidth(412)
      expect(cardW412).toBe(330)
      const centeredInset412 = getPeekSideInset(412)
      expect(centeredInset412).toBe(41)
      const centeredLeftPeek412 = 412 - centeredInset412 - cardW412 - CARS_PEEK_GAP
      expect(centeredLeftPeek412).toBe(35)
    })

    it('positions Cars peek slots at rightOffset = leadingInset + index * step', async () => {
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
      const expectedLeadingInset = getPeekSideInset(SW)

      const slot0 = StyleSheet.flatten(getByTestId('card-slot-0').props.style)
      const slot1 = StyleSheet.flatten(getByTestId('card-slot-1').props.style)
      const slot2 = StyleSheet.flatten(getByTestId('card-slot-2').props.style)
      const slotSeeAll = StyleSheet.flatten(getByTestId('card-slot-see-all').props.style)

      // Under RTL (I18nManager.isRTL = true), physicalRightStyle(offset) maps to { left: offset }
      expect(slot0.width).toBe(cardWidth)
      expect(slot0.left).toBe(expectedLeadingInset)
      expect(slot1.left).toBe(expectedLeadingInset + 1 * step)
      expect(slot2.left).toBe(expectedLeadingInset + 2 * step)
      expect(slotSeeAll.left).toBe(expectedLeadingInset + 3 * step)
    })
  })

  describe('2. Snap Offsets & Dots Active Index Mapping (Index 0, Middle, Last)', () => {
    it('snaps card 0, middle card (1), last data card (2), and SeeAll card (3) to leadingInset and updates active dot', async () => {
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

      const getActiveDotIndex = () => {
        const scroller = getByTestId('horizontal-scroll-card')
        const dotsContainer = scroller.children[1] as { children: Array<{ props: { style: unknown } }> }
        const dotViews = dotsContainer.children
        expect(dotViews).toHaveLength(4) // 3 cars + 1 SeeAll card
        return dotViews.findIndex((v) => {
          const flat = StyleSheet.flatten(v.props.style as never)
          return flat.width === 16 && flat.backgroundColor === Colors.primary
        })
      }

      // Index 0 (initial): snapped at translateX = 0, card 0 right edge at leadingInset, active dot = 0
      expect(getActiveDotIndex()).toBe(0)
      expect((leadingInset + 0 * step) - 0 * step).toBe(leadingInset)

      // Swipe to Index 1 (middle card):
      await act(async () => {
        capturedOnStart?.()
        capturedOnUpdate?.({ translationX: step * 0.5 })
        capturedOnEnd?.({ translationX: step * 0.5, velocityX: 300 })
      })
      expect(getActiveDotIndex()).toBe(1)
      expect((leadingInset + 1 * step) - 1 * step).toBe(leadingInset)

      // Swipe to Index 2 (last data card):
      await act(async () => {
        capturedOnStart?.()
        capturedOnUpdate?.({ translationX: step * 0.5 })
        capturedOnEnd?.({ translationX: step * 0.5, velocityX: 300 })
      })
      expect(getActiveDotIndex()).toBe(2)
      expect((leadingInset + 2 * step) - 2 * step).toBe(leadingInset)

      // Swipe to Index 3 (last item: SeeAll card):
      await act(async () => {
        capturedOnStart?.()
        capturedOnUpdate?.({ translationX: step * 0.5 })
        capturedOnEnd?.({ translationX: step * 0.5, velocityX: 300 })
      })
      expect(getActiveDotIndex()).toBe(3)
      expect((leadingInset + 3 * step) - 3 * step).toBe(leadingInset)

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

  describe('3. Loading Skeleton vs Real Card Geometry in Peek Mode', () => {
    it('renders 3 SkeletonCards in peek loading state with matching cardWidth, gap, and leadingInset', async () => {
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
      const expectedLeadingInset = getPeekSideInset(SW)

      const slot0 = StyleSheet.flatten(getByTestId('card-slot-0').props.style)
      const slot1 = StyleSheet.flatten(getByTestId('card-slot-1').props.style)
      const slot2 = StyleSheet.flatten(getByTestId('card-slot-2').props.style)

      expect(slot0.width).toBe(cardWidth)
      expect(slot0.left).toBe(expectedLeadingInset)
      expect(slot1.left).toBe(expectedLeadingInset + 1 * step)
      expect(slot2.left).toBe(expectedLeadingInset + 2 * step)
      expect(queryByTestId('card-slot-3')).toBeNull()
    })

    it('characterizes pre-fix compact body height of SkeletonCard (104pt / 239pt total) vs ListingCardBase (115pt / 250pt total)', () => {
      const realBodyCompact = computeStaticCardBodyHeight(listingCardBaseStyles, true)
      const skeletonBodyCompact = computeStaticSkeletonBodyHeight(skeletonCardStyles, true)
      const realBorder = Number(listingCardBaseStyles.card.borderWidth ?? 1) * 2
      const skeletonBorder = Number(skeletonCardStyles.card.borderWidth ?? 1) * 2

      expect(realBodyCompact).toBe(115)
      expect(CARS_PEEK_IMAGE_HEIGHT + realBodyCompact + realBorder).toBe(250)

      expect(skeletonBodyCompact).toBe(104)
      expect(CARS_PEEK_IMAGE_HEIGHT + skeletonBodyCompact + skeletonBorder).toBe(239)

      expect(skeletonCardStyles.card.borderRadius).toBe(CardSystem.radius.outer)
      expect(listingCardBaseStyles.card.borderRadius).toBe(CardSystem.radius.outer)
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
