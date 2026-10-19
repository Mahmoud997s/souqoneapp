import { formatDeletionDate } from '../utils/formatDeletionDate'

describe('formatDeletionDate', () => {
  it('formats an ISO date to Oman timezone (UTC+4) in Arabic', () => {
    // 2026-10-25T11:15:00.000Z + 4h = 2026-10-25 15:15:00 (3:15 PM) in Oman
    const iso = '2026-10-25T11:15:00.000Z'
    const formatted = formatDeletionDate(iso)
    expect(formatted).toBe('الأحد 25 أكتوبر 2026 الساعة 3:15 م بتوقيت عُمان')
  })

  it('correctly handles midnight and morning (ص)', () => {
    // 2026-01-01T04:30:00.000Z + 4h = 2026-01-01 08:30:00 (8:30 AM) in Oman (Thursday)
    const iso = '2026-01-01T04:30:00.000Z'
    const formatted = formatDeletionDate(iso)
    expect(formatted).toBe('الخميس 1 يناير 2026 الساعة 8:30 ص بتوقيت عُمان')
  })

  it('correctly handles day crossover due to +4 hours', () => {
    // 2026-05-15T22:00:00.000Z + 4h = 2026-05-16 02:00:00 (Saturday) in Oman
    const iso = '2026-05-15T22:00:00.000Z'
    const formatted = formatDeletionDate(iso)
    expect(formatted).toBe('السبت 16 مايو 2026 الساعة 2:00 ص بتوقيت عُمان')
  })

  it('correctly formats 12 PM (noon) and 12 AM (midnight)', () => {
    // Noon in Oman: 08:00 UTC
    const noonIso = '2026-07-20T08:00:00.000Z'
    expect(formatDeletionDate(noonIso)).toBe('الإثنين 20 يوليو 2026 الساعة 12:00 م بتوقيت عُمان')

    // Midnight in Oman: 20:00 UTC previous day
    const midnightIso = '2026-07-19T20:00:00.000Z'
    expect(formatDeletionDate(midnightIso)).toBe('الإثنين 20 يوليو 2026 الساعة 12:00 ص بتوقيت عُمان')
  })

  it('returns safe fallback for null, undefined, or empty string', () => {
    expect(formatDeletionDate(null)).toBe('موعد غير محدد')
    expect(formatDeletionDate(undefined)).toBe('موعد غير محدد')
    expect(formatDeletionDate('')).toBe('موعد غير محدد')
  })

  it('returns safe fallback for invalid date strings', () => {
    expect(formatDeletionDate('not-a-date')).toBe('موعد غير محدد')
    expect(formatDeletionDate('2026-99-99')).toBe('موعد غير محدد')
  })
})
