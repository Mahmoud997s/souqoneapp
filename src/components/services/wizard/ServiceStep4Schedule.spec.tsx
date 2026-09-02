import React from 'react'
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react-native'
import { ServiceStep4Schedule } from './ServiceStep4Schedule'
import { defaultServiceFormData, ServiceFormData } from '../../../store/serviceWizardStore'
import { WORKING_DAYS_AR } from '../../../constants/services'

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
        testID="mock-datetime-picker-confirm"
        onPress={() => {
          const testDate = new Date(2026, 0, 1, 8, 30) // 08:30
          props.onConfirm(testDate)
        }}
      >
        <Text>Confirm Time</Text>
      </TouchableOpacity>
    )
  }
})

describe('ServiceStep4Schedule', () => {
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

  it('adds day to workingDays array when day chip is pressed', async () => {
    await render(<ServiceStep4Schedule {...defaultProps} />)

    const sundayChip = screen.getByTestId('day-chip-الأحد')
    await act(async () => {
      fireEvent.press(sundayChip)
    })

    expect(mockOnUpdateField).toHaveBeenCalledWith('workingDays', ['الأحد'])
  })

  it('removes day from workingDays array when already selected (toggle)', async () => {
    const props: { formData: ServiceFormData; errors: Record<string, string>; onUpdateField: jest.Mock } = {
      ...defaultProps,
      formData: {
        ...defaultServiceFormData,
        workingDays: ['السبت', 'الأحد'],
      },
    }

    await render(<ServiceStep4Schedule {...props} />)

    const sundayChip = screen.getByTestId('day-chip-الأحد')
    await act(async () => {
      fireEvent.press(sundayChip)
    })

    expect(mockOnUpdateField).toHaveBeenCalledWith('workingDays', ['السبت'])
  })

  it('fills all 7 days when "طوال أيام الأسبوع" preset is pressed', async () => {
    await render(<ServiceStep4Schedule {...defaultProps} />)

    const allDaysBtn = screen.getByTestId('preset-all-days')
    await act(async () => {
      fireEvent.press(allDaysBtn)
    })

    expect(mockOnUpdateField).toHaveBeenCalledWith('workingDays', WORKING_DAYS_AR)
  })

  it('fills 6 days (excluding Friday) when "من السبت للخميس" preset is pressed', async () => {
    await render(<ServiceStep4Schedule {...defaultProps} />)

    const satToThuBtn = screen.getByTestId('preset-sat-to-thu')
    await act(async () => {
      fireEvent.press(satToThuBtn)
    })

    const expectedDays = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس']
    expect(mockOnUpdateField).toHaveBeenCalledWith('workingDays', expectedDays)
  })

  it('opens picker and updates workingHoursOpen with HH:mm on confirm', async () => {
    await render(<ServiceStep4Schedule {...defaultProps} />)

    const openTimeBtn = screen.getByTestId('open-time-btn')
    await act(async () => {
      fireEvent.press(openTimeBtn)
    })

    const confirmBtn = screen.getByTestId('mock-datetime-picker-confirm')
    await act(async () => {
      fireEvent.press(confirmBtn)
    })

    expect(mockOnUpdateField).toHaveBeenCalledWith('workingHoursOpen', '08:30')
  })

  it('opens picker and updates workingHoursClose with HH:mm on confirm', async () => {
    await render(<ServiceStep4Schedule {...defaultProps} />)

    const closeTimeBtn = screen.getByTestId('close-time-btn')
    await act(async () => {
      fireEvent.press(closeTimeBtn)
    })

    const confirmBtn = screen.getByTestId('mock-datetime-picker-confirm')
    await act(async () => {
      fireEvent.press(confirmBtn)
    })

    expect(mockOnUpdateField).toHaveBeenCalledWith('workingHoursClose', '08:30')
  })

  it('clears opening time when clear button is pressed', async () => {
    const props = {
      ...defaultProps,
      formData: {
        ...defaultServiceFormData,
        workingHoursOpen: '08:00',
      },
    }

    await render(<ServiceStep4Schedule {...props} />)

    const clearBtn = screen.getByTestId('clear-open-time')
    await act(async () => {
      fireEvent.press(clearBtn)
    })

    expect(mockOnUpdateField).toHaveBeenCalledWith('workingHoursOpen', null)
  })
})
