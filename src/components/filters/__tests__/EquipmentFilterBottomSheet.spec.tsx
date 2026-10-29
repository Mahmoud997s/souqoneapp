import React from 'react'
import fs from 'fs'
import path from 'path'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react-native'
import { EquipmentFilterBottomSheet, EquipmentFilterState } from '../EquipmentFilterBottomSheet'
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

describe('EquipmentFilterBottomSheet Component', () => {
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

  it('strictly adheres to architecture standards: uses FilterBottomSheetLayout and has NO direct Modal', () => {
    const filePath = path.join(__dirname, '../EquipmentFilterBottomSheet.tsx')
    const fileContent = fs.readFileSync(filePath, 'utf-8')

    // Must use FilterBottomSheetLayout
    expect(fileContent).toContain('FilterBottomSheetLayout')
    // Must use FilterSection
    expect(fileContent).toContain('FilterSection')
    // Must use FilterChip
    expect(fileContent).toContain('FilterChip')
    // Must use RangeSlider with reset key
    expect(fileContent).toContain('RangeSlider')
    expect(fileContent).toContain('sliderResetKey')
    // Must NOT import Modal directly from react-native
    expect(fileContent).not.toMatch(/import\s*\{[^}]*\bModal\b[^}]*\}\s*from\s*['"]react-native['"]/)
  })

  it('renders without "قريباً" text and displays all primary filter sections matching backend schema', async () => {
    await render(
      <EquipmentFilterBottomSheet
        visible={true}
        onClose={jest.fn()}
        initialFilters={{}}
        onApplyFilters={jest.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.queryByText(/قريباً/)).toBeNull()
      expect(screen.getByText('تصفية المعدات')).toBeTruthy()
      expect(screen.getByText('نوع الإعلان')).toBeTruthy()
      expect(screen.getByText('فئة المعدة')).toBeTruthy()
      expect(screen.getByText('الموقع')).toBeTruthy()
      expect(screen.getByText('نطاق السعر (ر.ع)')).toBeTruthy()
      expect(screen.getByText('حالة المعدة')).toBeTruthy()
      expect(screen.getByText('سنة الصنع')).toBeTruthy()
      expect(screen.getByText('ساعات العمل')).toBeTruthy()

      // Backend conditions are present; non-existent REFURBISHED is strictly excluded
      expect(screen.getByText('جديدة تماماً (أصفار)')).toBeTruthy()
      expect(screen.getByText('بحالة ممتازة (شبه جديدة)')).toBeTruthy()
      expect(screen.getByText('مستعملة بحالة جيدة')).toBeTruthy()
      expect(screen.queryByText('مجددة')).toBeNull()
      expect(screen.queryByText('REFURBISHED')).toBeNull()
    })
  })

  it('allows selecting category, condition, year and calls onApplyFilters with correct keys', async () => {
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

    await waitFor(() => {
      expect(screen.getByText('حفار')).toBeTruthy()
    })

    // Select category 'حفار' (EXCAVATOR)
    await act(async () => {
      fireEvent.press(screen.getByText('حفار'))
    })

    // Select condition 'جديدة تماماً (أصفار)' (NEW)
    await act(async () => {
      fireEvent.press(screen.getByText('جديدة تماماً (أصفار)'))
    })

    // Select year '2022 - 2024'
    await act(async () => {
      fireEvent.press(screen.getByText('2022 - 2024'))
    })

    // Press Apply
    await act(async () => {
      fireEvent.press(screen.getByText('تطبيق الفلتر'))
    })

    expect(onApplyFilters).toHaveBeenCalledWith(
      expect.objectContaining({
        equipmentType: 'EXCAVATOR',
        categoryId: 'EXCAVATOR',
        condition: 'NEW',
        conditionId: 'NEW',
        yearMin: '2022',
        yearMax: '2024',
        yearId: 'y1',
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
      priceId: 'p4',
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
})
