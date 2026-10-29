import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { EquipCard } from '../../../src/components/cards/EquipCard'
import { mapEquipmentToCard } from '../../../src/utils/mappers'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('EquipCard - Field Parity with old CarCard and Enhancements', () => {
  it('correctly displays all sale equipment fields: price, location, condition, make, year, hours', async () => {
    const rawBackendSaleEquipment = {
      id: 'eq-sale-1',
      title: 'حفارة كاتربيلر 320D',
      equipmentType: 'EXCAVATOR',
      make: 'Caterpillar',
      model: '320D',
      year: 2021,
      hoursUsed: 3500,
      condition: 'USED',
      price: 25000,
      currency: 'ر.ع.',
      listingType: 'EQUIPMENT_SALE',
      city: 'السيب',
      governorate: 'مسقط',
      isPremium: true,
      images: ['https://img.souqone.app/eq1.jpg'],
    }

    const mappedItem = mapEquipmentToCard(rawBackendSaleEquipment)

    await render(
      <EquipCard
        item={mappedItem as any}
        onPress={jest.fn()}
        fullWidth
        showChips
        maxChips={4}
      />,
      { wrapper: createWrapper() }
    )

    // 1. Title is displayed
    expect(screen.getByText('حفارة كاتربيلر 320D')).toBeTruthy()

    // 2. Price is formatted in OMR
    expect(screen.getByText('25000 ر.ع')).toBeTruthy()

    // 3. Location is formatted
    expect(screen.getByText('مسقط، السيب')).toBeTruthy()

    // 4. Condition badge is displayed
    expect(screen.getByText('مستعملة')).toBeTruthy()

    // 5. Specs pills are displayed with hours in 'س' (not kilometers 'كم' like old CarCard)
    expect(screen.getByText('Caterpillar')).toBeTruthy()
    expect(screen.getByText('2021')).toBeTruthy()
    expect(screen.getByText('3500 س')).toBeTruthy()

    // 6. Premium badge is displayed
    expect(screen.getByText('مميز')).toBeTruthy()
  })

  it('correctly displays all rental equipment fields: daily price with / يوم, rental badge, driver badge', async () => {
    const rawBackendRentEquipment = {
      id: 'eq-rent-1',
      title: 'رافعة شوكية تويوتا 3 طن',
      equipmentType: 'FORKLIFT',
      make: 'Toyota',
      model: '8FD30',
      year: 2023,
      hoursUsed: 400,
      condition: 'LIKE_NEW',
      dailyPrice: 35,
      currency: 'ر.ع.',
      listingType: 'EQUIPMENT_RENT',
      withDriver: true,
      city: 'صحار',
      governorate: 'شمال الباطنة',
      images: ['https://img.souqone.app/eq2.jpg'],
    }

    const mappedItem = {
      ...mapEquipmentToCard(rawBackendRentEquipment),
      withDriver: true,
    }

    await render(
      <EquipCard
        item={mappedItem as any}
        onPress={jest.fn()}
        fullWidth
        showChips
        maxChips={4}
      />,
      { wrapper: createWrapper() }
    )

    // 1. Title
    expect(screen.getByText('رافعة شوكية تويوتا 3 طن')).toBeTruthy()

    // 2. Rental Price with period (/ يوم)
    expect(screen.getByText('35 ر.ع / يوم')).toBeTruthy()

    // 3. Rental Badge
    expect(screen.getByText('إيجار')).toBeTruthy()

    // 4. With Driver Badge
    expect(screen.getByText('مع سائق/مشغل')).toBeTruthy()

    // 5. Condition Pill (for non-sale)
    expect(screen.getByText('شبه جديدة')).toBeTruthy()

    // 6. Hours worked in 'س'
    expect(screen.getByText('400 س')).toBeTruthy()
  })
})
