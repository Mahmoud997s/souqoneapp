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
  calculateCategoryItemWidth,
} from '../components/home/HomeCategoriesGrid'

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
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

describe('HomeCategoriesGrid — 3D Icons Display & Parity', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  describe('1. Data & Scale Configuration Integrity', () => {
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

      // Verify specific scale tuning for wide vs square icons (D-153c: 1.10 for wide)
      expect(CATEGORY_ICON_SCALES['cars']).toBe(1.10)
      expect(CATEGORY_ICON_SCALES['buses']).toBe(1.10)
      expect(CATEGORY_ICON_SCALES['equipment']).toBe(1.05)
      expect(CATEGORY_ICON_SCALES['services']).toBe(1.0)
      expect(CATEGORY_ICON_SCALES['parts']).toBe(1.0)
      expect(CATEGORY_ICON_SCALES['browse']).toBe(1.0)
    })

    it('Grid geometry math conforms to standard columns and padding', () => {
      expect(CATEGORY_GRID_COLUMNS).toBe(3)
      expect(CATEGORY_GRID_GAP).toBe(8)
      expect(CATEGORY_GRID_PADDING_H).toBe(32)
      expect(calculateCategoryItemWidth(360)).toBe(104)
      expect(calculateCategoryItemWidth(430)).toBe(127)
    })
  })

  describe('2. Component Rendering & Interaction', () => {
    it('renders all 6 category tiles with rectangular cards (80h), 40x40 icons, and 2px line under label (D-153c)', async () => {
      const { getByTestId, getAllByTestId } = await render(<HomeCategoriesGrid />)

      HOME_CATEGORIES.forEach((cat) => {
        const tile = getByTestId(`category-tile-${cat.id}`)
        expect(tile).toBeTruthy()
        expect(tile.props.accessibilityLabel).toBe(cat.label)
        expect(tile.props.accessibilityRole).toBe('button')

        // (أ) D-153c/d: ارتفاع الكارت = 80 (card style height 80, minHeight 80)
        const cardView = tile.children[0] as any
        const cardStyle = StyleSheet.flatten(cardView.props.style)
        expect(cardStyle.height).toBe(80)
        expect(cardStyle.minHeight).toBe(80)
        expect(cardStyle.borderRadius).toBe(16)

        // (ب) D-153c/d: عرض الـ tile/slot wrapper محدد كـ number
        const itemWrap = tile.parent as any
        expect(itemWrap).toBeTruthy()
        const itemWrapStyle = StyleSheet.flatten(itemWrap.props.style)
        expect(typeof itemWrapStyle.width).toBe('number')

        // (ج) D-153c/d: category-label-line أخ لـ label وموجود بعده، وليس جوّا iconContainer
        const cardChildren = React.Children.toArray(cardView.props.children) as any[]
        expect(cardChildren).toHaveLength(3)

        // 1) iconContainer has exactly 1 child (iconBox), no groundShadow child
        const iconContainer = cardChildren[0]
        const iconContainerChildren = React.Children.toArray(iconContainer.props.children) as any[]
        expect(iconContainerChildren).toHaveLength(1)
        const iconBox = iconContainerChildren[0]
        const iconBoxChildren = React.Children.toArray(iconBox.props.children) as any[]
        expect(iconBoxChildren).toHaveLength(1) // Image only

        // 2) Text label is child 1
        expect(cardChildren[1].props.children).toBe(cat.label)

        // 3) category-label-line is child 2 (sibling after label, sharing card parent)
        const labelLine = cardChildren[2]
        expect(labelLine.props.testID).toBe('category-label-line')
        const lineStyle = StyleSheet.flatten(labelLine.props.style)
        expect(lineStyle.height).toBe(2)
        expect(lineStyle.width).toBe(28)
        expect(lineStyle.opacity).toBe(0.35)
      })

      // D-153c/d: عرض الـ tile عند 360 = 104 وعند 430 = 127
      expect(calculateCategoryItemWidth(360)).toBe(104)
      expect(calculateCategoryItemWidth(430)).toBe(127)

      const images = getAllByTestId('category-tile-image')
      expect(images).toHaveLength(6)

      // D-153c: 40x40 icon dimensions
      images.forEach((img) => {
        const flattened = StyleSheet.flatten(img.props.style)
        expect(flattened.width).toBe(40)
        expect(flattened.height).toBe(40)
      })

      // D-153c: 2px thin line under label text with 0.35 opacity and 28 width
      const lines = getAllByTestId('category-label-line')
      expect(lines).toHaveLength(6)
      lines.forEach((line) => {
        const flattened = StyleSheet.flatten(line.props.style)
        expect(flattened.height).toBe(2)
        expect(flattened.width).toBe(28)
        expect(flattened.opacity).toBe(0.35)
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
