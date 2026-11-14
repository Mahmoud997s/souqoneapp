import axios from 'axios'
import { getMutationErrorMessage } from './listing-detail/getDetailErrorKind'
import { getPublishRateLimitErrorMessage } from './publishRateLimitError'

export interface ChangePasswordFieldErrors {
  currentPassword?: string
  newPassword?: string
  confirmPassword?: string
}

export interface ChangePasswordBackendErrorResult {
  fieldErrors: ChangePasswordFieldErrors
  generalMessage?: string
}

export interface ValidateChangePasswordParams {
  currentPassword?: string
  newPassword?: string
  confirmPassword?: string
}

/**
 * Validates password input before sending to backend.
 * Returns field-level error messages in Arabic for inline display under AppInput.
 */
export function validateChangePasswordInput({
  currentPassword = '',
  newPassword = '',
  confirmPassword = '',
}: ValidateChangePasswordParams): ChangePasswordFieldErrors {
  const errors: ChangePasswordFieldErrors = {}

  if (!currentPassword.trim()) {
    errors.currentPassword = 'يرجى إدخال كلمة المرور الحالية'
  }

  if (!newPassword) {
    errors.newPassword = 'يرجى إدخال كلمة المرور الجديدة'
  } else if (newPassword.length < 8) {
    errors.newPassword = 'كلمة المرور الجديدة يجب أن تكون ٨ أحرف على الأقل'
  } else if (!/[A-Z]/.test(newPassword) || !/\d/.test(newPassword)) {
    errors.newPassword = 'كلمة المرور يجب أن تحتوي على حرف كبير ورقم على الأقل'
  }

  if (!confirmPassword) {
    errors.confirmPassword = 'يرجى تأكيد كلمة المرور الجديدة'
  } else if (newPassword && confirmPassword !== newPassword) {
    errors.confirmPassword = 'كلمة المرور الجديدة غير متطابقة مع التأكيد'
  }

  return errors
}

export function hasChangePasswordErrors(errors: ChangePasswordFieldErrors): boolean {
  return Boolean(errors.currentPassword || errors.newPassword || errors.confirmPassword)
}

interface BackendFieldErrorItem {
  field?: string
  code?: string
}

/**
 * Maps server-side errors into either inline field errors (currentPassword / newPassword)
 * or a general alert message (for 429 rate limit, network failure, 500, etc.).
 *
 * Fully supports S7 structured fieldErrors (PR #163) as well as fallback string/array responses.
 */
export function mapChangePasswordBackendErrors(error: unknown): ChangePasswordBackendErrorResult {
  const result: ChangePasswordBackendErrorResult = {
    fieldErrors: {},
  }

  if (!axios.isAxiosError(error)) {
    result.generalMessage = getMutationErrorMessage(error, 'حدث خطأ أثناء تغيير كلمة المرور')
    return result
  }

  const status = error.response?.status
  const data = error.response?.data as
    | {
        statusCode?: number
        message?: unknown
        fieldErrors?: BackendFieldErrorItem[]
      }
    | undefined

  // 1. Rate Limit (HTTP 429) -> use specialized publishRateLimitError logic
  if (status === 429) {
    result.generalMessage = getPublishRateLimitErrorMessage(error)
    return result
  }

  // 2. Structured fieldErrors (S7 / PR #163) on HTTP 400
  if (status === 400 && Array.isArray(data?.fieldErrors) && data!.fieldErrors.length > 0) {
    for (const item of data!.fieldErrors) {
      if (!item || typeof item.field !== 'string') continue

      if (item.field === 'currentPassword') {
        if (item.code === 'REQUIRED' || item.code === 'TOO_SHORT') {
          result.fieldErrors.currentPassword = 'يرجى إدخال كلمة المرور الحالية'
        } else {
          result.fieldErrors.currentPassword = 'كلمة المرور الحالية غير صحيحة'
        }
      } else if (item.field === 'newPassword') {
        if (item.code === 'TOO_LONG') {
          result.fieldErrors.newPassword = 'كلمة المرور الجديدة يجب ألا تتجاوز ٧٢ حرفاً'
        } else if (item.code === 'TOO_SHORT') {
          result.fieldErrors.newPassword = 'كلمة المرور الجديدة يجب أن تكون ٨ أحرف على الأقل'
        } else if (item.code === 'INVALID_FORMAT') {
          result.fieldErrors.newPassword = 'كلمة المرور يجب أن تحتوي على حرف كبير ورقم على الأقل'
        } else if (item.code === 'REQUIRED') {
          result.fieldErrors.newPassword = 'يرجى إدخال كلمة المرور الجديدة'
        } else {
          result.fieldErrors.newPassword = 'كلمة المرور الجديدة غير صالحة'
        }
      }
    }

    if (hasChangePasswordErrors(result.fieldErrors)) {
      return result
    }
  }

  // 3. Fallback string or array message on 400/401
  if (data && data.message) {
    const rawMessages: string[] = []
    if (typeof data.message === 'string') {
      rawMessages.push(data.message)
    } else if (Array.isArray(data.message)) {
      for (const m of data.message) {
        if (typeof m === 'string') rawMessages.push(m)
      }
    }

    for (const msg of rawMessages) {
      const lower = msg.toLowerCase()
      if (
        msg.includes('الحالية') ||
        lower.includes('currentpassword') ||
        lower.includes('current') ||
        lower.includes('invalid credentials')
      ) {
        result.fieldErrors.currentPassword = /[\u0600-\u06FF]/.test(msg)
          ? msg.trim()
          : 'كلمة المرور الحالية غير صحيحة'
      } else if (msg.includes('الجديدة') || lower.includes('newpassword') || lower.includes('new password')) {
        result.fieldErrors.newPassword = /[\u0600-\u06FF]/.test(msg)
          ? msg.trim()
          : 'كلمة المرور الجديدة غير صالحة'
      }
    }

    if (hasChangePasswordErrors(result.fieldErrors)) {
      return result
    }
  }

  // 4. Default: fallback to general mutation error message
  result.generalMessage = getMutationErrorMessage(error, 'حدث خطأ أثناء تغيير كلمة المرور')
  return result
}
