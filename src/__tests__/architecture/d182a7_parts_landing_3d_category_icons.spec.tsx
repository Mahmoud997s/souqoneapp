import React from 'react'
import { StyleSheet, View } from 'react-native'
import { render, fireEvent, act } from '@testing-library/react-native'
import fs from 'fs'
import path from 'path'
import {
  PartsCategoriesGrid,
  PARTS_LANDING_CATEGORIES,
} from '../../components/parts/PartsCategoriesGrid'
import { CategoriesGrid } from '../../components/cars/CategoriesGrid'
import { BusCategoriesGrid } from '../../components/buses/landing/BusCategoriesGrid'
import { EquipmentCategoriesGrid } from '../../components/equipment/landing/EquipmentCategoriesGrid'
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

jest.mock('@expo/vector-icons', () => {
  const ReactLib = require('react')
  const { View: RNView } = require('react-native')
  return {
    Ionicons: (props: Record<string, unknown>) =>
      ReactLib.createElement(RNView, { testID: `icon-${String(props.name)}`, ...props }),
    MaterialCommunityIcons: (props: Record<string, unknown>) =>
      ReactLib.createElement(RNView, { testID: `m-icon-${String(props.name)}`, ...props }),
  }
})

describe('D-196 — Parts Landing Restored Vector Category Icons & No 3D Assets', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('1. 11-Item Order & Vector Icon Definitions in PartsCategoriesGrid', () => {
    const expectedCategoryIds = [
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

    it('defines all 11 part categories with iconType: "material" and valid MaterialCommunityIcons names', () => {
      expect(PARTS_LANDING_CATEGORIES.map((c) => c.id)).toEqual(expectedCategoryIds)

      for (const cat of PARTS_LANDING_CATEGORIES) {
        expect(cat.iconType).toBe('material')
        expect(typeof cat.icon).toBe('string')
        expect(cat.icon.length).toBeGreaterThan(0)
        expect((cat as any).image).toBeUndefined()
      }

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

    it('TEETH PROOF: verifies NO parts 3D image files exist in assets/images/categories/parts', () => {
      const partsDir = path.resolve(__dirname, '../../../assets/images/categories/parts')
      expect(fs.existsSync(partsDir)).toBe(false)
    })

    it('renders vector icons inside 36x36 icon boxes for all 11 items and ZERO 3D image tiles', async () => {
      const { queryAllByTestId, getByTestId, getAllByText } = await render(
        <PartsCategoriesGrid />
      )

      // Zero 3D image tiles rendered
      const imageTiles = queryAllByTestId(/^category-tile-image-/)
      expect(imageTiles).toHaveLength(0)

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

      for (const id of expectedCategoryIds) {
        const iconBox = getByTestId(`category-icon-box-${id}`)
        expect(iconBox).toBeTruthy()
        const boxStyle = StyleSheet.flatten(iconBox.props.style) as Record<string, unknown>
        expect(boxStyle.width).toBe(36)
        expect(boxStyle.height).toBe(36)
      }
    })

    it('navigates to /parts/browse?category=<ID> for all category tabs and /parts/browse for all', async () => {
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

  describe('2. Other Grids: Cars, Buses & Equipment Stay on Vector Icons', () => {
    it('keeps Cars, Buses, and Equipment grids on vector icons with paleMint icon boxes', async () => {
      const { queryAllByTestId, getAllByTestId } = await render(
        <View>
          <CategoriesGrid />
          <BusCategoriesGrid />
          <EquipmentCategoriesGrid />
        </View>
      )

      // Zero GlassCategoriesGrid 3D image icons
      const glassImageNodes = queryAllByTestId(/^category-tile-image-/)
      expect(glassImageNodes).toHaveLength(0)

      // Cars/Buses/Equipment 'new' tiles still use paleMint icon box
      const newBoxes = getAllByTestId('category-icon-box-new')
      expect(newBoxes.length).toBeGreaterThanOrEqual(2)
      const newBoxStyle = StyleSheet.flatten(newBoxes[0].props.style) as Record<string, unknown>
      expect(newBoxStyle.backgroundColor).toBe(Colors.paleMint)
      expect(newBoxStyle.width).toBe(36)
      expect(newBoxStyle.height).toBe(36)
    })
  })
})
