import { apiClient } from './client'
import { NotificationItem } from '../types/api.types'

export const notificationsApi = {
  getAll:   (params?: Record<string, unknown>) => apiClient.get<NotificationItem[]>('/notifications', { params }),
  readAll:  () => apiClient.patch('/notifications/read-all'),
  markRead: (id: string) => apiClient.patch(`/notifications/${id}/read`),
  deleteOne: (id: string) => apiClient.delete(`/notifications/${id}`),
  deleteAllRead: () => apiClient.delete('/notifications/read'),
}
