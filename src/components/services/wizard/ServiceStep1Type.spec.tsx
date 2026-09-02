import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { ServiceStep1Type } from './ServiceStep1Type'
import { defaultServiceFormData } from '../../../store/serviceWizardStore'
import { SERVICE_TYPES, PROVIDER_TYPES } from '../../../constants/services'

jest.mock('expo-blur', () => ({
  BlurView: ({ children }: any) => <>{children}</>,
}))

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}))

describe('ServiceStep1Type', () => {
  const mockOnUpdateField = jest.fn()

  const defaultProps = {
    formData: defaultServiceFormData,
    errors: {},
    onUpdateField: mockOnUpdateField,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders all service type options and calls onUpdateField when pressed', async () => {
    await render(<ServiceStep1Type {...defaultProps} />)

    SERVICE_TYPES.forEach((st) => {
      const option = screen.getByTestId(`service-type-${st.id}`)
      expect(option).toBeTruthy()
    })

    const maintenanceOption = screen.getByTestId('service-type-MAINTENANCE')
    fireEvent.press(maintenanceOption)
    expect(mockOnUpdateField).toHaveBeenCalledWith('serviceType', 'MAINTENANCE')
  })

  it('renders all provider type chips and calls onUpdateField when pressed', async () => {
    await render(<ServiceStep1Type {...defaultProps} />)

    PROVIDER_TYPES.forEach((pt) => {
      const chip = screen.getByTestId(`provider-type-${pt.id}`)
      expect(chip).toBeTruthy()
    })

    const workshopChip = screen.getByTestId('provider-type-WORKSHOP')
    fireEvent.press(workshopChip)
    expect(mockOnUpdateField).toHaveBeenCalledWith('providerType', 'WORKSHOP')
  })

  it('renders providerName input and updates field when text changes', async () => {
    await render(<ServiceStep1Type {...defaultProps} />)

    const input = screen.getByTestId('provider-name-input')
    expect(input).toBeTruthy()

    fireEvent.changeText(input, 'كراج النجوم لصيانة المحركات')
    expect(mockOnUpdateField).toHaveBeenCalledWith('providerName', 'كراج النجوم لصيانة المحركات')
  })

  it('displays inline error messages when provided in errors prop', async () => {
    const propsWithErrors = {
      ...defaultProps,
      errors: {
        serviceType: 'اختر نوع الخدمة',
        providerType: 'اختر صفة مقدم الخدمة',
        providerName: 'اسم مقدم الخدمة لازم يكون 3 أحرف على الأقل',
      },
    }

    await render(<ServiceStep1Type {...propsWithErrors} />)

    expect(screen.getByText('اختر نوع الخدمة')).toBeTruthy()
    expect(screen.getByText('اختر صفة مقدم الخدمة')).toBeTruthy()
    expect(screen.getByText('اسم مقدم الخدمة لازم يكون 3 أحرف على الأقل')).toBeTruthy()
  })
})
