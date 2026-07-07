import { apiClient } from './client'
import { AuthResponse, LoginDto, RegisterDto } from '../types/auth.types'

export const authApi = {
  login:          (dto: LoginDto)           => apiClient.post<AuthResponse>('/auth/login', dto),
  register:       (dto: RegisterDto)        => apiClient.post<AuthResponse>('/auth/signup', dto),
  loginGoogle:    (token: string)           => apiClient.post<AuthResponse>('/auth/google', { token }),
  refresh:        (refreshToken: string)    => apiClient.post<AuthResponse>('/auth/refresh', { refreshToken }),
  logout:         (refreshToken: string)    => apiClient.post('/auth/logout', { refreshToken }),
  verifyEmail:    (code: string)            => apiClient.post<AuthResponse>('/auth/verify-email', { code }),
  resendVerification: ()                    => apiClient.post('/auth/resend-verification'),
  forgotPassword: (email: string)           => apiClient.post('/auth/forgot-password', { email }),
  resetPassword:  (token: string, password: string) =>
                                               apiClient.post('/auth/reset-password', { token, password }),
  me:             ()                        => apiClient.get('/users/me'),
}
