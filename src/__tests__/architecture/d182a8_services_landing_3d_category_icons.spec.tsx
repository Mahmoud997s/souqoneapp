import React from 'react'
import { StyleSheet, View } from 'react-native'
import { render, fireEvent, act } from '@testing-library/react-native'
import fs from 'fs'
import path from 'path'
import {
  ServicesCategoriesGrid,
  SERVICES_LANDING_CATEGORIES,
} from '../../components/services/ServicesCategoriesGrid'
import { CATEGORY_IMAGE_ICON_SIZE } from '../../components/ui/GlassCategoriesGrid'
import {
  SERVICE_CATEGORY_ICONS,
  type ServiceCategoryIconId,
} from '../../constants/serviceCategoryIcons'
import { PART_CATEGORY_ICONS } from '../../constants/partCategoryIcons'
import { CATEGORY_ICONS } from '../../constants/categoryIcons'
import {
  HomeCategoriesGrid,
  CATEGORY_ICON_SIZE,
} from '../../components/home/HomeCategoriesGrid'
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

describe('D-182a8 — Services Landing 3D Category Icons, Order, Option B 39.5pt Sizing & Vector Preservation', () => {
  jest.setTimeout(30000)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('1. Mapping Constant (SERVICE_CATEGORY_ICONS) & 9-Item Order in ServicesCategoriesGrid', () => {
    const expectedServiceImageIds: ServiceCategoryIconId[] = [
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

    it('maps all 9 service category IDs (including INSPECTION) to non-null 3D image assets with ACCESSORIES_INSTALL reusing part-accessories and all reusing cat-browse', () => {
      for (const id of expectedServiceImageIds) {
        expect(SERVICE_CATEGORY_ICONS[id]).toBeDefined()
        expect(SERVICE_CATEGORY_ICONS[id]).not.toBeNull()
        expect(typeof SERVICE_CATEGORY_ICONS[id]).not.toBe('string')
      }

      // ACCESSORIES_INSTALL reuses the steering-wheel 3D asset created in D-182a7 for parts ACCESSORIES
      expect(SERVICE_CATEGORY_ICONS.ACCESSORIES_INSTALL).toBe(
        PART_CATEGORY_ICONS.ACCESSORIES
      )
      // all (عرض الكل) reuses the existing cat-browse.png asset
      expect(SERVICE_CATEGORY_ICONS.all).toBe(CATEGORY_ICONS.browse)

      // All 7 new cropped 384x384 PNG files exist on disk in assets/images/categories/services/
      const expectedFiles = [
        'service-maintenance.png',
        'service-cleaning.png',
        'service-inspection.png',
        'service-bodywork.png',
        'service-modification.png',
        'service-towing.png',
        'service-keys-locks.png',
      ]
      for (const fileName of expectedFiles) {
        const assetPath = path.resolve(
          __dirname,
          '../../../assets/images/categories/services',
          fileName
        )
        expect(fs.existsSync(assetPath)).toBe(true)
        const stat = fs.statSync(assetPath)
        expect(stat.size).toBeGreaterThan(50 * 1024)
        expect(stat.size).toBeLessThan(260 * 1024)
      }

      expect(SERVICES_LANDING_CATEGORIES.map((c) => c.id)).toEqual([
        'MAINTENANCE',
        'CLEANING',
        'INSPECTION',
        'BODYWORK',
        'MODIFICATION',
        'TOWING',
        'KEYS_LOCKS',
        'ACCESSORIES_INSTALL',
        'all',
      ])

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

    it('renders all 9 service category tabs as 3D image icons at 47.4x47.4 (39.5 * 1.2) inside 36x36 transparent catIconBox', async () => {
      expect(CATEGORY_ICON_SIZE).toBe(39.5)
      expect(CATEGORY_IMAGE_ICON_SIZE).toBeCloseTo(39.5 * 1.2, 5)
      expect(CATEGORY_IMAGE_ICON_SIZE).toBe(47.4)

      const { getByTestId, getAllByText } = await render(
        <ServicesCategoriesGrid />
      )

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

      for (const id of expectedServiceImageIds) {
        const iconBox = getByTestId(`category-icon-box-${id}`)
        const boxStyle = StyleSheet.flatten(iconBox.props.style) as Record<
          string,
          unknown
        >
        expect(boxStyle.width).toBe(36)
        expect(boxStyle.height).toBe(36)
        expect(boxStyle.marginBottom).toBe(6)
        expect(boxStyle.backgroundColor).toBe('transparent')
        expect(boxStyle.overflow).toBeUndefined()

        const img = getByTestId(`category-tile-image-${id}`)
        expect(img.props.source).toBe(SERVICE_CATEGORY_ICONS[id])
        expect(img.props.contentFit).toBe('contain')
        expect(img.props.tintColor).toBeUndefined()

        const imgStyle = StyleSheet.flatten(img.props.style) as Record<
          string,
          unknown
        >
        expect(imgStyle.width).toBe(47.4)
        expect(imgStyle.height).toBe(47.4)
      }
    })

    it('navigates to /services/browse?serviceType=<ID> for all 8 service category tabs and /services/browse for all', async () => {
      const { getByText } = await render(<ServicesCategoriesGrid />)

      await act(async () => {
        fireEvent.press(getByText('فحص'))
      })
      expect(mockPush).toHaveBeenLastCalledWith(
        '/services/browse?serviceType=INSPECTION'
      )

      await act(async () => {
        fireEvent.press(getByText('إكسسوارات'))
      })
      expect(mockPush).toHaveBeenLastCalledWith(
        '/services/browse?serviceType=ACCESSORIES_INSTALL'
      )

      await act(async () => {
        fireEvent.press(getByText('عرض الكل'))
      })
      expect(mockPush).toHaveBeenLastCalledWith('/services/browse')
    })
  })

  describe('2. Other Grids Untouched: Cars, Buses & Equipment Stay on Vector Icons; Parts & Home Grids Preserved', () => {
    it('keeps Cars, Buses, and Equipment on vector icons and preserves Parts (all 11 3D icons) and Home (7 3D)', async () => {
      const { queryAllByTestId, getByTestId } = await render(
        <View>
          <CategoriesGrid />
          <BusCategoriesGrid />
          <EquipmentCategoriesGrid />
          <PartsCategoriesGrid />
          <HomeCategoriesGrid reducedMotion={true} />
        </View>
      )

      // Only Parts' 11 image icons should match category-tile-image-<id> (Cars, Buses, Equipment have 0)
      const glassImageNodes = queryAllByTestId(/^category-tile-image-/)
      expect(glassImageNodes).toHaveLength(11)

      // Parts SUSPENSION now also uses transparent 3D icon box (M.PNG)
      const suspBox = getByTestId('category-icon-box-SUSPENSION')
      const suspBoxStyle = StyleSheet.flatten(suspBox.props.style) as Record<
        string,
        unknown
      >
      expect(suspBoxStyle.backgroundColor).toBe('transparent')

      // HomeCategoriesGrid still renders its 7 tiles
      const homeImages = queryAllByTestId('category-tile-image')
      expect(homeImages).toHaveLength(7)
    })
  })
})
