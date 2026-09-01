import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { PartStep1Category } from './PartStep1Category'
import { defaultPartFormData } from '../../../store/partWizardStore'
import { PART_CONDITIONS, PART_ORIGINALITY_OPTIONS } from '../../../constants/parts'

jest.mock('expo-blur', () => ({
  BlurView: ({ children }: any) => <>{children}</>
}))

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  MaterialCommunityIcons: 'MaterialCommunityIcons'
}))

describe('PartStep1Category', () => {
  const mockOnUpdateField = jest.fn()

  const defaultProps = {
    formData: defaultPartFormData,
    errors: {},
    onUpdateField: mockOnUpdateField,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders listing types correctly and updates store on select', async () => {
    await render(<PartStep1Category {...defaultProps} />)
    
    const saleOption = screen.getByTestId('listing-type-SPARE_PART_SALE')
    const wantedOption = screen.getByTestId('listing-type-SPARE_PART_WANTED')
    
    expect(saleOption).toBeTruthy()
    expect(wantedOption).toBeTruthy()

    fireEvent.press(saleOption)
    expect(mockOnUpdateField).toHaveBeenCalledWith('listingType', 'SPARE_PART_SALE')
  })

  it('renders categories grid and updates store on select', async () => {
    await render(<PartStep1Category {...defaultProps} />)
    
    const engineCategory = screen.getByTestId('category-ENGINE')
    expect(engineCategory).toBeTruthy()

    fireEvent.press(engineCategory)
    expect(mockOnUpdateField).toHaveBeenCalledWith('partCategory', 'ENGINE')
  })

  it('renders condition chips and updates store on select', async () => {
    await render(<PartStep1Category {...defaultProps} />)
    
    const newCondition = screen.getByTestId(`condition-${PART_CONDITIONS[0].id}`)
    expect(newCondition).toBeTruthy()

    fireEvent.press(newCondition)
    expect(mockOnUpdateField).toHaveBeenCalledWith('condition', PART_CONDITIONS[0].id)
  })

  it('renders originality options and updates store on select', async () => {
    await render(<PartStep1Category {...defaultProps} />)
    
    const originalOption = screen.getByTestId(`originality-${PART_ORIGINALITY_OPTIONS[0].value.toString()}`)
    expect(originalOption).toBeTruthy()

    fireEvent.press(originalOption)
    expect(mockOnUpdateField).toHaveBeenCalledWith('isOriginal', PART_ORIGINALITY_OPTIONS[0].value)
  })

  it('renders inline errors when passed via errors prop', async () => {
    const propsWithError = {
      ...defaultProps,
      errors: {
        listingType: 'اختر نوع الإعلان',
        partCategory: 'اختر فئة القطعة',
      }
    }
    await render(<PartStep1Category {...propsWithError} />)
    
    expect(screen.getByText(/اختر نوع الإعلان/i)).toBeTruthy()
    expect(screen.getByText(/اختر فئة القطعة/i)).toBeTruthy()
  })
})
