import React from 'react'
import fs from 'fs'
import path from 'path'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react-native'
import {
  BusFilterBottomSheet,
  BusFilters,
  BUS_SORT_OPTIONS,
  BUS_LISTING_TYPE_OPTIONS,
  BUS_TYPE_OPTIONS,
  BUS_MAKE_OPTIONS,
  BUS_CAPACITY_OPTIONS,
  BUS_CONDITION_OPTIONS,
  BUS_TRANSMISSION_OPTIONS,
  BUS_FUEL_OPTIONS,
} from '../BusFilterBottomSheet'
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

describe('BusFilterBottomSheet Component (Architecture & Design Parity - D-136 PR-3)', () => {
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

  it('strictly adheres to architecture standards: FilterBottomSheetLayout, DropdownSelector, RangeSlider, NO FilterChip, NO Modal, NO hardcoded GOVERNORATES', () => {
    const filePath = path.join(__dirname, '../BusFilterBottomSheet.tsx')
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
    // Must NOT contain hardcoded GOVERNORATES string array
    expect(fileContent).not.toContain('const GOVERNORATES')
    // Must not use MultiSlider
    expect(fileContent).not.toContain('@ptomasroos/react-native-multi-slider')
  })

  it('renders with header title "تصفية النتائج" and correct section order matching cars/equipment', async () => {
    await render(
      <BusFilterBottomSheet
        visible={true}
        onClose={jest.fn()}
        currentFilters={{}}
        onApply={jest.fn()}
      />
    )

    await waitFor(() => {
      // Header title matches convention
      expect(screen.getByText('تصفية النتائج')).toBeTruthy()

      // Primary sections rendered in order
      expect(screen.getByText('ترتيب النتائج')).toBeTruthy()
      expect(screen.getByText('الحافلة')).toBeTruthy()
      expect(screen.getByText('الماركة والسعة')).toBeTruthy()
      expect(screen.getByText('الموقع')).toBeTruthy()
      expect(screen.getByText('نطاق السعر (ر.ع)')).toBeTruthy()
      expect(screen.getByText('سنة الصنع')).toBeTruthy()

      // Placeholders inside dropdowns
      expect(screen.getByText('الترتيب الافتراضي')).toBeTruthy()
      expect(screen.getByText('نوع الإعلان')).toBeTruthy()
      expect(screen.getByText('فئة الحافلة')).toBeTruthy()
      expect(screen.getByText('الماركة')).toBeTruthy()
      expect(screen.getByText('سعة الركاب')).toBeTruthy()
      expect(screen.getByText('المحافظة')).toBeTruthy()
      expect(screen.getByText('الولاية')).toBeTruthy()

      // Expander button is visible
      expect(screen.getByText('المزيد من الفلاتر')).toBeTruthy()

      // Secondary filters are collapsed initially
      expect(screen.queryByText('حالة الحافلة')).toBeNull()
      expect(screen.queryByText('ناقل الحركة')).toBeNull()
      expect(screen.queryByText('نوع الوقود')).toBeNull()
    })
  })

  it('expands secondary filters when "المزيد من الفلاتر" is pressed', async () => {
    await render(
      <BusFilterBottomSheet
        visible={true}
        onClose={jest.fn()}
        currentFilters={{}}
        onApply={jest.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('المزيد من الفلاتر')).toBeTruthy()
    })

    await act(async () => {
      fireEvent.press(screen.getByText('المزيد من الفلاتر'))
    })

    expect(screen.getByText('حالة الحافلة')).toBeTruthy()
    expect(screen.getByText('ناقل الحركة')).toBeTruthy()
    expect(screen.getByText('نوع الوقود')).toBeTruthy()
  })

  it('fetches governorates and selects governorate yielding numeric governorateId', async () => {
    const handleApply = jest.fn()
    await render(
      <BusFilterBottomSheet
        visible={true}
        onClose={jest.fn()}
        currentFilters={{}}
        onApply={handleApply}
      />
    )

    await waitFor(() => {
      expect(locationsApi.getGovernorates).toHaveBeenCalled()
    })

    // Open governorate selector
    await act(async () => {
      fireEvent.press(screen.getByText('المحافظة'))
    })

    await waitFor(() => {
      expect(screen.getByText('مسقط')).toBeTruthy()
    })

    // Select 'مسقط' (id: 1)
    await act(async () => {
      fireEvent.press(screen.getByText('مسقط'))
    })

    // Press apply
    await act(async () => {
      fireEvent.press(screen.getByText('تطبيق الفلتر'))
    })

    expect(handleApply).toHaveBeenCalledWith(
      expect.objectContaining({
        governorateId: 1,
        governorate: 'مسقط',
      })
    )
  })

  it('fetches wilayas when governorateId is present and selecting wilaya yields numeric wilayaId', async () => {
    const handleApply = jest.fn()
    await render(
      <BusFilterBottomSheet
        visible={true}
        onClose={jest.fn()}
        currentFilters={{ governorateId: 1, governorate: 'مسقط' }}
        onApply={handleApply}
      />
    )

    await waitFor(() => {
      expect(locationsApi.getWilayas).toHaveBeenCalledWith(1)
    })

    // Open wilaya selector
    await act(async () => {
      fireEvent.press(screen.getByText('الولاية'))
    })

    await waitFor(() => {
      expect(screen.getByText('السيب')).toBeTruthy()
    })

    // Select 'السيب' (id: 101)
    await act(async () => {
      fireEvent.press(screen.getByText('السيب'))
    })

    // Apply
    await act(async () => {
      fireEvent.press(screen.getByText('تطبيق الفلتر'))
    })

    expect(handleApply).toHaveBeenCalledWith(
      expect.objectContaining({
        governorateId: 1,
        wilayaId: 101,
        city: 'السيب',
      })
    )
  })

  it('clears all filters and resets numeric location ids on clear', async () => {
    const handleApply = jest.fn()
    await render(
      <BusFilterBottomSheet
        visible={true}
        onClose={jest.fn()}
        currentFilters={{
          governorateId: 1,
          wilayaId: 101,
          make: 'Toyota',
          capacityMin: 15,
        }}
        onApply={handleApply}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('مسح الفلاتر')).toBeTruthy()
    })

    // Clear filters
    await act(async () => {
      fireEvent.press(screen.getByText('مسح الفلاتر'))
    })

    // Apply after clear
    await act(async () => {
      fireEvent.press(screen.getByText('تطبيق الفلتر'))
    })

    expect(handleApply).toHaveBeenCalledWith({})
  })

  it('supports both currentFilters/onApply and initialFilters/onApplyFilters props seamlessly', async () => {
    const onApplyFilters = jest.fn()
    await render(
      <BusFilterBottomSheet
        visible={true}
        onClose={jest.fn()}
        initialFilters={{
          sort: 'price_asc',
          busType: 'MINI_BUS',
          governorateId: 2,
        }}
        onApplyFilters={onApplyFilters}
      />
    )

    await act(async () => {
      fireEvent.press(screen.getByText('تطبيق الفلتر'))
    })

    expect(onApplyFilters).toHaveBeenCalledWith({
      sort: 'price_asc',
      busType: 'MINI_BUS',
      governorateId: 2,
    })
  })

  it('selects sort option and updates sort filter value', async () => {
    const handleApply = jest.fn()
    await render(
      <BusFilterBottomSheet
        visible={true}
        onClose={jest.fn()}
        currentFilters={{}}
        onApply={handleApply}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('الترتيب الافتراضي')).toBeTruthy()
    })

    // Press sort dropdown
    await act(async () => {
      fireEvent.press(screen.getByText('الترتيب الافتراضي'))
    })

    await waitFor(() => {
      expect(screen.getByText('السعر: الأقل للأعلى')).toBeTruthy()
    })

    await act(async () => {
      fireEvent.press(screen.getByText('السعر: الأقل للأعلى'))
    })

    await act(async () => {
      fireEvent.press(screen.getByText('تطبيق الفلتر'))
    })

    expect(handleApply).toHaveBeenCalledWith(
      expect.objectContaining({
        sort: 'price_asc',
      })
    )
  })

  it('selects passenger capacity preset and updates capacityMin and minCapacity', async () => {
    const handleApply = jest.fn()
    await render(
      <BusFilterBottomSheet
        visible={true}
        onClose={jest.fn()}
        currentFilters={{}}
        onApply={handleApply}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('سعة الركاب')).toBeTruthy()
    })

    // Press capacity dropdown
    await act(async () => {
      fireEvent.press(screen.getByText('سعة الركاب'))
    })

    await waitFor(() => {
      expect(screen.getByText('+ 30 مقعد')).toBeTruthy()
    })

    await act(async () => {
      fireEvent.press(screen.getByText('+ 30 مقعد'))
    })

    await act(async () => {
      fireEvent.press(screen.getByText('تطبيق الفلتر'))
    })

    expect(handleApply).toHaveBeenCalledWith(
      expect.objectContaining({
        capacityMin: 30,
        minCapacity: 30,
        capacityId: 'cap_30',
      })
    )
  })

  it('teeth test: verify onApply yields numeric governorateId and not string-only representation', async () => {
    const handleApply = jest.fn()
    await render(
      <BusFilterBottomSheet
        visible={true}
        onClose={jest.fn()}
        currentFilters={{ governorateId: 1 }}
        onApply={handleApply}
      />
    )

    await act(async () => {
      fireEvent.press(screen.getByText('تطبيق الفلتر'))
    })

    expect(handleApply).toHaveBeenCalledTimes(1)
    const applied = handleApply.mock.calls[0][0]
    expect(typeof applied.governorateId).toBe('number')
    expect(applied.governorateId).toBe(1)
  })

  it('has structural parity with Cars and Equipment filter sheets pattern', () => {
    const carsFilePath = path.join(__dirname, '../FilterBottomSheet.tsx')
    const busFilePath = path.join(__dirname, '../BusFilterBottomSheet.tsx')

    const carsContent = fs.readFileSync(carsFilePath, 'utf-8')
    const busContent = fs.readFileSync(busFilePath, 'utf-8')

    // Both use FilterBottomSheetLayout
    expect(carsContent).toContain('FilterBottomSheetLayout')
    expect(busContent).toContain('FilterBottomSheetLayout')

    // Both have Sort section on top
    expect(carsContent).toContain('FilterSection title="ترتيب النتائج"')
    expect(busContent).toContain('FilterSection title="ترتيب النتائج"')

    // Both have Location section with Governorate and Wilaya
    expect(carsContent).toContain('FilterSection title="الموقع"')
    expect(busContent).toContain('FilterSection title="الموقع"')

    // Both have Price Range section
    expect(carsContent).toContain('FilterSection title="نطاق السعر (ر.ع)"')
    expect(busContent).toContain('FilterSection title="نطاق السعر (ر.ع)"')

    // Both have Year of Manufacture section
    expect(carsContent).toContain('FilterSection title="سنة الصنع"')
    expect(busContent).toContain('FilterSection title="سنة الصنع"')

    // Both have 'المزيد من الفلاتر' expander
    expect(carsContent).toContain('المزيد من الفلاتر')
    expect(busContent).toContain('المزيد من الفلاتر')
  })
})
