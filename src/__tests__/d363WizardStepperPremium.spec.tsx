import React from 'react'
import { StyleSheet } from 'react-native'
import { render } from '@testing-library/react-native'
import { Stepper } from '../components/ui/Stepper'
import { Colors } from '../constants/colors'

describe('D-363: Premium Wizard Stepper', () => {
  it('renders checkmark on done steps, outer ring + number on current step, hollow upcoming, 2px connectors, caption, and a11y label', async () => {
    const { getByTestId, getByText, queryByText, getByLabelText } = await render(
      <Stepper currentStep={3} totalSteps={5} title="بيانات الإعلان" variant="light" />
    )

    // Root a11y label
    expect(getByLabelText('الخطوة 3 من 5')).toBeTruthy()

    // Title + caption
    const title = getByText('بيانات الإعلان')
    const titleStyle = StyleSheet.flatten(title.props.style)
    expect(titleStyle.fontFamily).toBe('Almarai_700Bold')
    expect(titleStyle.fontSize).toBe(16)
    expect(titleStyle.color).toBe(Colors.text)
    expect(getByText('الخطوة 3 من 5')).toBeTruthy()

    // Done steps (1, 2): checkmark icon, no step number
    expect(getByTestId('stepper-check-1')).toBeTruthy()
    expect(getByTestId('stepper-check-2')).toBeTruthy()
    expect(queryByText('1')).toBeNull()
    expect(queryByText('2')).toBeNull()

    // Current step (3): number 3 + ring
    expect(getByText('3')).toBeTruthy()
    const ring = getByTestId('stepper-current-ring')
    const ringStyle = StyleSheet.flatten(ring.props.style)
    expect(ringStyle.width).toBe(38)
    expect(ringStyle.height).toBe(38)
    expect(ringStyle.borderColor).toBe(Colors.primary)

    // Upcoming steps (4, 5): hollow 1px border, muted number
    expect(getByText('4')).toBeTruthy()
    expect(getByText('5')).toBeTruthy()
    const step4Circle = StyleSheet.flatten(getByTestId('stepper-circle-4').props.style)
    expect(step4Circle.width).toBe(30)
    expect(step4Circle.borderWidth).toBe(1)
    expect(step4Circle.backgroundColor).toBe(Colors.transparent)

    // Connectors height 2
    const connector1 = StyleSheet.flatten(getByTestId('stepper-connector-1').props.style)
    expect(connector1.height).toBe(2)
  })

  it('omits caption when title is omitted and keeps dark variant rendering', async () => {
    const { queryByText, getByText } = await render(
      <Stepper currentStep={2} totalSteps={3} variant="dark" />
    )
    expect(queryByText('الخطوة 2 من 3')).toBeNull()
    expect(getByText('2')).toBeTruthy()
  })
})
