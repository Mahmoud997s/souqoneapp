import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { WizardSelectField, WizardSelectGroup, WizardSelectOption } from '../WizardSelectField'
import * as reducedMotionModule from '../../../utils/listing-detail/useAppReducedMotion'

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}))

const FLAT_OPTIONS: WizardSelectOption[] = [
  { value: 'EQUIPMENT_SALE', label: 'معدة للبيع', testID: 'listing-type-EQUIPMENT_SALE' },
  { value: 'EQUIPMENT_RENT', label: 'معدة للإيجار', testID: 'listing-type-EQUIPMENT_RENT' },
  { value: 'EQUIPMENT_WANTED', label: 'مطلوب معدة', testID: 'listing-type-EQUIPMENT_WANTED' },
]

const GROUPED_OPTIONS: WizardSelectGroup[] = [
  {
    title: 'الحفر والتحميل',
    options: [
      { value: 'EXCAVATOR', label: 'حفار', testID: 'category-EXCAVATOR' },
      { value: 'LOADER', label: 'لودر / شيول', testID: 'category-LOADER' },
    ],
  },
  {
    title: 'الرفع',
    options: [
      { value: 'CRANE', label: 'رافعة / كرين', testID: 'category-CRANE' },
    ],
  },
]

describe('WizardSelectField', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('renders collapsed 48pt header with selected label and a11y expanded=false', async () => {
    const { getByTestId, getByText, queryByTestId } = await render(
      <WizardSelectField
        label="نوع الإعلان *"
        value="EQUIPMENT_SALE"
        options={FLAT_OPTIONS}
        onSelect={jest.fn()}
        testID="listing-type-select"
      />
    )

    const trigger = getByTestId('listing-type-select')
    expect(trigger.props.accessibilityRole).toBe('button')
    expect(trigger.props.accessibilityState).toEqual(
      expect.objectContaining({ expanded: false })
    )
    expect(getByText('معدة للبيع')).toBeTruthy()
    expect(queryByTestId('listing-type-EQUIPMENT_RENT')).toBeNull()
  })

  it('expands inline on tap, selects an option, calls onSelect, and collapses', async () => {
    const onSelect = jest.fn()
    const { getByTestId } = await render(
      <WizardSelectField
        label="نوع الإعلان *"
        value="EQUIPMENT_SALE"
        options={FLAT_OPTIONS}
        onSelect={onSelect}
        testID="listing-type-select"
      />
    )

    const trigger = getByTestId('listing-type-select')
    await fireEvent.press(trigger)

    expect(getByTestId('listing-type-select').props.accessibilityState).toEqual(
      expect.objectContaining({ expanded: true })
    )
    const rentOption = getByTestId('listing-type-EQUIPMENT_RENT')
    expect(rentOption.props.accessibilityRole).toBe('radio')
    expect(rentOption.props.accessibilityState).toEqual(
      expect.objectContaining({ selected: false })
    )
    expect(getByTestId('listing-type-EQUIPMENT_SALE').props.accessibilityState).toEqual(
      expect.objectContaining({ selected: true })
    )

    await fireEvent.press(rentOption)

    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith('EQUIPMENT_RENT')
    expect(getByTestId('listing-type-select').props.accessibilityState).toEqual(
      expect.objectContaining({ expanded: false })
    )
  })

  it('renders group headers only when groups are provided and shows selected item group on open', async () => {
    const { getByTestId, getByText } = await render(
      <WizardSelectField
        label="فئة المعدة *"
        value="CRANE"
        groups={GROUPED_OPTIONS}
        onSelect={jest.fn()}
        testID="category-select"
      />
    )

    expect(getByText('رافعة / كرين')).toBeTruthy()

    await fireEvent.press(getByTestId('category-select'))

    expect(getByText('الحفر والتحميل')).toBeTruthy()
    expect(getByText('الرفع')).toBeTruthy()
    expect(getByTestId('category-CRANE').props.accessibilityState).toEqual(
      expect.objectContaining({ selected: true })
    )
  })

  it('renders inline error message when error prop is provided', async () => {
    const { getByText } = await render(
      <WizardSelectField
        label="فئة المعدة *"
        value=""
        placeholder="اختر فئة المعدة"
        groups={GROUPED_OPTIONS}
        error="يرجى اختيار فئة المعدة"
        onSelect={jest.fn()}
        testID="category-select"
      />
    )

    expect(getByText('اختر فئة المعدة')).toBeTruthy()
    expect(getByText('يرجى اختيار فئة المعدة')).toBeTruthy()
  })

  it('supports reduced motion for instant open/close without timing animation', async () => {
    jest.spyOn(reducedMotionModule, 'useAppReducedMotion').mockReturnValue(true)
    const onSelect = jest.fn()

    const { getByTestId, queryByTestId } = await render(
      <WizardSelectField
        label="نوع الإعلان *"
        value="EQUIPMENT_SALE"
        options={FLAT_OPTIONS}
        onSelect={onSelect}
        testID="listing-type-select"
      />
    )

    await fireEvent.press(getByTestId('listing-type-select'))
    expect(getByTestId('listing-type-EQUIPMENT_WANTED')).toBeTruthy()

    await fireEvent.press(getByTestId('listing-type-EQUIPMENT_WANTED'))
    expect(onSelect).toHaveBeenCalledWith('EQUIPMENT_WANTED')
    expect(queryByTestId('listing-type-EQUIPMENT_WANTED')).toBeNull()
  })
})
