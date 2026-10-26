import { apiClient } from './client'

export const favoritesApi = {
  getAll: () => apiClient.get('/favorites'),
  ids: (type?: string) =>
    apiClient.get<string[]>('/favorites/ids', { params: type ? { type } : undefined }),
  check: (entityType: string, entityId: string) =>
    apiClient.get<{ favorited: boolean }>(`/favorites/check/${entityType}/${entityId}`),
  add: (entityType: string, entityId: string) =>
    apiClient.post<{ favorited: boolean }>(`/favorites/${entityType}/${entityId}`),
  remove: (entityType: string, entityId: string) =>
    apiClient.post<{ favorited: boolean }>(`/favorites/${entityType}/${entityId}`), // toggle endpoint
}
