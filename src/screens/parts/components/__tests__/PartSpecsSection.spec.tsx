import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { PartSpecsSection } from '../PartSpecsSection'
import { mapPartDetailViewModel } from '../../mappers/partDetailViewModel'

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

  it('renders every saved basic field and negotiable badge', async () => {
    const vm = mapPartDetailViewModel(basePart)
    await render(<PartSpecsSection vm={vm} />)

    expect(screen.getByTestId('part-specs-basic-card')).toBeTruthy()
    expect(screen.getByText('المواصفات الفنية')).toBeTruthy()
    expect(screen.getByText('فئة القطعة')).toBeTruthy()
    expect(screen.getByText('فرامل ومكابح')).toBeTruthy()
    expect(screen.getByText('الحالة')).toBeTruthy()
    expect(screen.getByText('جديد')).toBeTruthy()
    expect(screen.getByText('أصلي وكالة')).toBeTruthy()
    expect(screen.getByText('04465-33471')).toBeTruthy()
    expect(screen.getByText('2 - 5')).toBeTruthy()
    expect(screen.getByText('سنة')).toBeTruthy()
    expect(screen.getByText('قابل للتفاوض')).toBeTruthy()
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
})
