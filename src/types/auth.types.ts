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
  governorateId?: number
  wilayaId?: number
  governorateRef?: { id: number; nameAr: string; nameEn?: string }
  wilayaRef?: { id: number; nameAr: string; nameEn?: string }
  role: 'user' | 'admin'
  accountType?: 'private' | 'company'
  isVerified: boolean
  avatar?: string
  avatarUrl?: string
  createdAt: string
  deletionScheduledAt?: string | null
  deletionReauthMethod?: 'password' | 'google' | 'apple' | 'confirmation'
}

export interface AppleLoginPayload {
  identityToken: string
  nonce: string
  fullName?: {
    givenName?: string
    familyName?: string
  }
  authorizationCode?: string
}

export interface AuthResponse {
  accessToken?: string
  refreshToken?: string
  user?: User
  requiresVerification?: boolean
  verificationToken?: string
  emailSent?: boolean
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
  governorateId?: number
  wilayaId?: number
  accountType?: 'private' | 'company'
}

export interface ResetPasswordDto {
  email: string
  code: string
  newPassword: string
}

export interface VerifyEmailResponse {
  message?: string
  accessToken?: string
  refreshToken?: string
  user?: User
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
