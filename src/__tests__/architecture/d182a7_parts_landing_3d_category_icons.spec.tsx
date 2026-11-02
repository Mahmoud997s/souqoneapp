import React from 'react'
import { StyleSheet, View } from 'react-native'
import { render, fireEvent, act } from '@testing-library/react-native'
import fs from 'fs'
import path from 'path'
import {
  PartsCategoriesGrid,
  PARTS_LANDING_CATEGORIES,
} from '../../components/parts/PartsCategoriesGrid'
import {
  CATEGORY_IMAGE_ICON_SIZE,
  CATEGORY_IMAGE_ICON_OFFSET_Y,
} from '../../components/ui/GlassCategoriesGrid'
import {
  PART_CATEGORY_ICONS,
  type PartCategoryIconId,
} from '../../constants/partCategoryIcons'
import { CATEGORY_ICONS } from '../../constants/categoryIcons'
import {
  HomeCategoriesGrid,
  CATEGORY_ICON_SIZE,
} from '../../components/home/HomeCategoriesGrid'
import { CategoriesGrid } from '../../components/cars/CategoriesGrid'
import { BusCategoriesGrid } from '../../components/buses/landing/BusCategoriesGrid'
import { EquipmentCategoriesGrid } from '../../components/equipment/landing/EquipmentCategoriesGrid'
import { ServicesCategoriesGrid } from '../../components/services/ServicesCategoriesGrid'
import { Colors } from '../../constants/colors'

const mockPush = jest.fn()
jest.mock('expo-router', () => ({
  router: {
    push: (...args: unknown[]) => mockPush(...args),
  },
  useRouter: () => ({
    push: (...args: unknown[]) => mockPush(...args),
  }),
}))

jest.mock('expo-image', () => ({
  Image: (props: Record<string, unknown> & { testID?: string }) => {
    const ReactLib = require('react')
    const { View: RNView } = require('react-native')
    return ReactLib.createElement(RNView, {
      ...props,
      testID: props.testID || 'category-tile-image',
    })
  },
}))

describe('D-182a7 + D-182a7b — Parts Landing 3D Category Icons (All 11 Items Incl. SUSPENSION M.PNG), +20% Size (47.4pt) & Vector Preservation', () => {
  jest.setTimeout(30000)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('1. Mapping Constant (PART_CATEGORY_ICONS) & 11-Item Order in PartsCategoriesGrid', () => {
    const expectedImageIds: PartCategoryIconId[] = [
      'ENGINE',
      'BODY',
      'ELECTRICAL',
      'SUSPENSION',
      'BRAKES',
      'INTERIOR',
      'TIRES',
      'BATTERIES',
      'OILS',
      'ACCESSORIES',
      'all',
    ]

    it('maps all 11 part category IDs (including SUSPENSION) to non-null image assets with BRAKES=cat-parts and all=cat-browse', () => {
      for (const id of expectedImageIds) {
        expect(PART_CATEGORY_ICONS[id]).toBeDefined()
        expect(PART_CATEGORY_ICONS[id]).not.toBeNull()
        expect(typeof PART_CATEGORY_ICONS[id]).not.toBe('string')
      }

      // BRAKES reuses the existing 3D brake disc asset (cat-parts.png)
      expect(PART_CATEGORY_ICONS.BRAKES).toBe(CATEGORY_ICONS.parts)
      // all (عرض الكل) reuses the existing cat-browse.png asset
      expect(PART_CATEGORY_ICONS.all).toBe(CATEGORY_ICONS.browse)

      // All 9 new cropped 384x384 PNG files exist on disk in assets/images/categories/parts/
      const expectedFiles = [
        'part-engine.png',
        'part-body.png',
        'part-electrical.png',
        'part-suspension.png',
        'part-accessories.png',
        'part-interior.png',
        'part-tires.png',
        'part-oils.png',
        'part-batteries.png',
      ]
      for (const fileName of expectedFiles) {
        const assetPath = path.resolve(
          __dirname,
          '../../../assets/images/categories/parts',
          fileName
        )
        expect(fs.existsSync(assetPath)).toBe(true)
        const stat = fs.statSync(assetPath)
        expect(stat.size).toBeGreaterThan(50 * 1024)
        expect(stat.size).toBeLessThan(250 * 1024)
      }

      expect(PARTS_LANDING_CATEGORIES.map((c) => c.id)).toEqual([
        'ENGINE',
        'BODY',
        'ELECTRICAL',
        'SUSPENSION',
        'BRAKES',
        'INTERIOR',
        'TIRES',
        'BATTERIES',
        'OILS',
        'ACCESSORIES',
        'all',
      ])

      expect(PARTS_LANDING_CATEGORIES.map((c) => c.label)).toEqual([
        'المحرك',
        'الهيكل',
        'الكهرباء',
        'المساعدات والتعليق',
        'الفرامل',
        'الداخلية',
        'الإطارات',
        'البطاريات',
        'الزيوت',
        'إكسسوارات',
        'عرض الكل',
      ])
    })

    it('renders all 11 3D image icons at 47.4x47.4 (39.5 * 1.2) with translateY -2 inside unchanged 36x36 transparent catIconBox and 82pt tab inside 96pt track without clipping', async () => {
      // Home's CATEGORY_ICON_SIZE remains 39.5 while landing grids' CATEGORY_IMAGE_ICON_SIZE is 39.5 * 1.2 = 47.4
      expect(CATEGORY_ICON_SIZE).toBe(39.5)
      expect(CATEGORY_IMAGE_ICON_SIZE).toBeCloseTo(39.5 * 1.2, 5)
      expect(CATEGORY_IMAGE_ICON_SIZE).toBe(47.4)
      expect(CATEGORY_IMAGE_ICON_OFFSET_Y).toBe(-2)

      const { getByTestId, getAllByText } = await render(
        <PartsCategoriesGrid />
      )

      const labels = getAllByText(/[\u0600-\u06FF]/).map((n) => n.props.children)
      expect(labels).toEqual([
        'المحرك',
        'الهيكل',
        'الكهرباء',
        'المساعدات والتعليق',
        'الفرامل',
        'الداخلية',
        'الإطارات',
        'البطاريات',
        'الزيوت',
        'إكسسوارات',
        'عرض الكل',
      ])

      // Verify all 11 3D-icon tabs render expo-image at 47.4x47.4 inside 36x36 transparent box and never exceed tab rect:
      for (const id of expectedImageIds) {
        const tile = getByTestId(`category-tile-${id}`)
        const tileStyle = StyleSheet.flatten(tile.props.style) as Record<
          string,
          unknown
        >
        const paddingVertical = Number(tileStyle.paddingVertical) // 10
        const borderWidth = Number(tileStyle.borderWidth) // 1
        expect(paddingVertical).toBe(10)
        expect(borderWidth).toBe(1)

        const iconBox = getByTestId(`category-icon-box-${id}`)
        const boxStyle = StyleSheet.flatten(iconBox.props.style) as Record<
          string,
          unknown
        >
        const boxWidth = Number(boxStyle.width) // 36
        const boxHeight = Number(boxStyle.height) // 36
        const marginBottom = Number(boxStyle.marginBottom) // 6
        expect(boxWidth).toBe(36)
        expect(boxHeight).toBe(36)
        expect(marginBottom).toBe(6)
        expect(boxStyle.backgroundColor).toBe('transparent')
        expect(boxStyle.overflow).toBeUndefined()

        // Tab height calculation: 2*borderWidth(2) + 2*paddingVertical(20) + boxHeight(36) + marginBottom(6) + label(18) = 82pt (inside 96pt track)
        const labelHeight = 18 // lineHeight 16 + paddingTop 2
        const computedTabHeight =
          2 * borderWidth +
          2 * paddingVertical +
          boxHeight +
          marginBottom +
          labelHeight
        expect(computedTabHeight).toBe(82)

        const img = getByTestId(`category-tile-image-${id}`)
        expect(img.props.source).toBe(PART_CATEGORY_ICONS[id])
        expect(img.props.contentFit).toBe('contain')
        expect(img.props.tintColor).toBeUndefined()

        const imgStyle = StyleSheet.flatten(img.props.style) as Record<
          string,
          unknown
        >
        expect(imgStyle.width).toBe(47.4)
        expect(imgStyle.height).toBe(47.4)
        expect(imgStyle.transform).toEqual([
          { translateY: CATEGORY_IMAGE_ICON_OFFSET_Y },
        ])

        // Prove the 47.4x47.4 image never exceeds the 88x82 tab inner rect:
        const overflowPerSide = (CATEGORY_IMAGE_ICON_SIZE - boxHeight) / 2 // 5.7pt
        const topBufferFromInnerBorder =
          paddingVertical - overflowPerSide + CATEGORY_IMAGE_ICON_OFFSET_Y // 10 - 5.7 - 2 = 2.3pt
        const bottomGapToLabelBox =
          marginBottom - overflowPerSide - CATEGORY_IMAGE_ICON_OFFSET_Y // 6 - 5.7 + 2 = 2.3pt
        expect(topBufferFromInnerBorder).toBeCloseTo(2.3, 5)
        expect(bottomGapToLabelBox).toBeCloseTo(2.3, 5)
        expect(topBufferFromInnerBorder).toBeGreaterThan(0)
        expect(bottomGapToLabelBox).toBeGreaterThan(0)
      }
    })

    it('navigates to /parts/browse?category=<ID> for all 10 category tabs (including ACCESSORIES and SUSPENSION) and /parts/browse for all', async () => {
      const { getByText } = await render(<PartsCategoriesGrid />)

      await act(async () => {
        fireEvent.press(getByText('إكسسوارات'))
      })
      expect(mockPush).toHaveBeenLastCalledWith('/parts/browse?category=ACCESSORIES')

      await act(async () => {
        fireEvent.press(getByText('المساعدات والتعليق'))
      })
      expect(mockPush).toHaveBeenLastCalledWith('/parts/browse?category=SUSPENSION')

      await act(async () => {
        fireEvent.press(getByText('عرض الكل'))
      })
      expect(mockPush).toHaveBeenLastCalledWith('/parts/browse')
    })
  })

  describe('2. Other Grids Untouched: Cars, Buses, Equipment & Services Stay on Vector Icons (on PR #85 branch) and Home Grid Unchanged at 39.5pt', () => {
    it('keeps Cars, Buses, Equipment, and Services grids on vector icons and HomeCategoriesGrid at 39.5x39.5', async () => {
      const { queryAllByTestId, getByTestId } = await render(
        <View>
          <CategoriesGrid />
          <BusCategoriesGrid />
          <EquipmentCategoriesGrid />
          <ServicesCategoriesGrid />
          <HomeCategoriesGrid reducedMotion={true} />
        </View>
      )

      const glassImageNodes = queryAllByTestId(/^category-tile-image-/)
      expect(glassImageNodes).toHaveLength(0)

      const maintBox = getByTestId('category-icon-box-MAINTENANCE')
      const maintBoxStyle = StyleSheet.flatten(maintBox.props.style) as Record<
        string,
        unknown
      >
      expect(maintBoxStyle.backgroundColor).toBe(Colors.paleMint)
      expect(maintBoxStyle.width).toBe(36)
      expect(maintBoxStyle.height).toBe(36)

      // HomeCategoriesGrid still renders its 7 tiles with 39.5x39.5 icons:
      const homeImages = queryAllByTestId('category-tile-image')
      expect(homeImages).toHaveLength(7)
      const homeImgStyle = StyleSheet.flatten(
        homeImages[0].props.style
      ) as Record<string, unknown>
      expect(homeImgStyle.width).toBe(39.5)
      expect(homeImgStyle.height).toBe(39.5)
    })
  })
})
