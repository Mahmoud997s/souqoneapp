import React from 'react'
import { render, waitFor, act } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useSimilarListings, UseSimilarListingsResult, SimilarCarItem } from './useSimilarListings'
import { listingsApi } from '../../api/listings'

jest.mock('../../api/listings', () => ({
  listingsApi: {
    getSimilar: jest.fn(),
  },
}))

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  })
}

function renderSimilarListingsHook(
  id: string,
  limit: number | undefined,
  queryClient: QueryClient
) {
  let hookValue: UseSimilarListingsResult | undefined

  function Consumer() {
    hookValue = limit !== undefined ? useSimilarListings(id, limit) : useSimilarListings(id)
    return null
  }

  const rendered = render(
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(Consumer)
    )
  )

  return {
    get current(): UseSimilarListingsResult {
      if (!hookValue) {
        throw new Error('Hook value not yet populated')
      }
      return hookValue
    },
    ...rendered,
  }
}

describe('useSimilarListings', () => {
  const mockItems: SimilarCarItem[] = [
    {
      id: 'sim-1',
      title: 'تويوتا لاندكروزر 2022',
      description: 'سيارة نظيفة جداً',
      price: 28000,
      currency: 'OMR',
      listingType: 'SALE',
      condition: 'USED',
      governorate: 'مسقط',
      city: 'السيب',
      isPremium: false,
      views: 120,
      user: { id: 'u1', name: 'أحمد', phone: '96812345678' } as any,
      images: [
        { id: 'img-1', url: 'https://example.com/lc1.jpg', order: 1, isPrimary: true },
      ],
      createdAt: '2026-09-21T00:00:00.000Z',
    },
    {
      id: 'sim-2',
      title: 'نيسان باترول 2021',
      description: 'بلاتينيوم صبغة وكالة',
      price: 24500,
      currency: 'OMR',
      listingType: 'SALE',
      condition: 'USED',
      governorate: 'مسقط',
      city: 'بوشر',
      isPremium: true,
      views: 310,
      user: { id: 'u2', name: 'سالم', phone: '96887654321' } as any,
      images: [
        { id: 'img-2', url: 'https://example.com/patrol1.jpg', order: 1, isPrimary: true },
      ],
      createdAt: '2026-09-22T00:00:00.000Z',
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('success: returns the items array unchanged with isLoading: false and isError: false', async () => {
    ;(listingsApi.getSimilar as jest.Mock).mockResolvedValueOnce({
      data: mockItems,
    })

    const queryClient = createTestQueryClient()
    const hook = renderSimilarListingsHook('car-100', undefined, queryClient)

    await waitFor(() => {
      expect(hook.current.isLoading).toBe(false)
    })

    expect(hook.current.isError).toBe(false)
    expect(hook.current.items).toEqual(mockItems)
    expect(hook.current.items).toHaveLength(2)
  })

  it('404 error: maps to { items: [], isLoading: false, isError: false } (not an error state)', async () => {
    ;(listingsApi.getSimilar as jest.Mock).mockRejectedValueOnce({
      response: { status: 404, data: { message: 'الإعلان غير موجود' } },
    })

    const queryClient = createTestQueryClient()
    const hook = renderSimilarListingsHook('car-404', undefined, queryClient)

    await waitFor(() => {
      expect(hook.current.isLoading).toBe(false)
    })

    expect(hook.current.isError).toBe(false)
    expect(hook.current.items).toEqual([])
  })

  it('generic error (e.g. 500): maps to isError: true with empty items', async () => {
    ;(listingsApi.getSimilar as jest.Mock).mockRejectedValueOnce({
      response: { status: 500, data: { message: 'Internal Server Error' } },
      message: 'Server error',
    })

    const queryClient = createTestQueryClient()
    const hook = renderSimilarListingsHook('car-500', undefined, queryClient)

    await waitFor(() => {
      expect(hook.current.isLoading).toBe(false)
    })

    expect(hook.current.isError).toBe(true)
    expect(hook.current.items).toEqual([])
  })

  it('query key includes both id and limit (with default limit = 8)', async () => {
    ;(listingsApi.getSimilar as jest.Mock).mockResolvedValueOnce({
      data: mockItems,
    })

    const queryClient = createTestQueryClient()
    const hook = renderSimilarListingsHook('car-default-limit', undefined, queryClient)

    await waitFor(() => {
      expect(listingsApi.getSimilar).toHaveBeenCalledWith('car-default-limit', 8)
    })

    const queryKey = queryClient.getQueryCache().findAll().map((q) => q.queryKey)
    expect(queryKey).toContainEqual(['listing-similar', 'car-default-limit', 8])
    expect(hook.current.isLoading).toBe(false)
  })

  it('passes custom limit to API and includes it in query key', async () => {
    ;(listingsApi.getSimilar as jest.Mock).mockResolvedValueOnce({
      data: [mockItems[0]],
    })

    const queryClient = createTestQueryClient()
    const hook = renderSimilarListingsHook('car-custom-limit', 4, queryClient)

    await waitFor(() => {
      expect(hook.current.isLoading).toBe(false)
    })

    expect(listingsApi.getSimilar).toHaveBeenCalledWith('car-custom-limit', 4)

    const queryKey = queryClient.getQueryCache().findAll().map((q) => q.queryKey)
    expect(queryKey).toContainEqual(['listing-similar', 'car-custom-limit', 4])
    expect(hook.current.items).toHaveLength(1)
  })

  it('allows manual refetch via refetch()', async () => {
    ;(listingsApi.getSimilar as jest.Mock).mockResolvedValueOnce({
      data: [mockItems[0]],
    })

    const queryClient = createTestQueryClient()
    const hook = renderSimilarListingsHook('car-refetch', undefined, queryClient)

    await waitFor(() => {
      expect(hook.current.isLoading).toBe(false)
    })

    expect(hook.current.items).toHaveLength(1)

    ;(listingsApi.getSimilar as jest.Mock).mockResolvedValueOnce({
      data: mockItems,
    })

    await act(async () => {
      hook.current.refetch()
    })

    await waitFor(() => {
      expect(hook.current.items).toHaveLength(2)
    })

    expect(listingsApi.getSimilar).toHaveBeenCalledTimes(2)
  })
})
