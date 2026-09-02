import React from 'react'
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react-native'
import { ServiceStep5Pricing } from './ServiceStep5Pricing'
import { defaultServiceFormData } from '../../../store/serviceWizardStore'

jest.mock('expo-blur', () => ({
  BlurView: ({ children }: any) => <>{children}</>,
}))

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}))

jest.mock('../../ui/GovernorateWilayaSelect', () => {
  const React = require('react')
  const { TouchableOpacity, Text } = require('react-native')
  return {
    GovernorateWilayaSelect: ({ onLocationChange }: any) => (
      <TouchableOpacity
        testID="mock-gov-wilaya-select"
        onPress={() => onLocationChange(1, 101, 'مسقط', 'السيب')}
      >
        <Text>Mock Location Selector</Text>
      </TouchableOpacity>
    ),
  }
})

jest.mock('../../ui/MapLocationPicker', () => {
  const React = require('react')
  const { View } = require('react-native')
  return {
    MapLocationPicker: () => <View testID="mock-map-picker" />,
  }
})

describe('ServiceStep5Pricing', () => {
  const mockOnUpdateField = jest.fn()
  const mockOnLocationChange = jest.fn()

  const defaultProps = {
    formData: defaultServiceFormData,
    errors: {},
    onUpdateField: mockOnUpdateField,
    onLocationChange: mockOnLocationChange,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('updates priceFrom as number when typing in input', async () => {
    await render(<ServiceStep5Pricing {...defaultProps} />)

    const input = screen.getByTestId('price-from-input')
    await act(async () => {
      fireEvent.changeText(input, '25')
    })

    expect(mockOnUpdateField).toHaveBeenCalledWith('priceFrom', 25)
  })

  it('sets priceFrom to null when clearing input', async () => {
    const props = {
      ...defaultProps,
      formData: {
        ...defaultServiceFormData,
        priceFrom: 25,
      },
    }

    await render(<ServiceStep5Pricing {...props} />)

    const input = screen.getByTestId('price-from-input')
    await act(async () => {
      fireEvent.changeText(input, '')
    })

    expect(mockOnUpdateField).toHaveBeenCalledWith('priceFrom', null)
  })

  it('updates priceTo as number and accepts empty/null values', async () => {
    await render(<ServiceStep5Pricing {...defaultProps} />)

    const input = screen.getByTestId('price-to-input')
    await act(async () => {
      fireEvent.changeText(input, '100')
    })

    expect(mockOnUpdateField).toHaveBeenCalledWith('priceTo', 100)

    await act(async () => {
      fireEvent.changeText(input, '')
    })

    expect(mockOnUpdateField).toHaveBeenCalledWith('priceTo', null)
  })

  it('calls onLocationChange with correct IDs and Arabic names from location selector', async () => {
    await render(<ServiceStep5Pricing {...defaultProps} />)

    const locSelector = screen.getByTestId('mock-gov-wilaya-select')
    await act(async () => {
      fireEvent.press(locSelector)
    })

    expect(mockOnLocationChange).toHaveBeenCalledWith(1, 101, 'مسقط', 'السيب')
  })

  it('updates address, contactPhone, whatsapp, and website fields cleanly', async () => {
    await render(<ServiceStep5Pricing {...defaultProps} />)

    const addressInput = screen.getByTestId('address-input')
    const phoneInput = screen.getByTestId('contact-phone-input')
    const whatsappInput = screen.getByTestId('whatsapp-input')
    const websiteInput = screen.getByTestId('website-input')

    await act(async () => {
      fireEvent.changeText(addressInput, 'شارع رقم 8، المعبيلة الصناعية')
    })
    expect(mockOnUpdateField).toHaveBeenCalledWith('address', 'شارع رقم 8، المعبيلة الصناعية')

    await act(async () => {
      fireEvent.changeText(phoneInput, '91234567')
    })
    expect(mockOnUpdateField).toHaveBeenCalledWith('contactPhone', '91234567')

    await act(async () => {
      fireEvent.changeText(whatsappInput, '97654321')
    })
    expect(mockOnUpdateField).toHaveBeenCalledWith('whatsapp', '97654321')

    await act(async () => {
      fireEvent.changeText(websiteInput, 'https://mygarage.om')
    })
    expect(mockOnUpdateField).toHaveBeenCalledWith('website', 'https://mygarage.om')
  })

  it('displays inline error message when errors.priceFrom is provided', async () => {
    const propsWithErrors = {
      ...defaultProps,
      errors: {
        priceFrom: 'أدخل سعر الخدمة',
      },
    }

    await render(<ServiceStep5Pricing {...propsWithErrors} />)

    expect(screen.getByText('أدخل سعر الخدمة')).toBeTruthy()
  })
})
