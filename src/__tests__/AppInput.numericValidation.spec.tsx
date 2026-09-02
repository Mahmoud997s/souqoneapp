import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { AppInput, normalizeDigits } from '../components/ui/AppInput'
import { PartStep5Pricing } from '../components/parts/wizard/PartStep5Pricing'
import { PartFormData, defaultPartFormData } from '../store/partWizardStore'

jest.mock('../components/ui/MapLocationPicker', () => ({
  MapLocationPicker: () => <></>,
}))
jest.mock('../components/ui/GovernorateWilayaSelect', () => ({
  GovernorateWilayaSelect: () => <></>,
}))

describe('Phase 13: Numeric Validation & Digit Normalization', () => {
  describe('normalizeDigits utility', () => {
    it('converts Eastern Arabic-Indic numerals to standard Western digits', () => {
      expect(normalizeDigits('٠١٢٣٤٥٦٧٨٩')).toBe('0123456789')
      expect(normalizeDigits('٥٠٠')).toBe('500')
      expect(normalizeDigits('٩١٢٣٤٥٦٧')).toBe('91234567')
    })

    it('leaves standard Western digits untouched', () => {
      expect(normalizeDigits('1234567890')).toBe('1234567890')
      expect(normalizeDigits('500.5')).toBe('500.5')
    })

    it('handles mixed strings converting only Arabic numerals', () => {
      expect(normalizeDigits('سعر ٥٠٠ ر.ع')).toBe('سعر 500 ر.ع')
      expect(normalizeDigits('+٩٦٨-٩١٢٣٤٥٦٧')).toBe('+968-91234567')
    })

    it('handles empty and falsy input safely', () => {
      expect(normalizeDigits('')).toBe('')
    })
  })

  describe('AppInput component digit handling', () => {
    it('normalizes digits automatically when keyboardType is numeric', async () => {
      const onChangeTextMock = jest.fn()
      await render(
        <AppInput
          placeholder="السعر"
          keyboardType="numeric"
          onChangeText={onChangeTextMock}
        />
      )

      fireEvent.changeText(screen.getByPlaceholderText('السعر'), '٥٠٠')
      expect(onChangeTextMock).toHaveBeenCalledWith('500')
    })

    it('normalizes digits automatically when keyboardType is phone-pad', async () => {
      const onChangeTextMock = jest.fn()
      await render(
        <AppInput
          placeholder="الهاتف"
          keyboardType="phone-pad"
          onChangeText={onChangeTextMock}
        />
      )

      fireEvent.changeText(screen.getByPlaceholderText('الهاتف'), '٩١٢٣٤٥٦٧')
      expect(onChangeTextMock).toHaveBeenCalledWith('91234567')
    })

    it('preserves raw text completely untouched when keyboardType is default or unspecified', async () => {
      const onChangeTextMock = jest.fn()
      await render(
        <AppInput
          placeholder="العنوان"
          keyboardType="default"
          onChangeText={onChangeTextMock}
        />
      )

      fireEvent.changeText(screen.getByPlaceholderText('العنوان'), 'كامري ٢٠٢٠ أصلية')
      expect(onChangeTextMock).toHaveBeenCalledWith('كامري ٢٠٢٠ أصلية')
    })
  })

  describe('PartStep5Pricing integration with normalized digits', () => {
    it('updates price as a valid number when user types Arabic numerals', async () => {
      const onUpdateFieldMock = jest.fn()
      const mockFormData: PartFormData = {
        ...defaultPartFormData,
        price: null,
      }

      await render(
        <PartStep5Pricing
          formData={mockFormData}
          errors={{}}
          onUpdateField={onUpdateFieldMock}
          onLocationChange={jest.fn()}
        />
      )

      const priceInput = screen.getByTestId('price-input')
      fireEvent.changeText(priceInput, '٧٥')

      expect(onUpdateFieldMock).toHaveBeenCalledWith('price', 75)
    })
  })
})

