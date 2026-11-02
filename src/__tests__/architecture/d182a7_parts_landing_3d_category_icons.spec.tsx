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

describe('D-182a7 — Parts Landing 3D Category Icons, Order, Option B 39.5pt Sizing & Vector Preservation', () => {
  jest.setTimeout(30000)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('1. Mapping Constant (PART_CATEGORY_ICONS) & 11-Item Order in PartsCategoriesGrid', () => {
    const expectedImageIds: PartCategoryIconId[] = [
      'ENGINE',
      'BODY',
      'ELECTRICAL',
      'BRAKES',
      'INTERIOR',
      'TIRES',
      'BATTERIES',
      'OILS',
      'ACCESSORIES',
      'all',
    ]

    it('maps all 10 3D-icon part category IDs to non-null image assets with BRAKES=cat-parts and all=cat-browse', () => {
      for (const id of expectedImageIds) {
        expect(PART_CATEGORY_ICONS[id]).toBeDefined()
        expect(PART_CATEGORY_ICONS[id]).not.toBeNull()
        expect(typeof PART_CATEGORY_ICONS[id]).not.toBe('string')
      }

      // BRAKES reuses the existing 3D brake disc asset (cat-parts.png)
      expect(PART_CATEGORY_ICONS.BRAKES).toBe(CATEGORY_ICONS.parts)
      // all (عرض الكل) reuses the existing cat-browse.png asset
      expect(PART_CATEGORY_ICONS.all).toBe(CATEGORY_ICONS.browse)

      // All 8 new cropped 384x384 PNG files exist on disk in assets/images/categories/parts/
      const expectedFiles = [
        'part-engine.png',
        'part-body.png',
        'part-electrical.png',
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

    it('renders 10 3D image icons at 39.5x39.5 inside 36x36 transparent catIconBox and keeps SUSPENSION as the only vector icon', async () => {
      expect(CATEGORY_IMAGE_ICON_SIZE).toBe(CATEGORY_ICON_SIZE)
      expect(CATEGORY_IMAGE_ICON_SIZE).toBe(39.5)

      const { getByTestId, queryByTestId, getAllByText } = await render(
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

      // Verify all 10 3D-icon tabs render expo-image with 39.5x39.5, contentFit="contain", no tintColor, inside 36x36 transparent box:
      for (const id of expectedImageIds) {
        const iconBox = getByTestId(`category-icon-box-${id}`)
        const boxStyle = StyleSheet.flatten(iconBox.props.style) as Record<string, unknown>
        expect(boxStyle.width).toBe(36)
        expect(boxStyle.height).toBe(36)
        expect(boxStyle.marginBottom).toBe(6)
        expect(boxStyle.backgroundColor).toBe('transparent')
        expect(boxStyle.overflow).toBeUndefined()

        const img = getByTestId(`category-tile-image-${id}`)
        expect(img.props.source).toBe(PART_CATEGORY_ICONS[id])
        expect(img.props.contentFit).toBe('contain')
        expect(img.props.tintColor).toBeUndefined()

        const imgStyle = StyleSheet.flatten(img.props.style) as Record<string, unknown>
        expect(imgStyle.width).toBe(39.5)
        expect(imgStyle.height).toBe(39.5)
      }

      // Verify SUSPENSION stays on its vector icon (MaterialCommunityIcons 'car-esp') inside 36x36 paleMint box:
      expect(queryByTestId('category-tile-image-SUSPENSION')).toBeNull()
      const suspBox = getByTestId('category-icon-box-SUSPENSION')
      const suspBoxStyle = StyleSheet.flatten(suspBox.props.style) as Record<string, unknown>
      expect(suspBoxStyle.width).toBe(36)
      expect(suspBoxStyle.height).toBe(36)
      expect(suspBoxStyle.marginBottom).toBe(6)
      expect(suspBoxStyle.backgroundColor).toBe(Colors.paleMint)
    })

    it('navigates to /parts/browse?category=<ID> for all 10 category tabs (including ACCESSORIES) and /parts/browse for all', async () => {
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

  describe('2. Other Grids Untouched: Cars, Buses, Equipment & Services Stay on Vector Icons and Home Grid Unchanged', () => {
    it('keeps Cars, Buses, Equipment, and Services grids on vector icons with paleMint icon boxes and zero image icons', async () => {
      const { queryAllByTestId, getByTestId } = await render(
        <View>
          <CategoriesGrid />
          <BusCategoriesGrid />
          <EquipmentCategoriesGrid />
          <ServicesCategoriesGrid />
          <HomeCategoriesGrid reducedMotion={true} />
        </View>
      )

      // Zero GlassCategoriesGrid image icons rendered across Cars, Buses, Equipment, and Services:
      const glassImageNodes = queryAllByTestId(/^category-tile-image-/)
      expect(glassImageNodes).toHaveLength(0)

      // Services MAINTENANCE still uses paleMint icon box:
      const maintBox = getByTestId('category-icon-box-MAINTENANCE')
      const maintBoxStyle = StyleSheet.flatten(maintBox.props.style) as Record<string, unknown>
      expect(maintBoxStyle.backgroundColor).toBe(Colors.paleMint)
      expect(maintBoxStyle.width).toBe(36)
      expect(maintBoxStyle.height).toBe(36)

      // HomeCategoriesGrid still renders its 7 tiles with 39.5x39.5 icons:
      const homeImages = queryAllByTestId('category-tile-image')
      expect(homeImages).toHaveLength(7)
    })
  })
})
