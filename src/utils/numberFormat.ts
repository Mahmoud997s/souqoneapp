/**
 * Shared Western-digit (en-US) number formatting utilities (D-381).
 * Re-exported from `src/utils/listing-detail/formatters.ts` for full backward compatibility.
 * Never use for years (2020 stays 2020), phone numbers, IDs, or live TextInput typing.
 */

/**
 * Normalizes Arabic-Indic (٠-٩) and Extended Arabic-Indic (۰-۹) digits to Western Latin digits (0-9).
 * Intended for address / location display text on detail pages so mixed digits render consistently.
 */
export function normalizeArabicIndicDigits(text: string): string {
  if (!text) return text
  return text
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06F0))
}

/**
 * Formats numeric amounts using Western digits with comma separators (en-US locale).
 */
export function formatNumberWestern(num: number | null | undefined): string {
  if (num === null || num === undefined || Number.isNaN(num)) return '0'
  return num.toLocaleString('en-US')
}

function parseFiniteBound(val: string | number | null | undefined): number | undefined {
  if (val === null || val === undefined || val === '') return undefined
  const n = typeof val === 'number' ? val : Number(val)
  return Number.isFinite(n) ? n : undefined
}

/**
 * Formats an applied price/rate filter chip label with Western thousands separators:
 * - both min & max -> "1,000 - 5,000 ر.ع"
 * - only min       -> "من 1,000 ر.ع"
 * - only max       -> "حتى 5,000 ر.ع"
 * - neither        -> fallbackLabel
 */
export function formatPriceRangeChipLabel(
  min?: string | number | null,
  max?: string | number | null,
  fallbackLabel = 'السعر',
  unit = 'ر.ع'
): string {
  const minNum = parseFiniteBound(min)
  const maxNum = parseFiniteBound(max)

  if (minNum !== undefined && maxNum !== undefined) {
    return `${formatNumberWestern(minNum)} - ${formatNumberWestern(maxNum)} ${unit}`
  }
  if (minNum !== undefined) {
    return `من ${formatNumberWestern(minNum)} ${unit}`
  }
  if (maxNum !== undefined) {
    return `حتى ${formatNumberWestern(maxNum)} ${unit}`
  }
  return fallbackLabel
}
