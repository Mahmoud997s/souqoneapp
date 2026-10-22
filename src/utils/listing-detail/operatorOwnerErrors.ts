/**
 * Operator owner action error translations.
 * Translates backend HTTP error responses into user-friendly Arabic text.
 */
export function translateOperatorOwnerError(error: unknown): string {
  if (!error || typeof error !== 'object') {
    return 'تعذّر تنفيذ الإجراء. حاول مرة أخرى.'
  }

  const err = error as {
    response?: {
      status?: number
      data?: {
        message?: string | string[]
        statusCode?: number
      }
    }
    message?: string
  }

  const status = err.response?.status
  const backendMsg = err.response?.data?.message
  const messageStr = Array.isArray(backendMsg) ? backendMsg.join(' ') : (backendMsg || '')

  // Specific backend operator error messages
  if (messageStr.includes('يوجد طلب حذف قيد المراجعة بالفعل')) {
    return 'يوجد طلب حذف قيد المراجعة بالفعل لهذا الإعلان.'
  }

  if (messageStr.includes('لا يمكن إلغاء طلب تم البت فيه')) {
    return 'لا يمكن إلغاء طلب تم البت فيه بالفعل أو تم إلغاؤه.'
  }

  if (messageStr.includes('انتهت مهلة إلغاء طلب الحذف')) {
    return 'انتهت مهلة إلغاء طلب الحذف (24 ساعة)، والطلب قيد مراجعة الإدارة الآن.'
  }

  if (messageStr.includes('لا يمكنك إلغاء طلب حذف لا يخصك') || messageStr.includes('لا يمكنك حذف إعلان غيرك')) {
    return 'ليس لديك صلاحية لتنفيذ هذا الإجراء على هذا الإعلان.'
  }

  if (messageStr.includes('طلب الحذف غير موجود')) {
    return 'طلب الحذف غير موجود أو تم البت فيه مسبقاً.'
  }

  // HTTP status codes
  switch (status) {
    case 400:
      return messageStr || 'البيانات المدخلة غير صحيحة.'
    case 401:
      return 'انتهت جلستك. يرجى تسجيل الدخول مجدداً.'
    case 403:
      return 'ليس لديك صلاحية لتنفيذ هذا الإجراء.'
    case 404:
      return 'إعلان المشغل غير موجود.'
    case 409:
      return 'يوجد طلب حذف قيد المراجعة بالفعل لهذا الإعلان.'
    case 429:
      return 'عدد المحاولات كبير جداً. يرجى الانتظار قليلاً.'
    case 500:
    case 502:
    case 503:
      return 'خطأ في الخادم. يرجى المحاولة بعد قليل.'
    default:
      return 'تعذّر تنفيذ الإجراء. حاول مرة أخرى.'
  }
}
