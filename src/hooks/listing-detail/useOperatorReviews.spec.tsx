import React from 'react'
import { renderHook, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useOperatorReviews } from './useOperatorReviews'
import { reviewsApi } from '../../api/reviews'

jest.mock('../../api/reviews', () => ({
  reviewsApi: {
    getByEntity: jest.fn(),
  },
}))

describe('useOperatorReviews', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    jest.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  it('calculates average rating and review count from review array', async () => {
    const mockReviews = [
      { id: 'rev-1', rating: 5, comment: 'ممتاز', reviewerId: 'u-1', createdAt: '2026-10-01' },
      { id: 'rev-2', rating: 4, comment: 'جيد جدا', reviewerId: 'u-2', createdAt: '2026-10-02' },
    ]
    ;(reviewsApi.getByEntity as jest.Mock).mockResolvedValueOnce({
      data: mockReviews,
    })

    const { result } = await renderHook(() => useOperatorReviews('op-1'), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.summary.reviewCount).toBe(2)
    expect(result.current.summary.averageRating).toBe(4.5)
    expect(result.current.reviews).toHaveLength(2)
    expect(result.current.isError).toBe(false)
  })

  it('handles nested data.items response container gracefully', async () => {
    ;(reviewsApi.getByEntity as jest.Mock).mockResolvedValueOnce({
      data: {
        items: [{ id: 'rev-3', rating: 5, reviewerId: 'u-3', createdAt: '2026-10-03' }],
      },
    })

    const { result } = await renderHook(() => useOperatorReviews('op-1'), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.summary.reviewCount).toBe(1)
    expect(result.current.summary.averageRating).toBe(5)
  })

  it('never breaks screen on error; returns empty summary with isError: true', async () => {
    ;(reviewsApi.getByEntity as jest.Mock).mockRejectedValueOnce(new Error('Network offline'))

    const { result } = await renderHook(() => useOperatorReviews('op-1'), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.isError).toBe(true)
    expect(result.current.summary.reviewCount).toBe(0)
    expect(result.current.summary.averageRating).toBe(0)
    expect(result.current.reviews).toEqual([])
  })
})
