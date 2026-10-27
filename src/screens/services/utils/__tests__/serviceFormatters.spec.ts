import {
  normalizeArabicDayName,
  formatWorkingDays,
  formatSingleTimeDisplay,
  formatServiceWorkingHours,
  formatServicePrice,
  sanitizeWebsiteUrl,
} from '../serviceFormatters'

describe('serviceFormatters', () => {
  describe('normalizeArabicDayName', () => {
    it('normalizes Arabic day variations', () => {
      expect(normalizeArabicDayName('السبت')).toBe('السبت')
      expect(normalizeArabicDayName('سبت')).toBe('السبت')
      expect(normalizeArabicDayName('الأحد')).toBe('الأحد')
      expect(normalizeArabicDayName('الاحد')).toBe('الأحد')
      expect(normalizeArabicDayName('الإثنين')).toBe('الاثنين')
      expect(normalizeArabicDayName('الاثنين')).toBe('الاثنين')
      expect(normalizeArabicDayName('الثلاثاء')).toBe('الثلاثاء')
      expect(normalizeArabicDayName('الأربعاء')).toBe('الأربعاء')
      expect(normalizeArabicDayName('الاربعاء')).toBe('الأربعاء')
      expect(normalizeArabicDayName('الخميس')).toBe('الخميس')
      expect(normalizeArabicDayName('الجمعة')).toBe('الجمعة')
    })

    it('normalizes English day keys (case-insensitive and short)', () => {
      expect(normalizeArabicDayName('SATURDAY')).toBe('السبت')
      expect(normalizeArabicDayName('Sunday')).toBe('الأحد')
      expect(normalizeArabicDayName('mon')).toBe('الاثنين')
      expect(normalizeArabicDayName('tue')).toBe('الثلاثاء')
      expect(normalizeArabicDayName('Wednesday')).toBe('الأربعاء')
      expect(normalizeArabicDayName('THU')).toBe('الخميس')
      expect(normalizeArabicDayName('fri')).toBe('الجمعة')
    })

    it('normalizes numbers 0-6 (numeric and string)', () => {
      expect(normalizeArabicDayName(0)).toBe('الأحد')
      expect(normalizeArabicDayName(1)).toBe('الاثنين')
      expect(normalizeArabicDayName(6)).toBe('السبت')
      expect(normalizeArabicDayName('0')).toBe('الأحد')
      expect(normalizeArabicDayName('5')).toBe('الجمعة')
    })

    it('skips unknown or invalid values returning null', () => {
      expect(normalizeArabicDayName(null)).toBeNull()
      expect(normalizeArabicDayName(undefined)).toBeNull()
      expect(normalizeArabicDayName('')).toBeNull()
      expect(normalizeArabicDayName('funday')).toBeNull()
      expect(normalizeArabicDayName(7)).toBeNull()
      expect(normalizeArabicDayName(-1)).toBeNull()
      expect(normalizeArabicDayName({})).toBeNull()
    })

    it('guards against prototype pollution keys and returns null', () => {
      expect(normalizeArabicDayName('constructor')).toBeNull()
      expect(normalizeArabicDayName('__proto__')).toBeNull()
      expect(normalizeArabicDayName('toString')).toBeNull()
      expect(normalizeArabicDayName('valueOf')).toBeNull()
    })
  })

  describe('formatWorkingDays', () => {
    it('returns smart summary for all 7 days', () => {
      const allDays = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة']
      const res = formatWorkingDays(allDays)
      expect(res.summary).toBe('طوال أيام الأسبوع (يومياً)')
      expect(res.labels.length).toBe(7)
    })

    it('returns smart summary for Saturday to Thursday', () => {
      const days = ['sat', 'sun', 'mon', 'tue', 'wed', 'thu']
      const res = formatWorkingDays(days)
      expect(res.summary).toBe('من السبت إلى الخميس')
      expect(res.labels.length).toBe(6)
    })

    it('returns smart summary for Sunday to Thursday', () => {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday']
      const res = formatWorkingDays(days)
      expect(res.summary).toBe('من الأحد إلى الخميس')
      expect(res.labels.length).toBe(5)
    })

    it('joins custom day list with Arabic comma and deduplicates', () => {
      const days = ['الجمعة', 'السبت', 'fri', 'unknown']
      const res = formatWorkingDays(days)
      expect(res.summary).toBe('الجمعة، السبت')
      expect(res.labels).toEqual(['الجمعة', 'السبت'])
    })

    it('handles empty or missing arrays safely', () => {
      expect(formatWorkingDays([])).toEqual({ labels: [], summary: '' })
      expect(formatWorkingDays(undefined)).toEqual({ labels: [], summary: '' })
    })
  })

  describe('formatServiceWorkingHours', () => {
    it('formats 24h open and close to Arabic 12h range', () => {
      const hours = formatServiceWorkingHours('08:00', '18:30')
      expect(hours).toBe('من 08:00 ص إلى 06:30 م')
    })

    it('handles 12:00 PM and midnight correctly', () => {
      expect(formatSingleTimeDisplay('12:00')).toBe('12:00 م')
      expect(formatSingleTimeDisplay('00:00')).toBe('12:00 ص')
    })

    it('handles single boundary', () => {
      expect(formatServiceWorkingHours('09:00', null)).toBe('يبدأ العمل 09:00 ص')
      expect(formatServiceWorkingHours(null, '22:00')).toBe('حتى 10:00 م')
    })

    it('returns undefined if both null or invalid', () => {
      expect(formatServiceWorkingHours(null, undefined)).toBeUndefined()
      expect(formatServiceWorkingHours('invalid', '')).toBeUndefined()
    })
  })

  describe('formatServicePrice', () => {
    it('formats price range with from and to', () => {
      const price = formatServicePrice(15, 30, null, 'OMR')
      expect(price.isRange).toBe(true)
      expect(price.typeLabel).toBe('نطاق السعر التقريبي')
      expect(price.amountLabel).toBe('15 - 30 ر.ع.')
    })

    it('formats starting price when only priceFrom is provided', () => {
      const price = formatServicePrice(20, null, null, 'OMR')
      expect(price.isRange).toBe(false)
      expect(price.typeLabel).toBe('السعر يبدأ من')
      expect(price.amountLabel).toBe('20 ر.ع.')
    })

    it('formats exact price when only price is provided', () => {
      const price = formatServicePrice(null, null, 50, 'OMR')
      expect(price.isRange).toBe(false)
      expect(price.typeLabel).toBeUndefined()
      expect(price.amountLabel).toBe('50 ر.ع.')
    })

    it('returns contact for price when price is 0 or missing', () => {
      expect(formatServicePrice(0, 0, 0).amountLabel).toBe('تواصل لمعرفة السعر')
      expect(formatServicePrice(null, null, null).amountLabel).toBe('تواصل لمعرفة السعر')
    })
  })

  describe('sanitizeWebsiteUrl', () => {
    it('accepts safe http and https URLs and generates displayUrl', () => {
      const res = sanitizeWebsiteUrl('https://auto-care.om/services/')
      expect(res).toEqual({
        url: 'https://auto-care.om/services/',
        displayUrl: 'auto-care.om/services',
      })
    })

    it('adds https to bare domains', () => {
      const res = sanitizeWebsiteUrl('garage-alstar.com')
      expect(res).toEqual({
        url: 'https://garage-alstar.com',
        displayUrl: 'garage-alstar.com',
      })
    })

    it('rejects unsafe schemes', () => {
      expect(sanitizeWebsiteUrl('javascript:alert(1)')).toBeUndefined()
      expect(sanitizeWebsiteUrl('data:text/html;base64,...')).toBeUndefined()
      expect(sanitizeWebsiteUrl('file:///etc/passwd')).toBeUndefined()
    })

    it('rejects URLs with embedded user credentials (spoofing protection)', () => {
      expect(sanitizeWebsiteUrl('https://trusted.com@evil.com')).toBeUndefined()
      expect(sanitizeWebsiteUrl('https://user:pass@evil.com/path')).toBeUndefined()
    })

    it('handles invalid or empty inputs gracefully', () => {
      expect(sanitizeWebsiteUrl('')).toBeUndefined()
      expect(sanitizeWebsiteUrl(null)).toBeUndefined()
      expect(sanitizeWebsiteUrl('not a domain')).toBeUndefined()
    })
  })
})
