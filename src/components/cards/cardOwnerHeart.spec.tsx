import React from 'react'
import { render } from '@testing-library/react-native'
import { ListingCardBase } from '../ui/ListingCardBase'
import { UnifiedCard } from './UnifiedCard'
import { CarCard } from '../cars/CarCard'
import { BusCard } from '../buses/BusCard'
import { EquipCard } from './EquipCard'
import { PartCard } from '../parts/PartCard'
import { ServiceCard } from '../services/ServiceCard'
import { useAuthStore } from '../../store/authStore'
import { useFavoriteToggle } from '../../features/favorites/useFavoriteToggle'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

jest.mock('expo-image', () => ({
  Image: () => <></>,
}))

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
  router: { push: jest.fn() },
}))

jest.mock('../../features/favorites/useFavoriteToggle', () => ({
  useFavoriteToggle: jest.fn(() => ({
    isFavorite: false,
    isBusy: false,
    toggle: jest.fn(),
  })),
}))

jest.mock('../../hooks/useCars', () => ({
  useBrands: () => ({ data: [] }),
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('Card favorite heart - hide for owner', () => {
  const CURRENT_USER = {
    id: 'user-owner-100',
    username: 'owner',
    displayName: 'Owner User',
    phone: '+96891234567',
  }

  const mockToggle = jest.fn()

  beforeEach(() => {
    mockToggle.mockReset()
    ;(useFavoriteToggle as jest.Mock).mockReturnValue({
      isFavorite: false,
      isBusy: false,
      toggle: mockToggle,
    })
    useAuthStore.setState({ user: CURRENT_USER as any, isLoggedIn: true, isGuest: false })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('ListingCardBase (all verticals)', () => {
    it('hides favorite heart when current user owns the car listing (item.user.id)', async () => {
      const carItem = {
        id: 'car-1',
        title: 'Toyota Camry 2022',
        user: { id: CURRENT_USER.id },
      }

      const { queryByTestId } = await render(
        <ListingCardBase
          item={carItem}
          title="Toyota Camry 2022"
          priceLabel="5,000 OMR"
          onPress={jest.fn()}
          favoriteType="LISTING"
        />,
        { wrapper: createWrapper() }
      )

      expect(queryByTestId('listing-card-favorite')).toBeNull()
    })

    it('hides favorite heart when current user owns the bus listing (item.userId)', async () => {
      const busItem = {
        id: 'bus-1',
        title: 'Toyota Coaster 2021',
        userId: CURRENT_USER.id,
      }

      const { queryByTestId } = await render(
        <ListingCardBase
          item={busItem}
          title="Toyota Coaster 2021"
          priceLabel="12,000 OMR"
          onPress={jest.fn()}
          favoriteType="BUS_LISTING"
        />,
        { wrapper: createWrapper() }
      )

      expect(queryByTestId('listing-card-favorite')).toBeNull()
    })

    it('hides favorite heart when current user owns the equipment listing (item.raw.userId)', async () => {
      const eqItem = {
        id: 'eq-1',
        title: 'Caterpillar Excavator',
        raw: { userId: CURRENT_USER.id },
      }

      const { queryByTestId } = await render(
        <ListingCardBase
          item={eqItem}
          title="Caterpillar Excavator"
          priceLabel="25,000 OMR"
          onPress={jest.fn()}
          favoriteType="EQUIPMENT_LISTING"
        />,
        { wrapper: createWrapper() }
      )

      expect(queryByTestId('listing-card-favorite')).toBeNull()
    })

    it('hides favorite heart when current user owns the spare part listing (item.sellerId)', async () => {
      const partItem = {
        id: 'part-1',
        title: 'Brake Pads',
        sellerId: CURRENT_USER.id,
      }

      const { queryByTestId } = await render(
        <ListingCardBase
          item={partItem}
          title="Brake Pads"
          priceLabel="30 OMR"
          onPress={jest.fn()}
          favoriteType="SPARE_PART"
        />,
        { wrapper: createWrapper() }
      )

      expect(queryByTestId('listing-card-favorite')).toBeNull()
    })

    it('hides favorite heart when current user owns the car service listing (item.userId)', async () => {
      const serviceItem = {
        id: 'svc-1',
        title: 'Oil Change',
        userId: CURRENT_USER.id,
      }

      const { queryByTestId } = await render(
        <ListingCardBase
          item={serviceItem}
          title="Oil Change"
          priceLabel="15 OMR"
          onPress={jest.fn()}
          favoriteType="CAR_SERVICE"
        />,
        { wrapper: createWrapper() }
      )

      expect(queryByTestId('listing-card-favorite')).toBeNull()
    })

    it('shows favorite heart when listing belongs to another user', async () => {
      const anotherItem = {
        id: 'car-other',
        title: 'Nissan Patrol',
        user: { id: 'other-user-999' },
      }

      const { getByTestId } = await render(
        <ListingCardBase
          item={anotherItem}
          title="Nissan Patrol"
          priceLabel="18,000 OMR"
          onPress={jest.fn()}
          favoriteType="LISTING"
        />,
        { wrapper: createWrapper() }
      )

      expect(getByTestId('listing-card-favorite')).toBeTruthy()
    })

    it('shows favorite heart when user is logged out (guest mode)', async () => {
      useAuthStore.setState({ user: null, isLoggedIn: false, isGuest: true })

      const item = {
        id: 'car-guest-view',
        title: 'Honda Accord',
        user: { id: CURRENT_USER.id },
      }

      const { getByTestId } = await render(
        <ListingCardBase
          item={item}
          title="Honda Accord"
          priceLabel="4,000 OMR"
          onPress={jest.fn()}
          favoriteType="LISTING"
        />,
        { wrapper: createWrapper() }
      )

      expect(getByTestId('listing-card-favorite')).toBeTruthy()
    })
  })

  describe('Vertical Card wrappers', () => {
    it('CarCard: hides heart for owner, shows for visitor', async () => {
      const ownedCar: any = { id: 'c-1', title: 'Car', price: 1000, user: { id: CURRENT_USER.id } }
      const visitorCar: any = { id: 'c-2', title: 'Car', price: 1000, user: { id: 'other' } }

      const { queryByTestId: queryOwned } = await render(
        <CarCard item={ownedCar} onPress={jest.fn()} />,
        { wrapper: createWrapper() }
      )
      expect(queryOwned('listing-card-favorite')).toBeNull()

      const { getByTestId: getVisitor } = await render(
        <CarCard item={visitorCar} onPress={jest.fn()} />,
        { wrapper: createWrapper() }
      )
      expect(getVisitor('listing-card-favorite')).toBeTruthy()
    })

    it('BusCard: hides heart for owner, shows for visitor', async () => {
      const ownedBus: any = { id: 'b-1', title: 'Bus', price: 2000, userId: CURRENT_USER.id }
      const visitorBus: any = { id: 'b-2', title: 'Bus', price: 2000, userId: 'other' }

      const { queryByTestId: queryOwned } = await render(
        <BusCard item={ownedBus} onPress={jest.fn()} />,
        { wrapper: createWrapper() }
      )
      expect(queryOwned('listing-card-favorite')).toBeNull()

      const { getByTestId: getVisitor } = await render(
        <BusCard item={visitorBus} onPress={jest.fn()} />,
        { wrapper: createWrapper() }
      )
      expect(getVisitor('listing-card-favorite')).toBeTruthy()
    })

    it('EquipCard: hides heart for owner, shows for visitor', async () => {
      const ownedEq: any = { id: 'e-1', title: 'Equip', price: 3000, userId: CURRENT_USER.id }
      const visitorEq: any = { id: 'e-2', title: 'Equip', price: 3000, userId: 'other' }

      const { queryByTestId: queryOwned } = await render(
        <EquipCard item={ownedEq} onPress={jest.fn()} />,
        { wrapper: createWrapper() }
      )
      expect(queryOwned('listing-card-favorite')).toBeNull()

      const { getByTestId: getVisitor } = await render(
        <EquipCard item={visitorEq} onPress={jest.fn()} />,
        { wrapper: createWrapper() }
      )
      expect(getVisitor('listing-card-favorite')).toBeTruthy()
    })

    it('PartCard: hides heart for owner, shows for visitor', async () => {
      const ownedPart: any = { id: 'p-1', title: 'Part', price: 50, sellerId: CURRENT_USER.id }
      const visitorPart: any = { id: 'p-2', title: 'Part', price: 50, sellerId: 'other' }

      const { queryByTestId: queryOwned } = await render(
        <PartCard item={ownedPart} onPress={jest.fn()} />,
        { wrapper: createWrapper() }
      )
      expect(queryOwned('listing-card-favorite')).toBeNull()

      const { getByTestId: getVisitor } = await render(
        <PartCard item={visitorPart} onPress={jest.fn()} />,
        { wrapper: createWrapper() }
      )
      expect(getVisitor('listing-card-favorite')).toBeTruthy()
    })

    it('ServiceCard: hides heart for owner, shows for visitor', async () => {
      const ownedSvc: any = { id: 's-1', title: 'Service', price: 20, raw: { userId: CURRENT_USER.id } }
      const visitorSvc: any = { id: 's-2', title: 'Service', price: 20, raw: { userId: 'other' } }

      const { queryByTestId: queryOwned } = await render(
        <ServiceCard item={ownedSvc} onPress={jest.fn()} />,
        { wrapper: createWrapper() }
      )
      expect(queryOwned('listing-card-favorite')).toBeNull()

      const { getByTestId: getVisitor } = await render(
        <ServiceCard item={visitorSvc} onPress={jest.fn()} />,
        { wrapper: createWrapper() }
      )
      expect(getVisitor('listing-card-favorite')).toBeTruthy()
    })
  })

  describe('UnifiedCard (compact mode)', () => {
    it('hides compact heart when current user owns the item', async () => {
      const item = {
        id: 'comp-1',
        title: 'Compact Owned Item',
        images: ['https://example.com/img.jpg'],
        category: 'cars',
        raw: { sellerId: CURRENT_USER.id },
      }

      const { queryByTestId } = await render(
        <UnifiedCard item={item as any} compact={true} onPress={jest.fn()} />,
        { wrapper: createWrapper() }
      )

      expect(queryByTestId('unified-compact-heart')).toBeNull()
    })

    it('shows compact heart when item belongs to another user', async () => {
      const item = {
        id: 'comp-2',
        title: 'Compact Visitor Item',
        images: ['https://example.com/img.jpg'],
        category: 'cars',
        raw: { sellerId: 'other-user-888' },
      }

      const { getByTestId } = await render(
        <UnifiedCard item={item as any} compact={true} onPress={jest.fn()} />,
        { wrapper: createWrapper() }
      )

      expect(getByTestId('unified-compact-heart')).toBeTruthy()
    })
  })
})
