/**
 * SouqOne — Pure Authentication Form Validation Suite
 * Aligned with Add Listing validation architecture (useCarValidation / useServiceValidation)
 */

export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
}

export interface LoginValidationInput {
  email: string
  password: string
}

export interface RegisterValidationInput {
  displayName: string
  username: string
  email: string
  phone: string
  password: string
  confirmPassword?: string
}

export interface ResetPasswordValidationInput {
  email?: string
  code?: string
  tokenOrOtp?: string
  password?: string
  newPassword?: string
  confirmPassword?: string
}

import { normalizeDigits } from './digits'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const OMANI_PHONE_REGEX = /^(7|9)\d{7}$/
const USERNAME_REGEX = /^[a-z0-9_.]{3,30}$/

export const SERVER_EMAIL_ERROR = 'البريد الإلكتروني غير صالح'

/**
 * Unicode category \p{Cf} explicit code point ranges fallback for Hermes.
 * Generated algorithmically in Node.js by scanning Unicode code points 0..0x10FFFF against /\p{Cf}/u.
 */
export const UNICODE_CF_FALLBACK_PATTERN =
  '[\\u00AD\\u0600-\\u0605\\u061C\\u06DD\\u070F\\u0890-\\u0891\\u08E2\\u180E\\u200B-\\u200F\\u202A-\\u202E\\u2060-\\u2064\\u2066-\\u206F\\uFEFF\\uFFF9-\\uFFFB\\u{110BD}\\u{110CD}\\u{13430}-\\u{1343F}\\u{1BCA0}-\\u{1BCA3}\\u{1D173}-\\u{1D17A}\\u{E0001}\\u{E0020}-\\u{E007F}]'

/**
 * Creates the Unicode Cf stripping regex.
 * Tries dynamic \p{Cf} first; falls back safely to explicit code point ranges.
 */
export function createUnicodeCfRegex(forceFallback = false): RegExp {
  if (!forceFallback) {
    try {
      return new RegExp('\\p{Cf}', 'gu')
    } catch {
      // Fallback if Hermes engine does not support \p{Cf}
    }
  }
  return new RegExp(UNICODE_CF_FALLBACK_PATTERN, 'gu')
}

const UNICODE_CF_REGEX = createUnicodeCfRegex()

/**
 * Normalizes email:
 * 1. Strips all Unicode category Cf formatting marks (BiDi, ZWSP, BOM, etc.).
 * 2. Trims whitespace (including non-breaking spaces U+00A0).
 * 3. Converts to lowercase.
 */
export function normalizeEmail(raw: string | null | undefined, forceFallback = false): string {
  if (typeof raw !== 'string') return ''
  const pattern = forceFallback ? createUnicodeCfRegex(true) : UNICODE_CF_REGEX
  return raw.replace(new RegExp(pattern.source, pattern.flags), '').trim().toLowerCase()
}

/**
 * Checks whether an already normalized email is strictly valid:
 * 1. Non-empty and <= 254 characters (RFC 5321 limit).
 * 2. ASCII characters only (rejects Arabic/non-ASCII letters).
 * 3. Matches standard email format.
 */
export function isValidNormalizedEmail(cleanEmail: string): boolean {
  if (typeof cleanEmail !== 'string') return false
  if (!cleanEmail || cleanEmail.length > 254) return false
  if (/[^\x20-\x7E]/.test(cleanEmail)) return false
  return EMAIL_REGEX.test(cleanEmail)
}

/**
 * Normalizes digits and strips non-numeric characters for phone inspection.
 * Automatically handles and strips Omani country codes (+968 or 00968).
 */
export function normalizeOmaniPhoneDigits(rawPhone: string | null | undefined): string {
  let digits = normalizeDigits(rawPhone || '').trim().replace(/\D/g, '')
  if (digits.startsWith('00968') && digits.length === 13) {
    digits = digits.slice(5)
  } else if (digits.startsWith('968') && digits.length === 11) {
    digits = digits.slice(3)
  }
  return digits
}

/**
 * Checks if a given raw or normalized phone string conforms to Omani 8-digit mobile number starting with 7 or 9.
 */
export function isValidOmaniPhone(rawPhone: string | null | undefined): boolean {
  const phoneClean = normalizeOmaniPhoneDigits(rawPhone)
  return OMANI_PHONE_REGEX.test(phoneClean)
}

/**
 * Validates Login Form
 */
export function validateLogin(input: LoginValidationInput): ValidationResult {
  const errors: Record<string, string> = {}

  const cleanEmail = normalizeEmail(input.email)
  const rawTrimmed = (input.email || '').trim()

  if (!rawTrimmed) {
    errors.email = 'يرجى إدخال البريد الإلكتروني'
  } else if (!isValidNormalizedEmail(cleanEmail)) {
    errors.email = SERVER_EMAIL_ERROR
  }

  if (!input.password) {
    errors.password = 'يرجى إدخال كلمة المرور'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Validates Registration Form
 */
export function validateRegister(input: RegisterValidationInput): ValidationResult {
  const errors: Record<string, string> = {}

  // 1. Full Name
  const nameTrimmed = (input.displayName || '').trim()
  if (!nameTrimmed) {
    errors.displayName = 'يرجى إدخال الاسم الكامل'
  } else if (nameTrimmed.length < 2) {
    errors.displayName = 'الاسم الكامل يجب أن يتكون من حرفين على الأقل'
  }

  // 2. Username
  const usernameClean = (input.username || '').trim().toLowerCase()
  if (!usernameClean) {
    errors.username = 'يرجى إدخال اسم المستخدم'
  } else if (!USERNAME_REGEX.test(usernameClean)) {
    errors.username = 'من 3 إلى 30 حرفاً إنجليزياً صغيراً أو أرقاماً أو _ أو .'
  }

  // 3. Email
  const cleanEmail = normalizeEmail(input.email)
  const rawEmailTrimmed = (input.email || '').trim()
  if (!rawEmailTrimmed) {
    errors.email = 'يرجى إدخال البريد الإلكتروني'
  } else if (!isValidNormalizedEmail(cleanEmail)) {
    errors.email = SERVER_EMAIL_ERROR
  }

  // 4. Omani Phone (+968)
  const phoneClean = normalizeDigits(input.phone || '').trim().replace(/\D/g, '')
  if (!phoneClean) {
    errors.phone = 'يرجى إدخال رقم الهاتف'
  } else if (!OMANI_PHONE_REGEX.test(phoneClean)) {
    errors.phone = 'رقم عماني غير صحيح (8 أرقام يبدأ بـ 9 أو 7)'
  }

  // 5. Password
  const pw = input.password || ''
  if (!pw) {
    errors.password = 'يرجى إدخال كلمة المرور'
  } else if (pw.length < 8) {
    errors.password = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'
  } else if (!/[A-Z]/.test(pw) || !/[0-9]/.test(pw)) {
    errors.password = 'يجب أن تحتوي على حرف كبير واحد (A-Z) ورقم (0-9)'
  }

  // 6. Confirm Password
  if (!input.confirmPassword) {
    errors.confirmPassword = 'يرجى تأكيد كلمة المرور'
  } else if (pw !== input.confirmPassword) {
    errors.confirmPassword = 'كلمتا المرور غير متطابقتين'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Validates Forgot Password Form
 */
export function validateForgotPassword(email: string): ValidationResult {
  const errors: Record<string, string> = {}
  const cleanEmail = normalizeEmail(email)
  const rawEmailTrimmed = (email || '').trim()

  if (!rawEmailTrimmed) {
    errors.email = 'يرجى إدخال البريد الإلكتروني المسجل'
  } else if (!isValidNormalizedEmail(cleanEmail)) {
    errors.email = SERVER_EMAIL_ERROR
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Validates Reset Password Form
 */
export function validateResetPassword(input: ResetPasswordValidationInput): ValidationResult {
  const errors: Record<string, string> = {}

  if (input.email !== undefined) {
    const cleanEmail = normalizeEmail(input.email)
    const rawEmailTrimmed = (input.email || '').trim()
    if (!rawEmailTrimmed) {
      errors.email = 'يرجى إدخال البريد الإلكتروني'
    } else if (!isValidNormalizedEmail(cleanEmail)) {
      errors.email = SERVER_EMAIL_ERROR
    }
  }

  const tokenClean = normalizeDigits(input.code || input.tokenOrOtp || '').trim()
  if (!tokenClean) {
    errors.code = 'يرجى إدخال رمز التحقق'
  } else if (!/^\d{6}$/.test(tokenClean)) {
    errors.code = 'رمز التحقق يجب أن يتكون من 6 أرقام'
  }

  const pw = input.password || input.newPassword || ''
  if (!pw) {
    errors.password = 'يرجى إدخال كلمة المرور الجديدة'
  } else if (pw.length < 8) {
    errors.password = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'
  } else if (!/[A-Z]/.test(pw) || !/[0-9]/.test(pw)) {
    errors.password = 'يجب أن تحتوي على حرف كبير ورقم واحد على الأقل'
  }

  if (!input.confirmPassword) {
    errors.confirm = 'يرجى تأكيد كلمة المرور'
  } else if (pw !== input.confirmPassword) {
    errors.confirm = 'كلمتا المرور غير متطابقتين'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Validates OTP 6-digit Code
 */
export function validateOtp(code: string): ValidationResult {
  const errors: Record<string, string> = {}
  const cleaned = normalizeDigits(code || '').trim().replace(/\D/g, '')

  if (!cleaned) {
    errors.code = 'يرجى إدخال رمز التحقق'
    errors.otp = 'يرجى إدخال رمز التحقق'
  } else if (cleaned.length !== 6) {
    errors.code = 'رمز التحقق يجب أن يتكون من 6 أرقام'
    errors.otp = 'رمز التحقق يجب أن يتكون من 6 أرقام'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}
