import { useQuery } from '@tanstack/react-query'
import { reviewsApi, type SellerReviewSummary } from '../../api/reviews'

export const sellerReviewSummaryKey = (sellerId?: string) =>
  ['seller-review-summary', sellerId ?? ''] as const

export interface UseSellerReviewSummaryResult {
  averageRating: number | null
  reviewCount: number
  isLoading: boolean
  isError: boolean
  refetch: () => void
}

/**
 * Fetches aggregate seller rating summary via GET /reviews/summary/:userId.
 * Shared between SellerRatingBlock (5 detail screens) and PublicProfile fallback.
 */
export function useSellerReviewSummary(sellerId?: string): UseSellerReviewSummaryResult {
  const query = useQuery<SellerReviewSummary, unknown>({
    queryKey: sellerReviewSummaryKey(sellerId),
    queryFn: async () => {
      const res = await reviewsApi.getSummary(sellerId!)
      return res.data
    },
    enabled: Boolean(sellerId),
    staleTime: 1000 * 60 * 2,
    retry: false,
  })

  const rawAvg = query.data?.averageRating
  const rawCount = query.data?.reviewCount

  return {
    averageRating:
      typeof rawAvg === 'number' && Number.isFinite(rawAvg) && rawAvg > 0 ? rawAvg : null,
    reviewCount:
      typeof rawCount === 'number' && Number.isFinite(rawCount) && rawCount > 0 ? rawCount : 0,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: () => {
      query.refetch()
    },
  }
}
