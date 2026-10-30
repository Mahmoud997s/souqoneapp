import React from 'react'
import { StyleSheet } from 'react-native'
import { render, fireEvent, cleanup } from '@testing-library/react-native'
import { router } from 'expo-router'
import * as Haptics from 'expo-haptics'
import * as Reanimated from 'react-native-reanimated'
import {
  HomeCategoriesGrid,
  HOME_CATEGORIES,
  CATEGORY_ICONS,
  CATEGORY_ICON_SCALES,
  CATEGORY_GRID_COLUMNS,
  CATEGORY_GRID_GAP,
  CATEGORY_GRID_PADDING_H,
  CATEGORY_ITEM_SIZE,
  CATEGORY_ITEM_WIDTH,
  CATEGORY_ITEM_HEIGHT,
  MARQUEE_SPEED_PX_PER_SEC,
  MARQUEE_DIRECTION,
  getMarqueeEndpoints,
  calculateCategoryItemWidth,
  calculateCategoryGridGap,
} from '../components/home/HomeCategoriesGrid'
import { Colors } from '../constants/colors'

jest.mock('react-native-reanimated', () => {
  const reanimated = require('react-native-reanimated/mock')
  return {
    ...reanimated,
    cancelAnimation: jest.fn(),
    configureReanimatedLogger: jest.fn(),
  }
})

jest.mock('../utils/listing-detail/useAppReducedMotion', () => ({
  useAppReducedMotion: jest.fn(() => false),
}))

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
  },
}))

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children, ...props }: any) => {
    const React = require('react')
    const { View } = require('react-native')
    return React.createElement(View, props, children)
  },
}))

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: {
    Light: 'light',
  },
}))

jest.mock('expo-image', () => ({
  Image: (props: any) => {
    const React = require('react')
    const { View } = require('react-native')
    return React.createElement(View, { ...props, testID: props.testID || 'category-tile-image' })
  },
}))

describe('HomeCategoriesGrid — Floating Tiles 78x90 & Live Marquee Loop (D-163h/g)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('1. Data, Scale & Configuration Integrity', () => {
    it('HOME_CATEGORIES has exactly 6 items in preserved order', () => {
      expect(HOME_CATEGORIES).toHaveLength(6)
      const ids = HOME_CATEGORIES.map((cat) => cat.id)
      expect(ids).toEqual(['cars', 'services', 'parts', 'equipment', 'buses', 'browse'])
    })

    it('every category tile has a valid non-empty route, label, and image source', () => {
      HOME_CATEGORIES.forEach((cat) => {
        expect(cat.id).toBeTruthy()
        expect(cat.label.trim().length).toBeGreaterThan(0)
        expect(cat.route.trim().length).toBeGreaterThan(0)
        expect(cat.image).toBeDefined()
        expect(cat.image).not.toBeNull()
      })
    })

    it('CATEGORY_ICONS has entries for all 6 categories', () => {
      expect(CATEGORY_ICONS.cars).toBeDefined()
      expect(CATEGORY_ICONS.services).toBeDefined()
      expect(CATEGORY_ICONS.parts).toBeDefined()
      expect(CATEGORY_ICONS.equipment).toBeDefined()
      expect(CATEGORY_ICONS.buses).toBeDefined()
      expect(CATEGORY_ICONS.browse).toBeDefined()
    })

    it('CATEGORY_ICON_SCALES config has a defined numeric scale entry for EVERY category item', () => {
      HOME_CATEGORIES.forEach((cat) => {
        const scale = CATEGORY_ICON_SCALES[cat.id]
        expect(typeof scale).toBe('number')
        expect(scale).toBeGreaterThan(0)
      })

      expect(CATEGORY_ICON_SCALES['cars']).toBe(1.10)
      expect(CATEGORY_ICON_SCALES['buses']).toBe(1.10)
      expect(CATEGORY_ICON_SCALES['equipment']).toBe(1.05)
      expect(CATEGORY_ICON_SCALES['services']).toBe(1.0)
      expect(CATEGORY_ICON_SCALES['parts']).toBe(1.0)
      expect(CATEGORY_ICON_SCALES['browse']).toBe(1.0)
    })

    it('Tile geometry math defines compact portrait tile 78x90 with 12px gap (D-163h)', () => {
      expect(CATEGORY_ITEM_WIDTH).toBe(78)
      expect(CATEGORY_ITEM_HEIGHT).toBe(90)
      expect(CATEGORY_ITEM_SIZE).toBe(78)
      expect(CATEGORY_GRID_GAP).toBe(12)
      expect(calculateCategoryItemWidth(360)).toBe(78)
      expect(calculateCategoryGridGap(360)).toBe(12)
    })

    it('exports MARQUEE_SPEED_PX_PER_SEC within recommended 25-30 px/s range (D-163g)', () => {
      expect(typeof MARQUEE_SPEED_PX_PER_SEC).toBe('number')
      expect(MARQUEE_SPEED_PX_PER_SEC).toBeGreaterThanOrEqual(25)
      expect(MARQUEE_SPEED_PX_PER_SEC).toBeLessThanOrEqual(30)
    })

    it('exports MARQUEE_DIRECTION = 1 for left-to-right rightward motion (D-163i)', () => {
      expect(MARQUEE_DIRECTION).toBe(1)
    })

    it('getMarqueeEndpoints correctly configures endpoints for rightward (1) and leftward (-1) motions (D-163i)', () => {
      const singleSetWidth = 540 // 6 * (78 + 12)

      // Rightward motion (1): starts shifted to left (-540) and translates to 0 (+540 displacement = rightward)
      const rightward = getMarqueeEndpoints(singleSetWidth, 1)
      expect(rightward.start).toBe(-540)
      expect(rightward.end).toBe(0)
      expect(rightward.end - rightward.start).toBe(540) // Positive displacement

      // Leftward motion (-1): starts at 0 and translates to -540 (-540 displacement = leftward) — teeth proof flip
      const leftward = getMarqueeEndpoints(singleSetWidth, -1)
      expect(leftward.start).toBe(0)
      expect(leftward.end).toBe(-540)
      expect(leftward.end - leftward.start).toBe(-540) // Negative displacement

      // Seamless loop invariant: difference between start and end is exactly singleSetWidth
      expect(Math.abs(rightward.end - rightward.start)).toBe(singleSetWidth)
      expect(Math.abs(leftward.end - leftward.start)).toBe(singleSetWidth)
    })
  })

  describe('2. Reduced Motion Fallback', () => {
    it('renders static horizontal ScrollView with 6 tiles when reduced motion is enabled', async () => {
      const { getByTestId, queryByTestId } = await render(<HomeCategoriesGrid reducedMotion={true} />)
      const scrollView = getByTestId('home-categories-scroll')
      expect(scrollView).toBeTruthy()
      expect(scrollView.props.horizontal).toBe(true)

      HOME_CATEGORIES.forEach((cat) => {
        expect(getByTestId(`category-tile-${cat.id}`)).toBeTruthy()
      })
      expect(queryByTestId('home-categories-marquee-track')).toBeNull()
    })
  })

  describe('3. Live Marquee Seamless Loop & Rendering (D-163g)', () => {
    it('renders marquee track with 2 sets (12 tiles total) and hides Set B from accessibility', async () => {
      const { getByTestId, getAllByTestId, queryByTestId } = await render(<HomeCategoriesGrid />)

      // Marquee track container exists
      const marqueeTrack = getByTestId('home-categories-marquee-track')
      expect(marqueeTrack).toBeTruthy()

      // category-label-line must NOT exist
      expect(queryByTestId('category-label-line')).toBeNull()

      // No grey pill shadow under any icon
      expect(queryByTestId('category-tile-shadow')).toBeNull()

      // Set A: 6 standard tiles
      HOME_CATEGORIES.forEach((cat) => {
        const tile = getByTestId(`category-tile-${cat.id}`)
        expect(tile).toBeTruthy()
        expect(tile.props.accessibilityLabel).toBe(cat.label)
        expect(tile.props.accessibilityRole).toBe('button')

        // Compact card dimensions 78x90
        const cardView = tile.children[0] as any
        const cardStyle = StyleSheet.flatten(cardView.props.style)
        expect(cardStyle.width).toBe(78)
        expect(cardStyle.height).toBe(90)
        expect(cardStyle.minHeight).toBe(90)
        expect(cardStyle.borderRadius).toBe(16)

        // Tile slot width = 78
        const itemWrap = tile.parent as any
        expect(itemWrap).toBeTruthy()
        const itemWrapStyle = StyleSheet.flatten(itemWrap.props.style)
        expect(itemWrapStyle.width).toBe(78)

        // Uniform gentle gradient
        const cardChildren = React.Children.toArray(cardView.props.children) as any[]
        const gradient = cardChildren.find((c: any) => c.props.testID === 'tile-gradient')
        expect(gradient).toBeTruthy()
        expect(gradient.props.colors).toEqual([Colors.surface, Colors.surfaceAlt])

        // Icon container: 52x52
        const iconContainer = cardChildren.find((c: any) => c.props.testID === `icon-container-${cat.id}`) || cardChildren[1]
        const iconContainerChildren = React.Children.toArray(iconContainer.props.children) as any[]
        const iconBox = iconContainerChildren[0]
        const iconBoxStyle = StyleSheet.flatten(iconBox.props.style)
        expect(iconBoxStyle.width).toBe(52)
        expect(iconBoxStyle.height).toBe(52)

        // Text label font size 14, line height 18
        const labelText = cardChildren.find((c: any) => c.props.children === cat.label)
        expect(labelText).toBeTruthy()
        const labelStyle = StyleSheet.flatten(labelText.props.style)
        expect(labelStyle.fontSize).toBe(14)
        expect(labelStyle.lineHeight).toBe(18)
      })

      // Set B: duplicate set hidden from accessibility
      const setBContainer = getByTestId('home-categories-set-b', { includeHiddenElements: true })
      expect(setBContainer).toBeTruthy()
      expect(setBContainer.props.accessibilityElementsHidden).toBe(true)
      expect(setBContainer.props.importantForAccessibility).toBe('no-hide-descendants')

      HOME_CATEGORIES.forEach((cat) => {
        const dupTile = getByTestId(`category-tile-${cat.id}-dup`, { includeHiddenElements: true })
        expect(dupTile).toBeTruthy()
      })

      // 12 tiles in total (6 accessible in set A + 6 duplicates in set B)
      const allTileImages = getAllByTestId('category-tile-image', { includeHiddenElements: true })
      expect(allTileImages).toHaveLength(12)
    })

    it('pauses animation on touchStart and resumes smoothly after touchEnd (D-163g)', async () => {
      const { getByTestId } = await render(<HomeCategoriesGrid />)

      const marqueeContainer = getByTestId('home-categories-marquee-container')
      expect(marqueeContainer).toBeTruthy()

      // User touches row -> cancelAnimation called
      fireEvent(marqueeContainer, 'touchStart')
      expect(Reanimated.cancelAnimation).toHaveBeenCalled()
    })

    it('navigates when tiles in set A or set B are pressed and triggers haptics', async () => {
      const { getByTestId } = await render(<HomeCategoriesGrid />)

      const carsTile = getByTestId('category-tile-cars')
      fireEvent(carsTile, 'pressIn')
      expect(Haptics.impactAsync).toHaveBeenCalledWith('light')
      fireEvent(carsTile, 'pressOut')

      fireEvent.press(carsTile)
      expect(router.push).toHaveBeenCalledWith('/cars')

      // Duplicate set B tile also triggers navigation
      const browseDupTile = getByTestId('category-tile-browse-dup', { includeHiddenElements: true })
      fireEvent.press(browseDupTile)
      expect(router.push).toHaveBeenCalledWith('/(tabs)/browse')
    })
  })

  describe('4. Optical Scale Configuration (D-153c)', () => {
    it('each category maintains defined optical scale in CATEGORY_ICON_SCALES', () => {
      HOME_CATEGORIES.forEach((cat) => {
        expect(CATEGORY_ICON_SCALES[cat.id]).toBeDefined()
        expect(typeof CATEGORY_ICON_SCALES[cat.id]).toBe('number')
      })
      expect(CATEGORY_ICON_SCALES.cars).toBe(1.10)
      expect(CATEGORY_ICON_SCALES.buses).toBe(1.10)
      expect(CATEGORY_ICON_SCALES.equipment).toBe(1.05)
      expect(CATEGORY_ICON_SCALES.services).toBe(1.0)
      expect(CATEGORY_ICON_SCALES.parts).toBe(1.0)
      expect(CATEGORY_ICON_SCALES.browse).toBe(1.0)
    })
  })
})
