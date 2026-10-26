import { formatSimilarListingPrice } from './formatSimilarListingPrice'

describe('formatSimilarListingPrice', () => {
  it('formats sale price with currency', () => {
    expect(formatSimilarListingPrice({ price: 15000, currency: 'OMR' })).toBe('15,000 ر.ع')
    expect(formatSimilarListingPrice({ price: '28000.00', currency: 'OMR' })).toBe('28,000 ر.ع')
  })

  it('formats daily rental price with / يوم suffix taking precedence over monthly and sale price', () => {
    expect(
      formatSimilarListingPrice({
        price: 25000,
        dailyPrice: 120,
        monthlyPrice: 2500,
        currency: 'OMR',
      })
    ).toBe('120 ر.ع / يوم')
  })

  it('formats monthly rental price with / شهر suffix when dailyPrice is absent', () => {
    expect(
      formatSimilarListingPrice({
        dailyPrice: null,
        monthlyPrice: 650,
        currency: 'OMR',
      })
    ).toBe('650 ر.ع / شهر')
  })

  it('returns empty string when price fields are null, undefined, or empty string', () => {
    expect(formatSimilarListingPrice(null)).toBe('')
    expect(formatSimilarListingPrice(undefined)).toBe('')
    expect(formatSimilarListingPrice({})).toBe('')
    expect(formatSimilarListingPrice({ price: null, dailyPrice: null, monthlyPrice: null })).toBe('')
    expect(formatSimilarListingPrice({ price: '' })).toBe('')
  })

  it('returns empty string when price cannot be parsed as a decimal number', () => {
    expect(formatSimilarListingPrice({ price: 'invalid' })).toBe('')
  })
})
