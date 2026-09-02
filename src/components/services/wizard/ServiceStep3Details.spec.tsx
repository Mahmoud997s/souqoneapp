import React from 'react'
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react-native'
import { ServiceStep3Details } from './ServiceStep3Details'
import { defaultServiceFormData, ServiceFormData } from '../../../store/serviceWizardStore'
import { COMMON_SPECIALIZATIONS } from '../../../constants/services'

jest.mock('expo-blur', () => ({
  BlurView: ({ children }: any) => <>{children}</>,
}))

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}))

describe('ServiceStep3Details', () => {
  const mockOnUpdateField = jest.fn()

  const defaultProps = {
    formData: defaultServiceFormData,
    errors: {},
    onUpdateField: mockOnUpdateField,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('updates title and description when typing in inputs', async () => {
    await render(<ServiceStep3Details {...defaultProps} />)

    const titleInput = screen.getByTestId('title-input')
    const descInput = screen.getByTestId('description-input')

    await act(async () => {
      fireEvent.changeText(titleInput, 'صيانة وفحص سيارات')
    })
    expect(mockOnUpdateField).toHaveBeenCalledWith('title', 'صيانة وفحص سيارات')

    await act(async () => {
      fireEvent.changeText(descInput, 'وصف تفصيلي للخدمة مع الضمان')
    })
    expect(mockOnUpdateField).toHaveBeenCalledWith('description', 'وصف تفصيلي للخدمة مع الضمان')
  })

  it('displays message to choose serviceType first when serviceType is null', async () => {
    const props = {
      ...defaultProps,
      formData: { ...defaultServiceFormData, serviceType: null },
    }

    await render(<ServiceStep3Details {...props} />)

    expect(
      screen.getByText('اختر نوع الخدمة أولاً في الخطوة السابقة لتحديد التخصصات المتاحة')
    ).toBeTruthy()
  })

  it('displays correct specializations with "أخرى" always at the end when serviceType is set', async () => {
    const props: { formData: ServiceFormData; errors: Record<string, string>; onUpdateField: jest.Mock } = {
      ...defaultProps,
      formData: { ...defaultServiceFormData, serviceType: 'MAINTENANCE' },
    }

    await render(<ServiceStep3Details {...props} />)

    const maintenanceSpecs = COMMON_SPECIALIZATIONS.MAINTENANCE
    maintenanceSpecs.forEach((spec) => {
      expect(screen.getByTestId(`spec-chip-${spec}`)).toBeTruthy()
    })

    const otherChip = screen.getByTestId('spec-chip-أخرى')
    expect(otherChip).toBeTruthy()
  })

  it('changes specializations list when serviceType changes', async () => {
    const props: { formData: ServiceFormData; errors: Record<string, string>; onUpdateField: jest.Mock } = {
      ...defaultProps,
      formData: { ...defaultServiceFormData, serviceType: 'CLEANING' },
    }

    await render(<ServiceStep3Details {...props} />)

    const cleaningSpecs = COMMON_SPECIALIZATIONS.CLEANING
    cleaningSpecs.forEach((spec) => {
      expect(screen.getByTestId(`spec-chip-${spec}`)).toBeTruthy()
    })
    expect(screen.getByTestId('spec-chip-أخرى')).toBeTruthy()
  })

  it('adds specialization to array on press when not currently selected', async () => {
    const props: { formData: ServiceFormData; errors: Record<string, string>; onUpdateField: jest.Mock } = {
      ...defaultProps,
      formData: {
        ...defaultServiceFormData,
        serviceType: 'MAINTENANCE',
        specializations: ['تغيير زيت وفلاتر'],
      },
    }

    await render(<ServiceStep3Details {...props} />)

    const chip = screen.getByTestId('spec-chip-ميكانيكا عامة')
    await act(async () => {
      fireEvent.press(chip)
    })

    expect(mockOnUpdateField).toHaveBeenCalledWith('specializations', [
      'تغيير زيت وفلاتر',
      'ميكانيكا عامة',
    ])
  })

  it('removes specialization from array on press when already selected', async () => {
    const props: { formData: ServiceFormData; errors: Record<string, string>; onUpdateField: jest.Mock } = {
      ...defaultProps,
      formData: {
        ...defaultServiceFormData,
        serviceType: 'MAINTENANCE',
        specializations: ['تغيير زيت وفلاتر', 'ميكانيكا عامة'],
      },
    }

    await render(<ServiceStep3Details {...props} />)

    const chip = screen.getByTestId('spec-chip-تغيير زيت وفلاتر')
    await act(async () => {
      fireEvent.press(chip)
    })

    expect(mockOnUpdateField).toHaveBeenCalledWith('specializations', ['ميكانيكا عامة'])
  })

  it('toggles isHomeService switch when pressed', async () => {
    const props: { formData: ServiceFormData; errors: Record<string, string>; onUpdateField: jest.Mock } = {
      ...defaultProps,
      formData: {
        ...defaultServiceFormData,
        isHomeService: false,
      },
    }

    await render(<ServiceStep3Details {...props} />)

    const switchEl = screen.getByTestId('home-service-switch')
    await act(async () => {
      fireEvent(switchEl, 'valueChange', true)
    })

    expect(mockOnUpdateField).toHaveBeenCalledWith('isHomeService', true)
  })

  it('displays inline error messages when passed via errors prop', async () => {
    const propsWithErrors = {
      ...defaultProps,
      errors: {
        title: 'العنوان لازم يكون 3 أحرف على الأقل',
        description: 'الوصف لازم يكون 10 أحرف على الأقل',
      },
    }

    await render(<ServiceStep3Details {...propsWithErrors} />)

    expect(screen.getByText('العنوان لازم يكون 3 أحرف على الأقل')).toBeTruthy()
    expect(screen.getByText('الوصف لازم يكون 10 أحرف على الأقل')).toBeTruthy()
  })
})
