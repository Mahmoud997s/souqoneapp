import { apiClient } from './client'

export const reviewsApi = {
  getByEntity: (entityId: string, entityType?: string) =>
    apiClient.get('/reviews', { params: { entityId, entityType } }),
  create: (data: { entityId: string; entityType: string; rating: number; comment?: string; revieweeId?: string }) =>
    apiClient.post('/reviews', data),
}
