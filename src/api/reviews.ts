import { apiClient } from './client'

export interface CreateReviewParams {
  entityId: string
  entityType: string
  rating: number
  comment?: string
  revieweeId?: string
}

export interface SellerReviewSummary {
  averageRating: number | null
  reviewCount: number
  distribution?: Record<string, number>
}

const SERVER_DERIVED_REVIEWEE_TYPES = new Set(['OPERATOR_LISTING', 'USER'])

/**
 * Builds the payload for POST /reviews.
 * For OPERATOR_LISTING and USER (D-B18), the backend derives the reviewee on the server
 * from entityId and ignores client-sent revieweeId, so revieweeId is strictly omitted.
 */
export function buildCreateReviewPayload(data: CreateReviewParams): CreateReviewParams {
  const payload: CreateReviewParams = {
    entityId: data.entityId,
    entityType: data.entityType,
    rating: data.rating,
  }
  if (data.comment !== undefined) {
    payload.comment = data.comment
  }
  if (!SERVER_DERIVED_REVIEWEE_TYPES.has(data.entityType) && data.revieweeId !== undefined) {
    payload.revieweeId = data.revieweeId
  }
  return payload
}

export const reviewsApi = {
  getByEntity: (entityId: string, entityType?: string) => {
    const params =
      entityType === 'USER'
        ? { userId: entityId, entityType: 'USER' }
        : { entityId, entityType }
    return apiClient.get('/reviews', { params })
  },
  getSummary: (userId: string) =>
    apiClient.get<SellerReviewSummary>(`/reviews/summary/${userId}`),
  create: (data: CreateReviewParams) =>
    apiClient.post('/reviews', buildCreateReviewPayload(data)),
}
