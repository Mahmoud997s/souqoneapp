export interface NotificationSection<T> {
  title: string
  key: string
  data: T[]
}

const ARABIC_WEEKDAYS = [
  'الأحد',
  'الإثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
  'السبت',
] as const

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
] as const

const MS_PER_DAY = 86_400_000

/**
 * Formats a notification timestamp into a WhatsApp-style Arabic date separator
 * using local calendar days so timezone/DST boundaries never misclassify days.
 */
export function getNotificationDateLabel(iso: string, now: Date = new Date()): string {
  if (!iso) return 'أقدم'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'أقدم'

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const targetStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.round((todayStart.getTime() - targetStart.getTime()) / MS_PER_DAY)

  if (diffDays <= 0) return 'اليوم'
  if (diffDays === 1) return 'أمس'
  if (diffDays >= 2 && diffDays <= 6) return ARABIC_WEEKDAYS[date.getDay()]

  return `${date.getDate()} ${ARABIC_MONTHS[date.getMonth()]}`
}

function getLocalDayKey(iso: string): string {
  if (!iso) return 'unknown'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'unknown'
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

/**
 * Groups notifications by local calendar day while preserving server order.
 */
export function groupNotificationsByDate<T extends { createdAt: string }>(
  items: T[],
  now: Date = new Date()
): NotificationSection<T>[] {
  const sectionsMap = new Map<string, NotificationSection<T>>()

  for (const item of items) {
    const key = getLocalDayKey(item.createdAt)
    let section = sectionsMap.get(key)
    if (!section) {
      section = {
        key,
        title: getNotificationDateLabel(item.createdAt, now),
        data: [],
      }
      sectionsMap.set(key, section)
    }
    section.data.push(item)
  }

  return Array.from(sectionsMap.values())
}
