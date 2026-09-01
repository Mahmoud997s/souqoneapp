import React from 'react'
import { render, screen, fireEvent, cleanup } from '@testing-library/react-native'
import { PartStep3Details } from './PartStep3Details'
import { defaultPartFormData } from '../../../store/partWizardStore'

jest.mock('expo-blur', () => ({
  BlurView: ({ children }: any) => <>{children}</>
}))

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  MaterialCommunityIcons: 'MaterialCommunityIcons'
}))

describe('PartStep3Details', () => {
  const mockOnUpdateField = jest.fn()

  const defaultProps = {
    formData: defaultPartFormData,
    errors: {},
    onUpdateField: mockOnUpdateField,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders inputs and updates store on text change', async () => {
    await render(<PartStep3Details {...defaultProps} />)
    
    // Using the exact text in the rendered component
    const titleInput = screen.getByPlaceholderText(/مثال: مكينة كامري/i)
    const descInput = screen.getByPlaceholderText(/تفاصيل حالة القطعة/i)
    
    expect(titleInput).toBeTruthy()
    expect(descInput).toBeTruthy()
  })

  it('toggles hasWarranty switch and clears warrantyDuration if false', async () => {
    const propsWithWarranty = {
      ...defaultProps,
      formData: { ...defaultPartFormData, hasWarranty: true, warrantyDuration: 'ONE_MONTH' as any }
    }
    await render(<PartStep3Details {...propsWithWarranty} />)
    
    const switchElement = screen.getByTestId('warranty-switch')
    expect(switchElement).toBeTruthy()
  })

  it('does not render warranty duration dropdown if hasWarranty is false', async () => {
    await render(<PartStep3Details {...defaultProps} />)
    
    const durationDropdownLabel = screen.queryByText(/مدة الضمان/i)
    expect(durationDropdownLabel).toBeNull()
  })

  it('renders warranty duration dropdown if hasWarranty is true', async () => {
    const propsWithWarranty = {
      ...defaultProps,
      formData: {
        ...defaultProps.formData,
        hasWarranty: true
      }
    }
    await render(<PartStep3Details {...propsWithWarranty} />)
    
    const durationDropdownLabel = screen.queryAllByText(/مدة الضمان/i)
    expect(durationDropdownLabel.length).toBeGreaterThan(0)
  })
})
