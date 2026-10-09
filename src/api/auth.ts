import { apiClient } from './client'
import { AuthResponse, LoginDto, RegisterDto, ResetPasswordDto, VerifyEmailResponse } from '../types/auth.types'

export const authApi = {
  login:          (dto: LoginDto)           => apiClient.post<AuthResponse>('/auth/login', dto),
  register:       (dto: RegisterDto)        => apiClient.post<AuthResponse>('/auth/signup', dto),
  loginGoogle:    (credential: string)      => apiClient.post<AuthResponse>('/auth/google', { credential }),
  refresh:        (refreshToken: string)    => apiClient.post<AuthResponse>('/auth/refresh', { refreshToken }),
  logout:         (refreshToken: string)    => apiClient.post('/auth/logout', { refreshToken }),
  verifyEmail:    (code: string)            => apiClient.post<VerifyEmailResponse>('/auth/verify-email', { code }),
  resendVerification: ()                    => apiClient.post<{ message: string }>('/auth/resend-verification'),
  forgotPassword: (email: string)           => apiClient.post<{ message: string }>('/auth/forgot-password', { email }),
  resetPassword:  (dto: ResetPasswordDto)   => apiClient.post<{ message: string }>('/auth/reset-password', dto),
  me:             ()                        => apiClient.get('/users/me'),
}
