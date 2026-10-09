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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const OMANI_PHONE_REGEX = /^(7|9)\d{7}$/
const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/

/**
 * Validates Login Form
 */
export function validateLogin(input: LoginValidationInput): ValidationResult {
  const errors: Record<string, string> = {}

  const emailTrimmed = (input.email || '').trim()
  if (!emailTrimmed) {
    errors.email = 'يرجى إدخال البريد الإلكتروني'
  } else if (!EMAIL_REGEX.test(emailTrimmed)) {
    errors.email = 'صيغة البريد الإلكتروني غير صحيحة'
  }

  if (!input.password) {
    errors.password = 'يرجى إدخال كلمة المرور'
  } else if (input.password.length < 6) {
    errors.password = 'كلمة المرور يجب أن تتكون من 6 أحرف على الأقل'
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
  } else if (nameTrimmed.length < 3) {
    errors.displayName = 'الاسم الكامل يجب أن يتكون من 3 أحرف على الأقل'
  }

  // 2. Username
  const usernameClean = (input.username || '').trim().toLowerCase()
  if (!usernameClean) {
    errors.username = 'يرجى إدخال اسم المستخدم'
  } else if (usernameClean.length < 3) {
    errors.username = 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل'
  } else if (!USERNAME_REGEX.test(usernameClean)) {
    errors.username = 'أحرف إنجليزية وأرقام و _ فقط بدون مسافات'
  }

  // 3. Email
  const emailTrimmed = (input.email || '').trim()
  if (!emailTrimmed) {
    errors.email = 'يرجى إدخال البريد الإلكتروني'
  } else if (!EMAIL_REGEX.test(emailTrimmed)) {
    errors.email = 'صيغة البريد الإلكتروني غير صحيحة'
  }

  // 4. Omani Phone (+968)
  const phoneClean = (input.phone || '').trim().replace(/\D/g, '')
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
  const emailTrimmed = (email || '').trim()

  if (!emailTrimmed) {
    errors.email = 'يرجى إدخال البريد الإلكتروني المسجل'
  } else if (!EMAIL_REGEX.test(emailTrimmed)) {
    errors.email = 'صيغة البريد الإلكتروني غير صحيحة'
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
    const emailTrimmed = (input.email || '').trim()
    if (!emailTrimmed) {
      errors.email = 'يرجى إدخال البريد الإلكتروني'
    } else if (!EMAIL_REGEX.test(emailTrimmed)) {
      errors.email = 'صيغة البريد الإلكتروني غير صحيحة'
    }
  }

  const tokenClean = (input.code || input.tokenOrOtp || '').trim()
  if (!tokenClean) {
    errors.code = 'يرجى إدخال رمز التحقق'
  } else if (tokenClean.length < 6) {
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
  const cleaned = (code || '').trim().replace(/\D/g, '')

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
