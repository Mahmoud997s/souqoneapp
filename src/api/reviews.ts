import { apiClient } from './client'

export interface CreateReviewParams {
  entityId: string
  entityType: string
  rating: number
  comment?: string
  revieweeId?: string
}

/**
 * Builds the payload for POST /reviews.
 * For OPERATOR_LISTING, the backend derives the reviewee (effectiveRevieweeId = listing.userId)
 * from entityId (PR #156 / commit f81fa56 on backend main) and ignores client-sent revieweeId.
 * Therefore, revieweeId is omitted for OPERATOR_LISTING to avoid sending redundant or conflicting data.
 * Other review entity types still rely on client-supplied revieweeId.
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
  if (data.entityType !== 'OPERATOR_LISTING' && data.revieweeId !== undefined) {
    payload.revieweeId = data.revieweeId
  }
  return payload
}

export const reviewsApi = {
  getByEntity: (entityId: string, entityType?: string) =>
    apiClient.get('/reviews', { params: { entityId, entityType } }),
  create: (data: CreateReviewParams) =>
    apiClient.post('/reviews', buildCreateReviewPayload(data)),
}

