import React from 'react'
import { View, Text, Dimensions } from 'react-native'
import { render, fireEvent, act } from '@testing-library/react-native'
import { router } from 'expo-router'
import {
  CategorySection,
  CARS_PEEK_WIDTH_RATIO,
  CARS_PEEK_GAP,
  SIDE_SCALE,
  SIDE_TRANSLATE_Y,
  SIDE_OPACITY,
  SNAP_DURATION,
  CARD_WIDTH,
  getPeekCardWidth,
  getPeekSideInset,
  computeCardDepth,
} from '../../../app/(tabs)/index'
import { Spacing } from '../../constants/spacing'

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
  },
}))

jest.mock('react-native-reanimated', () => {
  const reanimated = require('react-native-reanimated/mock')
  return {
    ...reanimated,
    FadeInDown: {
      duration: () => ({}),
    },
  }
})

describe('Home Cars Section — Peek Carousel & Depth Motion (D-164 / D-164b)', () => {
  const { width: SCREEN_WIDTH } = Dimensions.get('window')

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('1. Pure Interpolation Helper: computeCardDepth (D-164b)', () => {
    it('returns scale 1, translateY 0, opacity 1 when card is centered (distance = 0)', () => {
      const centerDepth = computeCardDepth(0, false)
      expect(centerDepth.scale).toBe(1)
      expect(centerDepth.translateY).toBe(0)
      expect(centerDepth.opacity).toBe(1)
    })

    it('returns SIDE_SCALE (0.88), SIDE_TRANSLATE_Y (14), SIDE_OPACITY (0.85) when card is at side (distance = 1)', () => {
      const sideDepth = computeCardDepth(1, false)
      expect(sideDepth.scale).toBe(SIDE_SCALE)
      expect(sideDepth.scale).toBe(0.88)
      expect(sideDepth.translateY).toBe(SIDE_TRANSLATE_Y)
      expect(sideDepth.translateY).toBe(14)
      expect(sideDepth.opacity).toBe(SIDE_OPACITY)
      expect(sideDepth.opacity).toBe(0.85)
    })

    it('interpolates smoothly at intermediate distance (0.5)', () => {
      const midDepth = computeCardDepth(0.5, false)
      expect(midDepth.scale).toBeCloseTo(0.94, 2)
      expect(midDepth.translateY).toBe(7)
      expect(midDepth.opacity).toBeCloseTo(0.925, 2)
    })

    it('clamps transformations at max depth when distance >= 1', () => {
      const farDepth = computeCardDepth(2, false)
      expect(farDepth.scale).toBe(SIDE_SCALE)
      expect(farDepth.translateY).toBe(SIDE_TRANSLATE_Y)
      expect(farDepth.opacity).toBe(SIDE_OPACITY)
    })

    it('handles negative distance symmetrically (Math.abs)', () => {
      const negDepth = computeCardDepth(-1, false)
      expect(negDepth.scale).toBe(SIDE_SCALE)
      expect(negDepth.translateY).toBe(SIDE_TRANSLATE_Y)
      expect(negDepth.opacity).toBe(SIDE_OPACITY)
    })

    it('reduced motion returns flat values (scale 1, translateY 0, opacity 1) regardless of distance', () => {
      expect(computeCardDepth(0, true)).toEqual({ scale: 1, translateY: 0, opacity: 1 })
      expect(computeCardDepth(0.5, true)).toEqual({ scale: 1, translateY: 0, opacity: 1 })
      expect(computeCardDepth(1, true)).toEqual({ scale: 1, translateY: 0, opacity: 1 })
      expect(computeCardDepth(2, true)).toEqual({ scale: 1, translateY: 0, opacity: 1 })
    })

    it('teeth proof: moving card from center (0) to side (1) strictly decreases scale and opacity and increases translateY', () => {
      const center = computeCardDepth(0, false)
      const side = computeCardDepth(1, false)
      expect(side.scale).toBeLessThan(center.scale)
      expect(side.opacity).toBeLessThan(center.opacity)
      expect(side.translateY).toBeGreaterThan(center.translateY)
    })
  })

  describe('2. Peek Carousel Mathematical & Responsive Specs', () => {
    it('defines depth constants and peek width ratio 80% (D-164b)', () => {
      expect(CARS_PEEK_WIDTH_RATIO).toBe(0.80)
      expect(CARS_PEEK_GAP).toBe(10)
      expect(SIDE_SCALE).toBe(0.88)
      expect(SIDE_TRANSLATE_Y).toBe(14)
      expect(SIDE_OPACITY).toBe(0.85)
      expect(SNAP_DURATION).toBe(350)
    })

    it('calculates correct cardWidth and centered sideInset across standard screen sizes (360/390/430)', () => {
      // 360px screen (Compact Android)
      expect(getPeekCardWidth(360)).toBe(288) // 360 * 0.80
      expect(getPeekSideInset(360)).toBe(36)  // (360 - 288) / 2 = 10% on each side

      // 390px screen (Standard iPhone 13/14/15/16)
      expect(getPeekCardWidth(390)).toBe(312) // 390 * 0.80
      expect(getPeekSideInset(390)).toBe(39)  // (390 - 312) / 2 = 10% on each side

      // 430px screen (Pro Max / Plus iPhone)
      expect(getPeekCardWidth(430)).toBe(344) // 430 * 0.80
      expect(getPeekSideInset(430)).toBe(43)  // (430 - 344) / 2 = 10% on each side
    })

    it('standard CARD_WIDTH is scaled to 60% of screen width for all other categories', () => {
      expect(CARD_WIDTH).toBe(Math.round(SCREEN_WIDTH * 0.6))
    })
  })

  describe('3. CategorySection with peek={true} (CARS Section uses PeekCarousel)', () => {
    const mockCarsData = [
      { id: 'car-1', title: 'تويوتا كامري 2024' },
      { id: 'car-2', title: 'نيسان باترول 2023' },
      { id: 'car-3', title: 'هوندا أكورد 2022' },
    ]

    const MockCustomCard = ({ item, onPress }: any) => (
      <View testID={`mock-car-card-${item.id}`}>
        <Text onPress={onPress}>{item.title}</Text>
      </View>
    )

    it('renders PeekCarousel with snapToInterval, fast deceleration, depth wrappers, and dots', async () => {
      const { getByTestId, queryByTestId } = await render(
        <CategorySection
          peek={true}
          title="أحدث إعلانات السيارات"
          subTitle="أفضل عروض البيع والإيجار المتاحة"
          icon="car-sports"
          seeAllRoute="/cars/browse"
          data={mockCarsData as any}
          isLoading={false}
          routeBase="cars"
          CustomCard={MockCustomCard}
        />
      )

      // PeekCarousel is rendered (NOT HorizontalScrollCard)
      const carousel = getByTestId('peek-carousel')
      expect(carousel).toBeTruthy()
      expect(queryByTestId('horizontal-scroll-card')).toBeNull()

      // ScrollView has snapToInterval = cardWidth + gap and fast deceleration
      const scrollView = getByTestId('peek-carousel-scroll')
      expect(scrollView).toBeTruthy()
      const expectedStep = getPeekCardWidth(SCREEN_WIDTH) + CARS_PEEK_GAP
      expect(scrollView.props.snapToInterval).toBe(expectedStep)
      expect(scrollView.props.decelerationRate).toBe('fast')
      expect(scrollView.props.disableIntervalMomentum).toBe(true)

      // Each card has its depth wrapper
      expect(getByTestId('peek-card-depth-0')).toBeTruthy()
      expect(getByTestId('peek-card-depth-1')).toBeTruthy()
      expect(getByTestId('peek-card-depth-2')).toBeTruthy()

      // Dots container rendered
      expect(getByTestId('peek-carousel-dots')).toBeTruthy()
    })

    it('navigates to car detail when card is tapped, and to seeAllRoute when SeeAll button is tapped', async () => {
      const { getByText } = await render(
        <CategorySection
          peek={true}
          title="أحدث إعلانات السيارات"
          subTitle="أفضل عروض البيع والإيجار المتاحة"
          icon="car-sports"
          seeAllRoute="/cars/browse"
          data={mockCarsData as any}
          isLoading={false}
          routeBase="cars"
          CustomCard={MockCustomCard}
        />
      )

      // Tap card
      await act(async () => {
        fireEvent.press(getByText('تويوتا كامري 2024'))
      })
      expect(router.push).toHaveBeenCalledWith('/cars/car-1')

      // Tap See All header button
      await act(async () => {
        fireEvent.press(getByText('الكل'))
      })
      expect(router.push).toHaveBeenCalledWith('/cars/browse')
    })
  })

  describe('4. CategorySection with peek={false} (Other Sections DO NOT use PeekCarousel)', () => {
    const mockServicesData = [
      { id: 'svc-1', title: 'صيانة مكابح' },
      { id: 'svc-2', title: 'تغيير زيت' },
    ]

    const MockServiceCard = ({ item }: any) => (
      <View testID={`mock-svc-card-${item.id}`}>
        <Text>{item.title}</Text>
      </View>
    )

    it('renders with standard HorizontalScrollCard (60% width), and PeekCarousel is NOT rendered', async () => {
      const { getByTestId, queryByTestId } = await render(
        <CategorySection
          peek={false}
          title="خدمات السيارات"
          icon="car-wrench"
          seeAllRoute="/services/browse"
          data={mockServicesData as any}
          isLoading={false}
          routeBase="services"
          CustomCard={MockServiceCard}
        />
      )

      // HorizontalScrollCard is used
      const scroller = getByTestId('horizontal-scroll-card')
      expect(scroller).toBeTruthy()

      // PeekCarousel is NOT used
      expect(queryByTestId('peek-carousel')).toBeNull()

      const svc1Card = getByTestId('mock-svc-card-svc-1')
      const cardWrapper = svc1Card.parent as any
      expect(cardWrapper.props.style.width).toBe(CARD_WIDTH)
    })
  })
})
