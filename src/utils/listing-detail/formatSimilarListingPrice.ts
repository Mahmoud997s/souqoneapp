import { formatNumberWestern, parseDecimal } from './formatters'
import { normalizeCurrency } from './mapBusDetail'

export interface FormatSimilarPriceInput {
  price?: number | string | null
  dailyPrice?: number | string | null
  monthlyPrice?: number | string | null
  currency?: string | null
}

/**
 * Pure formatter for similar listing card prices across cars, buses, and equipment detail screens.
 * Supports sale price, daily rental price, and monthly rental price with appropriate Arabic suffixes.
 */
export function formatSimilarListingPrice(input?: FormatSimilarPriceInput | null): string {
  if (!input) return ''

  const priceVal = input.dailyPrice ?? input.monthlyPrice ?? input.price
  if (priceVal === undefined || priceVal === null || priceVal === '') {
    return ''
  }

  const parsed = parseDecimal(priceVal)
  if (parsed === undefined || isNaN(parsed)) {
    return ''
  }

  const periodSuffix =
    input.dailyPrice !== undefined && input.dailyPrice !== null
      ? ' / يوم'
      : input.monthlyPrice !== undefined && input.monthlyPrice !== null
        ? ' / شهر'
        : ''

  const currencyLabel = normalizeCurrency(input.currency)
  return `${formatNumberWestern(parsed)} ${currencyLabel}${periodSuffix}`
}
