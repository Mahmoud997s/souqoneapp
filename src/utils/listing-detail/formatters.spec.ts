import {
  formatNumberWestern,
  formatDetailPrice,
  formatMileage,
  formatRelativeTimeAr,
  formatMemberSince,
  parseDecimal,
} from './formatters'

describe('formatters', () => {
  describe('formatNumberWestern', () => {
    it('returns "0" for null, undefined, or NaN', () => {
      expect(formatNumberWestern(null)).toBe('0')
      expect(formatNumberWestern(undefined)).toBe('0')
      expect(formatNumberWestern(NaN)).toBe('0')
    })

    it('formats numbers with commas in en-US format', () => {
      expect(formatNumberWestern(0)).toBe('0')
      expect(formatNumberWestern(500)).toBe('500')
      expect(formatNumberWestern(5000)).toBe('5,000')
      expect(formatNumberWestern(150000)).toBe('150,000')
      expect(formatNumberWestern(5000.5)).toBe('5,000.5')
    })
  })

  describe('formatDetailPrice', () => {
    it('formats prices with default currency "ر.ع"', () => {
      expect(formatDetailPrice(0)).toBe('0 ر.ع')
      expect(formatDetailPrice(5000)).toBe('5,000 ر.ع')
      expect(formatDetailPrice(150000)).toBe('150,000 ر.ع')
      expect(formatDetailPrice(5000.5)).toBe('5,000.5 ر.ع')
      expect(formatDetailPrice(null)).toBe('0 ر.ع')
      expect(formatDetailPrice(undefined)).toBe('0 ر.ع')
    })

    it('supports custom currency', () => {
      expect(formatDetailPrice(100, '$')).toBe('100 $')
    })
  })

  describe('formatMileage', () => {
    it('returns empty string for null, undefined, or NaN', () => {
      expect(formatMileage(null)).toBe('')
      expect(formatMileage(undefined)).toBe('')
      expect(formatMileage(NaN)).toBe('')
    })

    it('formats valid mileage with "كم"', () => {
      expect(formatMileage(0)).toBe('0 كم')
      expect(formatMileage(50000)).toBe('50,000 كم')
      expect(formatMileage(125000)).toBe('125,000 كم')
    })
  })

  describe('formatRelativeTimeAr', () => {
    const fixedNow = new Date('2026-09-22T15:00:00.000Z')

    it('returns empty string for invalid dates', () => {
      expect(formatRelativeTimeAr('invalid-date', fixedNow)).toBe('')
    })

    it('returns "الآن" for dates in the future or under 60 seconds ago', () => {
      expect(formatRelativeTimeAr('2026-09-22T15:00:10.000Z', fixedNow)).toBe('الآن')
      expect(formatRelativeTimeAr('2026-09-22T14:59:40.000Z', fixedNow)).toBe('الآن')
    })

    it('formats minutes correctly', () => {
      expect(formatRelativeTimeAr('2026-09-22T14:59:00.000Z', fixedNow)).toBe('منذ دقيقة')
      expect(formatRelativeTimeAr('2026-09-22T14:58:00.000Z', fixedNow)).toBe('منذ دقيقتين')
      expect(formatRelativeTimeAr('2026-09-22T14:55:00.000Z', fixedNow)).toBe('منذ 5 دقائق')
      expect(formatRelativeTimeAr('2026-09-22T14:40:00.000Z', fixedNow)).toBe('منذ 20 دقيقة')
    })

    it('formats hours correctly', () => {
      expect(formatRelativeTimeAr('2026-09-22T14:00:00.000Z', fixedNow)).toBe('منذ ساعة')
      expect(formatRelativeTimeAr('2026-09-22T13:00:00.000Z', fixedNow)).toBe('منذ ساعتين')
      expect(formatRelativeTimeAr('2026-09-22T11:00:00.000Z', fixedNow)).toBe('منذ 4 ساعات')
      expect(formatRelativeTimeAr('2026-09-22T03:00:00.000Z', fixedNow)).toBe('منذ 12 ساعة')
    })

    it('formats days correctly', () => {
      expect(formatRelativeTimeAr('2026-09-21T15:00:00.000Z', fixedNow)).toBe('منذ يوم')
      expect(formatRelativeTimeAr('2026-09-20T15:00:00.000Z', fixedNow)).toBe('منذ يومين')
      expect(formatRelativeTimeAr('2026-09-18T15:00:00.000Z', fixedNow)).toBe('منذ 4 أيام')
      expect(formatRelativeTimeAr('2026-09-16T15:00:00.000Z', fixedNow)).toBe('منذ 6 أيام')
    })

    it('formats weeks correctly', () => {
      expect(formatRelativeTimeAr('2026-09-15T15:00:00.000Z', fixedNow)).toBe('منذ أسبوع')
      expect(formatRelativeTimeAr('2026-09-08T15:00:00.000Z', fixedNow)).toBe('منذ أسبوعين')
      expect(formatRelativeTimeAr('2026-09-01T15:00:00.000Z', fixedNow)).toBe('منذ 3 أسابيع')
    })

    it('formats months correctly', () => {
      expect(formatRelativeTimeAr('2026-08-22T15:00:00.000Z', fixedNow)).toBe('منذ شهر')
      expect(formatRelativeTimeAr('2026-07-22T15:00:00.000Z', fixedNow)).toBe('منذ شهرين')
      expect(formatRelativeTimeAr('2026-04-22T15:00:00.000Z', fixedNow)).toBe('منذ 5 أشهر')
    })

    it('formats years correctly', () => {
      expect(formatRelativeTimeAr('2025-09-22T15:00:00.000Z', fixedNow)).toBe('منذ سنة')
      expect(formatRelativeTimeAr('2024-09-22T15:00:00.000Z', fixedNow)).toBe('منذ سنتين')
      expect(formatRelativeTimeAr('2023-09-22T15:00:00.000Z', fixedNow)).toBe('منذ 3 سنوات')
    })
  })

  describe('formatMemberSince', () => {
    it('returns default fallback for invalid dates', () => {
      expect(formatMemberSince('not-a-date')).toBe('عضو في سوق ون')
    })

    it('formats valid ISO dates into Arabic month and year', () => {
      expect(formatMemberSince('2023-01-15T10:00:00.000Z')).toBe('عضو منذ يناير 2023')
      expect(formatMemberSince('2025-09-01T00:00:00.000Z')).toBe('عضو منذ سبتمبر 2025')
      expect(formatMemberSince('2022-12-31T23:59:59.000Z')).toBe('عضو منذ ديسمبر 2022')
    })
  })

  describe('parseDecimal', () => {
    it('parses numbers and numeric strings', () => {
      expect(parseDecimal(1800)).toBe(1800)
      expect(parseDecimal('1800')).toBe(1800)
      expect(parseDecimal(' 45.5 ')).toBe(45.5)
      expect(parseDecimal('0')).toBe(0)
    })

    it('returns undefined for null, undefined, and empty strings without warning', () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
      expect(parseDecimal(null)).toBeUndefined()
      expect(parseDecimal(undefined)).toBeUndefined()
      expect(parseDecimal('  ')).toBeUndefined()
      expect(warn).not.toHaveBeenCalled()
      warn.mockRestore()
    })

    it('returns undefined and warns for unparseable values instead of coercing to 0', () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
      expect(parseDecimal('not-a-number')).toBeUndefined()
      expect(parseDecimal(NaN)).toBeUndefined()
      expect(parseDecimal({})).toBeUndefined()
      warn.mockRestore()
    })
  })
})
