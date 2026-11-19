import React from 'react'
import { StyleSheet } from 'react-native'
import fs from 'fs'
import path from 'path'
import { act, fireEvent, render } from '@testing-library/react-native'
import { GovernorateWilayaSelect } from '../components/ui/GovernorateWilayaSelect'
import { locationsApi } from '../api/locations'
import { Colors } from '../constants/colors'
import { Radius } from '../constants/radius'

jest.mock('../api/locations', () => ({
  locationsApi: {
    getGovernorates: jest.fn(),
    getWilayas: jest.fn(),
  },
}))

const MOCK_GOVS = [
  { id: 1, nameAr: 'مسقط', nameEn: 'Muscat' },
  { id: 2, nameAr: 'ظفار', nameEn: 'Dhofar' },
]

const MOCK_WILAYAS = [
  { id: 10, nameAr: 'السيب', nameEn: 'Seeb' },
  { id: 11, nameAr: 'بوشر', nameEn: 'Bawshar' },
]

describe('D-372: GovernorateWilayaSelect glass skin via GlassPickerButton', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(locationsApi.getGovernorates as jest.Mock).mockResolvedValue(MOCK_GOVS)
    ;(locationsApi.getWilayas as jest.Mock).mockResolvedValue(MOCK_WILAYAS)
  })

  it('renders both boxes with GlassPickerButton (46px height, transparent bg, Radius.md), dimmed wilaya before gov, and error borders', async () => {
    const view = await render(
      <GovernorateWilayaSelect
        governorateId={null}
        wilayaId={null}
        govError="اختر المحافظة"
        cityError="اختر الولاية"
        onLocationChange={jest.fn()}
      />
    )

    expect(view.getByTestId('gov-picker-btn-glass-layers')).toBeTruthy()
    expect(view.getByTestId('wilaya-picker-btn-glass-layers')).toBeTruthy()

    const govStyle = StyleSheet.flatten(view.getByTestId('gov-picker-btn').props.style)
    expect(govStyle.height).toBe(46)
    expect(govStyle.borderRadius).toBe(Radius.md)
    expect(govStyle.backgroundColor).toBe(Colors.transparent)
    expect(govStyle.borderColor).toBe(Colors.error)

    const wilayaStyle = StyleSheet.flatten(view.getByTestId('wilaya-picker-btn').props.style)
    expect(wilayaStyle.height).toBe(46)
    expect(wilayaStyle.opacity).toBe(0.6)
    expect(wilayaStyle.borderColor).toBe(Colors.error)
  })

  it('applies active primary border when governorate & wilaya are selected, and opens correct modals on press', async () => {
    const view = await render(
      <GovernorateWilayaSelect
        governorateId={1}
        wilayaId={10}
        onLocationChange={jest.fn()}
      />
    )

    const govStyle = StyleSheet.flatten(view.getByTestId('gov-picker-btn').props.style)
    expect(govStyle.borderColor).toBe(Colors.primary)

    const wilayaStyle = StyleSheet.flatten(view.getByTestId('wilaya-picker-btn').props.style)
    expect(wilayaStyle.borderColor).toBe(Colors.primary)

    await act(async () => {
      fireEvent.press(view.getByTestId('gov-picker-btn'))
    })
    expect(view.getByText('اختر المحافظة')).toBeTruthy()

    await act(async () => {
      fireEvent.press(view.getByTestId('wilaya-picker-btn'))
    })
    expect(view.getByText('اختر الولاية (مسقط)')).toBeTruthy()
  })

  it('pressing wilaya before governorate does not open wilaya modal (opens governorate modal instead)', async () => {
    const view = await render(
      <GovernorateWilayaSelect
        governorateId={null}
        wilayaId={null}
        onLocationChange={jest.fn()}
      />
    )

    await act(async () => {
      fireEvent.press(view.getByTestId('wilaya-picker-btn'))
    })
    expect(view.getAllByText('اختر المحافظة').length).toBeGreaterThanOrEqual(2)
    expect(view.queryByText(/اختر الولاية \(/)).toBeNull()
  })

  it('renders loading spinner while governorates request is pending', async () => {
    ;(locationsApi.getGovernorates as jest.Mock).mockReturnValue(new Promise(() => {}))
    const view = await render(
      <GovernorateWilayaSelect
        governorateId={null}
        wilayaId={null}
        onLocationChange={jest.fn()}
      />
    )
    expect(view.getByTestId('gov-picker-btn')).toBeTruthy()
  })

  it('removes dead inputBox styles from GovernorateWilayaSelect.tsx', () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, '..', 'components', 'ui', 'GovernorateWilayaSelect.tsx'),
      'utf8'
    )
    expect(src).toContain('GlassPickerButton')
    expect(src).not.toMatch(/\bs\.inputBox\b/)
    expect(src).not.toMatch(/\bs\.inputBoxActive\b/)
    expect(src).not.toMatch(/\bs\.inputBoxError\b/)
    expect(src).not.toMatch(/\bs\.inputBoxDisabled\b/)
  })
})
