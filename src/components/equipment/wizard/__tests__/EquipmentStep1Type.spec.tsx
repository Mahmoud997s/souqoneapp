import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { EquipmentStep1Type } from '../EquipmentStep1Type'
import { EquipmentFormData } from '../../../../types/equipmentForm.types'

jest.mock('expo-blur', () => ({
  BlurView: ({ children }: any) => <>{children}</>,
}))

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}))

const BASE_FORM = {
  listingType: 'EQUIPMENT_SALE',
  equipmentType: 'CRANE',
  title: '',
  description: '',
} as unknown as EquipmentFormData

describe('EquipmentStep1Type (D-352 inline select field adoption)', () => {
  it('renders listingType and equipmentType as collapsed inline select fields showing current values', async () => {
    const { getByTestId, getByText } = await render(
      <EquipmentStep1Type
        formData={BASE_FORM}
        errors={{}}
        onUpdateField={jest.fn()}
      />
    )

    const listingSelect = getByTestId('equipment-listing-type-select')
    const categorySelect = getByTestId('equipment-category-select')

    expect(listingSelect.props.accessibilityState).toEqual(
      expect.objectContaining({ expanded: false })
    )
    expect(categorySelect.props.accessibilityState).toEqual(
      expect.objectContaining({ expanded: false })
    )

    expect(getByText('معدة للبيع')).toBeTruthy()
    expect(getByText('رافعة / كرين')).toBeTruthy()
  })

  it('expands listingType inline and updates listingType without modal', async () => {
    const onUpdateField = jest.fn()
    const { getByTestId } = await render(
      <EquipmentStep1Type
        formData={BASE_FORM}
        errors={{}}
        onUpdateField={onUpdateField}
      />
    )

    await fireEvent.press(getByTestId('equipment-listing-type-select'))
    await fireEvent.press(getByTestId('listing-type-EQUIPMENT_RENT'))

    expect(onUpdateField).toHaveBeenCalledWith('listingType', 'EQUIPMENT_RENT')
  })

  it('expands equipmentType with the 5 Arabic group headers and updates equipmentType', async () => {
    const onUpdateField = jest.fn()
    const { getByTestId, getByText } = await render(
      <EquipmentStep1Type
        formData={BASE_FORM}
        errors={{}}
        onUpdateField={onUpdateField}
      />
    )

    await fireEvent.press(getByTestId('equipment-category-select'))

    expect(getByText('الحفر والتحميل')).toBeTruthy()
    expect(getByText('الرفع')).toBeTruthy()
    expect(getByText('الشاحنات والنقل')).toBeTruthy()
    expect(getByText('الخرسانة والطاقة والورش')).toBeTruthy()
    expect(getByText('الموقع وأخرى')).toBeTruthy()

    await fireEvent.press(getByTestId('category-EXCAVATOR'))
    expect(onUpdateField).toHaveBeenCalledWith('equipmentType', 'EXCAVATOR')
  })
})
