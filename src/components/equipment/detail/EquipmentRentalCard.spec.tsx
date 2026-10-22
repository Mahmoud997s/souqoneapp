import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { EquipmentRentalCard } from './EquipmentRentalCard'
import type { EquipmentRentalView } from '../../../types/equipmentDetailViewModel.types'

describe('EquipmentRentalCard', () => {
  it('returns null when rental is null', async () => {
    const res = await render(<EquipmentRentalCard rental={null} />)
    expect(res.toJSON()).toBeNull()
  })

  it('renders all fields when daily and monthly prices are present with operator and delivery', async () => {
    const rental: EquipmentRentalView = {
      dailyPrice: 120,
      dailyPriceFormatted: '120 ر.ع',
      monthlyPrice: 2500,
      monthlyPriceFormatted: '2,500 ر.ع',
      withOperator: true,
      deliveryAvailable: true,
    }

    await render(<EquipmentRentalCard rental={rental} />)

    expect(screen.getByTestId('equipment-rental-card')).toBeTruthy()
    expect(screen.getByText('شروط الإيجار')).toBeTruthy()

    // Daily price row
    expect(screen.getByTestId('rental-row-daily-price')).toBeTruthy()
    expect(screen.getByText('الأجر اليومي')).toBeTruthy()
    expect(screen.getByText('120 ر.ع')).toBeTruthy()

    // Monthly price row
    expect(screen.getByTestId('rental-row-monthly-price')).toBeTruthy()
    expect(screen.getByText('الأجر الشهري')).toBeTruthy()
    expect(screen.getByText('2,500 ر.ع')).toBeTruthy()

    // Operator row
    expect(screen.getByTestId('rental-row-operator')).toBeTruthy()
    expect(screen.getByText('المشغّل')).toBeTruthy()
    expect(screen.getByText('مع مشغّل')).toBeTruthy()

    // Delivery row
    expect(screen.getByTestId('rental-row-delivery')).toBeTruthy()
    expect(screen.getByText('التوصيل لموقع العمل')).toBeTruthy()
    expect(screen.getByText('متاح')).toBeTruthy()
  })

  it('renders only daily rate when monthly rate is missing', async () => {
    const rental: EquipmentRentalView = {
      dailyPrice: 80,
      dailyPriceFormatted: '80 ر.ع',
      withOperator: false,
      deliveryAvailable: true,
    }

    await render(<EquipmentRentalCard rental={rental} />)

    expect(screen.getByTestId('rental-row-daily-price')).toBeTruthy()
    expect(screen.getByText('80 ر.ع')).toBeTruthy()
    expect(screen.queryByTestId('rental-row-monthly-price')).toBeNull()

    // Operator & delivery still rendered
    expect(screen.getByText('بدون مشغّل')).toBeTruthy()
    expect(screen.getByText('متاح')).toBeTruthy()
  })

  it('renders only monthly rate when daily rate is missing', async () => {
    const rental: EquipmentRentalView = {
      monthlyPrice: 1800,
      monthlyPriceFormatted: '1,800 ر.ع',
      withOperator: true,
      deliveryAvailable: false,
    }

    await render(<EquipmentRentalCard rental={rental} />)

    expect(screen.queryByTestId('rental-row-daily-price')).toBeNull()
    expect(screen.getByTestId('rental-row-monthly-price')).toBeTruthy()
    expect(screen.getByText('1,800 ر.ع')).toBeTruthy()

    // Operator & delivery still rendered
    expect(screen.getByText('مع مشغّل')).toBeTruthy()
    expect(screen.getByText('غير متاح')).toBeTruthy()
  })

  it('hides both rate rows when neither is provided, but still shows operator and delivery rows', async () => {
    const rental: EquipmentRentalView = {
      withOperator: false,
      deliveryAvailable: false,
    }

    await render(<EquipmentRentalCard rental={rental} />)

    expect(screen.getByTestId('equipment-rental-card')).toBeTruthy()
    expect(screen.queryByTestId('rental-row-daily-price')).toBeNull()
    expect(screen.queryByTestId('rental-row-monthly-price')).toBeNull()

    expect(screen.getByTestId('rental-row-operator')).toBeTruthy()
    expect(screen.getByText('بدون مشغّل')).toBeTruthy()
    expect(screen.getByTestId('rental-row-delivery')).toBeTruthy()
    expect(screen.getByText('غير متاح')).toBeTruthy()
  })
})
