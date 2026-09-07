import React from 'react'
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react-native'
import { BusStep5Location } from './BusStep5Location'
import { BusWizardData } from '../../../store/busWizardStore'

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}))

jest.mock('expo-blur', () => ({
  BlurView: ({ children }: any) => <>{children}</>,
}))

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
  },
}))

jest.mock('../../ui/GovernorateWilayaSelect', () => {
  const React = require('react')
  const { View, Text, TouchableOpacity } = require('react-native')
  return {
    GovernorateWilayaSelect: ({ onLocationChange, govError, cityError }: any) => (
      <View testID="mock-gov-wilaya-select-wrap">
        <TouchableOpacity
          testID="mock-gov-wilaya-select-btn"
          onPress={() => onLocationChange(1, 101, 'مسقط', 'السيب')}
        >
          <Text>Mock Select Location</Text>
        </TouchableOpacity>
        {govError ? <Text testID="mock-gov-error">{govError}</Text> : null}
        {cityError ? <Text testID="mock-city-error">{cityError}</Text> : null}
      </View>
    ),
  }
})

jest.mock('../../ui/MapLocationPicker', () => {
  const React = require('react')
  const { View, Text, TouchableOpacity } = require('react-native')
  return {
    MapLocationPicker: ({ isVisible, onClose, onConfirm }: any) => {
      if (!isVisible) return null
      return (
        <View testID="mock-map-location-picker-modal">
          <TouchableOpacity
            testID="mock-map-confirm-btn"
            onPress={() => onConfirm(23.6143, 58.5453)}
          >
            <Text>Confirm Pin</Text>
          </TouchableOpacity>
          <TouchableOpacity testID="mock-map-close-btn" onPress={onClose}>
            <Text>Close Modal</Text>
          </TouchableOpacity>
        </View>
      )
    },
  }
})

const baseMockData: BusWizardData = {
  busListingType: 'BUS_SALE',
  busType: 'MINI_BUS',
  make: 'Toyota',
  model: 'Coaster',
  manufacturerId: '1',
  modelId: '10',
  year: '2022',
  capacity: '30',
  condition: 'USED',
  transmission: 'MANUAL',
  fuelType: 'DIESEL',
  mileage: '50000',
  plateNumber: '1234 A',
  features: [],
  price: '15000',
  currency: 'OMR',
  isPriceNegotiable: false,
  dailyPrice: '',
  monthlyPrice: '',
  withDriver: false,
  contractType: '',
  contractClient: '',
  contractMonthly: '',
  contractDuration: '',
  contractExpiry: null,
  title: 'حافلة تويوتا كوستر',
  description: 'حافلة بحالة ممتازة وجاهزة للاستخدام',
  governorateId: null,
  wilayaId: null,
  governorateNameAr: '',
  wilayaNameAr: '',
  latitude: null,
  longitude: null,
  images: [],
  existingImages: [],
  removedImageIds: [],
  contactPhone: '',
  whatsapp: '',
}

describe('BusStep5Location', () => {
  const mockOnUpdateField = jest.fn()
  const mockOnLocationChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders location and contact cards with proper fields', async () => {
    await render(
      <BusStep5Location
        data={baseMockData}
        errors={{}}
        onUpdateField={mockOnUpdateField}
        onLocationChange={mockOnLocationChange}
      />
    )

    expect(screen.getByTestId('mock-gov-wilaya-select-wrap')).toBeTruthy()
    expect(screen.getByTestId('open-map-picker-btn')).toBeTruthy()
    expect(screen.getByTestId('contact-phone-input')).toBeTruthy()
    expect(screen.getByTestId('whatsapp-input')).toBeTruthy()
    expect(screen.queryByTestId('coords-box')).toBeNull()
  })

  it('triggers onLocationChange when GovernorateWilayaSelect emits selection', async () => {
    await render(
      <BusStep5Location
        data={baseMockData}
        errors={{}}
        onUpdateField={mockOnUpdateField}
        onLocationChange={mockOnLocationChange}
      />
    )

    await act(async () => {
      fireEvent.press(screen.getByTestId('mock-gov-wilaya-select-btn'))
    })

    expect(mockOnLocationChange).toHaveBeenCalledWith(1, 101, 'مسقط', 'السيب')
  })

  it('opens MapLocationPicker when open button is pressed and updates coordinates on confirm', async () => {
    await render(
      <BusStep5Location
        data={baseMockData}
        errors={{}}
        onUpdateField={mockOnUpdateField}
        onLocationChange={mockOnLocationChange}
      />
    )

    expect(screen.queryByTestId('mock-map-location-picker-modal')).toBeNull()

    // Open map modal
    await act(async () => {
      fireEvent.press(screen.getByTestId('open-map-picker-btn'))
    })

    expect(screen.getByTestId('mock-map-location-picker-modal')).toBeTruthy()

    // Confirm coordinates
    await act(async () => {
      fireEvent.press(screen.getByTestId('mock-map-confirm-btn'))
    })

    expect(mockOnUpdateField).toHaveBeenCalledWith('latitude', 23.6143)
    expect(mockOnUpdateField).toHaveBeenCalledWith('longitude', 58.5453)
    expect(screen.queryByTestId('mock-map-location-picker-modal')).toBeNull()
  })

  it('renders coords-box when coordinates exist and allows editing and clearing', async () => {
    const dataWithCoords: BusWizardData = {
      ...baseMockData,
      latitude: 23.588,
      longitude: 58.3829,
    }

    await render(
      <BusStep5Location
        data={dataWithCoords}
        errors={{}}
        onUpdateField={mockOnUpdateField}
        onLocationChange={mockOnLocationChange}
      />
    )

    expect(screen.getByTestId('coords-box')).toBeTruthy()
    expect(screen.getByText(/23.5880, 58.3829/)).toBeTruthy()
    expect(screen.queryByTestId('open-map-picker-btn')).toBeNull()

    // Test editing coordinates
    await act(async () => {
      fireEvent.press(screen.getByTestId('edit-map-coords-btn'))
    })
    expect(screen.getByTestId('mock-map-location-picker-modal')).toBeTruthy()

    // Close modal
    await act(async () => {
      fireEvent.press(screen.getByTestId('mock-map-close-btn'))
    })
    expect(screen.queryByTestId('mock-map-location-picker-modal')).toBeNull()

    // Test clearing coordinates
    await act(async () => {
      fireEvent.press(screen.getByTestId('clear-map-coords-btn'))
    })
    expect(mockOnUpdateField).toHaveBeenCalledWith('latitude', null)
    expect(mockOnUpdateField).toHaveBeenCalledWith('longitude', null)
  })

  it('updates contactPhone (required) and whatsapp (optional) inputs on text change', async () => {
    await render(
      <BusStep5Location
        data={baseMockData}
        errors={{}}
        onUpdateField={mockOnUpdateField}
        onLocationChange={mockOnLocationChange}
      />
    )

    await act(async () => {
      fireEvent.changeText(screen.getByTestId('contact-phone-input'), '91234567')
    })
    expect(mockOnUpdateField).toHaveBeenCalledWith('contactPhone', '91234567')

    await act(async () => {
      fireEvent.changeText(screen.getByTestId('whatsapp-input'), '99887766')
    })
    expect(mockOnUpdateField).toHaveBeenCalledWith('whatsapp', '99887766')
  })

  it('displays validation errors for required governorate, wilaya, and contactPhone', async () => {
    const errors = {
      governorateId: 'الرجاء اختيار المحافظة',
      wilayaId: 'الرجاء اختيار الولاية',
      contactPhone: 'الرجاء إدخال رقم الجوال',
      whatsapp: 'رقم الواتساب غير صالح',
    }

    await render(
      <BusStep5Location
        data={baseMockData}
        errors={errors}
        onUpdateField={mockOnUpdateField}
        onLocationChange={mockOnLocationChange}
      />
    )

    expect(screen.getByTestId('mock-gov-error')).toBeTruthy()
    expect(screen.getByText('الرجاء اختيار المحافظة')).toBeTruthy()

    expect(screen.getByTestId('mock-city-error')).toBeTruthy()
    expect(screen.getByText('الرجاء اختيار الولاية')).toBeTruthy()

    expect(screen.getByText('الرجاء إدخال رقم الجوال')).toBeTruthy()
    expect(screen.getByText('رقم الواتساب غير صالح')).toBeTruthy()
  })
})
