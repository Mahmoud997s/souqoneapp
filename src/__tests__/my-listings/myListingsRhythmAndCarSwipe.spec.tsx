import React from 'react'
import { StyleSheet } from 'react-native'
import { render, cleanup } from '@testing-library/react-native'
import { MyListingCardDispatcher } from '../../components/profile/my-listings/MyListingCardDispatcher'
import { MyListingSectionSlider } from '../../components/profile/my-listings/MyListingSectionSlider'
import { MyListingsVisualFilters } from '../../components/profile/MyListingsVisualFilters'
import { Spacing } from '../../constants/spacing'
import { MyListingItem } from '../../types/my-listings.types'

// Mock dependencies
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
  },
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

jest.mock('expo-image', () => ({
  Image: (props: any) => {
    const React = require('react')
    const { View } = require('react-native')
    return React.createElement(View, { ...props, testID: props.testID || 'expo-image-mock' })
  },
}))

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: (props: any) => {
    const React = require('react')
    const { View } = require('react-native')
    return React.createElement(View, { ...props, testID: 'linear-gradient-mock' })
  },
}))

jest.mock('../../store/authStore', () => ({
  useAuthStore: () => ({
    user: { id: 'test-user-1' },
    isAuthenticated: true,
  }),
}))

jest.mock('../../features/favorites/useFavoriteToggle', () => ({
  useFavoriteToggle: () => ({
    isFavorite: false,
    toggleFavorite: jest.fn(),
  }),
}))

const mockCarItem: MyListingItem = {
  id: 'car-1',
  entityType: 'car',
  normalizedStatus: 'active',
  rawStatus: 'ACTIVE',
  title: 'تويوتا كامري 2024',
  updatedAt: '2026-10-30T10:00:00Z',
  mapped: {
    id: 'car-1',
    title: 'تويوتا كامري 2024',
    price: 9500,
    currency: 'OMR',
    images: ['https://example.com/car1.jpg', 'https://example.com/car2.jpg', 'https://example.com/car3.jpg'],
    status: 'ACTIVE',
    createdAt: '2026-10-30T10:00:00Z',
  } as any,
  raw: {} as any,
}

describe('D-158: My Listings Vertical Rhythm & CarCard No Swipe', () => {
  afterEach(() => {
    cleanup()
  })

  describe('1. CarCard in MyListings: disableImageSwipe', () => {
    it('passes disableImageSwipe=true to CarCard, preventing multi-image gesture swiper and pagination dots', async () => {
      const { getByTestId, queryByTestId } = await render(
        <MyListingCardDispatcher
          item={mockCarItem}
          onView={jest.fn()}
          onEdit={jest.fn()}
          onDelete={jest.fn()}
          isEditSupported={true}
        />
      )

      // In CardImageSwiper, when disableImageSwipe is true, it renders card-image-static
      expect(getByTestId('card-image-static')).toBeTruthy()

      // Swiper gesture track and pagination dots must NOT be rendered
      expect(queryByTestId('card-image-swipeable')).toBeNull()
      expect(queryByTestId('card-image-swiper-dots')).toBeNull()
    })

    it('TEETH PROOF: verifies static single-image container is active instead of gesture swiper', async () => {
      const { getByTestId, queryByTestId } = await render(
        <MyListingCardDispatcher
          item={mockCarItem}
          onView={jest.fn()}
          onEdit={jest.fn()}
          onDelete={jest.fn()}
          isEditSupported={true}
        />
      )
      // When disableImageSwipe is active, static image exists and swiper track is absent
      const staticImage = getByTestId('card-image-static')
      expect(staticImage).toBeTruthy()
      expect(queryByTestId('card-image-swipeable')).toBeNull()
    })
  })

  describe('2. Vertical Spacing Rhythm & Horizontal 16px Alignment', () => {
    it('MyListingsVisualFilters specifies exact vertical tokens (12 top, 8 between, 12 bottom)', async () => {
      const { getByTestId } = await render(
        <MyListingsVisualFilters
          activeCategory="all"
          activeSubFilter="all"
          onSelectCategory={jest.fn()}
          onSelectSubFilter={jest.fn()}
        />
      )

      const base = getByTestId('visual-filters-base')
      const segmented = getByTestId('visual-filters-segmented-wrapper')
      const contentArea = getByTestId('visual-filters-content-area')

      const baseStyle = StyleSheet.flatten(base.props.style)
      const segmentedStyle = StyleSheet.flatten(segmented.props.style)
      const contentAreaStyle = StyleSheet.flatten(contentArea.props.style)

      // Header -> Tabs: space3 (12)
      expect(segmentedStyle.marginTop).toBe(Spacing.space3)
      expect(segmentedStyle.marginTop).toBe(12)

      // Tabs -> Chips: space2 (8) with 0 extra padding
      expect(segmentedStyle.marginBottom).toBe(Spacing.space2)
      expect(segmentedStyle.marginBottom).toBe(8)
      expect(contentAreaStyle.paddingTop).toBe(0)

      // Chips -> first section title: space3 (12)
      expect(baseStyle.paddingBottom).toBe(Spacing.space3)
      expect(baseStyle.paddingBottom).toBe(12)
    })

    it('MyListingSectionSlider spacing conforms to tokens (16 horizontal, 12 title-to-cards, 20 section-to-section)', async () => {
      const config = {
        entityType: 'car' as const,
        title: 'إعلانات السيارات',
        icon: 'car-sport-outline' as const,
        gradient: ['#1e3a8a', '#3b82f6'] as const,
        categoryId: 'cars',
      }

      const { getByTestId } = await render(
        <MyListingSectionSlider
          config={config}
          items={[mockCarItem]}
          onSelectCategory={jest.fn()}
          onView={jest.fn()}
          onEdit={jest.fn()}
          onDelete={jest.fn()}
          isEditSupported={() => true}
        />
      )

      const section = getByTestId('my-listing-section-slider')
      const header = getByTestId('my-listing-section-header')

      const sectionStyle = StyleSheet.flatten(section.props.style)
      const headerStyle = StyleSheet.flatten(header.props.style)

      // Section title horizontal padding is 16 (Spacing.space4), aligned with tabs & chips
      expect(headerStyle.paddingHorizontal).toBe(Spacing.space4)
      expect(headerStyle.paddingHorizontal).toBe(16)

      // Section title to cards is 12 (Spacing.space3)
      expect(headerStyle.marginBottom).toBe(Spacing.space3)
      expect(headerStyle.marginBottom).toBe(12)

      // Section to section margin is 20 (Spacing.space5)
      expect(sectionStyle.marginBottom).toBe(Spacing.space5)
      expect(sectionStyle.marginBottom).toBe(20)
    })

    it('TEETH PROOF: Section margin bottom is strictly space5 (20) and not the old space6 (32)', async () => {
      const config = {
        entityType: 'car' as const,
        title: 'إعلانات السيارات',
        icon: 'car-sport-outline' as const,
        gradient: ['#1e3a8a', '#3b82f6'] as const,
        categoryId: 'cars',
      }

      const { getByTestId } = await render(
        <MyListingSectionSlider
          config={config}
          items={[mockCarItem]}
          onSelectCategory={jest.fn()}
          onView={jest.fn()}
          onEdit={jest.fn()}
          onDelete={jest.fn()}
          isEditSupported={() => true}
        />
      )

      const section = getByTestId('my-listing-section-slider')
      const sectionStyle = StyleSheet.flatten(section.props.style)
      expect(sectionStyle.marginBottom).toBe(20)
      expect(sectionStyle.marginBottom).not.toBe(32)
      expect(sectionStyle.marginBottom).toBe(Spacing.space5)
    })
  })
})
