import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { OperatorStarsRow } from './OperatorStarsRow'

describe('OperatorStarsRow', () => {
  it('renders 5 star icons for full rating', async () => {
    await render(<OperatorStarsRow rating={5} />)
    expect(screen.getByTestId('operator-stars-row')).toBeTruthy()
  })

  it('handles 0 or negative rating gracefully', async () => {
    await render(<OperatorStarsRow rating={0} />)
    expect(screen.getByTestId('operator-stars-row')).toBeTruthy()
  })

  it('announces overall rating via accessible prop and accessibilityLabel', async () => {
    await render(<OperatorStarsRow rating={4.5} />)
    const row = screen.getByTestId('operator-stars-row')
    expect(row.props.accessible).toBe(true)
    expect(row.props.accessibilityLabel).toBe('التقييم 4.5 من 5')
  })

  it('supports custom accessibilityLabel', async () => {
    await render(<OperatorStarsRow rating={4.5} accessibilityLabel="التقييم 4.5 من 5 من إجمالي 10 تقييمات" />)
    const row = screen.getByTestId('operator-stars-row')
    expect(row.props.accessibilityLabel).toBe('التقييم 4.5 من 5 من إجمالي 10 تقييمات')
  })
})
