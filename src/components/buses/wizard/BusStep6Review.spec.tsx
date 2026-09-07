import React from 'react'
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react-native'
import { BusStep6Review } from './BusStep6Review'
import { BusWizardData } from '../../../store/busWizardStore'

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}))

jest.mock('expo-blur', () => ({
  BlurView: ({ children }: any) => <>{children}</>,
}))

jest.mock('expo-image', () => {
  const React = require('react')
  const { View } = require('react-native')
  return {
    Image: (props: any) => <View testID="expo-image" {...props} />,
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
  features: ['ac', 'wifi', 'usb'],
  price: '15000',
  currency: 'OMR',
  isPriceNegotiable: true,
  dailyPrice: '',
  monthlyPrice: '',
  withDriver: false,
  contractType: '',
  contractClient: '',
  contractMonthly: '',
  contractDuration: '',
  contractExpiry: null,
  title: 'حافلة تويوتا كوستر 2022 للبيع',
  description: 'حافلة نظيفة بحالة ممتازة وجاهزة للعمل الفوري',
  governorateId: 1,
  wilayaId: 101,
  governorateNameAr: 'مسقط',
  wilayaNameAr: 'السيب',
  latitude: 23.6143,
  longitude: 58.5453,
  images: ['https://example.com/bus1.jpg', 'https://example.com/bus2.jpg'],
  existingImages: [],
  removedImageIds: [],
  contactPhone: '91234567',
  whatsapp: '99887766',
}

describe('BusStep6Review', () => {
  const mockOnEditStep = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders all sections and general notice banner', async () => {
    await render(<BusStep6Review data={baseMockData} onEditStep={mockOnEditStep} />)

    // Top notice
    expect(screen.getByText(/راجع تفاصيل الإعلان بعناية/)).toBeTruthy()

    // Photos Card
    expect(screen.getByText(/الصور والمرفقات \(2\)/)).toBeTruthy()
    expect(screen.getByText('الرئيسية')).toBeTruthy()

    // Basic Info Card
    expect(screen.getByText('للبيع')).toBeTruthy()
    expect(screen.getByText('ميني باص')).toBeTruthy()
    expect(screen.getByText('حافلة تويوتا كوستر 2022 للبيع')).toBeTruthy()
    expect(screen.getByText(/حافلة نظيفة بحالة ممتازة/)).toBeTruthy()

    // Specs Card
    expect(screen.getByText('Toyota')).toBeTruthy()
    expect(screen.getByText('Coaster')).toBeTruthy()
    expect(screen.getByText('2022')).toBeTruthy()
    expect(screen.getByText('30 راكب')).toBeTruthy()
    expect(screen.getByText('50,000 كم')).toBeTruthy()
    expect(screen.getByText('مستعمل')).toBeTruthy()
    expect(screen.getByText('عادي / يدوي')).toBeTruthy()
    expect(screen.getByText('ديزل')).toBeTruthy()
    expect(screen.getByText('1234 A')).toBeTruthy()
    expect(screen.getByText('تكييف مركزي')).toBeTruthy()
    expect(screen.getByText('واي فاي (WiFi)')).toBeTruthy()
    expect(screen.getByText('منافذ شحن USB')).toBeTruthy()

    // Pricing Card (Sale branch)
    expect(screen.getByTestId('sale-pricing-box')).toBeTruthy()
    expect(screen.getByText('قابل للتفاوض')).toBeTruthy()
    expect(screen.getByText(/15,000/)).toBeTruthy()

    // Location & Contact Card
    expect(screen.getByText('مسقط - السيب')).toBeTruthy()
    expect(screen.getByText(/23.6143/)).toBeTruthy()
    expect(screen.getByText('91234567')).toBeTruthy()
    expect(screen.getByText('99887766')).toBeTruthy()
  })

  it('triggers onEditStep with correct step number for each edit button', async () => {
    await render(<BusStep6Review data={baseMockData} onEditStep={mockOnEditStep} />)

    // Step 1: Basic info
    await act(async () => {
      fireEvent.press(screen.getByTestId('edit-step-basic'))
    })
    expect(mockOnEditStep).toHaveBeenCalledWith(1)

    // Step 2: Images
    await act(async () => {
      fireEvent.press(screen.getByTestId('edit-step-images'))
    })
    expect(mockOnEditStep).toHaveBeenCalledWith(2)

    // Step 3: Details & Specs
    await act(async () => {
      fireEvent.press(screen.getByTestId('edit-step-details'))
    })
    expect(mockOnEditStep).toHaveBeenCalledWith(3)

    // Step 4: Pricing
    await act(async () => {
      fireEvent.press(screen.getByTestId('edit-step-pricing'))
    })
    expect(mockOnEditStep).toHaveBeenCalledWith(4)

    // Step 5: Location & Contact
    await act(async () => {
      fireEvent.press(screen.getByTestId('edit-step-location'))
    })
    expect(mockOnEditStep).toHaveBeenCalledWith(5)
  })

  it('renders conditional pricing for BUS_RENT branch', async () => {
    const rentData: BusWizardData = {
      ...baseMockData,
      busListingType: 'BUS_RENT',
      dailyPrice: '60',
      monthlyPrice: '1200',
      withDriver: true,
    }

    await render(<BusStep6Review data={rentData} onEditStep={mockOnEditStep} />)

    expect(screen.getByTestId('rent-pricing-box')).toBeTruthy()
    expect(screen.getByText('60 ر.ع / يوم')).toBeTruthy()
    expect(screen.getByText('1,200 ر.ع / شهر')).toBeTruthy()
    expect(screen.getByText('مع سائق')).toBeTruthy()

    expect(screen.queryByTestId('sale-pricing-box')).toBeNull()
    expect(screen.queryByTestId('contract-pricing-box')).toBeNull()
  })

  it('renders conditional pricing for BUS_SALE_WITH_CONTRACT branch', async () => {
    const contractData: BusWizardData = {
      ...baseMockData,
      busListingType: 'BUS_SALE_WITH_CONTRACT',
      price: '22000',
      contractType: 'SCHOOL',
      contractClient: 'مدرسة التفوق الخاصة',
      contractMonthly: '850',
      contractDuration: '24',
      contractExpiry: '2028-06-30',
    }

    await render(<BusStep6Review data={contractData} onEditStep={mockOnEditStep} />)

    expect(screen.getByTestId('contract-pricing-box')).toBeTruthy()
    expect(screen.getByText(/22,000/)).toBeTruthy()
    expect(screen.getByText('نقل مدرسي / جامعي')).toBeTruthy()
    expect(screen.getByText('مدرسة التفوق الخاصة')).toBeTruthy()
    expect(screen.getByText('850 ر.ع')).toBeTruthy()
    expect(screen.getByText('24 شهر')).toBeTruthy()
    expect(screen.getByText('2028-06-30')).toBeTruthy()

    expect(screen.queryByTestId('rent-pricing-box')).toBeNull()
  })
})
