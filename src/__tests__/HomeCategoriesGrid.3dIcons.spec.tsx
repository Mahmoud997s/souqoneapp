import React from 'react'
import { StyleSheet } from 'react-native'
import { render, fireEvent, act } from '@testing-library/react-native'
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
  CATEGORY_ITEM_HEIGHT,
  CATEGORY_ICON_SIZE,
  CATEGORY_ITEM_WIDTH,
  CATEGORY_ITEM_SIZE,
  calculateCategoryItemWidth,
  calculateCategoryGridGap,
} from '../components/home/HomeCategoriesGrid'
import { Colors } from '../constants/colors'
import { NOTIFICATIONS_EMPTY_CTA_ROUTE } from '../../app/profile/notifications'

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

describe('HomeCategoriesGrid — 6 Tiles in ONE Static Row, No Animation (D-163j)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('1. Data, Scale & Configuration Integrity', () => {
    it('HOME_CATEGORIES has exactly 6 items in preserved Arabic RTL order', () => {
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
  })

  describe('2. Layout Geometry & Screen Width Fitting Math (D-163j)', () => {
    it('exports single row layout constants with tight 6px gap and height 76', () => {
      expect(CATEGORY_GRID_COLUMNS).toBe(6)
      expect(CATEGORY_GRID_GAP).toBe(6)
      expect(CATEGORY_GRID_PADDING_H).toBe(16)
      expect(CATEGORY_ITEM_HEIGHT).toBe(76)
      expect(CATEGORY_ICON_SIZE).toBe(38)
      expect(CATEGORY_ITEM_WIDTH).toBeGreaterThan(0)
      expect(CATEGORY_ITEM_SIZE).toBe(CATEGORY_ITEM_WIDTH)
    })

    it('calculates item width that fits within screen width on 360, 390, and 430 screens', () => {
      // 360px screen (small Android / iPhone SE):
      const width360 = calculateCategoryItemWidth(360)
      expect(width360).toBe(49)
      const totalOccupied360 = (width360 * 6) + (CATEGORY_GRID_GAP * 5) + (CATEGORY_GRID_PADDING_H * 2)
      expect(totalOccupied360).toBeLessThanOrEqual(360)

      // 390px screen (iPhone 13 / 14 / 15):
      const width390 = calculateCategoryItemWidth(390)
      expect(width390).toBe(54)
      const totalOccupied390 = (width390 * 6) + (CATEGORY_GRID_GAP * 5) + (CATEGORY_GRID_PADDING_H * 2)
      expect(totalOccupied390).toBeLessThanOrEqual(390)

      // 430px screen (iPhone 14/15/16 Pro Max / large Android):
      const width430 = calculateCategoryItemWidth(430)
      expect(width430).toBe(61)
      const totalOccupied430 = (width430 * 6) + (CATEGORY_GRID_GAP * 5) + (CATEGORY_GRID_PADDING_H * 2)
      expect(totalOccupied430).toBeLessThanOrEqual(430)

      // Gap is constant 6 across screen sizes
      expect(calculateCategoryGridGap(360)).toBe(6)
      expect(calculateCategoryGridGap(390)).toBe(6)
      expect(calculateCategoryGridGap(430)).toBe(6)

      // Teeth proof: if gap increases to 10, item width strictly decreases
      const wideGapAvailable = 360 - 32 - (10 * 5)
      expect(Math.floor(wideGapAvailable / 6)).toBeLessThan(width360)
    })
  })

  describe('3. Single Static Row Rendering & No Animation (D-163j)', () => {
    it('renders exactly 6 tiles in ONE static row with NO ScrollView and NO marquee track', async () => {
      const { getByTestId, queryByTestId, getAllByTestId } = await render(<HomeCategoriesGrid />)

      // Row container exists and has flexDirection row with gap 6
      const row = getByTestId('home-categories-row')
      expect(row).toBeTruthy()
      const rowStyle = StyleSheet.flatten(row.props.style)
      expect(rowStyle.flexDirection).toBe('row')
      expect(rowStyle.gap).toBe(6)

      // No ScrollView in default mode
      expect(queryByTestId('home-categories-scroll')).toBeNull()

      // No marquee track or container
      expect(queryByTestId('home-categories-marquee-track')).toBeNull()
      expect(queryByTestId('home-categories-marquee-container')).toBeNull()

      // No duplicate set B or duplicate tile testIDs
      expect(queryByTestId('home-categories-set-b')).toBeNull()
      HOME_CATEGORIES.forEach((cat) => {
        expect(queryByTestId(`category-tile-${cat.id}-dup`)).toBeNull()
      })

      // Exactly 6 tile images rendered in the entire tree
      const tileImages = getAllByTestId('category-tile-image')
      expect(tileImages).toHaveLength(6)

      // No container card, no label line, no shadow pill under icon
      expect(queryByTestId('category-label-line')).toBeNull()
      expect(queryByTestId('category-tile-shadow')).toBeNull()
    })

    it('renders exactly the same static row when reducedMotion is enabled (no ScrollView)', async () => {
      const { getByTestId, queryByTestId, getAllByTestId } = await render(<HomeCategoriesGrid reducedMotion={true} />)

      expect(getByTestId('home-categories-row')).toBeTruthy()
      expect(queryByTestId('home-categories-scroll')).toBeNull()
      expect(queryByTestId('home-categories-marquee-track')).toBeNull()
      expect(getAllByTestId('category-tile-image')).toHaveLength(6)
    })
  })

  describe('4. Equal Widths, Tile Sizing & Label Fit Props (D-163j)', () => {
    it('every tile has flex: 1, height 76, radius 14, and label fit props', async () => {
      const { getByTestId } = await render(<HomeCategoriesGrid />)

      HOME_CATEGORIES.forEach((cat) => {
        const tile = getByTestId(`category-tile-${cat.id}`)
        expect(tile).toBeTruthy()
        expect(tile.props.accessibilityLabel).toBe(cat.label)
        expect(tile.props.accessibilityRole).toBe('button')

        // itemWrap has flex: 1 for equal width distribution
        const itemWrap = tile.parent as any
        expect(itemWrap).toBeTruthy()
        const itemWrapStyle = StyleSheet.flatten(itemWrap.props.style)
        expect(itemWrapStyle.flex).toBe(1)

        // Card styling: height 76, radius 14, overflow hidden
        const cardView = tile.children[0] as any
        const cardStyle = StyleSheet.flatten(cardView.props.style)
        expect(cardStyle.height).toBe(76)
        expect(cardStyle.minHeight).toBe(76)
        expect(cardStyle.borderRadius).toBe(14)
        expect(cardStyle.overflow).toBe('hidden')

        // Gradient background present
        const cardChildren = React.Children.toArray(cardView.props.children) as any[]
        const gradient = cardChildren.find((c: any) => c.props.testID === 'tile-gradient')
        expect(gradient).toBeTruthy()
        expect(gradient.props.colors).toEqual([Colors.surface, Colors.surfaceAlt])

        // Icon container: 38x38
        const iconContainer = cardChildren.find((c: any) => c.props.testID === `icon-container-${cat.id}`) || cardChildren[1]
        const iconContainerChildren = React.Children.toArray(iconContainer.props.children) as any[]
        const iconBox = iconContainerChildren[0]
        const iconBoxStyle = StyleSheet.flatten(iconBox.props.style)
        expect(iconBoxStyle.width).toBe(38)
        expect(iconBoxStyle.height).toBe(38)

        // Label: single line, adjustsFontSizeToFit, minimumFontScale 0.8
        const labelText = cardChildren.find((c: any) => c.props.children === cat.label)
        expect(labelText).toBeTruthy()
        expect(labelText.props.numberOfLines).toBe(1)
        expect(labelText.props.ellipsizeMode).toBe('tail')
        expect(labelText.props.adjustsFontSizeToFit).toBe(true)
        expect(labelText.props.minimumFontScale).toBe(0.8)

        const labelStyle = StyleSheet.flatten(labelText.props.style)
        expect(labelStyle.fontSize).toBe(11.5)
        expect(labelStyle.lineHeight).toBe(15)
        expect(labelStyle.fontFamily).toBe(cat.isAction ? 'Almarai_800ExtraBold' : 'Almarai_700Bold')
        expect(labelStyle.color).toBe(cat.isAction ? Colors.primary : Colors.text)
      })
    })
  })

  describe('5. Navigation and Press Feedback', () => {
    it('navigates to category route and triggers haptics on press', async () => {
      const { getByTestId } = await render(<HomeCategoriesGrid />)

      const carsTile = getByTestId('category-tile-cars')
      await act(async () => {
        fireEvent(carsTile, 'pressIn')
      })
      expect(Haptics.impactAsync).toHaveBeenCalledWith('light')

      await act(async () => {
        fireEvent(carsTile, 'pressOut')
      })

      await act(async () => {
        fireEvent.press(carsTile)
      })
      expect(router.push).toHaveBeenCalledWith('/cars')

      const browseTile = getByTestId('category-tile-browse')
      await act(async () => {
        fireEvent.press(browseTile)
      })
      expect(router.push).toHaveBeenCalledWith('/(tabs)/search')
    })

    it('route-existence guard: every category tile route and notifications CTA target maps to an existing app file', () => {
      const fs = require('fs')
      const path = require('path')
      const appRoot = path.resolve(__dirname, '../../app')

      const routesToVerify = [
        ...HOME_CATEGORIES.map((cat) => ({ id: cat.id, route: cat.route })),
        { id: 'notifications-empty-cta', route: NOTIFICATIONS_EMPTY_CTA_ROUTE },
      ]

      routesToVerify.forEach(({ id, route }) => {
        const clean = route.replace(/^\//, '')
        const candidateFile = path.join(appRoot, `${clean}.tsx`)
        const candidateDirIndex = path.join(appRoot, clean, 'index.tsx')
        const exists = fs.existsSync(candidateFile) || fs.existsSync(candidateDirIndex)

        expect({ id, route, exists }).toEqual({ id, route, exists: true })
      })
    })
  })
})
