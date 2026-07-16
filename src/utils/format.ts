export const formatPrice = (amount: number, currency = 'OMR'): string => {
  if (currency === 'OMR') {
    return `${amount.toLocaleString('ar-OM')} ر.ع.`
  }
  return `${amount.toLocaleString()} ${currency}`
}

export const formatDate = (iso: string): string => {
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  const diffWeeks = Math.floor(diffDays / 7)
  const diffMonths = Math.floor(diffDays / 30)

  if (diffSecs < 60) return 'الآن'
  if (diffMins < 60) return `منذ ${diffMins} دقيقة`
  if (diffHours < 24) return `منذ ${diffHours} ساعة`
  if (diffDays === 1) return 'منذ يوم'
  if (diffDays < 7) return `منذ ${diffDays} أيام`
  if (diffWeeks === 1) return 'منذ أسبوع'
  if (diffWeeks < 4) return `منذ ${diffWeeks} أسابيع`
  if (diffMonths === 1) return 'منذ شهر'
  if (diffMonths < 12) return `منذ ${diffMonths} أشهر`

  const months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو',
                   'يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
  return `${date.getDate()} ${months[date.getMonth()]}`
}

export const formatPhone = (phone: string): string =>
  phone.startsWith('+968') ? phone : `+968${phone}`

export const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}م`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}ك`
  return num.toString()
}

const SALARY_PERIOD_AR: Record<string, string> = {
  DAILY: 'يومي',
  MONTHLY: 'شهري',
  YEARLY: 'سنوي',
  NEGOTIABLE: 'قابل للتفاوض',
}

export function formatSalary(
  salary?: number | null,
  period?: string | null,
  currency?: string | null,
): string {
  if (!salary) return 'قابل للتفاوض'
  const cur = !currency || currency === 'OMR' ? 'ر.ع.' : currency
  const per = period ? SALARY_PERIOD_AR[period] ?? period : ''
  return per ? `${salary.toLocaleString('en-US')} ${cur} / ${per}` : `${salary.toLocaleString('en-US')} ${cur}`
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()
}

const AVATAR_HEX_COLORS = [
  '#2563eb', // blue
  '#4f46e5', // indigo
  '#7c3aed', // violet
  '#9333ea', // purple
  '#db2777', // pink
  '#e11d48', // rose
  '#ea580c', // orange
  '#d97706', // amber
  '#059669', // emerald
  '#0d9488', // teal
  '#0891b2', // cyan
  '#0284c7', // sky
]

export function getAvatarColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash + userId.charCodeAt(i)) | 0
  }
  return AVATAR_HEX_COLORS[Math.abs(hash) % AVATAR_HEX_COLORS.length]
}

