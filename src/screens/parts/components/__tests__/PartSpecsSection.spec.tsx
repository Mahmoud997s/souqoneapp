import React from 'react'
import { StyleSheet } from 'react-native'
import { render, screen, fireEvent } from '@testing-library/react-native'
import {
  PartSpecsSection,
  hasMatchingPartSpecs,
  SPEC_ROW_MIN_HEIGHT,
} from '../PartSpecsSection'
import { mapPartDetailViewModel } from '../../mappers/partDetailViewModel'
import { Colors } from '../../../../constants/colors'
import { lineHeightFor } from '../../../../constants/typography'

jest.mock('@expo/vector-icons', () => {
  const { View } = require('react-native')
  return { Ionicons: (props: any) => <View {...props} /> }
})

describe('PartSpecsSection', () => {
  const basePart = {
    id: 'p-1',
    title: 'سفايف بريك',
    partCategory: 'BRAKES',
    condition: 'NEW',
    isOriginal: true,
    partNumber: '04465-33471',
    quantity: 'TWO_TO_FIVE',
    hasWarranty: true,
    warrantyDuration: 'ONE_YEAR',
    isPriceNegotiable: true,
    price: 35,
    compatibleMakes: ['toyota', 'lexus', 'honda', 'nissan', 'mazda'],
    compatibleModels: ['Camry', 'Avalon', 'ES350', 'Accord', 'Altima', 'Mazda6', 'CX5'],
    yearFrom: 2018,
    yearTo: 2023,
    compatibleVehicleTypes: ['CAR'],
  }

  it('renders technical specifications without duplicated condition or negotiable fields (R2)', async () => {
    const vm = mapPartDetailViewModel(basePart)
    await render(<PartSpecsSection vm={vm} />)

    expect(screen.getByTestId('part-specs-basic-card')).toBeTruthy()
    expect(screen.getByText('المواصفات الفنية')).toBeTruthy()
    expect(screen.getByText('فئة القطعة')).toBeTruthy()
    expect(screen.getByText('فرامل ومكابح')).toBeTruthy()
    expect(screen.getByText('النوع')).toBeTruthy()
    expect(screen.getByText('أصلي وكالة')).toBeTruthy()
    expect(screen.getByText('04465-33471')).toBeTruthy()
    expect(screen.getByText('2 - 5')).toBeTruthy()
    expect(screen.getByText('سنة')).toBeTruthy()

    // Condition and negotiable are canonical in header block; must NOT be duplicated here
    expect(screen.queryByTestId('spec-row-condition')).toBeNull()
    expect(screen.queryByTestId('spec-row-negotiable')).toBeNull()
  })

  it('hides empty optional fields in basic card', async () => {
    const sparsePart = {
      id: 'p-sparse',
      title: 'قطعة بسيطة',
      partCategory: 'OTHER',
      condition: 'USED',
      isOriginal: false,
      isPriceNegotiable: false,
      price: 10,
    }
    const vm = mapPartDetailViewModel(sparsePart)
    await render(<PartSpecsSection vm={vm} />)

    expect(screen.queryByTestId('spec-row-part-number')).toBeNull()
    expect(screen.queryByTestId('spec-row-quantity')).toBeNull()
    expect(screen.queryByTestId('spec-row-negotiable')).toBeNull()
    expect(screen.queryByTestId('part-specs-compat-card')).toBeNull()
  })

  it('renders year range formats: both from and to', async () => {
    const vm = mapPartDetailViewModel({
      ...basePart,
      yearFrom: 2017,
      yearTo: 2022,
    })
    await render(<PartSpecsSection vm={vm} />)
    expect(screen.getByText('من 2017 إلى 2022')).toBeTruthy()
  })

  it('renders year range formats: from only', async () => {
    const vm = mapPartDetailViewModel({
      ...basePart,
      yearFrom: 2019,
      yearTo: undefined,
    })
    await render(<PartSpecsSection vm={vm} />)
    expect(screen.getByText('من سنة 2019')).toBeTruthy()
  })

  it('renders year range formats: to only', async () => {
    const vm = mapPartDetailViewModel({
      ...basePart,
      yearFrom: undefined,
      yearTo: 2025,
    })
    await render(<PartSpecsSection vm={vm} />)
    expect(screen.getByText('حتى سنة 2025')).toBeTruthy()
  })

  it('handles expandable makes list without overflow', async () => {
    const vm = mapPartDetailViewModel(basePart)
    await render(<PartSpecsSection vm={vm} />)

    // Base mock has 5 makes, limit is 4
    expect(screen.getByText('عرض الكل (5)')).toBeTruthy()

    // Expand
    await fireEvent.press(screen.getByTestId('toggle-makes-btn'))
    expect(screen.getByText('عرض أقل')).toBeTruthy()

    // Collapse
    await fireEvent.press(screen.getByTestId('toggle-makes-btn'))
    expect(screen.getByText('عرض الكل (5)')).toBeTruthy()
  })

  it('handles expandable models list without overflow', async () => {
    const vm = mapPartDetailViewModel(basePart)
    await render(<PartSpecsSection vm={vm} />)

    // Base mock has 7 models, limit is 6
    expect(screen.getByText('عرض الكل (7)')).toBeTruthy()

    // Expand
    await fireEvent.press(screen.getByTestId('toggle-models-btn'))
    expect(screen.getByText('عرض أقل')).toBeTruthy()

    // Collapse
    await fireEvent.press(screen.getByTestId('toggle-models-btn'))
    expect(screen.getByText('عرض الكل (7)')).toBeTruthy()
  })

  describe('Spec Tables Cleanup (D-170d)', () => {
    it('asserts NO badge/chip/pill elements exist inside spec rows and old chip wrappers are gone (Req a)', async () => {
      const vm = mapPartDetailViewModel(basePart)
      await render(<PartSpecsSection vm={vm} />)

      // Old chips wrappers removed
      expect(screen.queryByTestId('compat-makes-wrap')).toBeNull()
      expect(screen.queryByTestId('compat-models-wrap')).toBeNull()

      // Originality row has plain text value, directly in row without capsule wrapper
      const originalityVal = screen.getByTestId('spec-value-originality')
      expect(originalityVal.props.children).toBe('أصلي وكالة')
      expect(originalityVal.parent?.props.testID).toBe('spec-row-originality')

      // Part number has plain text value, matching standard typography
      const partNumberVal = screen.getByTestId('spec-value-part-number')
      expect(partNumberVal.props.children).toBe('04465-33471')
    })

    it('asserts row consistency: identical label and value styles and minHeight across all rows (Req c)', async () => {
      const vm = mapPartDetailViewModel(basePart)
      await render(<PartSpecsSection vm={vm} />)

      const rowKeys = [
        'category',
        'originality',
        'part-number',
        'quantity',
        'warranty',
        'year-range',
        'vehicle-types',
        'makes',
        'models',
      ]

      for (const key of rowKeys) {
        const row = screen.getByTestId(`spec-row-${key}`)
        const flatRowStyle = StyleSheet.flatten(row.props.style)
        expect(flatRowStyle.minHeight).toBe(SPEC_ROW_MIN_HEIGHT)

        const label = screen.getByTestId(`spec-label-${key}`)
        const flatLabelStyle = StyleSheet.flatten(label.props.style)
        expect(flatLabelStyle.fontFamily).toBe('Almarai_400Regular')
        expect(flatLabelStyle.fontSize).toBe(13)
        expect(flatLabelStyle.lineHeight).toBe(lineHeightFor(13))
        expect(flatLabelStyle.color).toBe(Colors.textMuted)

        const val = screen.getByTestId(`spec-value-${key}`)
        const flatValStyle = StyleSheet.flatten(val.props.style)
        expect(flatValStyle.fontFamily).toBe('Almarai_700Bold')
        expect(flatValStyle.fontSize).toBe(13)
        expect(flatValStyle.lineHeight).toBe(lineHeightFor(13))
        expect(flatValStyle.color).toBe(Colors.text)
      }
    })

    it('asserts lists render as plain comma-joined text in the same row layout (Req d)', async () => {
      const vm = mapPartDetailViewModel(basePart)
      await render(<PartSpecsSection vm={vm} />)

      // Old chips block must be gone
      expect(screen.queryByTestId('compat-makes-wrap')).toBeNull()
      expect(screen.queryByTestId('compat-models-wrap')).toBeNull()

      const makesVal = screen.getByTestId('spec-value-makes')
      expect(makesVal.props.children).toBe('تويوتا، لكزس، هوندا، نيسان')

      const modelsVal = screen.getByTestId('spec-value-models')
      expect(modelsVal.props.children).toBe('Camry، Avalon، ES350، Accord، Altima، Mazda6')

      // Toggle works
      await fireEvent.press(screen.getByTestId('toggle-makes-btn'))
      expect(screen.getByTestId('spec-value-makes').props.children).toBe(
        'تويوتا، لكزس، هوندا، نيسان، مازدا'
      )
    })
  })

  describe('hasMatchingPartSpecs & Search Filtering (Req e)', () => {
    it('returns true when query is empty or whitespace', () => {
      const vm = mapPartDetailViewModel(basePart)
      expect(hasMatchingPartSpecs(vm, '')).toBe(true)
      expect(hasMatchingPartSpecs(vm, '   ')).toBe(true)
      expect(hasMatchingPartSpecs(vm, undefined)).toBe(true)
    })

    it('matches part number, category, make, and model', () => {
      const vm = mapPartDetailViewModel(basePart)
      expect(hasMatchingPartSpecs(vm, '04465')).toBe(true)
      expect(hasMatchingPartSpecs(vm, 'فرامل')).toBe(true)
      expect(hasMatchingPartSpecs(vm, 'toyota')).toBe(true)
      expect(hasMatchingPartSpecs(vm, 'camry')).toBe(true)
      expect(hasMatchingPartSpecs(vm, 'غير موجود')).toBe(false)
    })

    it('filters rendered rows based on searchQuery', async () => {
      const vm = mapPartDetailViewModel(basePart)
      await render(<PartSpecsSection vm={vm} searchQuery="04465-33471" />)

      expect(screen.getByTestId('spec-row-part-number')).toBeTruthy()
      expect(screen.queryByTestId('spec-row-category')).toBeNull()
      expect(screen.queryByTestId('spec-row-originality')).toBeNull()
      expect(screen.queryByTestId('part-specs-compat-card')).toBeNull()
    })
  })
})
