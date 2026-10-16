/**
 * Hermes-safe suspension date formatter without relying on Intl.DateTimeFormat
 * Returns a localized Arabic string or fallback "حتى إشعار آخر" if date is null/invalid.
 */
export function formatSuspensionDate(isoString?: string | null): string {
  if (!isoString || typeof isoString !== 'string') {
    return 'حتى إشعار آخر'
  }

  const d = new Date(isoString)
  if (isNaN(d.getTime())) {
    return 'حتى إشعار آخر'
  }

  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')

  const hours24 = d.getHours()
  const minutes = String(d.getMinutes()).padStart(2, '0')

  const isPM = hours24 >= 12
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12
  const ampm = isPM ? 'م' : 'ص'

  return `${year}/${month}/${day} الساعة ${hours12}:${minutes} ${ampm}`
}
