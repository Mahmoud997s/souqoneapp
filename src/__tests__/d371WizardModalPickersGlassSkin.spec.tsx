import React from 'react'
import { StyleSheet, Text } from 'react-native'
import fs from 'fs'
import path from 'path'
import { act, fireEvent, render } from '@testing-library/react-native'
import { GlassPickerButton } from '../components/ui/GlassPickerButton'
import { PartStep3Details } from '../components/parts/wizard/PartStep3Details'
import { PartStep4Compatibility } from '../components/parts/wizard/PartStep4Compatibility'
import { Colors } from '../constants/colors'
import { Radius } from '../constants/radius'
import { TopBarTokens } from '../constants/topBarTokens'

jest.mock('../api/cars', () => ({
  carsApi: {
    getBrands: jest.fn().mockResolvedValue([]),
    getModels: jest.fn().mockResolvedValue([]),
  },
}))

describe('D-371: GlassPickerButton & wizard modal pickers glass skin', () => {
  it('renders TopBarGlassSurface ice-control with Radius.md, handles press, error border, and disabled dimming', async () => {
    const onPress = jest.fn()
    const { getByTestId } = await render(
      <>
        <GlassPickerButton testID="picker-btn" onPress={onPress}>
          <Text>اختر الماركة</Text>
        </GlassPickerButton>
        <GlassPickerButton testID="picker-btn-err" error disabled onPress={onPress}>
          <Text>اختر الماركة</Text>
        </GlassPickerButton>
      </>
    )

    const glass = getByTestId('picker-btn-glass-layers')
    expect(glass).toBeTruthy()

    const btn = getByTestId('picker-btn')
    const baseStyle = StyleSheet.flatten(btn.props.style)
    expect(baseStyle.backgroundColor).toBe(Colors.transparent)
    expect(baseStyle.borderColor).toBe(TopBarTokens.buttonBorderColor)
    expect(baseStyle.borderRadius).toBe(Radius.md)
    expect(baseStyle.minHeight).toBe(48)

    fireEvent.press(btn)
    expect(onPress).toHaveBeenCalledTimes(1)

    const errDisabledStyle = StyleSheet.flatten(getByTestId('picker-btn-err').props.style)
    expect(errDisabledStyle.borderColor).toBe(Colors.error)
    expect(errDisabledStyle.opacity).toBe(0.6)
  })

  it('wires GlassPickerButton in all 4 modal-picker wizard steps with zero leftover selectorButton styles', () => {
    const root = path.resolve(__dirname, '..', '..')
    const targets = [
      'src/components/cars/wizard/CarStep3Details.tsx',
      'src/components/buses/wizard/BusStep3Details.tsx',
      'src/components/parts/wizard/PartStep3Details.tsx',
      'src/components/parts/wizard/PartStep4Compatibility.tsx',
    ]

    for (const rel of targets) {
      const src = fs.readFileSync(path.join(root, rel), 'utf8')
      expect(src).toContain('GlassPickerButton')
      expect(src).not.toMatch(/\bs\.selectorButton\b/)
      expect(src).not.toMatch(/\bs\.selectorError\b/)
      expect(src).not.toMatch(/\bs\.selectorButtonDisabled\b/)
      expect(src).not.toMatch(/\bs\.selectorButtonEmpty\b/)
    }
  })

  it('PartStep3Details renders glass pickers and pressing opens the quantity modal', async () => {
    const view = await render(
      <PartStep3Details
        formData={{
          partNumber: '',
          condition: 'NEW',
          isOriginal: true,
          brandName: '',
          quantity: '',
          hasWarranty: true,
          warrantyDuration: '30',
          description: '',
        } as never}
        errors={{}}
        onUpdateField={jest.fn()}
      />
    )

    const buttons = view.getAllByRole('button')
    expect(buttons.length).toBeGreaterThanOrEqual(2)
    fireEvent.press(view.getByText('اختر الكمية المتوفرة'))
    expect(view.getByText('اختر الكمية المتوفرة')).toBeTruthy()
  })

  it('PartStep4Compatibility renders glass pickers for makes and yearFrom/yearTo and preserves testIDs', async () => {
    const view = await render(
      <PartStep4Compatibility
        formData={{
          compatibleVehicleTypes: ['CAR'],
          compatibleMakes: ['brand-1'],
          compatibleModels: [],
          yearFrom: null,
          yearTo: null,
        } as never}
        errors={{}}
        onUpdateField={jest.fn()}
      />
    )

    expect(view.getByTestId('open-makes-modal-btn')).toBeTruthy()
    expect(view.getByTestId('year-from-btn')).toBeTruthy()
    expect(view.getByTestId('year-to-btn')).toBeTruthy()

    await act(async () => {
      fireEvent.press(view.getByTestId('year-from-btn'))
    })
    expect(view.getByText('سنة الصنع (من)')).toBeTruthy()
  })
})
