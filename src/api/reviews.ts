import { apiClient } from './client'

export const reviewsApi = {
  getByEntity: (entityId: string) => apiClient.get(`/reviews/${entityId}`),
  create: (data: { entityId: string; entityType: string; rating: number; comment: string }) =>
    apiClient.post('/reviews', data),
}
