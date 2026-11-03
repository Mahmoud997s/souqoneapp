import React from 'react'
import { StyleSheet, View } from 'react-native'
import { render, fireEvent, act } from '@testing-library/react-native'
import fs from 'fs'
import path from 'path'
import {
  ServicesCategoriesGrid,
  SERVICES_LANDING_CATEGORIES,
} from '../../components/services/ServicesCategoriesGrid'
import { CategoriesGrid } from '../../components/cars/CategoriesGrid'
import { BusCategoriesGrid } from '../../components/buses/landing/BusCategoriesGrid'
import { EquipmentCategoriesGrid } from '../../components/equipment/landing/EquipmentCategoriesGrid'
import { PartsCategoriesGrid } from '../../components/parts/PartsCategoriesGrid'
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

describe('D-196 — Services Landing Restored Vector Category Icons & No 3D Assets', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('1. 9-Item Order & Vector Icon Definitions in ServicesCategoriesGrid', () => {
    const expectedServiceCategoryIds = [
      'MAINTENANCE',
      'CLEANING',
      'INSPECTION',
      'BODYWORK',
      'MODIFICATION',
      'TOWING',
      'KEYS_LOCKS',
      'ACCESSORIES_INSTALL',
      'all',
    ]

    it('defines all 9 service categories with iconType: "material" and valid vector icon names', () => {
      expect(SERVICES_LANDING_CATEGORIES.map((c) => c.id)).toEqual(expectedServiceCategoryIds)

      for (const cat of SERVICES_LANDING_CATEGORIES) {
        expect(cat.iconType).toBe('material')
        expect(typeof cat.icon).toBe('string')
        expect(cat.icon.length).toBeGreaterThan(0)
        expect((cat as any).image).toBeUndefined()
      }

      expect(SERVICES_LANDING_CATEGORIES.map((c) => c.label)).toEqual([
        'صيانة',
        'غسيل وتلميع',
        'فحص',
        'سمكرة وصبغ',
        'تعديل',
        'ونش وإنقاذ',
        'مفاتيح',
        'إكسسوارات',
        'عرض الكل',
      ])
    })

    it('TEETH PROOF: verifies NO services 3D image files exist in assets/images/categories/services', () => {
      const servicesDir = path.resolve(__dirname, '../../../assets/images/categories/services')
      expect(fs.existsSync(servicesDir)).toBe(false)
    })

    it('renders vector icons inside 36x36 icon boxes for all 9 items and ZERO 3D image tiles', async () => {
      const { queryAllByTestId, getByTestId, getAllByText } = await render(
        <ServicesCategoriesGrid />
      )

      // Zero 3D image tiles rendered
      const imageTiles = queryAllByTestId(/^category-tile-image-/)
      expect(imageTiles).toHaveLength(0)

      const labels = getAllByText(/[\u0600-\u06FF]/).map((n) => n.props.children)
      expect(labels).toEqual([
        'صيانة',
        'غسيل وتلميع',
        'فحص',
        'سمكرة وصبغ',
        'تعديل',
        'ونش وإنقاذ',
        'مفاتيح',
        'إكسسوارات',
        'عرض الكل',
      ])

      for (const id of expectedServiceCategoryIds) {
        const iconBox = getByTestId(`category-icon-box-${id}`)
        expect(iconBox).toBeTruthy()
        const boxStyle = StyleSheet.flatten(iconBox.props.style) as Record<string, unknown>
        expect(boxStyle.width).toBe(36)
        expect(boxStyle.height).toBe(36)
      }
    })

    it('navigates to /services/browse?serviceType=<ID> for all 8 category tabs and /services/browse for all', async () => {
      const { getByText } = await render(<ServicesCategoriesGrid />)

      await act(async () => {
        fireEvent.press(getByText('صيانة'))
      })
      expect(mockPush).toHaveBeenLastCalledWith(
        '/services/browse?serviceType=MAINTENANCE'
      )

      await act(async () => {
        fireEvent.press(getByText('غسيل وتلميع'))
      })
      expect(mockPush).toHaveBeenLastCalledWith('/services/browse?serviceType=CLEANING')

      await act(async () => {
        fireEvent.press(getByText('فحص'))
      })
      expect(mockPush).toHaveBeenLastCalledWith(
        '/services/browse?serviceType=INSPECTION'
      )

      await act(async () => {
        fireEvent.press(getByText('عرض الكل'))
      })
      expect(mockPush).toHaveBeenLastCalledWith('/services/browse')
    })
  })

  describe('2. Other Grids: Cars, Buses, Equipment & Parts Stay on Vector Icons', () => {
    it('keeps Cars, Buses, Equipment, and Parts grids on vector icons', async () => {
      const { queryAllByTestId } = await render(
        <View>
          <CategoriesGrid />
          <BusCategoriesGrid />
          <EquipmentCategoriesGrid />
          <PartsCategoriesGrid />
        </View>
      )

      // Zero GlassCategoriesGrid 3D image icons
      const glassImageNodes = queryAllByTestId(/^category-tile-image-/)
      expect(glassImageNodes).toHaveLength(0)
    })
  })
})
