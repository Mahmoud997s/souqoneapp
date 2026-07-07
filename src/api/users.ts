import { apiClient } from './client'
import { User } from '../types/auth.types'

export const usersApi = {
  getById: (id: string) => apiClient.get<User>(`/users/${id}`),
  updatePushToken: (token: string) => apiClient.post('/users/push-token', { token }),
  updateProfile: (data: Partial<User>) => apiClient.patch<User>('/users/me', data),
  changePassword: (data: any) => apiClient.patch('/users/me/password', data),
}
