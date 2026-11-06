import React from 'react'
import { StyleSheet } from 'react-native'
import { render, screen } from '@testing-library/react-native'
import { ServiceScheduleCard } from '../ServiceScheduleCard'
import type { ServiceScheduleViewModel } from '../../../../types/serviceDetailViewModel.types'
import { Colors } from '../../../../constants/colors'
import { Spacing } from '../../../../constants/spacing'

jest.setTimeout(15000)

describe('ServiceScheduleCard', () => {
  const fullSchedule: ServiceScheduleViewModel = {
    hasSchedule: true,
    workingDays: ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء'],
    workingDaysSummary: 'السبت - الأربعاء (5 أيام)',
    workingHoursLabel: '08:00 ص - 05:00 م',
    isOpenHoursProvided: true,
  }

  it('renders unspecified schedule card when hasSchedule is false (Decision d6, D-232)', async () => {
    const emptySchedule: ServiceScheduleViewModel = {
      hasSchedule: false,
      workingDays: [],
      workingDaysSummary: '',
      workingHoursLabel: undefined,
      isOpenHoursProvided: false,
    }
    await render(<ServiceScheduleCard schedule={emptySchedule} />)
    expect(screen.getByTestId('service-schedule-card')).toBeTruthy()
    expect(screen.getByTestId('schedule-unspecified')).toBeTruthy()
    expect(screen.getByText('غير محدد')).toBeTruthy()
  })

  it('renders card with working days chips and hours label', async () => {
    await render(<ServiceScheduleCard schedule={fullSchedule} />)

    expect(screen.getByTestId('service-schedule-card')).toBeTruthy()
    expect(screen.getByText('أوقات وجدول العمل')).toBeTruthy()
    expect(screen.getByText('السبت - الأربعاء (5 أيام)')).toBeTruthy()
    expect(screen.getByText('08:00 ص - 05:00 م')).toBeTruthy()

    // Check individual day chips
    expect(screen.getByText('السبت')).toBeTruthy()
    expect(screen.getByText('الأحد')).toBeTruthy()
    expect(screen.getByText('الأربعاء')).toBeTruthy()
  })

  it('strictly omits home service badge (header badge is single source of truth, D-182a)', async () => {
    await render(
      <ServiceScheduleCard schedule={fullSchedule} isHomeService={true} />,
    )
    expect(
      screen.queryByText('خدمة منزلية / متنقلة متاحة عند الطلب'),
    ).toBeNull()
  })

  it('renders unspecified schedule card and omits home service badge when hasSchedule is false (D-182a, D-232)', async () => {
    const emptySchedule: ServiceScheduleViewModel = {
      hasSchedule: false,
      workingDays: [],
      workingDaysSummary: '',
      workingHoursLabel: undefined,
      isOpenHoursProvided: false,
    }
    await render(
      <ServiceScheduleCard schedule={emptySchedule} isHomeService={true} />,
    )

    expect(screen.getByTestId('service-schedule-card')).toBeTruthy()
    expect(screen.getByTestId('schedule-unspecified')).toBeTruthy()
    expect(
      screen.queryByText('خدمة منزلية / متنقلة متاحة عند الطلب'),
    ).toBeNull()
  })

  describe('Card Spacing and Visual Tokens (D-170b)', () => {
    it('applies Spacing.space4 horizontal margin and Spacing.space2 vertical margin (Req a)', async () => {
      await render(<ServiceScheduleCard schedule={fullSchedule} />)
      const card = screen.getByTestId('service-schedule-card')
      const flatStyle = StyleSheet.flatten(card.props.style)
      expect(flatStyle.marginHorizontal).toBe(Spacing.space4)
      expect(flatStyle.marginVertical).toBe(Spacing.space2)
    })

    it('uses Colors.white background and card border matching Cars and Parts (Req b)', async () => {
      await render(<ServiceScheduleCard schedule={fullSchedule} />)
      const card = screen.getByTestId('service-schedule-card')
      const flatStyle = StyleSheet.flatten(card.props.style)
      expect(flatStyle.backgroundColor).toBe(Colors.white)
      expect(flatStyle.borderWidth).toBe(1)
      expect(flatStyle.borderColor).toBe(Colors.border)
    })
  })
})
