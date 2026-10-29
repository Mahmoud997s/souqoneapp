import React from 'react'
import fs from 'fs'
import path from 'path'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react-native'
import {
  EquipmentFilterBottomSheet,
  EquipmentFilterState,
  EQUIPMENT_SORT_OPTIONS,
  LISTING_TYPE_OPTIONS,
  CONDITION_OPTIONS,
  HOURS_OPTIONS,
} from '../EquipmentFilterBottomSheet'
import { locationsApi } from '../../../api/locations'

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}))

jest.mock('../../../api/locations', () => ({
  locationsApi: {
    getGovernorates: jest.fn(),
    getWilayas: jest.fn(),
  },
}))

describe('EquipmentFilterBottomSheet Component (Cars Parity Design)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(locationsApi.getGovernorates as jest.Mock).mockResolvedValue([
      { id: 1, nameAr: 'مسقط', nameEn: 'Muscat' },
      { id: 2, nameAr: 'ظفار', nameEn: 'Dhofar' },
    ])
    ;(locationsApi.getWilayas as jest.Mock).mockResolvedValue([
      { id: 101, nameAr: 'السيب', nameEn: 'Seeb' },
      { id: 102, nameAr: 'بوشر', nameEn: 'Bawshar' },
    ])
  })

  it('strictly adheres to architecture standards: FilterBottomSheetLayout, DropdownSelector, RangeSlider, NO FilterChip, NO Modal', () => {
    const filePath = path.join(__dirname, '../EquipmentFilterBottomSheet.tsx')
    const fileContent = fs.readFileSync(filePath, 'utf-8')

    // Must use FilterBottomSheetLayout
    expect(fileContent).toContain('FilterBottomSheetLayout')
    // Must use FilterSection
    expect(fileContent).toContain('FilterSection')
    // Must use DropdownSelector
    expect(fileContent).toContain('DropdownSelector')
    // Must use RangeSlider with reset key
    expect(fileContent).toContain('RangeSlider')
    expect(fileContent).toContain('sliderResetKey')
    // Must strictly have ZERO FilterChip in the sheet
    expect(fileContent).not.toContain('FilterChip')
    // Must NOT import Modal directly from react-native
    expect(fileContent).not.toMatch(/import\s*\{[^}]*\bModal\b[^}]*\}\s*from\s*['"]react-native['"]/)
  })

  it('renders with header title "تصفية النتائج" and correct section order matching Cars sheet', async () => {
    await render(
      <EquipmentFilterBottomSheet
        visible={true}
        onClose={jest.fn()}
        initialFilters={{}}
        onApplyFilters={jest.fn()}
      />
    )

    await waitFor(() => {
      // Header title matches Cars convention
      expect(screen.getByText('تصفية النتائج')).toBeTruthy()

      // Primary sections rendered in order
      expect(screen.getByText('ترتيب النتائج')).toBeTruthy()
      expect(screen.getByText('المعدة')).toBeTruthy()
      expect(screen.getByText('الموقع')).toBeTruthy()
      expect(screen.getByText('نطاق السعر (ر.ع)')).toBeTruthy()
      expect(screen.getByText('سنة الصنع')).toBeTruthy()

      // Placeholders inside dropdowns
      expect(screen.getByText('الترتيب الافتراضي')).toBeTruthy()
      expect(screen.getByText('نوع الإعلان')).toBeTruthy()
      expect(screen.getByText('فئة المعدة')).toBeTruthy()
      expect(screen.getByText('المحافظة')).toBeTruthy()
      expect(screen.getByText('الولاية')).toBeTruthy()

      // Expander button is visible
      expect(screen.getByText('المزيد من الفلاتر')).toBeTruthy()

      // Secondary filters are collapsed initially
      expect(screen.queryByText('حالة المعدة')).toBeNull()
      expect(screen.queryByText('ساعات العمل')).toBeNull()
    })
  })

  it('expands secondary filters ("حالة المعدة" and "ساعات العمل") when "المزيد من الفلاتر" is pressed', async () => {
    await render(
      <EquipmentFilterBottomSheet
        visible={true}
        onClose={jest.fn()}
        initialFilters={{}}
        onApplyFilters={jest.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('المزيد من الفلاتر')).toBeTruthy()
    })

    // Press expander
    await act(async () => {
      fireEvent.press(screen.getByText('المزيد من الفلاتر'))
    })

    // Secondary sections now visible
    expect(screen.getByText('حالة المعدة')).toBeTruthy()
    expect(screen.getByText('ساعات العمل')).toBeTruthy()
    // Expander button is hidden after expansion
    expect(screen.queryByText('المزيد من الفلاتر')).toBeNull()
  })

  it('allows selecting sort, listing type, category, condition, hours and passes correct keys to onApplyFilters', async () => {
    const onApplyFilters = jest.fn()
    const onClose = jest.fn()

    await render(
      <EquipmentFilterBottomSheet
        visible={true}
        onClose={onClose}
        initialFilters={{}}
        onApplyFilters={onApplyFilters}
      />
    )

    // 1. Select Sort (السعر: الأقل أولاً)
    await waitFor(() => {
      expect(screen.getByText('الترتيب الافتراضي')).toBeTruthy()
    })
    await act(async () => {
      fireEvent.press(screen.getByText('الترتيب الافتراضي'))
    })
    expect(screen.getByText('ترتيب النتائج')).toBeTruthy()
    await act(async () => {
      fireEvent.press(screen.getByText('السعر: الأقل أولاً'))
    })

    // 2. Select Listing Type (للبيع)
    await act(async () => {
      fireEvent.press(screen.getByText('نوع الإعلان'))
    })
    expect(screen.getByText('للبيع')).toBeTruthy()
    await act(async () => {
      fireEvent.press(screen.getByText('للبيع'))
    })

    // 3. Select Category (حفار -> EXCAVATOR)
    await act(async () => {
      fireEvent.press(screen.getByText('فئة المعدة'))
    })
    expect(screen.getByText('حفار')).toBeTruthy()
    await act(async () => {
      fireEvent.press(screen.getByText('حفار'))
    })

    // 4. Expand "المزيد من الفلاتر"
    await act(async () => {
      fireEvent.press(screen.getByText('المزيد من الفلاتر'))
    })

    // 5. Select Condition (جديدة تماماً (أصفار) -> NEW)
    const conditionDropdowns = screen.getAllByText('الكل')
    await act(async () => {
      // First 'الكل' is Condition
      fireEvent.press(conditionDropdowns[0])
    })
    expect(screen.getByText('جديدة تماماً (أصفار)')).toBeTruthy()
    await act(async () => {
      fireEvent.press(screen.getByText('جديدة تماماً (أصفار)'))
    })

    // 6. Select Hours (أقل من 3,000 ساعة -> 3000)
    await act(async () => {
      // Hours dropdown now has 'الكل'
      fireEvent.press(screen.getByText('الكل'))
    })
    expect(screen.getByText('أقل من 3,000 ساعة')).toBeTruthy()
    await act(async () => {
      fireEvent.press(screen.getByText('أقل من 3,000 ساعة'))
    })

    // 7. Press Apply
    await act(async () => {
      fireEvent.press(screen.getByText('تطبيق الفلتر'))
    })

    expect(onApplyFilters).toHaveBeenCalledWith(
      expect.objectContaining({
        sortBy: 'price_asc',
        listingType: 'EQUIPMENT_SALE',
        equipmentType: 'EXCAVATOR',
        categoryId: 'EXCAVATOR',
        condition: 'NEW',
        conditionId: 'NEW',
        hoursMax: '3000',
        hoursId: 'h2',
      })
    )
    expect(onClose).toHaveBeenCalled()
  })

  it('clears filters and resets slider state when "مسح الفلاتر" is pressed', async () => {
    const onApplyFilters = jest.fn()
    const onClose = jest.fn()

    const initial: EquipmentFilterState = {
      equipmentType: 'EXCAVATOR',
      condition: 'USED',
      priceMin: '500',
      priceMax: '2000',
      sortBy: 'price_asc',
    }

    await render(
      <EquipmentFilterBottomSheet
        visible={true}
        onClose={onClose}
        initialFilters={initial}
        onApplyFilters={onApplyFilters}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('مسح الفلاتر')).toBeTruthy()
    })

    // Press Clear
    await act(async () => {
      fireEvent.press(screen.getByText('مسح الفلاتر'))
    })

    // Press Apply
    await act(async () => {
      fireEvent.press(screen.getByText('تطبيق الفلتر'))
    })

    expect(onApplyFilters).toHaveBeenCalledWith({})
  })

  it('has structural parity with Cars filter sheet pattern', () => {
    const carsFilePath = path.join(__dirname, '../FilterBottomSheet.tsx')
    const equipFilePath = path.join(__dirname, '../EquipmentFilterBottomSheet.tsx')

    const carsContent = fs.readFileSync(carsFilePath, 'utf-8')
    const equipContent = fs.readFileSync(equipFilePath, 'utf-8')

    // Both use FilterBottomSheetLayout
    expect(carsContent).toContain('FilterBottomSheetLayout')
    expect(equipContent).toContain('FilterBottomSheetLayout')

    // Both have Sort section on top
    expect(carsContent).toContain('FilterSection title="ترتيب النتائج"')
    expect(equipContent).toContain('FilterSection title="ترتيب النتائج"')

    // Both have Location section with Governorate and Wilaya
    expect(carsContent).toContain('FilterSection title="الموقع"')
    expect(equipContent).toContain('FilterSection title="الموقع"')

    // Both have Price Range section
    expect(carsContent).toContain('FilterSection title="نطاق السعر (ر.ع)"')
    expect(equipContent).toContain('FilterSection title="نطاق السعر (ر.ع)"')

    // Both have Year of Manufacture section
    expect(carsContent).toContain('FilterSection title="سنة الصنع"')
    expect(equipContent).toContain('FilterSection title="سنة الصنع"')

    // Both have 'المزيد من الفلاتر' expander
    expect(carsContent).toContain('المزيد من الفلاتر')
    expect(equipContent).toContain('المزيد من الفلاتر')
  })
})
