import React, { type ReactNode } from 'react'
import { StyleSheet, View, Platform, type ViewStyle, type TextStyle } from 'react-native'
import { render, fireEvent, act } from '@testing-library/react-native'
import { router } from 'expo-router'
import * as Haptics from 'expo-haptics'
import fs from 'fs'
import path from 'path'
import {
  HomeCategoriesGrid,
  HOME_CATEGORIES,
  CATEGORY_ICONS,
  CATEGORY_GRID_COLUMNS,
  CATEGORY_GRID_GAP,
  CATEGORY_GRID_PADDING_H,
  CATEGORY_ITEM_HEIGHT,
  CATEGORY_ICON_SIZE,
  CATEGORY_ITEM_WIDTH,
  CATEGORY_ITEM_SIZE,
  calculateCategoryItemWidth,
  calculateCategoryItemHeight,
  calculateCategoryGridGap,
} from '../components/home/HomeCategoriesGrid'
import { Colors } from '../constants/colors'
import { NOTIFICATIONS_EMPTY_CTA_ROUTE } from '../../app/profile/notifications'
import * as glassSupportModule from '../components/navigation/glassSupport'

jest.mock('expo-blur', () => {
  const React = require('react')
  const { View } = require('react-native')
  return {
    BlurView: (props: any) => React.createElement(View, props),
  }
})

jest.mock('expo-glass-effect', () => {
  const React = require('react')
  const { View } = require('react-native')
  return {
    GlassView: (props: any) => React.createElement(View, props),
    isLiquidGlassAvailable: () => true,
    isGlassEffectAPIAvailable: () => true,
  }
})

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
  LinearGradient: ({ children, ...props }: { children?: ReactNode } & Record<string, unknown>) => {
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
  Image: (props: Record<string, unknown> & { testID?: string }) => {
    const React = require('react')
    const { View } = require('react-native')
    return React.createElement(View, { ...props, testID: props.testID || 'category-tile-image' })
  },
}))

describe('HomeCategoriesGrid — 4+3 Square Tiles with Operators (D-172a)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('1. Data, Icons & Configuration Integrity (Req 1, 2, 7)', () => {
    it('Tooth a: HOME_CATEGORIES has exactly 7 items in preserved Arabic RTL order', () => {
      expect(HOME_CATEGORIES).toHaveLength(7)
      const ids = HOME_CATEGORIES.map((cat) => cat.id)
      expect(ids).toEqual(['cars', 'services', 'parts', 'equipment', 'buses', 'operators', 'browse'])
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

    it('CATEGORY_ICONS has entries for all 7 categories including operators', () => {
      expect(CATEGORY_ICONS.cars).toBeDefined()
      expect(CATEGORY_ICONS.services).toBeDefined()
      expect(CATEGORY_ICONS.parts).toBeDefined()
      expect(CATEGORY_ICONS.equipment).toBeDefined()
      expect(CATEGORY_ICONS.buses).toBeDefined()
      expect(CATEGORY_ICONS.operators).toBeDefined()
      expect(CATEGORY_ICONS.browse).toBeDefined()
    })

    it('Tooth f: asset registered and file exists on disk', () => {
      expect(CATEGORY_ICONS.operators).toBeDefined()
      const assetPath = path.resolve(__dirname, '../../assets/images/categories/cat-operators.png')
      expect(fs.existsSync(assetPath)).toBe(true)
    })
  })

  describe('2. Layout Geometry & Screen Width Fitting Math (Req 3, 7)', () => {
    it('exports 4 columns layout constants with tight 6px gap and square items', () => {
      expect(CATEGORY_GRID_COLUMNS).toBe(4)
      expect(CATEGORY_GRID_GAP).toBe(6)
      expect(CATEGORY_GRID_PADDING_H).toBe(16)
      expect(CATEGORY_ICON_SIZE).toBe(38)
      expect(CATEGORY_ITEM_WIDTH).toBeGreaterThan(0)
      expect(CATEGORY_ITEM_HEIGHT).toBe(CATEGORY_ITEM_WIDTH)
      expect(CATEGORY_ITEM_SIZE).toBe(CATEGORY_ITEM_WIDTH)
    })

    it('Tooth d: square tiles: for widths 360/390/430 the computed width equals the height and 4 tiles plus 3 gaps plus padding fit', () => {
      ;[360, 390, 430].forEach((w) => {
        const itemWidth = calculateCategoryItemWidth(w)
        const itemHeight = calculateCategoryItemHeight(w)
        expect(itemWidth).toBe(itemHeight)
        const totalOccupied = (itemWidth * 4) + (CATEGORY_GRID_GAP * 3) + (CATEGORY_GRID_PADDING_H * 2)
        expect(totalOccupied).toBeLessThanOrEqual(w)
        expect(itemWidth).toBeGreaterThanOrEqual(44)
      })

      expect(calculateCategoryItemWidth(360)).toBe(77)
      expect(calculateCategoryItemHeight(360)).toBe(77)

      expect(calculateCategoryItemWidth(390)).toBe(85)
      expect(calculateCategoryItemHeight(390)).toBe(85)

      expect(calculateCategoryItemWidth(430)).toBe(95)
      expect(calculateCategoryItemHeight(430)).toBe(95)

      expect(calculateCategoryGridGap(360)).toBe(6)
      expect(calculateCategoryGridGap(390)).toBe(6)
      expect(calculateCategoryGridGap(430)).toBe(6)
    })
  })

  describe('3. Two Static Rows (4+3) Rendering & RTL Flow (Req 3, 4)', () => {
    it('renders exactly 7 tiles across top row (4) and bottom row (3) with NO ScrollView and NO marquee track', async () => {
      const { getByTestId, queryByTestId, getAllByTestId } = await render(<HomeCategoriesGrid />)

      const topRow = getByTestId('home-categories-row-top')
      expect(topRow).toBeTruthy()
      const topRowStyle = StyleSheet.flatten(topRow.props.style)
      expect(topRowStyle.flexDirection).toBe('row')
      expect(topRowStyle.gap).toBe(6)

      const bottomRow = getByTestId('home-categories-row-bottom')
      expect(bottomRow).toBeTruthy()
      const bottomRowStyle = StyleSheet.flatten(bottomRow.props.style)
      expect(bottomRowStyle.flexDirection).toBe('row')
      expect(bottomRowStyle.gap).toBe(6)

      expect(queryByTestId('home-categories-scroll')).toBeNull()
      expect(queryByTestId('home-categories-marquee-track')).toBeNull()
      expect(queryByTestId('home-categories-marquee-container')).toBeNull()

      const tileImages = getAllByTestId('category-tile-image')
      expect(tileImages).toHaveLength(7)
    })

    it('Tooth e: the bottom row has 3 items and starts at the right edge (assert row style and order)', async () => {
      const { getByTestId } = await render(<HomeCategoriesGrid />)
      const bottomRow = getByTestId('home-categories-row-bottom')
      expect(bottomRow).toBeTruthy()
      const bottomRowStyle = StyleSheet.flatten(bottomRow.props.style)
      expect(bottomRowStyle.flexDirection).toBe('row')
      expect(bottomRowStyle.justifyContent).toBe('flex-start')

      const bottomRowChildren = React.Children.toArray(bottomRow.props.children)
      expect(bottomRowChildren).toHaveLength(3)

      const bottomIds = bottomRowChildren.map((c) => (React.isValidElement<{ item: { id: string } }>(c) ? c.props.item.id : ''))
      expect(bottomIds).toEqual(['buses', 'operators', 'browse'])

      const topRow = getByTestId('home-categories-row-top')
      const topRowChildren = React.Children.toArray(topRow.props.children)
      expect(topRowChildren).toHaveLength(4)
      const topIds = topRowChildren.map((c) => (React.isValidElement<{ item: { id: string } }>(c) ? c.props.item.id : ''))
      expect(topIds).toEqual(['cars', 'services', 'parts', 'equipment'])
    })

    it('renders exactly the same static rows when reducedMotion is enabled', async () => {
      const { getByTestId, queryByTestId, getAllByTestId } = await render(<HomeCategoriesGrid reducedMotion={true} />)

      expect(getByTestId('home-categories-row-top')).toBeTruthy()
      expect(getByTestId('home-categories-row-bottom')).toBeTruthy()
      expect(queryByTestId('home-categories-scroll')).toBeNull()
      expect(queryByTestId('home-categories-marquee-track')).toBeNull()
      expect(getAllByTestId('category-tile-image')).toHaveLength(7)
    })
  })

  describe('4. Equal Icon Sizing & Middle Aligned Labels (Req 7, 8)', () => {
    it('Tooth g: equal icon boxes: rendered image style width/height is identical for all 7 tiles and CATEGORY_ICON_SCALES no longer exists', async () => {
      const { getAllByTestId } = await render(<HomeCategoriesGrid />)
      const tileImages = getAllByTestId('category-tile-image')
      expect(tileImages).toHaveLength(7)

      tileImages.forEach((image) => {
        const imageStyle = StyleSheet.flatten(image.props.style)
        expect(imageStyle.width).toBe(CATEGORY_ICON_SIZE)
        expect(imageStyle.height).toBe(CATEGORY_ICON_SIZE)
        expect(imageStyle.transform).toBeUndefined()
      })

      const gridModule = require('../components/home/HomeCategoriesGrid')
      expect(gridModule.CATEGORY_ICON_SCALES).toBeUndefined()

      const sourceCode = fs.readFileSync(path.resolve(__dirname, '../components/home/HomeCategoriesGrid.tsx'), 'utf8')
      expect(sourceCode).not.toContain('CATEGORY_ICON_SCALES')
    })

    it('Tooth h: labels: all 7 label containers share the same height and vertical centering, and label style has textAlign center (and never right)', async () => {
      const { getAllByTestId, getByText } = await render(<HomeCategoriesGrid />)
      const labelBoxes = getAllByTestId('category-tile-label-box')
      expect(labelBoxes).toHaveLength(7)

      labelBoxes.forEach((box) => {
        const boxStyle = StyleSheet.flatten(box.props.style)
        expect(boxStyle.height).toBe(18)
        expect(boxStyle.justifyContent).toBe('center')
        expect(boxStyle.alignItems).toBe('center')
      })

      HOME_CATEGORIES.forEach((cat) => {
        const labelText = getByText(cat.label)
        expect(labelText).toBeTruthy()
        const labelStyle = StyleSheet.flatten(labelText.props.style)
        expect(labelStyle.textAlign).toBe('center')
        expect(labelStyle.textAlign).not.toBe('right')
        expect(labelStyle.fontSize).toBe(11.5)
        expect(labelStyle.lineHeight).toBe(15)
        expect(labelStyle.fontFamily).toBe(cat.isAction ? 'Almarai_800ExtraBold' : 'Almarai_700Bold')
        expect(labelStyle.color).toBe(cat.isAction ? Colors.primary : Colors.text)
      })
    })

    it('every tile has square width and height, radius 14, and label fit props', async () => {
      const { getByTestId, queryByTestId } = await render(<HomeCategoriesGrid />)

      HOME_CATEGORIES.forEach((cat) => {
        const tile = getByTestId(`category-tile-${cat.id}`)
        expect(tile).toBeTruthy()
        expect(tile.props.accessibilityLabel).toBe(cat.label)
        expect(tile.props.accessibilityRole).toBe('button')

        const itemWrap = tile.parent
        expect(itemWrap).toBeTruthy()
        const itemWrapStyle = StyleSheet.flatten((itemWrap?.props as { style?: ViewStyle })?.style)
        expect(itemWrapStyle.width).toBe(CATEGORY_ITEM_WIDTH)
        expect(itemWrapStyle.height).toBe(CATEGORY_ITEM_HEIGHT)

        const cardView = tile.children[0]
        expect(cardView).toBeTruthy()
        const cardStyle = StyleSheet.flatten((cardView as { props?: { style?: ViewStyle } })?.props?.style)
        expect(cardStyle.height).toBe(CATEGORY_ITEM_HEIGHT)
        expect(cardStyle.minHeight).toBe(CATEGORY_ITEM_HEIGHT)
        expect(cardStyle.width).toBe(CATEGORY_ITEM_WIDTH)
        expect(cardStyle.borderRadius).toBe(14)
        expect(cardStyle.overflow).toBe('hidden')

        const cardChildren = React.Children.toArray((cardView as { props?: { children?: ReactNode } })?.props?.children)
        const glassSurface =
          queryByTestId(`category-tile-${cat.id}-glass-liquid`) ||
          queryByTestId(`category-tile-${cat.id}-glass-blur`)
        expect(glassSurface).toBeTruthy()

        const iconContainer = cardChildren.find((c) => React.isValidElement<{ testID?: string }>(c) && c.props.testID === `icon-container-${cat.id}`) || cardChildren[1]
        const iconContainerChildren = React.isValidElement<{ children?: ReactNode }>(iconContainer) ? React.Children.toArray(iconContainer.props.children) : []
        const iconBox = iconContainerChildren[0]
        const iconBoxStyle = StyleSheet.flatten(React.isValidElement<{ style?: ViewStyle }>(iconBox) ? iconBox.props.style : undefined)
        expect(iconBoxStyle.width).toBe(CATEGORY_ICON_SIZE)
        expect(iconBoxStyle.height).toBe(CATEGORY_ICON_SIZE)
      })
    })
  })

  describe('5. Navigation and Route-Existence Guard (Req 1, Tests b, c)', () => {
    it('Tooth b: navigates to category routes including operators and triggers haptics on press', async () => {
      const { getByTestId } = await render(<HomeCategoriesGrid />)

      const operatorsTile = getByTestId('category-tile-operators')
      await act(async () => {
        fireEvent(operatorsTile, 'pressIn')
      })
      expect(Haptics.impactAsync).toHaveBeenCalledWith('light')

      await act(async () => {
        fireEvent(operatorsTile, 'pressOut')
      })

      await act(async () => {
        fireEvent.press(operatorsTile)
      })
      expect(router.push).toHaveBeenCalledWith('/equipment/operators/browse')

      const carsTile = getByTestId('category-tile-cars')
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

    it('Tooth c: route-existence guard: every category tile route and notifications CTA target maps to an existing app file', () => {
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

  describe('6. Liquid Glass Surface & Fallbacks (D-172b Teeth Tests)', () => {
    it('Tooth a: liquid branch renders a glass surface per tile when module is available', async () => {
      const liquidSupport: glassSupportModule.LiquidGlassSupport = {
        kind: 'liquid',
        GlassView: ((props: any) => <View testID="mock-native-glass-view" {...props} />) as any,
      }

      const { getByTestId } = await render(
        <HomeCategoriesGrid support={liquidSupport} />
      )

      HOME_CATEGORIES.forEach((cat) => {
        const liquidSurface = getByTestId(`category-tile-${cat.id}-glass-liquid`)
        expect(liquidSurface).toBeTruthy()
        expect(liquidSurface.props.pointerEvents).toBe('none')
      })
    })

    it('Tooth b: blur branch when module is missing: no crash, all 7 tiles render blur and press normally', async () => {
      const blurSupport: glassSupportModule.BlurGlassSupport = {
        kind: 'blur',
      }

      const { getByTestId } = await render(
        <HomeCategoriesGrid support={blurSupport} />
      )

      HOME_CATEGORIES.forEach((cat) => {
        const blurSurface = getByTestId(`category-tile-${cat.id}-glass-blur`)
        expect(blurSurface).toBeTruthy()
        expect(blurSurface.props.pointerEvents).toBe('none')
      })

      // Presses still work
      const operatorsTile = getByTestId('category-tile-operators')
      await act(async () => {
        fireEvent.press(operatorsTile)
      })
      expect(router.push).toHaveBeenCalledWith('/equipment/operators/browse')
    })

    it('Tooth c: reduce-transparency fallback: returns blur support and renders blur surfaces', async () => {
      const resolved = glassSupportModule.getGlassSupport(true)
      expect(resolved.kind).toBe('blur')

      const { getByTestId } = await render(
        <HomeCategoriesGrid support={resolved} />
      )

      HOME_CATEGORIES.forEach((cat) => {
        const blurSurface = getByTestId(`category-tile-${cat.id}-glass-blur`)
        expect(blurSurface).toBeTruthy()
      })
    })

    it('Tooth d: Android platform: package is never required and defaults to blur', () => {
      const originalPlatform = Platform.OS
      try {
        jest.isolateModules(() => {
          Object.defineProperty(Platform, 'OS', { configurable: true, get: () => 'android' })
          const { getGlassSupport: getGlassSupportIsolated } =
            require('../components/navigation/glassSupport')
          const support = getGlassSupportIsolated(false)
          expect(support.kind).toBe('blur')
        })
      } finally {
        Object.defineProperty(Platform, 'OS', { configurable: true, get: () => originalPlatform })
      }
    })

    it('Tooth e: 7 tiles preserve exact order and routes', () => {
      expect(HOME_CATEGORIES.map((c) => c.id)).toEqual([
        'cars',
        'services',
        'parts',
        'equipment',
        'buses',
        'operators',
        'browse',
      ])
      expect(HOME_CATEGORIES.map((c) => c.route)).toEqual([
        '/cars',
        '/services',
        '/parts',
        '/equipment',
        '/buses',
        '/equipment/operators/browse',
        '/(tabs)/search',
      ])
    })

    it('Tooth f: no direct import of expo-glass-effect or expo-blur outside adapter', () => {
      const gridSourcePath = path.resolve(__dirname, '../components/home/HomeCategoriesGrid.tsx')
      const source = fs.readFileSync(gridSourcePath, 'utf8')
      expect(source.includes('expo-glass-effect')).toBe(false)
      expect(source.includes('expo-blur')).toBe(false)
      expect(source.includes("from '../navigation/glassSupport'")).toBe(true)
    })
  })
})
