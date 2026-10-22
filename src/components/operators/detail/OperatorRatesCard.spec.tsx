import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { OperatorRatesCard } from './OperatorRatesCard'
import type { OperatorRatesView } from '../../../types/operatorDetailViewModel.types'

describe('OperatorRatesCard', () => {
  it('renders both daily and hourly rates with negotiable note', async () => {
    const rates: OperatorRatesView = {
      dailyRate: 40,
      dailyRateFormatted: '40 ر.ع',
      hourlyRate: 6,
      hourlyRateFormatted: '6 ر.ع',
      currency: 'ر.ع',
      isNegotiable: true,
      primaryLabel: '40 ر.ع / يوم',
      hasAnyRate: true,
    }

    await render(<OperatorRatesCard rates={rates} />)

    expect(screen.getByTestId('operator-rates-card')).toBeTruthy()
    expect(screen.getByTestId('operator-daily-rate-row')).toBeTruthy()
    expect(screen.getByTestId('operator-hourly-rate-row')).toBeTruthy()
    expect(screen.getByText('40 ر.ع')).toBeTruthy()
    expect(screen.getByText('6 ر.ع')).toBeTruthy()
    expect(screen.getByTestId('operator-rates-negotiable-note')).toBeTruthy()
  })

  it('renders daily rate only when hourly is missing and hides negotiable note when false', async () => {
    const rates: OperatorRatesView = {
      dailyRate: 50,
      dailyRateFormatted: '50 ر.ع',
      currency: 'ر.ع',
      isNegotiable: false,
      primaryLabel: '50 ر.ع / يوم',
      hasAnyRate: true,
    }

    await render(<OperatorRatesCard rates={rates} />)

    expect(screen.getByTestId('operator-daily-rate-row')).toBeTruthy()
    expect(screen.queryByTestId('operator-hourly-rate-row')).toBeNull()
    expect(screen.queryByTestId('operator-rates-negotiable-note')).toBeNull()
    expect(screen.getByText('50 ر.ع')).toBeTruthy()
  })

  it('renders hourly rate only when daily is missing', async () => {
    const rates: OperatorRatesView = {
      hourlyRate: 8,
      hourlyRateFormatted: '8 ر.ع',
      currency: 'ر.ع',
      isNegotiable: false,
      primaryLabel: '8 ر.ع / ساعة',
      hasAnyRate: true,
    }

    await render(<OperatorRatesCard rates={rates} />)

    expect(screen.queryByTestId('operator-daily-rate-row')).toBeNull()
    expect(screen.getByTestId('operator-hourly-rate-row')).toBeTruthy()
    expect(screen.getByText('8 ر.ع')).toBeTruthy()
  })

  it('renders fallback text when hasAnyRate is false', async () => {
    const rates: OperatorRatesView = {
      currency: 'ر.ع',
      isNegotiable: false,
      primaryLabel: 'السعر عند التواصل',
      hasAnyRate: false,
    }

    await render(<OperatorRatesCard rates={rates} />)

    expect(screen.getByTestId('operator-rates-empty')).toBeTruthy()
    expect(screen.queryByTestId('operator-daily-rate-row')).toBeNull()
    expect(screen.queryByTestId('operator-hourly-rate-row')).toBeNull()
    expect(screen.getByText('السعر عند التواصل')).toBeTruthy()
  })
})
