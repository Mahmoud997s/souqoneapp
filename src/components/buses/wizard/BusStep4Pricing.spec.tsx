import React from 'react'
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react-native'
import { BusStep4Pricing } from './BusStep4Pricing'
import { BusWizardData } from '../../../store/busWizardStore'

jest.mock('expo-blur', () => ({
  BlurView: ({ children }: any) => <>{children}</>,
}))

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}))

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
  },
}))

jest.mock('react-native-modal-datetime-picker', () => {
  const React = require('react')
  const { TouchableOpacity, Text } = require('react-native')
  return function MockDateTimePickerModal(props: any) {
    if (!props.isVisible) return null
    return (
      <TouchableOpacity
        testID="mock-date-picker-confirm"
        onPress={() => {
          const testDate = new Date('2026-12-31T00:00:00.000Z')
          props.onConfirm(testDate)
        }}
      >
        <Text>Confirm Date</Text>
      </TouchableOpacity>
    )
  }
})

const baseMockData: BusWizardData = {
  busListingType: 'BUS_SALE',
  busType: 'MINI_BUS',
  make: 'Toyota',
  model: 'Coaster',
  manufacturerId: null,
  modelId: null,
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
  governorateId: 1,
  wilayaId: 101,
  governorateNameAr: 'مسقط',
  wilayaNameAr: 'السيب',
  latitude: null,
  longitude: null,
  images: [],
  existingImages: [],
  removedImageIds: [],
  contactPhone: '91234567',
  whatsapp: '91234567',
}

describe('BusStep4Pricing', () => {
  const mockOnUpdateField = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  describe('Branch: BUS_SALE', () => {
    it('renders price input, negotiable switch, and condition chips', async () => {
      await render(
        <BusStep4Pricing
          data={{ ...baseMockData, busListingType: 'BUS_SALE' }}
          errors={{}}
          onUpdateField={mockOnUpdateField}
        />
      )

      expect(screen.getByTestId('price-input')).toBeTruthy()
      expect(screen.getByTestId('price-negotiable-switch')).toBeTruthy()
      expect(screen.getByTestId('condition-chip-USED')).toBeTruthy()
      expect(screen.getByTestId('condition-chip-NEW')).toBeTruthy()

      // Should not render rent or contract specific fields
      expect(screen.queryByTestId('daily-price-input')).toBeNull()
      expect(screen.queryByTestId('contract-client-input')).toBeNull()
    })

    it('handles price and condition changes and switch toggle', async () => {
      await render(
        <BusStep4Pricing
          data={{ ...baseMockData, busListingType: 'BUS_SALE', price: '', isPriceNegotiable: false }}
          errors={{}}
          onUpdateField={mockOnUpdateField}
        />
      )

      await act(async () => {
        fireEvent.changeText(screen.getByTestId('price-input'), '18500')
      })
      expect(mockOnUpdateField).toHaveBeenCalledWith('price', '18500')

      await act(async () => {
        fireEvent(screen.getByTestId('price-negotiable-switch'), 'valueChange', true)
      })
      expect(mockOnUpdateField).toHaveBeenCalledWith('isPriceNegotiable', true)

      await act(async () => {
        fireEvent.press(screen.getByTestId('condition-chip-NEW'))
      })
      expect(mockOnUpdateField).toHaveBeenCalledWith('condition', 'NEW')
    })

    it('displays validation errors for price and condition', async () => {
      await render(
        <BusStep4Pricing
          data={{ ...baseMockData, busListingType: 'BUS_SALE', price: '', condition: '' }}
          errors={{
            price: 'الرجاء إدخال السعر',
            condition: 'الرجاء اختيار حالة الحافلة',
          }}
          onUpdateField={mockOnUpdateField}
        />
      )

      expect(screen.getByText('الرجاء إدخال السعر')).toBeTruthy()
      expect(screen.getByText('الرجاء اختيار حالة الحافلة')).toBeTruthy()
    })
  })

  describe('Branch: BUS_RENT', () => {
    it('renders rental prices, withDriver switch, and rental hints', async () => {
      await render(
        <BusStep4Pricing
          data={{ ...baseMockData, busListingType: 'BUS_RENT', dailyPrice: '60', monthlyPrice: '1000' }}
          errors={{}}
          onUpdateField={mockOnUpdateField}
        />
      )

      expect(screen.getByTestId('daily-price-input')).toBeTruthy()
      expect(screen.getByTestId('monthly-price-input')).toBeTruthy()
      expect(screen.getByTestId('with-driver-switch')).toBeTruthy()
      expect(screen.getByText(/يجب إدخال سعر واحد على الأقل/)).toBeTruthy()

      // Sale-only price input shouldn't be rendered
      expect(screen.queryByTestId('price-input')).toBeNull()
      expect(screen.queryByTestId('contract-client-input')).toBeNull()
    })

    it('handles dailyPrice, monthlyPrice, and withDriver updates', async () => {
      await render(
        <BusStep4Pricing
          data={{ ...baseMockData, busListingType: 'BUS_RENT' }}
          errors={{}}
          onUpdateField={mockOnUpdateField}
        />
      )

      await act(async () => {
        fireEvent.changeText(screen.getByTestId('daily-price-input'), '75')
      })
      expect(mockOnUpdateField).toHaveBeenCalledWith('dailyPrice', '75')

      await act(async () => {
        fireEvent.changeText(screen.getByTestId('monthly-price-input'), '1200')
      })
      expect(mockOnUpdateField).toHaveBeenCalledWith('monthlyPrice', '1200')

      await act(async () => {
        fireEvent(screen.getByTestId('with-driver-switch'), 'valueChange', true)
      })
      expect(mockOnUpdateField).toHaveBeenCalledWith('withDriver', true)
    })

    it('displays rental validation errors', async () => {
      await render(
        <BusStep4Pricing
          data={{ ...baseMockData, busListingType: 'BUS_RENT', dailyPrice: '', monthlyPrice: '' }}
          errors={{ dailyPrice: 'الرجاء إدخال الإيجار اليومي أو الشهري' }}
          onUpdateField={mockOnUpdateField}
        />
      )

      expect(screen.getByText('الرجاء إدخال الإيجار اليومي أو الشهري')).toBeTruthy()
    })
  })

  describe('Branch: BUS_SALE_WITH_CONTRACT', () => {
    it('renders price, condition, contract types, client, monthly, duration, and date picker', async () => {
      await render(
        <BusStep4Pricing
          data={{
            ...baseMockData,
            busListingType: 'BUS_SALE_WITH_CONTRACT',
            contractType: 'SCHOOL',
            contractClient: 'مدرسة التفوق',
            contractMonthly: '500',
            contractDuration: '24',
            contractExpiry: null,
          }}
          errors={{}}
          onUpdateField={mockOnUpdateField}
        />
      )

      expect(screen.getByTestId('price-input')).toBeTruthy()
      expect(screen.getByTestId('condition-chip-USED')).toBeTruthy()
      expect(screen.getByTestId('contract-type-chip-SCHOOL')).toBeTruthy()
      expect(screen.getByTestId('contract-type-chip-COMPANY')).toBeTruthy()
      expect(screen.getByTestId('contract-type-chip-GOVERNMENT')).toBeTruthy()
      expect(screen.getByTestId('contract-type-chip-TOURISM')).toBeTruthy()
      expect(screen.getByTestId('contract-type-chip-OTHER_CONTRACT')).toBeTruthy()
      expect(screen.getByTestId('contract-client-input')).toBeTruthy()
      expect(screen.getByTestId('contract-monthly-input')).toBeTruthy()
      expect(screen.getByTestId('contract-duration-input')).toBeTruthy()
      expect(screen.getByTestId('contract-expiry-btn')).toBeTruthy()
    })

    it('updates contract fields on user input', async () => {
      await render(
        <BusStep4Pricing
          data={{ ...baseMockData, busListingType: 'BUS_SALE_WITH_CONTRACT' }}
          errors={{}}
          onUpdateField={mockOnUpdateField}
        />
      )

      await act(async () => {
        fireEvent.press(screen.getByTestId('contract-type-chip-COMPANY'))
      })
      expect(mockOnUpdateField).toHaveBeenCalledWith('contractType', 'COMPANY')

      await act(async () => {
        fireEvent.changeText(screen.getByTestId('contract-client-input'), 'شركة النورس')
      })
      expect(mockOnUpdateField).toHaveBeenCalledWith('contractClient', 'شركة النورس')

      await act(async () => {
        fireEvent.changeText(screen.getByTestId('contract-monthly-input'), '650')
      })
      expect(mockOnUpdateField).toHaveBeenCalledWith('contractMonthly', '650')

      await act(async () => {
        fireEvent.changeText(screen.getByTestId('contract-duration-input'), '18')
      })
      expect(mockOnUpdateField).toHaveBeenCalledWith('contractDuration', '18')
    })

    it('opens date picker and confirms date selection for contractExpiry', async () => {
      await render(
        <BusStep4Pricing
          data={{ ...baseMockData, busListingType: 'BUS_SALE_WITH_CONTRACT', contractExpiry: null }}
          errors={{}}
          onUpdateField={mockOnUpdateField}
        />
      )

      await act(async () => {
        fireEvent.press(screen.getByTestId('contract-expiry-btn'))
      })
      expect(screen.getByTestId('mock-date-picker-confirm')).toBeTruthy()

      await act(async () => {
        fireEvent.press(screen.getByTestId('mock-date-picker-confirm'))
      })
      expect(mockOnUpdateField).toHaveBeenCalledWith('contractExpiry', '2026-12-31')
    })

    it('allows clearing contractExpiry date and confirms contractExpiry is optional without error', async () => {
      await render(
        <BusStep4Pricing
          data={{ ...baseMockData, busListingType: 'BUS_SALE_WITH_CONTRACT', contractExpiry: '2026-12-31' }}
          errors={{}}
          onUpdateField={mockOnUpdateField}
        />
      )

      expect(screen.getByText('2026-12-31')).toBeTruthy()
      expect(screen.getByTestId('clear-contract-expiry-btn')).toBeTruthy()

      await act(async () => {
        fireEvent.press(screen.getByTestId('clear-contract-expiry-btn'))
      })
      expect(mockOnUpdateField).toHaveBeenCalledWith('contractExpiry', null)
    })

    it('displays contract validation errors', async () => {
      await render(
        <BusStep4Pricing
          data={{ ...baseMockData, busListingType: 'BUS_SALE_WITH_CONTRACT' }}
          errors={{
            contractType: 'الرجاء اختيار نوع العقد',
            contractClient: 'الرجاء إدخال الجهة',
            contractMonthly: 'الرجاء إدخال القيمة',
            contractDuration: 'الرجاء إدخال المدة المتبقية',
          }}
          onUpdateField={mockOnUpdateField}
        />
      )

      expect(screen.getByText('الرجاء اختيار نوع العقد')).toBeTruthy()
      expect(screen.getByText('الرجاء إدخال الجهة')).toBeTruthy()
      expect(screen.getByText('الرجاء إدخال القيمة')).toBeTruthy()
      expect(screen.getByText('الرجاء إدخال المدة المتبقية')).toBeTruthy()
    })
  })
})
