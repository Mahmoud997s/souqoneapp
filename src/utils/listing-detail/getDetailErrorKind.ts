import axios from 'axios'

export type DetailErrorKind =
  | 'notFound'
  | 'offline'
  | 'timeout'
  | 'serverError'
  | 'unauthorized'
  | 'forbidden'
  | 'conflict'
  | 'validation'
  | 'rateLimited'
  | 'canceled'
  | 'unknown'

/**
 * Discriminates errors thrown during detail screen fetching and mutation operations.
 *
 * Rules:
 * 1. Not an Axios error (e.g. JS TypeError, ReferenceError) => 'unknown' (never treat runtime errors as offline!)
 * 2. Canceled request (axios.isCancel or ERR_CANCELED) => 'canceled' (stays silent in UI)
 * 3. HTTP 404 => 'notFound'
 * 4. HTTP 401 => 'unauthorized' (session expired)
 * 5. HTTP 403 => 'forbidden'
 * 6. HTTP 409 => 'conflict'
 * 7. HTTP 400 or 422 => 'validation'
 * 8. HTTP 429 => 'rateLimited'
 * 9. HTTP >= 500 => 'serverError' (5xx is server failure, not client offline)
 * 10. ECONNABORTED / ETIMEDOUT / message includes timeout / HTTP 408 => 'timeout'
 * 11. ERR_NETWORK or (no response && message === 'Network Error') => 'offline'
 * 12. Anything else (including unrecognized 4xx) => 'unknown' (never relabeled as network)
 */
export function getDetailErrorKind(error: unknown): DetailErrorKind {
  if (!axios.isAxiosError(error)) {
    return 'unknown'
  }

  if (axios.isCancel(error) || error.code === 'ERR_CANCELED') {
    return 'canceled'
  }

  const status = error.response?.status
  if (status === 404) {
    return 'notFound'
  }

  if (status === 401) {
    return 'unauthorized'
  }

  if (status === 403) {
    return 'forbidden'
  }

  if (status === 409) {
    return 'conflict'
  }

  if (status === 400 || status === 422) {
    return 'validation'
  }

  if (status === 429) {
    return 'rateLimited'
  }

  if (typeof status === 'number' && status >= 500) {
    return 'serverError'
  }

  const code = error.code
  const message = error.message

  if (
    status === 408 ||
    code === 'ECONNABORTED' ||
    code === 'ETIMEDOUT' ||
    (typeof message === 'string' && /timeout/i.test(message))
  ) {
    return 'timeout'
  }

  if (
    code === 'ERR_NETWORK' ||
    (!error.response && typeof message === 'string' && /network\s*error/i.test(message))
  ) {
    return 'offline'
  }

  return 'unknown'
}

/**
 * Single source of truth for mutation error messages (Arabic).
 * Maps API, network, and validation errors into clear, actionable Arabic text for alerts/toasts.
 * Preserves specific Arabic messages returned from the backend where available.
 */
export function getMutationErrorMessage(
  error: unknown,
  fallbackMessage: string = 'تعذّر إتمام العملية، حاول مرة أخرى'
): string {
  const kind = getDetailErrorKind(error)

  if (kind === 'offline') {
    return 'تعذر الاتصال بالإنترنت. يرجى التحقق من اتصالك والمحاولة مجدداً.'
  }

  if (kind === 'timeout') {
    return 'انتهت مهلة الاتصال بالخادم. يرجى إعادة المحاولة.'
  }

  if (kind === 'unauthorized') {
    return 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.'
  }

  if (kind === 'rateLimited') {
    return 'لقد تجاوزت الحد المسموح من الطلبات. يرجى الانتظار قليلاً ثم المحاولة مرة أخرى.'
  }

  if (kind === 'serverError') {
    return 'حدث خطأ في الخادم. يرجى المحاولة مرة أخرى لاحقاً.'
  }

  // Preserve backend-provided Arabic business message if present
  if (axios.isAxiosError(error) && error.response?.data) {
    const data = error.response.data as { message?: unknown }
    if (typeof data.message === 'string' && /[\u0600-\u06FF]/.test(data.message)) {
      return data.message.trim()
    }
    if (Array.isArray(data.message)) {
      const arabicItem = data.message.find(
        (m): m is string => typeof m === 'string' && /[\u0600-\u06FF]/.test(m)
      )
      if (arabicItem) {
        return arabicItem.trim()
      }
    }
  }

  if (kind === 'forbidden') {
    return 'ليس لديك الصلاحية لتنفيذ هذا الإجراء.'
  }

  if (kind === 'notFound') {
    return 'العنصر المطلوب غير موجود أو تم حذفه.'
  }

  if (kind === 'conflict') {
    return 'تم تعديل البيانات من جهاز آخر. يرجى التحديث والمحاولة مجدداً.'
  }

  if (kind === 'validation') {
    return 'بيانات الطلب غير صالحة. يرجى التأكد من البيانات والمحاولة مجدداً.'
  }

  return fallbackMessage
}

