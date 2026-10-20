import { apiClient } from './client'
import { User } from '../types/auth.types'

export interface UpdateProfilePayload {
  displayName?: string
  bio?: string | null
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

export interface DeleteAccountPayload {
  password?: string
  googleIdToken?: string
  appleIdentityToken?: string
  appleNonce?: string
  appleAuthorizationCode?: string
  confirmation: string
}

export const usersApi = {
  getById: (id: string) => apiClient.get<User>(`/users/${id}`),
  updatePushToken: (token: string) => apiClient.post('/users/push-token', { token }),
  unregisterPushToken: () => apiClient.delete('/users/push-token'),
  updateProfile: (data: UpdateProfilePayload | Partial<User>) => apiClient.patch<User>('/users/me', data),
  changePassword: (data: ChangePasswordPayload) => apiClient.patch('/users/me/password', data),
  deleteAccount: (payload: DeleteAccountPayload) =>
    apiClient.post<{ message: string; deletionScheduledAt: string }>('/users/me/delete-account', payload),
  cancelDeletion: () =>
    apiClient.post<{ message: string }>('/users/me/cancel-deletion'),
  blockUser: (userId: string, reason?: string) => apiClient.post(`/users/${userId}/block`, { reason }),
  reportUser: (userId: string, reason?: string) => apiClient.post(`/users/${userId}/report`, { reason }),
}
