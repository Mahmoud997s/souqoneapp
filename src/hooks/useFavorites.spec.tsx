import React from 'react'
import { renderHook, waitFor, cleanup } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useFavorites } from './useListings'
import { favoritesApi } from '../api/favorites'

jest.mock('../api/favorites', () => ({
  favoritesApi: {
    getAll: jest.fn(),
  },
}))

describe('useFavorites (Filtering & Mapping)', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    jest.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
      },
    })
  })

  afterEach(() => {
    queryClient.clear()
    cleanup()
  })

  function createWrapper() {
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }

  it('maps OPERATOR_LISTING favorites rows via mapOperatorToCard, skips deleted entities, and keeps supported items', async () => {
    ;(favoritesApi.getAll as jest.Mock).mockResolvedValueOnce({
      data: [
        {
          id: 'fav-1',
          entityType: 'OPERATOR_LISTING',
          entityId: 'op-101',
          operatorListing: {
            id: 'op-101',
            title: 'مشغل رافعة محترف',
            dailyRate: 45,
            currency: 'OMR',
            operatorType: 'OPERATOR',
            experienceYears: 6,
            governorate: 'مسقط',
            images: [],
          },
        },
        {
          id: 'fav-1b',
          entityType: 'OPERATOR_LISTING',
          entityId: 'op-deleted-1',
          // Deleted operator: no operatorListing and no entity
        },
        {
          id: 'fav-2',
          entityType: 'BUS_LISTING',
          entityId: 'bus-200',
          busListing: {
            id: 'bus-200',
            title: 'حافلة ميتسوبيشي روزا',
            price: 18000,
            currency: 'OMR',
            busType: 'ROSA',
            capacity: 26,
            governorate: 'مسقط',
            images: [],
          },
        },
        {
          id: 'fav-3',
          entityType: 'EQUIPMENT_LISTING',
          entityId: 'eq-300',
          equipmentListing: {
            id: 'eq-300',
            title: 'بوبكات S570',
            price: 12000,
            currency: 'OMR',
            equipmentType: 'SKID_STEER',
            governorate: 'صحار',
            images: [],
          },
        },
        {
          id: 'fav-4',
          entityType: 'LISTING',
          entityId: 'deleted-1',
          // No underlying entity (deleted from db)
        },
      ],
    })

    const wrapper = createWrapper()
    const { result } = await renderHook(() => useFavorites(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
      expect(result.current.data).toBeDefined()
    })

    const items = result.current.data || []
    expect(items).toHaveLength(3)
    expect(items[0].id).toBe('op-101')
    expect(items[0].category).toBe('operators')
    expect(items[0].listingType).toBe('OPERATOR')
    expect(items[1].id).toBe('bus-200')
    expect(items[1].category).toBe('buses')
    expect(items[2].id).toBe('eq-300')
    expect(items[2].category).toBe('equipment')
    expect(items.some((i: any) => i.id === 'op-deleted-1' || i.id === 'deleted-1')).toBe(false)
  })
})
