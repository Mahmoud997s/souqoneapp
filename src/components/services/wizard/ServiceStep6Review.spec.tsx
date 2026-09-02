import React from 'react'
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react-native'
import { ServiceStep6Review } from './ServiceStep6Review'
import { defaultServiceFormData, ServiceFormData } from '../../../store/serviceWizardStore'

jest.mock('expo-blur', () => ({
  BlurView: ({ children }: any) => <>{children}</>,
}))

jest.mock('expo-image', () => {
  const React = require('react')
  const { View } = require('react-native')
  return {
    Image: () => <View testID="mock-expo-image" />,
  }
})

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}))

describe('ServiceStep6Review', () => {
  const mockOnEditStep = jest.fn()

  const fullFormData: ServiceFormData = {
    ...defaultServiceFormData,
    serviceType: 'MAINTENANCE',
    providerType: 'WORKSHOP',
    providerName: 'كراج السرعة الذهبية',
    images: [{ uri: 'file://img1.jpg' }],
    title: 'صيانة وفحص شامل وبرمجة',
    description: 'نوفر فحص كمبيوتر وتغيير زيوت مع ضمان شهرين',
    specializations: ['تغيير زيت وفلاتر', 'ميكانيكا عامة'],
    isHomeService: true,
    workingDays: ['السبت', 'الأحد', 'الاثنين'],
    workingHoursOpen: '08:00',
    workingHoursClose: '20:00',
    priceFrom: 50,
    priceTo: 150,
    governorateId: 1,
    wilayaId: 101,
    governorateNameAr: 'مسقط',
    wilayaNameAr: 'السيب',
    address: 'شارع 8، المعبيلة',
    contactPhone: '91234567',
    whatsapp: '97654321',
    website: 'https://garage.om',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders all 5 review cards with accurate labels and values', async () => {
    await render(<ServiceStep6Review formData={fullFormData} onEditStep={mockOnEditStep} />)

    // Card 1 Photos
    expect(screen.getByText('الصور والمرفقات (1)')).toBeTruthy()

    // Card 2 Basic Info
    expect(screen.getByText('صيانة وميكانيكا')).toBeTruthy()
    expect(screen.getByText('ورشة / كراج')).toBeTruthy()
    expect(screen.getByText('كراج السرعة الذهبية')).toBeTruthy()

    // Card 3 Details
    expect(screen.getByText('صيانة وفحص شامل وبرمجة')).toBeTruthy()
    expect(screen.getByText('تغيير زيت وفلاتر، ميكانيكا عامة')).toBeTruthy()
    expect(screen.getByText('خدمة متنقلة / في موقع العميل')).toBeTruthy()

    // Card 4 Schedule
    expect(screen.getByText('السبت، الأحد، الاثنين')).toBeTruthy()

    // Card 5 Pricing & Location
    expect(screen.getByText('من 50 إلى 150 ر.ع')).toBeTruthy()
    expect(screen.getByText('مسقط - السيب')).toBeTruthy()
    expect(screen.getByText('شارع 8، المعبيلة')).toBeTruthy()
    expect(screen.getByText('91234567')).toBeTruthy()
  })

  it('calls onEditStep with corresponding step number on edit buttons press', async () => {
    await render(<ServiceStep6Review formData={fullFormData} onEditStep={mockOnEditStep} />)

    await act(async () => {
      fireEvent.press(screen.getByTestId('edit-step-photos'))
    })
    expect(mockOnEditStep).toHaveBeenCalledWith(2)

    await act(async () => {
      fireEvent.press(screen.getByTestId('edit-step-basic'))
    })
    expect(mockOnEditStep).toHaveBeenCalledWith(1)

    await act(async () => {
      fireEvent.press(screen.getByTestId('edit-step-details'))
    })
    expect(mockOnEditStep).toHaveBeenCalledWith(3)

    await act(async () => {
      fireEvent.press(screen.getByTestId('edit-step-schedule'))
    })
    expect(mockOnEditStep).toHaveBeenCalledWith(4)

    await act(async () => {
      fireEvent.press(screen.getByTestId('edit-step-pricing'))
    })
    expect(mockOnEditStep).toHaveBeenCalledWith(5)
  })

  it('does NOT render home service badge when isHomeService is false', async () => {
    const dataWithoutHome: ServiceFormData = {
      ...fullFormData,
      isHomeService: false,
    }

    await render(<ServiceStep6Review formData={dataWithoutHome} onEditStep={mockOnEditStep} />)

    expect(screen.queryByTestId('home-service-review-badge')).toBeNull()
  })

  it('renders single price when priceTo is null', async () => {
    const dataSinglePrice: ServiceFormData = {
      ...fullFormData,
      priceFrom: 70,
      priceTo: null,
    }

    await render(<ServiceStep6Review formData={dataSinglePrice} onEditStep={mockOnEditStep} />)

    expect(screen.getByTestId('price-display-txt')).toHaveTextContent('70 ر.ع')
  })

  it('displays "غير محدد" when workingDays is empty', async () => {
    const dataNoDays: ServiceFormData = {
      ...fullFormData,
      workingDays: [],
    }

    await render(<ServiceStep6Review formData={dataNoDays} onEditStep={mockOnEditStep} />)

    expect(screen.getByText('غير محدد')).toBeTruthy()
  })
})
