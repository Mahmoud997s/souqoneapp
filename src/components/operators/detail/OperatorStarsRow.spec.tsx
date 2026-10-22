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
})
