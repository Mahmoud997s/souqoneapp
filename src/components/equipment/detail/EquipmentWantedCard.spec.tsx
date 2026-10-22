import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { EquipmentWantedCard, formatCalendarDate } from './EquipmentWantedCard'
import type { EquipmentWantedView } from '../../../types/equipmentDetailViewModel.types'

describe('EquipmentWantedCard', () => {
  describe('formatCalendarDate helper', () => {
    it('formats valid ISO date into YYYY/MM/DD', () => {
      expect(formatCalendarDate('2026-11-05T00:00:00.000Z')).toBe('2026/11/05')
      expect(formatCalendarDate('2026-03-01')).toBe('2026/03/01')
    })

    it('returns undefined for invalid, non-string, or empty dates', () => {
      expect(formatCalendarDate('invalid-date-string')).toBeUndefined()
      expect(formatCalendarDate('')).toBeUndefined()
      expect(formatCalendarDate('   ')).toBeUndefined()
      expect(formatCalendarDate(null)).toBeUndefined()
      expect(formatCalendarDate(undefined)).toBeUndefined()
    })
  })

  it('returns null when wanted is null', async () => {
    const res = await render(<EquipmentWantedCard wanted={null} />)
    expect(res.toJSON()).toBeNull()
  })

  it('returns null when all wanted fields are missing or empty', async () => {
    const emptyWanted: EquipmentWantedView = {
      budgetRangeFormatted: '',
      rentalDurationLabel: undefined,
      quantityFormatted: '',
      startDate: undefined,
      endDate: undefined,
      siteDetails: '   ',
    }

    const res = await render(<EquipmentWantedCard wanted={emptyWanted} />)
    expect(res.toJSON()).toBeNull()
  })

  it('renders all fields when fully populated', async () => {
    const wanted: EquipmentWantedView = {
      budgetRangeFormatted: '500 - 1,200 ر.ع',
      rentalDurationLabel: 'شهري',
      quantityFormatted: '2',
      startDate: '2026-11-01T00:00:00.000Z',
      endDate: '2027-02-01T00:00:00.000Z',
      siteDetails: 'مشروع إنشاءات في صحار الصناعية',
    }

    await render(<EquipmentWantedCard wanted={wanted} />)

    expect(screen.getByTestId('equipment-wanted-card')).toBeTruthy()
    expect(screen.getByText('تفاصيل الطلب')).toBeTruthy()

    expect(screen.getByTestId('wanted-row-budget')).toBeTruthy()
    expect(screen.getByText('الميزانية')).toBeTruthy()
    expect(screen.getByText('500 - 1,200 ر.ع')).toBeTruthy()

    expect(screen.getByTestId('wanted-row-duration')).toBeTruthy()
    expect(screen.getByText('مدة الإيجار')).toBeTruthy()
    expect(screen.getByText('شهري')).toBeTruthy()

    expect(screen.getByTestId('wanted-row-quantity')).toBeTruthy()
    expect(screen.getByText('الكمية')).toBeTruthy()
    expect(screen.getByText('2')).toBeTruthy()

    expect(screen.getByTestId('wanted-row-start-date')).toBeTruthy()
    expect(screen.getByText('تاريخ البدء')).toBeTruthy()
    expect(screen.getByText('2026/11/01')).toBeTruthy()

    expect(screen.getByTestId('wanted-row-end-date')).toBeTruthy()
    expect(screen.getByText('تاريخ الانتهاء')).toBeTruthy()
    expect(screen.getByText('2027/02/01')).toBeTruthy()

    expect(screen.getByTestId('wanted-row-site-details')).toBeTruthy()
    expect(screen.getByText('تفاصيل الموقع')).toBeTruthy()
    expect(screen.getByText('مشروع إنشاءات في صحار الصناعية')).toBeTruthy()
  })

  it('renders correctly when only budget is provided', async () => {
    const wanted: EquipmentWantedView = {
      budgetRangeFormatted: 'من 800 ر.ع',
    }

    await render(<EquipmentWantedCard wanted={wanted} />)

    expect(screen.getByTestId('equipment-wanted-card')).toBeTruthy()
    expect(screen.getByTestId('wanted-row-budget')).toBeTruthy()
    expect(screen.getByText('من 800 ر.ع')).toBeTruthy()

    expect(screen.queryByTestId('wanted-row-duration')).toBeNull()
    expect(screen.queryByTestId('wanted-row-quantity')).toBeNull()
    expect(screen.queryByTestId('wanted-row-start-date')).toBeNull()
    expect(screen.queryByTestId('wanted-row-end-date')).toBeNull()
    expect(screen.queryByTestId('wanted-row-site-details')).toBeNull()
  })

  it('hides invalid date strings without crashing or rendering "Invalid Date"', async () => {
    const wanted: EquipmentWantedView = {
      budgetRangeFormatted: 'حتى 1,000 ر.ع',
      startDate: 'not-a-valid-date',
      endDate: 'gibberish',
    }

    await render(<EquipmentWantedCard wanted={wanted} />)

    expect(screen.getByTestId('equipment-wanted-card')).toBeTruthy()
    expect(screen.getByText('حتى 1,000 ر.ع')).toBeTruthy()

    expect(screen.queryByTestId('wanted-row-start-date')).toBeNull()
    expect(screen.queryByTestId('wanted-row-end-date')).toBeNull()
    expect(screen.queryByText(/invalid/i)).toBeNull()
  })

  it('renders siteDetails when provided alone', async () => {
    const wanted: EquipmentWantedView = {
      siteDetails: 'موقع العمل: ولاية الدقم - المنطقة الاقتصادية',
    }

    await render(<EquipmentWantedCard wanted={wanted} />)

    expect(screen.getByTestId('equipment-wanted-card')).toBeTruthy()
    expect(screen.getByTestId('wanted-row-site-details')).toBeTruthy()
    expect(screen.getByText('تفاصيل الموقع')).toBeTruthy()
    expect(screen.getByText('موقع العمل: ولاية الدقم - المنطقة الاقتصادية')).toBeTruthy()
  })
})
