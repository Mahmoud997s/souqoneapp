import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { PartCard } from '../components/parts/PartCard'
import { PartsFilterBottomSheet } from '../components/parts/PartsFilterBottomSheet'
import {
  WARRANTY_DURATION_LABELS,
  QUANTITY_LABELS,
  VEHICLE_TYPE_LABELS,
  PART_WARRANTY_OPTIONS,
  VEHICLE_TYPE_FILTER_OPTIONS,
} from '../constants/parts'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

jest.mock('../components/ui/RangeSlider', () => ({
  RangeSlider: () => <></>,
}))
jest.mock('../../src/hooks/useCars', () => ({
  useBrands: () => ({ data: [] }),
}))
jest.mock('expo-image', () => ({
  Image: ({ source, style }: any) => <></>,
}))
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))
jest.mock('../../src/api/favorites', () => ({
  favoritesApi: {
    add: jest.fn(),
  },
}))
jest.mock('../../src/api/locations', () => ({
  locationsApi: {
    getGovernorates: jest.fn().mockResolvedValue([]),
    getWilayas: jest.fn().mockResolvedValue([]),
  },
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

const mockPartItem = {
  id: 'part-p11-1',
  title: 'سفايف كامري أصلية',
  price: 45,
  hasWarranty: true,
  warrantyDuration: 'SIX_MONTHS',
  quantity: 'ONE',
  compatibleVehicleTypes: ['CAR', 'BUS'],
  partCategory: 'BRAKES',
  condition: 'NEW',
  partNumber: '04465-33470',
  images: [],
}

describe('Phase 11: PartCard & Filters Read Path', () => {
  it('centralized constants export valid lookups matching options', () => {
    expect(WARRANTY_DURATION_LABELS.SIX_MONTHS).toBe('6 أشهر')
    expect(QUANTITY_LABELS.ONE).toBe('1')
    expect(VEHICLE_TYPE_LABELS.CAR).toBe('سيارات')
    expect(VEHICLE_TYPE_LABELS.BUS).toBe('باصات')
    expect(VEHICLE_TYPE_LABELS.EQUIPMENT).toBe('معدات')
    expect(PART_WARRANTY_OPTIONS).toHaveLength(2)
    expect(VEHICLE_TYPE_FILTER_OPTIONS).toHaveLength(3)
  })

  it('PartCard renders warranty and vehicle types pills when showChips=true', async () => {
    await render(
      <PartCard
        item={mockPartItem}
        onPress={jest.fn()}
        fullWidth
        showChips
        maxChips={5}
      />,
      { wrapper: createWrapper() }
    )

    expect(screen.getByText('سفايف كامري أصلية')).toBeTruthy()
    expect(screen.getByText('6 أشهر')).toBeTruthy()
    expect(screen.getByText('سيارات، باصات')).toBeTruthy()
  })

  it('PartCard handles maxChips cutoff and renders +N badge correctly', async () => {
    await render(
      <PartCard
        item={mockPartItem}
        onPress={jest.fn()}
        fullWidth
        showChips
        maxChips={2}
      />,
      { wrapper: createWrapper() }
    )

    // With maxChips=2, remaining chips show +N
    expect(screen.getByText('+3')).toBeTruthy()
  })

  it('PartsFilterBottomSheet displays hasWarranty and compatibleVehicleType correctly', async () => {
    const onApplyMock = jest.fn()

    await render(
      <PartsFilterBottomSheet
        visible={true}
        onClose={jest.fn()}
        initialFilters={{
          hasWarranty: true,
          compatibleVehicleType: 'CAR',
        }}
        onApplyFilters={onApplyMock}
      />,
      { wrapper: createWrapper() }
    )

    // Click "المزيد من الفلاتر" to expose expanded sections
    await fireEvent.press(screen.getByText('المزيد من الفلاتر'))

    // The selectors should show current values
    expect(await screen.findByText('يوجد ضمان')).toBeTruthy()
    expect(await screen.findByText('سيارات')).toBeTruthy()
  })
})
