import { stripMarkdown } from './stripMarkdown'

describe('stripMarkdown', () => {
  it('returns empty string for null, undefined, or empty string', () => {
    expect(stripMarkdown(null)).toBe('')
    expect(stripMarkdown(undefined)).toBe('')
    expect(stripMarkdown('')).toBe('')
    expect(stripMarkdown('   ')).toBe('')
  })

  it('strips bold and italic markdown markers', () => {
    expect(stripMarkdown('حافلة **بحالة الوكالة** وبسعر ممتاز')).toBe('حافلة بحالة الوكالة وبسعر ممتاز')
    expect(stripMarkdown('سيارة __نظيفة جدا__')).toBe('سيارة نظيفة جدا')
    expect(stripMarkdown('محرك *ستة سلندر* أصلي')).toBe('محرك ستة سلندر أصلي')
    expect(stripMarkdown('ناقل حركة _أوتوماتيك_')).toBe('ناقل حركة أوتوماتيك')
    expect(stripMarkdown('ملاحظة: ***عقد ساري***')).toBe('ملاحظة: عقد ساري')
  })

  it('strips headings and hash symbols', () => {
    const input = '# مواصفات الحافلة\n## المحرك والمقصورة\n### حالة الإطارات'
    const expected = 'مواصفات الحافلة\nالمحرك والمقصورة\nحالة الإطارات'
    expect(stripMarkdown(input)).toBe(expected)
  })

  it('strips markdown links keeping link text only', () => {
    const input = 'للمزيد من التفاصيل زوروا [موقعنا الرسمي](https://souqone.om)'
    expect(stripMarkdown(input)).toBe('للمزيد من التفاصيل زوروا موقعنا الرسمي')
  })

  it('strips strikethrough markers', () => {
    const input = 'السعر السابق: ~~25000~~ 22000 ر.ع'
    expect(stripMarkdown(input)).toBe('السعر السابق: 25000 22000 ر.ع')
  })

  it('strips inline code and blockquotes', () => {
    const input = '> تنبيه هام: رقم الهيكل `KMH12345678` مطابق للأوراق الرسمية.'
    expect(stripMarkdown(input)).toBe('تنبيه هام: رقم الهيكل KMH12345678 مطابق للأوراق الرسمية.')
  })

  it('handles realistic multi-line arabic vehicle listing description', () => {
    const input = `
# تويوتا كوستر 2023
**الحالة:** ممتازة جدا بحالة الوكالة
**المسافة المقطوعة:** 45,000 كم
* صيانة دورية بالوكالة
* أربعة إطارات جديدة
للتواصل المباشر عبر التطبيق.
    `.trim()

    const stripped = stripMarkdown(input)
    expect(stripped).not.toContain('**')
    expect(stripped).not.toContain('#')
    expect(stripped).toContain('تويوتا كوستر 2023')
    expect(stripped).toContain('الحالة: ممتازة جدا بحالة الوكالة')
    expect(stripped).toContain('المسافة المقطوعة: 45,000 كم')
  })
})
