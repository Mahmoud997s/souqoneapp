import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { ContractPercentRing, clampPercent } from './ContractPercentRing'

describe('ContractPercentRing', () => {
  it('clamps percentage values strictly between 0 and 100', () => {
    expect(clampPercent(-15)).toBe(0)
    expect(clampPercent(0)).toBe(0)
    expect(clampPercent(8)).toBe(8)
    expect(clampPercent(100)).toBe(100)
    expect(clampPercent(145)).toBe(100)
    expect(clampPercent(Number.NaN)).toBe(0)
  })

  it('renders 0% ring with full circumference offset and Arabic accessibility label', async () => {
    await render(<ContractPercentRing percent={0} size={32} />)

    const ring = screen.getByTestId('contract-percent-ring')
    expect(ring.props.accessibilityLabel).toBe('نسبة من السعر 0%')
    expect(ring.props.accessibilityValue).toEqual({ min: 0, max: 100, now: 0 })

    const progress = screen.getByTestId('contract-percent-ring-progress')
    const radius = (32 - 3.5) / 2
    const circumference = 2 * Math.PI * radius
    expect(progress.props.strokeDashoffset).toBeCloseTo(circumference, 4)
  })

  it('renders 8% ring with proportional strokeDashoffset and Arabic label', async () => {
    await render(<ContractPercentRing percent={8} size={36} />)

    const ring = screen.getByTestId('contract-percent-ring')
    expect(ring.props.accessibilityLabel).toBe('نسبة من السعر 8%')
    expect(ring.props.accessibilityValue).toEqual({ min: 0, max: 100, now: 8 })

    const progress = screen.getByTestId('contract-percent-ring-progress')
    const radius = (36 - 3.5) / 2
    const circumference = 2 * Math.PI * radius
    const expectedOffset = circumference - 0.08 * circumference
    expect(progress.props.strokeDashoffset).toBeCloseTo(expectedOffset, 4)
  })

  it('renders 100% ring with zero strokeDashoffset', async () => {
    await render(<ContractPercentRing percent={100} size={32} />)

    const ring = screen.getByTestId('contract-percent-ring')
    expect(ring.props.accessibilityLabel).toBe('نسبة من السعر 100%')
    expect(ring.props.accessibilityValue).toEqual({ min: 0, max: 100, now: 100 })

    const progress = screen.getByTestId('contract-percent-ring-progress')
    expect(Number(progress.props.strokeDashoffset ?? 0)).toBeCloseTo(0, 4)
  })

  it('clamps values > 100 to 100% and values < 0 to 0%', async () => {
    const { rerender } = await render(<ContractPercentRing percent={160} size={32} />)

    const ring = screen.getByTestId('contract-percent-ring')
    expect(ring.props.accessibilityLabel).toBe('نسبة من السعر 100%')
    expect(ring.props.accessibilityValue).toEqual({ min: 0, max: 100, now: 100 })

    await rerender(<ContractPercentRing percent={-25} size={32} />)
    expect(screen.getByTestId('contract-percent-ring').props.accessibilityLabel).toBe(
      'نسبة من السعر 0%'
    )
  })
})
