import { apiClient } from './client'
import { AppleLoginPayload, AuthResponse, LoginDto, RegisterDto, ResetPasswordDto, VerifyEmailResponse } from '../types/auth.types'

export const authApi = {
  login:          (dto: LoginDto)           => apiClient.post<AuthResponse>('/auth/login', dto),
  register:       (dto: RegisterDto)        => apiClient.post<AuthResponse>('/auth/signup', dto),
  loginGoogle:    (credential: string)      => apiClient.post<AuthResponse>('/auth/google', { credential }),
  loginApple:     (payload: AppleLoginPayload) => apiClient.post<AuthResponse>('/auth/apple', payload),
  refresh:        (refreshToken: string)    => apiClient.post<AuthResponse>('/auth/refresh', { refreshToken }),
  logout:         (refreshToken: string)    => apiClient.post('/auth/logout', { refreshToken }),
  verifyEmail:    (code: string, token?: string) =>
    apiClient.post<VerifyEmailResponse>(
      '/auth/verify-email',
      { code },
      token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
    ),
  resendVerification: (token?: string) =>
    apiClient.post<{ message: string; emailSent?: boolean }>(
      '/auth/resend-verification',
      {},
      token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
    ),
  forgotPassword: (email: string)           => apiClient.post<{ message: string }>('/auth/forgot-password', { email }),
  resetPassword:  (dto: ResetPasswordDto)   => apiClient.post<{ message: string }>('/auth/reset-password', dto),
  me:             ()                        => apiClient.get('/users/me'),
}
