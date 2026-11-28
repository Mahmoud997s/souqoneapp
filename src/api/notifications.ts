import { apiClient } from './client'
import { NotificationItem } from '../types/api.types'

export const UNREAD_COUNT_ALLOWED_PARAMS = ['excludeChat'] as const

export interface UnreadNotificationsCountResponse {
  count: number
}

export const notificationsApi = {
  getAll:   (params?: Record<string, unknown>) => apiClient.get<NotificationItem[]>('/notifications', { params }),
  getUnreadCount: () =>
    apiClient.get<UnreadNotificationsCountResponse>('/notifications/unread-count', {
      params: { excludeChat: true },
      skipErrorDialog: true,
    }),
  readAll:  () => apiClient.patch('/notifications/read-all'),
  markRead: (id: string) => apiClient.patch(`/notifications/${id}/read`),
  deleteOne: (id: string) => apiClient.delete(`/notifications/${id}`),
  deleteAllRead: () => apiClient.delete('/notifications/read'),
}
