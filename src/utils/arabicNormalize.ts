const TASHKEEL_RE = /[\u064B-\u065F\u0670]/g
const TATWEEL_RE = /\u0640/g
const ALEF_RE = /[أإآٱ]/g
const ARABIC_INDIC_DIGITS_RE = /[\u0660-\u0669]/g
const PERSIAN_DIGITS_RE = /[\u06F0-\u06F9]/g

/**
 * Normalizes Arabic and mixed-script text for client-side search/filter matching.
 * - Unifies Alef variants (أ/إ/آ/ٱ -> ا), Alif Maksura (ى -> ي), and Teh Marbuta (ة -> ه)
 * - Strips Arabic diacritics (tashkeel) and tatweel
 * - Converts Arabic-Indic (٠-٩) and Persian (۰-۹) digits to ASCII 0-9
 * - Trims whitespace and lowercases Latin characters
 */
export function normalizeArabic(value: string): string {
  if (!value) return ''
  return value
    .replace(TASHKEEL_RE, '')
    .replace(TATWEEL_RE, '')
    .replace(ALEF_RE, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(ARABIC_INDIC_DIGITS_RE, (ch) => String(ch.charCodeAt(0) - 0x0660))
    .replace(PERSIAN_DIGITS_RE, (ch) => String(ch.charCodeAt(0) - 0x06f0))
    .trim()
    .toLowerCase()
}

/**
 * Checks whether `candidate` or any of its `aliases` matches `query`
 * after Arabic normalization. Empty queries always match.
 */
export function matchesArabicQuery(
  candidate: string | null | undefined,
  query: string,
  ...aliases: Array<string | null | undefined>
): boolean {
  const normQuery = normalizeArabic(query)
  if (!normQuery) return true
  const fields = [candidate, ...aliases]
  return fields.some((field) => Boolean(field && normalizeArabic(field).includes(normQuery)))
}
