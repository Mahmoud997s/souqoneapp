import { useQuery } from '@tanstack/react-query'
import { reviewsApi } from '../../api/reviews'
import { operatorQueryKeys } from '../../utils/listing-detail/operatorQueryKeys'

export interface OperatorReviewItem {
  id: string
  rating: number
  comment?: string | null
  reviewerId: string
  reviewer?: {
    id: string
    username: string
    displayName?: string | null
    avatarUrl?: string | null
    isVerified?: boolean
  } | null
  createdAt: string
}

export interface OperatorReviewsSummary {
  averageRating: number
  reviewCount: number
}

export interface UseOperatorReviewsResult {
  summary: OperatorReviewsSummary
  reviews: OperatorReviewItem[]
  isLoading: boolean
  isError: boolean
  refetch: () => Promise<unknown>
}

/**
 * useOperatorReviews
 * Fetches reviews and calculates rating summary for an operator.
 * Designed with fault-tolerance: if reviews endpoint fails, the screen continues
 * gracefully with an empty summary (0 reviews, 0 rating) and an isError flag.
 */
export function useOperatorReviews(operatorId?: string | null): UseOperatorReviewsResult {
  const query = useQuery({
    queryKey: operatorQueryKeys.reviews(operatorId ?? ''),
    queryFn: async (): Promise<OperatorReviewItem[]> => {
      if (!operatorId) return []
      const res = await reviewsApi.getByEntity(operatorId, 'OPERATOR_LISTING')
      const raw = res.data as unknown
      if (Array.isArray(raw)) {
        return raw as OperatorReviewItem[]
      }
      const container = raw as { items?: OperatorReviewItem[]; data?: OperatorReviewItem[] }
      return (container?.items ?? container?.data ?? []) as OperatorReviewItem[]
    },
    enabled: Boolean(operatorId),
    staleTime: 2 * 60 * 1000,
  })

  const reviews = query.data ?? []
  const reviewCount = reviews.length
  const averageRating =
    reviewCount > 0
      ? Math.round(
          (reviews.reduce((acc, r) => acc + (typeof r.rating === 'number' ? r.rating : 0), 0) /
            reviewCount) *
            10
        ) / 10
      : 0

  return {
    summary: {
      averageRating,
      reviewCount,
    },
    reviews,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  }
}
