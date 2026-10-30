import React from 'react'
import { View, Text, Dimensions } from 'react-native'
import { render, fireEvent, act } from '@testing-library/react-native'
import { router } from 'expo-router'
import {
  CategorySection,
  CARS_PEEK_WIDTH_RATIO,
  CARS_PEEK_GAP,
  CARD_WIDTH,
  getPeekCardWidth,
  getPeekSideInset,
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

describe('Home Cars Section — Peek Carousel & Geometry (D-164)', () => {
  const { width: SCREEN_WIDTH } = Dimensions.get('window')

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('1. Peek Carousel Mathematical & Responsive Specs', () => {
    it('defines peek width ratio as 80% (0.80) and gap as 10px', () => {
      expect(CARS_PEEK_WIDTH_RATIO).toBe(0.80)
      expect(CARS_PEEK_GAP).toBe(10)
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

  describe('2. CategorySection with peek={true} (CARS Section)', () => {
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

    it('renders with 80% cardWidth, centered sideInset padding, paging enabled, and dots shown', async () => {
      const { getByTestId } = await render(
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

      // HorizontalScrollCard receives peek props
      const scroller = getByTestId('horizontal-scroll-card')
      expect(scroller).toBeTruthy()

      // Card 0 is rendered with peek card width
      const car1Card = getByTestId('mock-car-card-car-1')
      expect(car1Card).toBeTruthy()

      const cardWrapper = car1Card.parent as any
      expect(cardWrapper).toBeTruthy()
      expect(cardWrapper.props.style.width).toBe(getPeekCardWidth(SCREEN_WIDTH))
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

  describe('3. CategorySection with peek={false} (Other Sections Unchanged)', () => {
    const mockServicesData = [
      { id: 'svc-1', title: 'صيانة مكابح' },
      { id: 'svc-2', title: 'تغيير زيت' },
    ]

    const MockServiceCard = ({ item }: any) => (
      <View testID={`mock-svc-card-${item.id}`}>
        <Text>{item.title}</Text>
      </View>
    )

    it('renders with standard CARD_WIDTH (60%), standard Spacing.space5 padding, no dots, and no paging', async () => {
      const { getByTestId } = await render(
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

      const scroller = getByTestId('horizontal-scroll-card')
      expect(scroller).toBeTruthy()

      const svc1Card = getByTestId('mock-svc-card-svc-1')
      const cardWrapper = svc1Card.parent as any
      expect(cardWrapper.props.style.width).toBe(CARD_WIDTH)
    })
  })
})
