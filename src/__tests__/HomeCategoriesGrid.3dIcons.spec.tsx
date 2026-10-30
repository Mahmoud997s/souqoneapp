import React from 'react'
import { StyleSheet } from 'react-native'
import { render, fireEvent, cleanup } from '@testing-library/react-native'
import { router } from 'expo-router'
import * as Haptics from 'expo-haptics'
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
  calculateCategoryItemWidth,
  calculateCategoryGridGap,
} from '../components/home/HomeCategoriesGrid'
import { Colors } from '../constants/colors'

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

describe('HomeCategoriesGrid — Floating Tiles 78x90 & Clean Aesthetic (D-163h)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
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
  })

  describe('2. Floating Tiles Rendering & Clean Minimalist Look (D-163h)', () => {
    it('renders horizontal scroll row of 6 floating 78x90 tiles without outer card container or icon shadow pills', async () => {
      const { getByTestId, getAllByTestId, queryByTestId } = await render(<HomeCategoriesGrid />)

      // (أ) ScrollView exists and scrolls horizontally directly without outer card container
      const scrollView = getByTestId('home-categories-scroll')
      expect(scrollView).toBeTruthy()
      expect(scrollView.props.horizontal).toBe(true)
      expect(scrollView.props.showsHorizontalScrollIndicator).toBe(false)

      // (ب) category-label-line must NOT exist
      expect(queryByTestId('category-label-line')).toBeNull()

      // (ج) No grey pill shadow under any icon across the whole component
      expect(queryByTestId('category-tile-shadow')).toBeNull()

      HOME_CATEGORIES.forEach((cat) => {
        const tile = getByTestId(`category-tile-${cat.id}`)
        expect(tile).toBeTruthy()
        expect(tile.props.accessibilityLabel).toBe(cat.label)
        expect(tile.props.accessibilityRole).toBe('button')

        // (د) Compact card dimensions 78x90
        const cardView = tile.children[0] as any
        const cardStyle = StyleSheet.flatten(cardView.props.style)
        expect(cardStyle.width).toBe(78)
        expect(cardStyle.height).toBe(90)
        expect(cardStyle.minHeight).toBe(90)
        expect(cardStyle.borderRadius).toBe(16)

        // (هـ) Tile slot width = 78
        const itemWrap = tile.parent as any
        expect(itemWrap).toBeTruthy()
        const itemWrapStyle = StyleSheet.flatten(itemWrap.props.style)
        expect(itemWrapStyle.width).toBe(78)

        // (و) NO entrance animation on mount: wrapper does not have entering prop
        expect(itemWrap.props.entering).toBeUndefined()

        // (ز) Uniform gentle gradient [Colors.surface, Colors.surfaceAlt]
        const cardChildren = React.Children.toArray(cardView.props.children) as any[]
        const gradient = cardChildren.find((c: any) => c.props.testID === 'tile-gradient')
        expect(gradient).toBeTruthy()
        expect(gradient.props.colors).toEqual([Colors.surface, Colors.surfaceAlt])

        // (ح) Icon container: 52x52 box without shadow pill
        const iconContainer = cardChildren.find((c: any) => c.props.testID === `icon-container-${cat.id}`) || cardChildren[1]
        const iconContainerChildren = React.Children.toArray(iconContainer.props.children) as any[]
        const iconBox = iconContainerChildren[0]
        const iconBoxStyle = StyleSheet.flatten(iconBox.props.style)
        expect(iconBoxStyle.width).toBe(52)
        expect(iconBoxStyle.height).toBe(52)

        // (ط) Text label font size 14, line height 18
        const labelText = cardChildren.find((c: any) => c.props.children === cat.label)
        expect(labelText).toBeTruthy()
        const labelStyle = StyleSheet.flatten(labelText.props.style)
        expect(labelStyle.fontSize).toBe(14)
        expect(labelStyle.lineHeight).toBe(18)
      })

      const images = getAllByTestId('category-tile-image')
      expect(images).toHaveLength(6)
      images.forEach((img) => {
        const flattened = StyleSheet.flatten(img.props.style)
        expect(flattened.width).toBe(52)
        expect(flattened.height).toBe(52)
      })
    })

    it('navigates when tiles are pressed and triggers haptics on pressIn', async () => {
      const { getByTestId } = await render(<HomeCategoriesGrid />)

      const carsTile = getByTestId('category-tile-cars')
      fireEvent(carsTile, 'pressIn')
      expect(Haptics.impactAsync).toHaveBeenCalledWith('light')
      fireEvent(carsTile, 'pressOut')

      fireEvent.press(carsTile)
      expect(router.push).toHaveBeenCalledWith('/cars')

      const browseTile = getByTestId('category-tile-browse')
      fireEvent.press(browseTile)
      expect(router.push).toHaveBeenCalledWith('/(tabs)/browse')
    })
  })

  describe('3. Optical Scale Configuration (D-153c)', () => {
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
