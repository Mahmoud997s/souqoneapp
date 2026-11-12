import React from 'react'
import { render } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CarCard } from '../../components/cars/CarCard'
import { BusCard } from '../../components/buses/BusCard'
import { Listing } from '../../types/listing.types'

jest.mock('expo-image', () => ({
  Image: () => <></>,
}))

jest.mock('expo-blur', () => ({
  BlurView: ({ children }: any) => <>{children}</>,
}))

jest.mock('../../api/favorites', () => ({
  favoritesApi: {
    add: jest.fn().mockResolvedValue({ data: { favorited: true } }),
    getAll: jest.fn().mockResolvedValue({ data: [] }),
    check: jest.fn().mockResolvedValue({ data: { favorited: false } }),
  },
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

const mockCar: Listing = {
  id: 'car-test-1',
  title: 'سيارة تجريبية طويلة جداً لسطرين كاملين في عنوان البطاقة',
  description: 'وصف تجريبي',
  price: 5500,
  currency: 'OMR',
  listingType: 'SALE',
  condition: 'USED',
  governorate: 'مسقط',
  city: 'السيب',
  isPremium: false,
  views: 10,
  user: { id: 'u1', username: 'tester', isVerified: true },
  images: [{ id: 'img-1', url: 'https://example.com/car.jpg', isPrimary: true, order: 0 }],
  car: {
    brandId: 'b1',
    modelId: 'm1',
    year: 2022,
    mileage: 125000,
    fuelType: 'PETROL',
    transmission: 'AUTOMATIC',
    color: 'أبيض',
  },
  createdAt: new Date().toISOString(),
}

const mockBus: Listing = {
  id: 'bus-test-1',
  title: 'حافلة نقل ركاب تجريبية طويلة لسطرين كاملين في البطاقة',
  description: 'وصف حافلة تجريبية',
  price: 12000,
  currency: 'OMR',
  listingType: 'SALE',
  condition: 'USED',
  governorate: 'مسقط',
  city: 'بوشر',
  isPremium: false,
  views: 15,
  user: { id: 'u2', username: 'bus_tester', isVerified: true },
  images: [{ id: 'img-2', url: 'https://example.com/bus.jpg', isPrimary: true, order: 0 }],
  createdAt: new Date().toISOString(),
  make: 'تويوتا كوستر',
  model: 'كوستر',
  mileage: 180000,
  transmission: 'MANUAL',
} as unknown as Listing

describe('D-300: CarCard & BusCard Titles and Locale Verification', () => {
  const mockOnPress = jest.fn()

  it('CarCard defaults to titleNumberOfLines = 2 when omitted', async () => {
    const { getByText } = await render(<CarCard item={mockCar} onPress={mockOnPress} />, { wrapper: createWrapper() })
    const titleElement = getByText(mockCar.title)
    expect(titleElement.props.numberOfLines).toBe(2)
  })

  it('CarCard respects explicit titleNumberOfLines = 1 when provided', async () => {
    const { getByText } = await render(<CarCard item={mockCar} onPress={mockOnPress} titleNumberOfLines={1} />, { wrapper: createWrapper() })
    const titleElement = getByText(mockCar.title)
    expect(titleElement.props.numberOfLines).toBe(1)
  })

  it('BusCard defaults to titleNumberOfLines = 2 when omitted', async () => {
    const { getByText } = await render(<BusCard item={mockBus} onPress={mockOnPress} />, { wrapper: createWrapper() })
    const titleElement = getByText(mockBus.title)
    expect(titleElement.props.numberOfLines).toBe(2)
  })

  it('BusCard respects explicit titleNumberOfLines = 1 when provided', async () => {
    const { getByText } = await render(<BusCard item={mockBus} onPress={mockOnPress} titleNumberOfLines={1} />, { wrapper: createWrapper() })
    const titleElement = getByText(mockBus.title)
    expect(titleElement.props.numberOfLines).toBe(1)
  })

  it('CarCard renders formatted mileage with arabic app locale (ar)', async () => {
    const { getByText } = await render(<CarCard item={mockCar} onPress={mockOnPress} />, { wrapper: createWrapper() })
    const expectedMileage = `${(125000).toLocaleString('ar')} كم`
    expect(getByText(expectedMileage)).toBeTruthy()
  })

  it('BusCard renders formatted mileage with arabic app locale (ar)', async () => {
    const { getByText } = await render(<BusCard item={mockBus} onPress={mockOnPress} />, { wrapper: createWrapper() })
    const expectedMileage = `${(180000).toLocaleString('ar')} كم`
    expect(getByText(expectedMileage)).toBeTruthy()
  })
})
