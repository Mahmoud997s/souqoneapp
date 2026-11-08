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
 * Handles structured backend responses (PR #159 with PUBLISH_RATE_LIMIT_DAILY_REACHED /
 * PUBLISH_RATE_LIMIT_MONTHLY_REACHED and optional resetsAt), as well as legacy/fallback
 * unstructured throttler responses.
 */
export function getPublishRateLimitErrorMessage(err: unknown): string {
  const data = (err as any)?.response?.data

  if (data && typeof data === 'object') {
    const window = typeof data.window === 'string' ? data.window.toUpperCase() : undefined
    const code = typeof data.code === 'string' ? data.code.toUpperCase() : undefined
    const resetsAt = data.resetsAt
    const limit = data.limit

    const isDaily =
      code === 'PUBLISH_RATE_LIMIT_DAILY_REACHED' ||
      code === 'DAILY_LIMIT_EXCEEDED' ||
      window === 'DAILY' ||
      data.window === 'day'

    const isMonthly =
      code === 'PUBLISH_RATE_LIMIT_MONTHLY_REACHED' ||
      code === 'MONTHLY_LIMIT_EXCEEDED' ||
      window === 'MONTHLY' ||
      data.window === 'month'

    if (isDaily) {
      if (resetsAt) {
        return limit
          ? `وصلت للحد اليومي لنشر الإعلانات (${limit} إعلانات في اليوم). يُعاد تعيين الحد في ${formatCairoResetsTime(resetsAt)}.`
          : `وصلت للحد اليومي للنشر، يُعاد تعيين الحد في ${formatCairoResetsTime(resetsAt)}.`
      }
      return limit
        ? `وصلت للحد اليومي لنشر الإعلانات (${limit} إعلانات في اليوم)، جرّب غداً.`
        : 'وصلت للحد اليومي للنشر، جرّب غداً.'
    }

    if (isMonthly) {
      if (resetsAt) {
        return limit
          ? `وصلت للحد الشهري لنشر الإعلانات (${limit} إعلاناً في الشهر). يُعاد تعيين الحد في ${formatCairoResetsTime(resetsAt)}.`
          : `وصلت للحد الشهري للنشر، يُعاد تعيين الحد في ${formatCairoResetsTime(resetsAt)}.`
      }
      return limit
        ? `وصلت للحد الشهري لنشر الإعلانات (${limit} إعلاناً في الشهر)، جرّب الشهر القادم.`
        : 'وصلت للحد الشهري للنشر، جرّب الشهر القادم.'
    }
  }

  // Fallback for unstructured 429 (legacy throttler)
  return 'تجاوزت الحد المسموح من الطلبات، يرجى الانتظار دقيقة واحدة ثم المحاولة مجدداً.'
}
