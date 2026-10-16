import { formatSuspensionDate } from '../utils/formatSuspensionDate'

describe('formatSuspensionDate', () => {
  it('returns fallback text "حتى إشعار آخر" when input is null or undefined', () => {
    expect(formatSuspensionDate(null)).toBe('حتى إشعار آخر')
    expect(formatSuspensionDate(undefined)).toBe('حتى إشعار آخر')
    expect(formatSuspensionDate('')).toBe('حتى إشعار آخر')
    expect(formatSuspensionDate(123 as any)).toBe('حتى إشعار آخر')
  })

  it('returns fallback text "حتى إشعار آخر" when input is an invalid date string', () => {
    expect(formatSuspensionDate('invalid-date-string')).toBe('حتى إشعار آخر')
    expect(formatSuspensionDate('2026-99-99')).toBe('حتى إشعار آخر')
    expect(formatSuspensionDate('not a date')).toBe('حتى إشعار آخر')
  })

  it('formats a valid date correctly with local year, month, day, and time', () => {
    const date = new Date(2026, 10, 15, 9, 5) // Nov 15, 2026 09:05 AM local
    const formatted = formatSuspensionDate(date.toISOString())
    expect(formatted).toBe('2026/11/15 الساعة 9:05 ص')
  })

  it('handles 12 AM (midnight boundary) as 12:xx ص', () => {
    const midnight = new Date(2026, 4, 1, 0, 30) // May 1, 2026 00:30 (12:30 AM local)
    const formatted = formatSuspensionDate(midnight.toISOString())
    expect(formatted).toBe('2026/05/01 الساعة 12:30 ص')
  })

  it('handles 12 PM (noon boundary) as 12:xx م', () => {
    const noon = new Date(2026, 4, 1, 12, 0) // May 1, 2026 12:00 PM local
    const formatted = formatSuspensionDate(noon.toISOString())
    expect(formatted).toBe('2026/05/01 الساعة 12:00 م')
  })

  it('handles afternoon hours correctly with PM (م)', () => {
    const afternoon = new Date(2026, 6, 20, 15, 45) // 3:45 PM local
    const formatted = formatSuspensionDate(afternoon.toISOString())
    expect(formatted).toBe('2026/07/20 الساعة 3:45 م')
  })

  it('handles late night hours correctly with PM (م)', () => {
    const night = new Date(2026, 11, 31, 23, 59) // 11:59 PM local
    const formatted = formatSuspensionDate(night.toISOString())
    expect(formatted).toBe('2026/12/31 الساعة 11:59 م')
  })
})
