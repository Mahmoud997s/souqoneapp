import React from 'react'
import fs from 'fs'
import path from 'path'
import { LayoutAnimation, StyleSheet } from 'react-native'
import { render, fireEvent } from '@testing-library/react-native'
import { QuickFilters } from '../components/ui/QuickFilters'
import { VisualFiltersBase } from '../components/ui/VisualFiltersBase'
import { CarsVisualFilters } from '../components/cars/CarsVisualFilters'
import { BusesVisualFilters } from '../components/buses/BusesVisualFilters'
import { EquipmentVisualFilters } from '../components/equipment/EquipmentVisualFilters'
import { PartsVisualFilters } from '../components/parts/PartsVisualFilters'
import { ServicesVisualFilters } from '../components/services/ServicesVisualFilters'
import { MyListingsVisualFilters } from '../components/profile/MyListingsVisualFilters'
import { FilterGlassTokens, SoftTactileTokens, QuickChipTokens } from '../constants/filterGlassTokens'
import { Colors } from '../constants/colors'
import { Spacing } from '../constants/spacing'
import {
  computeHorizontalSnapStops,
  findNearestScrollStop,
} from '../utils/horizontalTrackSnap'

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}))

jest.mock('../hooks/useCars', () => ({
  useBrands: () => ({
    data: [{ id: 'toyota', name: 'Toyota', nameAr: 'تويوتا', slug: 'toyota' }],
    isLoading: false,
  }),
  useCarModels: () => ({
    data: [{ id: 'camry', name: 'Camry', nameAr: 'كامري' }],
    isLoading: false,
  }),
}))

jest.mock('../hooks/useBuses', () => ({
  useBusManufacturers: () => ({
    data: [{ id: 'yutong', name: 'Yutong', nameAr: 'يوتونج' }],
    isLoading: false,
  }),
}))

describe('D-377: Filters soft raised/inset look, transparent page bg, rhythm, zero animation, and horizontal snap helper', () => {
  describe('1. Styles: transparent container bg, no two-tone borders, no primaryDark border on selected', () => {
    it('QuickFilters container is transparent (not grey inputBg) and chips use plain flat QuickChipTokens without two-tone borders or inset overlay', async () => {
      const { getByTestId, getByLabelText, getByText, queryByTestId } = await render(
        <QuickFilters
          filters={[
            { id: 'brand', label: 'الماركة', isActive: false },
            { id: 'city', label: 'مسقط', isActive: true },
          ]}
          onFilterPress={jest.fn()}
          onClearFilter={jest.fn()}
        />
      )

      const containerStyle = StyleSheet.flatten(getByTestId('quick-filters-container').props.style)
      expect(containerStyle.backgroundColor).toBe(Colors.transparent)
      expect(containerStyle.backgroundColor).not.toBe(Colors.inputBg)

      const normalStyle = StyleSheet.flatten(getByLabelText('الماركة').parent?.props.style)
      expect(normalStyle.backgroundColor).toBe(QuickChipTokens.normal.bg)
      expect(normalStyle.borderColor).toBe(QuickChipTokens.normal.borderColor)
      expect(normalStyle.borderTopColor).toBeUndefined()
      expect(normalStyle.borderLeftColor).toBeUndefined()
      expect(normalStyle.borderRightColor).toBeUndefined()
      expect(normalStyle.borderBottomColor).toBeUndefined()
      expect(normalStyle.borderRadius).toBe(FilterGlassTokens.chip.borderRadius)

      const selectedStyle = StyleSheet.flatten(getByLabelText('مسقط').parent?.props.style)
      expect(selectedStyle.backgroundColor).toBe(Colors.primary)
      expect(selectedStyle.borderColor).toBe(Colors.primary)
      expect(selectedStyle.borderTopColor).toBeUndefined()
      expect(selectedStyle.borderLeftColor).toBeUndefined()
      expect(selectedStyle.borderRightColor).toBeUndefined()
      expect(selectedStyle.borderBottomColor).toBeUndefined()
      expect(selectedStyle.shadowOpacity).toBeUndefined()
      expect(selectedStyle.elevation).toBeUndefined()

      const selectedTextStyle = StyleSheet.flatten(getByText('مسقط').props.style)
      expect(selectedTextStyle.color).toBe(Colors.white)
      expect(queryByTestId('quick-filter-inset-city')).toBeNull()
    })

    it('VisualFiltersBase container & contentArea are transparent and cards have single hairline + soft inset without primaryDark border', async () => {
      const { getByTestId, getByLabelText, getByText } = await render(
        <VisualFiltersBase
          tabs={[
            {
              id: 'brands',
              label: 'الماركات',
              items: [
                { id: 'toyota', label: 'تويوتا', isSelected: false, onPress: jest.fn() },
                { id: 'nissan', label: 'نيسان', isSelected: true, onPress: jest.fn() },
              ],
            },
          ]}
        />
      )

      const baseStyle = StyleSheet.flatten(getByTestId('visual-filters-base').props.style)
      expect(baseStyle.backgroundColor).toBe(Colors.transparent)
      expect(baseStyle.backgroundColor).not.toBe(Colors.white)
      expect(baseStyle.backgroundColor).not.toBe(Colors.inputBg)

      const contentStyle = StyleSheet.flatten(getByTestId('visual-filters-content-area').props.style)
      expect(contentStyle.backgroundColor).toBe(Colors.transparent)
      expect(contentStyle.backgroundColor).not.toBe(Colors.inputBg)

      const raisedStyle = StyleSheet.flatten(getByLabelText('تويوتا').parent?.props.style)
      expect(raisedStyle.backgroundColor).toBe(SoftTactileTokens.raised.bg)
      expect(raisedStyle.borderColor).toBe(SoftTactileTokens.raised.borderColor)
      expect(raisedStyle.borderTopColor).toBeUndefined()
      expect(raisedStyle.borderBottomColor).toBeUndefined()
      expect(raisedStyle.borderRadius).toBe(FilterGlassTokens.card.borderRadius)

      const insetStyle = StyleSheet.flatten(getByLabelText('نيسان').parent?.props.style)
      expect(insetStyle.backgroundColor).toBe(Colors.paleMint)
      expect(insetStyle.borderColor).toBe(SoftTactileTokens.inset.borderColor)
      expect(insetStyle.borderColor).not.toBe(Colors.primaryDark)
      expect(insetStyle.borderTopColor).toBeUndefined()
      expect(insetStyle.borderBottomColor).toBeUndefined()

      const selectedLabelStyle = StyleSheet.flatten(getByText('نيسان').props.style)
      expect(selectedLabelStyle.color).toBe(Colors.primaryDark)
      expect(getByTestId('visual-filter-item-inset-nissan')).toBeTruthy()
    })
  })

  describe('2. Animation removal: zero Animated/Reanimated/LayoutAnimation in filter components', () => {
    const filterComponentFiles = [
      'src/components/ui/QuickFilters.tsx',
      'src/components/ui/VisualFiltersBase.tsx',
      'src/components/cars/CarsVisualFilters.tsx',
      'src/components/buses/BusesVisualFilters.tsx',
      'src/components/equipment/EquipmentVisualFilters.tsx',
      'src/components/parts/PartsVisualFilters.tsx',
      'src/components/services/ServicesVisualFilters.tsx',
      'src/components/profile/MyListingsVisualFilters.tsx',
    ]

    const forbiddenAnimationPattern =
      /\b(Animated|Reanimated|useSharedValue|withTiming|withSpring|LayoutAnimation|FadeIn|FadeOut)\b|\bentering=|\bexiting=/

    it('contains no animation primitives across all QuickFilters and VisualFilters source files', () => {
      const root = path.resolve(__dirname, '../..')
      for (const relPath of filterComponentFiles) {
        const src = fs.readFileSync(path.join(root, relPath), 'utf8')
        expect({ file: relPath, hasAnimation: forbiddenAnimationPattern.test(src) }).toEqual({
          file: relPath,
          hasAnimation: false,
        })
      }
    })

    it('CarsVisualFilters brand selection switches to models tab without calling LayoutAnimation', async () => {
      const layoutSpy = jest.spyOn(LayoutAnimation, 'configureNext')
      const onSelectFilter = jest.fn()

      const { getByLabelText } = await render(
        <CarsVisualFilters onSelectFilter={onSelectFilter} onViewAll={jest.fn()} />
      )

      fireEvent.press(getByLabelText('تويوتا'))
      expect(onSelectFilter).toHaveBeenCalledWith('make', 'toyota', 'Toyota')
      expect(layoutSpy).not.toHaveBeenCalled()
      layoutSpy.mockRestore()
    })
  })

  describe('3. Spacing rhythm parity across all 5 browse visual filters + MyListingsVisualFilters', () => {
    const cases: Array<{ name: string; element: React.ReactElement }> = [
      {
        name: 'CarsVisualFilters',
        element: <CarsVisualFilters onSelectFilter={jest.fn()} onViewAll={jest.fn()} />,
      },
      {
        name: 'BusesVisualFilters',
        element: <BusesVisualFilters onSelectFilter={jest.fn()} onViewAll={jest.fn()} />,
      },
      {
        name: 'EquipmentVisualFilters',
        element: <EquipmentVisualFilters onSelectFilter={jest.fn()} onViewAll={jest.fn()} />,
      },
      {
        name: 'PartsVisualFilters',
        element: <PartsVisualFilters onSelectFilter={jest.fn()} onViewAll={jest.fn()} />,
      },
      {
        name: 'ServicesVisualFilters',
        element: <ServicesVisualFilters onSelectFilter={jest.fn()} onViewAll={jest.fn()} />,
      },
      {
        name: 'MyListingsVisualFilters',
        element: (
          <MyListingsVisualFilters
            activeCategory="all"
            activeSubFilter="all_items"
            onSelectCategory={jest.fn()}
            onSelectSubFilter={jest.fn()}
          />
        ),
      },
    ]

    it.each(cases)('$name uses identical SoftTactileTokens.rhythm and transparent backgrounds', async ({ element }) => {
      const { getByTestId } = await render(element)

      const baseStyle = StyleSheet.flatten(getByTestId('visual-filters-base').props.style)
      const segmentedStyle = StyleSheet.flatten(getByTestId('visual-filters-segmented-wrapper').props.style)
      const contentStyle = StyleSheet.flatten(getByTestId('visual-filters-content-area').props.style)

      expect(baseStyle.backgroundColor).toBe(Colors.transparent)
      expect(baseStyle.paddingBottom).toBe(Spacing.space3)
      expect(segmentedStyle.marginTop).toBe(Spacing.space3)
      expect(segmentedStyle.marginBottom).toBe(Spacing.space3)
      expect(contentStyle.backgroundColor).toBe(Colors.transparent)
      expect(contentStyle.paddingTop).toBe(0)
    })
  })

  describe('4. Pure horizontalTrackSnap helper (several widths, both ends, RTL, no-overflow)', () => {
    it('returns [0] and snaps to 0 when content fits within container (no overflow)', () => {
      const stops = computeHorizontalSnapStops({
        itemWidths: [80, 90, 70],
        gap: 8,
        paddingStart: 16,
        paddingEnd: 16,
        containerWidth: 390,
      })
      expect(stops).toEqual([0])
      expect(findNearestScrollStop(50, stops, 0)).toBe(0)
    })

    it('computes exact right-edge and left-edge whole-chip stops for uniform widths', () => {
      // 6 items x 100px + 5 gaps x 8px + 16 + 16 = 672px; container = 390px -> maxScroll = 282px
      const stops = computeHorizontalSnapStops({
        itemWidths: [100, 100, 100, 100, 100, 100],
        gap: 8,
        paddingStart: 16,
        paddingEnd: 16,
        containerWidth: 390,
      })

      expect(stops[0]).toBe(0)
      expect(stops[stops.length - 1]).toBe(282)
      // Right-edge start boundaries: item 1 starts at 108 -> stop 108; item 2 starts at 216 -> stop 216
      expect(stops).toContain(108)
      expect(stops).toContain(216)
      // Left-edge end boundaries: item 3 ends at 16 + 4*100 + 3*8 = 440 -> +16 - 390 = 66; item 4 -> 174
      expect(stops).toContain(66)
      expect(stops).toContain(174)

      // Snapping near both ends and middle settles on exact boundaries
      expect(findNearestScrollStop(-40, stops, 282)).toBe(0)
      expect(findNearestScrollStop(500, stops, 282)).toBe(282)
      expect(findNearestScrollStop(100, stops, 282)).toBe(108)
      expect(findNearestScrollStop(170, stops, 282)).toBe(174)
    })

    it('handles mixed item widths cleanly without cutting edge chips', () => {
      // widths [72, 128, 94, 150, 86], gap 8, pad 16/16 -> total = 16 + 530 + 32 + 16 = 594; container = 360 -> maxScroll = 234
      const stops = computeHorizontalSnapStops({
        itemWidths: [72, 128, 94, 150, 86],
        gap: 8,
        paddingStart: 16,
        paddingEnd: 16,
        containerWidth: 360,
      })

      expect(stops[0]).toBe(0)
      expect(stops[stops.length - 1]).toBe(234)
      // Item 1 right-edge boundary: 72 + 8 = 80
      expect(stops).toContain(80)
      // Item 2 right-edge boundary: 72 + 8 + 128 + 8 = 216
      expect(stops).toContain(216)
      // Every stop is strictly sorted ascending within [0, maxScroll]
      for (let i = 1; i < stops.length; i += 1) {
        expect(stops[i]).toBeGreaterThan(stops[i - 1])
      }
      expect(findNearestScrollStop(84, stops, 234)).toBe(80)
      expect(findNearestScrollStop(220, stops, 234)).toBe(216)
    })
  })
})
