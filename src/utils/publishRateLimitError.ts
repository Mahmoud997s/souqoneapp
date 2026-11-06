/**
 * Formats a timestamp or ISO string into Cairo local time representation in Arabic.
 */
export function formatCairoResetsTime(resetsAt: string | number | Date): string {
  try {
    const date =
      typeof resetsAt === 'string' || typeof resetsAt === 'number'
        ? new Date(resetsAt)
        : resetsAt

    if (isNaN(date.getTime())) return String(resetsAt)

    return new Intl.DateTimeFormat('ar-EG', {
      timeZone: 'Africa/Cairo',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      day: 'numeric',
      month: 'short',
    }).format(date)
  } catch {
    return String(resetsAt)
  }
}

/**
 * Extracts and formats rate limit errors (HTTP 429).
 * Handles structured backend responses (PR #159 with window/code/resetsAt)
 * as well as legacy/fallback unstructured throttler responses.
 */
export function getPublishRateLimitErrorMessage(err: unknown): string {
  const data = (err as any)?.response?.data

  if (data && typeof data === 'object') {
    const window = data.window // 'day' | 'month'
    const code = data.code
    const resetsAt = data.resetsAt
    const limit = data.limit

    if (window === 'day' || code === 'DAILY_LIMIT_EXCEEDED') {
      let msg = limit
        ? `لقد وصلت للحد اليومي لنشر الإعلانات (${limit} إعلانات في اليوم).`
        : 'لقد وصلت للحد اليومي لنشر الإعلانات.'
      if (resetsAt) {
        msg += ` يُعاد تعيين الحد في ${formatCairoResetsTime(resetsAt)}.`
      }
      return msg
    }

    if (window === 'month' || code === 'MONTHLY_LIMIT_EXCEEDED') {
      let msg = limit
        ? `لقد وصلت للحد الشهري لنشر الإعلانات (${limit} إعلاناً في الشهر).`
        : 'لقد وصلت للحد الشهري لنشر الإعلانات.'
      if (resetsAt) {
        msg += ` يُعاد تعيين الحد في ${formatCairoResetsTime(resetsAt)}.`
      }
      return msg
    }
  }

  // Fallback for unstructured 429 (legacy throttler)
  return 'تجاوزت الحد المسموح من الطلبات، يرجى الانتظار دقيقة واحدة ثم المحاولة مجدداً.'
}
