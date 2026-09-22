const ARABIC_MONTHS = [
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
 * Formats numeric amounts using Western digits with comma separators (en-US locale).
 */
export function formatNumberWestern(num: number | null | undefined): string {
  if (num === null || num === undefined || isNaN(num)) return '0'
  return num.toLocaleString('en-US')
}

/**
 * Formats prices using Western digits and the OMR currency symbol.
 * Example: 15000 -> "15,000 ر.ع"
 */
export function formatDetailPrice(
  amount: number | null | undefined,
  currency = 'ر.ع'
): string {
  const formatted = formatNumberWestern(amount)
  return `${formatted} ${currency}`
}

/**
 * Formats mileage with Western digits and the Arabic kilometer unit.
 * Example: 50000 -> "50,000 كم"
 */
export function formatMileage(mileage: number | null | undefined): string {
  if (mileage === null || mileage === undefined || isNaN(mileage)) return ''
  return `${formatNumberWestern(mileage)} كم`
}

/**
 * Formats an ISO date into relative Arabic time ("posted X ago").
 * Accepts an optional reference `now` Date for deterministic unit testing.
 */
export function formatRelativeTimeAr(
  isoDate: string,
  now: Date = new Date()
): string {
  const date = new Date(isoDate)
  if (isNaN(date.getTime())) return ''

  const diffMs = now.getTime() - date.getTime()
  if (diffMs < 0) return 'الآن'

  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  const diffWeeks = Math.floor(diffDays / 7)
  const diffMonths = Math.floor(diffDays / 30)
  const diffYears = Math.floor(diffDays / 365)

  if (diffSecs < 60) return 'الآن'
  if (diffMins === 1) return 'منذ دقيقة'
  if (diffMins === 2) return 'منذ دقيقتين'
  if (diffMins >= 3 && diffMins <= 10) return `منذ ${diffMins} دقائق`
  if (diffMins < 60) return `منذ ${diffMins} دقيقة`

  if (diffHours === 1) return 'منذ ساعة'
  if (diffHours === 2) return 'منذ ساعتين'
  if (diffHours >= 3 && diffHours <= 10) return `منذ ${diffHours} ساعات`
  if (diffHours < 24) return `منذ ${diffHours} ساعة`

  if (diffDays === 1) return 'منذ يوم'
  if (diffDays === 2) return 'منذ يومين'
  if (diffDays >= 3 && diffDays < 7) return `منذ ${diffDays} أيام`

  if (diffWeeks === 1) return 'منذ أسبوع'
  if (diffWeeks === 2) return 'منذ أسبوعين'
  if (diffWeeks >= 3 && diffWeeks <= 4 && diffDays < 30) return `منذ ${diffWeeks} أسابيع`

  if (diffMonths === 1) return 'منذ شهر'
  if (diffMonths === 2) return 'منذ شهرين'
  if (diffMonths >= 3 && diffMonths <= 10) return `منذ ${diffMonths} أشهر`
  if (diffMonths < 12) return `منذ ${diffMonths} شهر`

  if (diffYears === 1) return 'منذ سنة'
  if (diffYears === 2) return 'منذ سنتين'
  if (diffYears >= 3 && diffYears <= 10) return `منذ ${diffYears} سنوات`
  return `منذ ${diffYears} سنة`
}

/**
 * Formats seller account creation date into "عضو منذ [Month] [Year]".
 * Uses UTC month and year for consistent timezone-independent formatting.
 */
export function formatMemberSince(isoDate: string): string {
  const date = new Date(isoDate)
  if (isNaN(date.getTime())) return 'عضو في سوق ون'

  const monthName = ARABIC_MONTHS[date.getUTCMonth()]
  const year = date.getUTCFullYear()
  return `عضو منذ ${monthName} ${year}`
}
