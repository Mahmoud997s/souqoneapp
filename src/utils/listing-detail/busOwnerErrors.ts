import { isProfilePhoneRequiredError } from '../profilePhoneGuard'

/**
 * Extracts error code or error message from Axios-like response errors.
 * Inspects response.data.code, response.data.message.code, or response.data.message.
 */
export function extractBusOwnerErrorCode(err: any): string | undefined {
  const data = err?.response?.data
  if (!data) return undefined
  if (typeof data.code === 'string') return data.code
  if (typeof data.message?.code === 'string') return data.message.code
  if (typeof data.message === 'string') {
    if (data.message.startsWith('INVALID_STATUS_TRANSITION')) {
      return 'INVALID_STATUS_TRANSITION'
    }
    return data.message
  }
  return undefined
}

/**
 * Translates backend API error responses during bus owner operations into user-friendly Arabic messages.
 */
export function translateBusOwnerError(err: any): string {
  if (err?.response?.status === 409) {
    return 'تم تعديل الإعلان من جهاز آخر. يرجى التحديث والمحاولة مجدداً.'
  }

  if (isProfilePhoneRequiredError(err)) {
    return 'يجب إضافة رقم هاتفك في الملف الشخصي قبل تفعيل الإعلان.'
  }

  const code = extractBusOwnerErrorCode(err)
  if (code) {
    if (code.includes('INVALID_STATUS_TRANSITION')) {
      return 'لا يمكن تغيير حالة الإعلان من حالته الحالية إلى الحالة المطلوبة.'
    }
    if (code === 'ACCOUNT_BANNED') {
      return 'حسابك محظور ولا يمكنك تنفيذ هذا الإجراء.'
    }
    if (code === 'ACCOUNT_SUSPENDED') {
      return 'حسابك موقوف مؤقتاً ولا يمكنك تنفيذ هذا الإجراء.'
    }
    if (code === 'ACTIVE_LISTINGS_LIMIT_REACHED') {
      return 'لقد بلغت الحد الأقصى للإعلانات النشطة. يرجى حذف أحد إعلاناتك أو إيقافه ثم المحاولة مرة أخرى.'
    }
  }

  const responseMessage = err?.response?.data?.message
  if (typeof responseMessage === 'string' && responseMessage.trim().length > 0) {
    return responseMessage
  }

  return 'تعذّر تنفيذ الإجراء. حاول مرة أخرى.'
}
