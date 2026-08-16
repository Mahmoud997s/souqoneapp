import { apiClient } from './client'
import { User } from '../types/auth.types'

export interface UpdateProfilePayload {
  displayName?: string
  bio?: string
  phone?: string
  country?: string
  governorateId?: number
  wilayaId?: number
  avatarUrl?: string | null
  latitude?: number
  longitude?: number
}

export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
}

export const usersApi = {
  getById: (id: string) => apiClient.get<User>(`/users/${id}`),
  updatePushToken: (token: string) => apiClient.post('/users/push-token', { token }),
  updateProfile: (data: UpdateProfilePayload | Partial<User>) => apiClient.patch<User>('/users/me', data),
  changePassword: (data: ChangePasswordPayload) => apiClient.patch('/users/me/password', data),
  blockUser: (userId: string, reason?: string) => apiClient.post(`/users/${userId}/block`, { reason }),
  reportUser: (userId: string, reason?: string) => apiClient.post(`/users/${userId}/report`, { reason }),
}
