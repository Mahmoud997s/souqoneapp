export interface User {
  id: string
  email: string
  username: string
  displayName?: string
  bio?: string
  phone?: string
  country?: string
  governorate?: string
  city?: string
  role: 'user' | 'admin'
  accountType?: 'private' | 'company'
  isVerified: boolean
  avatar?: string
  avatarUrl?: string
  createdAt: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: User
  requiresVerification?: boolean
}

export interface LoginDto {
  email: string
  password: string
}

export interface RegisterDto {
  email: string
  username: string
  password: string
  displayName?: string
  phone?: string
  country?: string
  governorate?: string
  city?: string
  accountType?: 'private' | 'company'
}

export interface UserSummary {
  id: string
  username: string
  displayName?: string
  avatar?: string
  avatarUrl?: string
  isVerified?: boolean
  accountType?: 'private' | 'company'
}
