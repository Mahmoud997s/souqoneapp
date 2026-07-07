import { apiClient } from './client'

export const favoritesApi = {
  getAll:  ()                                                 => apiClient.get('/favorites'),
  add:     (entityType: string, entityId: string)             =>
             apiClient.post(`/favorites/${entityType}/${entityId}`),
  remove:  (entityType: string, entityId: string)             => 
             apiClient.post(`/favorites/${entityType}/${entityId}`), // toggle endpoint
}
