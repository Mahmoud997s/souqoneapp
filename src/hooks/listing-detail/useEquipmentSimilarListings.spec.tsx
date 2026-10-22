import { renderHook, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useEquipmentSimilarListings } from './useEquipmentSimilarListings'
import { equipmentApi } from '../../api/equipment'
import type { EquipmentSimilarItemApi } from '../../types/equipmentDetailApi.types'

jest.mock('../../api/equipment')

const mockSimilarItems: EquipmentSimilarItemApi[] = [
  {
    id: 'eq-sim-1',
    slug: 'cat-320',
    title: 'حفار كاتربيلر 320',
    equipmentType: 'EXCAVATOR',
    listingType: 'EQUIPMENT_SALE',
    price: 31000,
    currency: 'OMR',
    hoursUsed: 4200,
    images: [{ id: 'img-1', url: 'https://example.com/cat.jpg', isPrimary: true, order: 0 }],
    user: { id: 'user-2', displayName: 'مقاولات مسقط' },
    createdAt: '2026-10-21T00:00:00.000Z',
  },
]

describe('useEquipmentSimilarListings', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    jest.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  it('fetches and returns similar equipment items successfully', async () => {
    ;(equipmentApi.getSimilar as jest.Mock).mockResolvedValueOnce({
      data: mockSimilarItems,
    })

    const { result } = await renderHook(() => useEquipmentSimilarListings('eq-1', 4), { wrapper })

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.items).toEqual(mockSimilarItems)
    expect(result.current.isError).toBe(false)
    expect(equipmentApi.getSimilar).toHaveBeenCalledWith('eq-1', 4)
  })

  it('gracefully returns empty list without error on 404 response', async () => {
    const error404 = {
      response: { status: 404 },
    }
    ;(equipmentApi.getSimilar as jest.Mock).mockRejectedValueOnce(error404)

    const { result } = await renderHook(() => useEquipmentSimilarListings('eq-hidden', 8), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.items).toEqual([])
    expect(result.current.isError).toBe(false)
  })

  it('sets isError: true on other server errors', async () => {
    const error500 = {
      response: { status: 500 },
      message: 'Server error',
    }
    ;(equipmentApi.getSimilar as jest.Mock).mockRejectedValueOnce(error500)

    const { result } = await renderHook(() => useEquipmentSimilarListings('eq-err', 8), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.isError).toBe(true)
    expect(result.current.items).toEqual([])
  })
})
