const DAYS_AR = [
  'الأحد',
  'الإثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
  'السبت',
]

const MONTHS_AR = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
]

/**
 * Hermes-safe date formatter for Oman (+4 UTC) fixed timezone
 * Format: "الأحد 25 أكتوبر 2026 الساعة 3:15 م بتوقيت عُمان"
 * Returns safe fallback for invalid or empty inputs.
 */
export function formatDeletionDate(isoString?: string | null): string {
  if (!isoString || typeof isoString !== 'string') {
    return 'موعد غير محدد'
  }

  const timestamp = Date.parse(isoString)
  if (isNaN(timestamp)) {
    return 'موعد غير محدد'
  }

  // Shift to Oman timezone (UTC + 4 hours = +14,400,000 ms)
  const omanOffsetMs = 4 * 60 * 60 * 1000
  const omanDate = new Date(timestamp + omanOffsetMs)

  const dayName = DAYS_AR[omanDate.getUTCDay()]
  const day = omanDate.getUTCDate()
  const monthName = MONTHS_AR[omanDate.getUTCMonth()]
  const year = omanDate.getUTCFullYear()

  const hours24 = omanDate.getUTCHours()
  const minutes = String(omanDate.getUTCMinutes()).padStart(2, '0')

  const isPM = hours24 >= 12
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12
  const ampm = isPM ? 'م' : 'ص'

  return `${dayName} ${day} ${monthName} ${year} الساعة ${hours12}:${minutes} ${ampm} بتوقيت عُمان`
}
