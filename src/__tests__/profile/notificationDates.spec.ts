import {
  getNotificationDateLabel,
  groupNotificationsByDate,
} from '../../utils/notificationDates'

describe('notificationDates (D-343 WhatsApp-style date separators)', () => {
  const localNow = new Date(2026, 10, 16, 14, 30, 0) // 16 Nov 2026, 14:30 local

  it('returns "اليوم" for timestamps on the same local calendar day', () => {
    const morning = new Date(2026, 10, 16, 0, 5, 0).toISOString()
    const afternoon = new Date(2026, 10, 16, 14, 29, 0).toISOString()

    expect(getNotificationDateLabel(morning, localNow)).toBe('اليوم')
    expect(getNotificationDateLabel(afternoon, localNow)).toBe('اليوم')
  })

  it('returns "أمس" for timestamps on the previous local calendar day', () => {
    const lateYesterday = new Date(2026, 10, 15, 23, 59, 0).toISOString()
    const earlyYesterday = new Date(2026, 10, 15, 0, 1, 0).toISOString()

    expect(getNotificationDateLabel(lateYesterday, localNow)).toBe('أمس')
    expect(getNotificationDateLabel(earlyYesterday, localNow)).toBe('أمس')
  })

  it('returns Arabic weekday name for 2 to 6 days ago', () => {
    // 16 Nov 2026 is Monday (الإثنين)
    // 14 Nov 2026 (2 days ago) = Saturday (السبت)
    // 13 Nov 2026 (3 days ago) = Friday (الجمعة)
    // 10 Nov 2026 (6 days ago) = Tuesday (الثلاثاء)
    expect(getNotificationDateLabel(new Date(2026, 10, 14, 12, 0, 0).toISOString(), localNow)).toBe('السبت')
    expect(getNotificationDateLabel(new Date(2026, 10, 13, 12, 0, 0).toISOString(), localNow)).toBe('الجمعة')
    expect(getNotificationDateLabel(new Date(2026, 10, 10, 12, 0, 0).toISOString(), localNow)).toBe('الثلاثاء')
  })

  it('returns full Arabic date like "9 نوفمبر" for 7+ days ago', () => {
    const sevenDaysAgo = new Date(2026, 10, 9, 12, 0, 0).toISOString()
    const older = new Date(2026, 9, 25, 10, 0, 0).toISOString()

    expect(getNotificationDateLabel(sevenDaysAgo, localNow)).toBe('9 نوفمبر')
    expect(getNotificationDateLabel(older, localNow)).toBe('25 أكتوبر')
  })

  it('recomputes label accurately across midnight rollover with two fixed now values', () => {
    const itemIso = new Date(2026, 10, 15, 20, 0, 0).toISOString()
    const beforeMidnight = new Date(2026, 10, 15, 23, 55, 0)
    const afterMidnight = new Date(2026, 10, 16, 0, 5, 0)

    expect(getNotificationDateLabel(itemIso, beforeMidnight)).toBe('اليوم')
    expect(getNotificationDateLabel(itemIso, afterMidnight)).toBe('أمس')

    const sectionsBefore = groupNotificationsByDate([{ id: '1', createdAt: itemIso }], beforeMidnight)
    const sectionsAfter = groupNotificationsByDate([{ id: '1', createdAt: itemIso }], afterMidnight)

    expect(sectionsBefore[0].title).toBe('اليوم')
    expect(sectionsAfter[0].title).toBe('أمس')
  })

  it('handles invalid or empty dates gracefully without throwing', () => {
    expect(getNotificationDateLabel('', localNow)).toBe('أقدم')
    expect(getNotificationDateLabel('not-a-date', localNow)).toBe('أقدم')

    const grouped = groupNotificationsByDate(
      [
        { id: '1', createdAt: new Date(2026, 10, 16, 9, 0, 0).toISOString() },
        { id: '2', createdAt: 'invalid' },
      ],
      localNow
    )
    expect(grouped.map((s) => s.title)).toEqual(['اليوم', 'أقدم'])
  })
})
