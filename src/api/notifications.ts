import { apiClient } from './client'
import { NotificationItem } from '../types/api.types'

export const notificationsApi = {
  getAll:  () => apiClient.get<NotificationItem[]>('/notifications'),
  readAll: () => apiClient.put('/notifications/read-all'),
}
