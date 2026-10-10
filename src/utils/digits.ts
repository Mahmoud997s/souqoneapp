/**
 * Normalizes numeric digits:
 * 1. Returns empty string if input is not a string.
 * 2. Converts Arabic-Indic (U+0660..U+0669) and Persian (U+06F0..U+06F9) digits to ASCII using code point arithmetic.
 * 3. Strips all Unicode category `Cf` characters.
 * 4. Trims whitespace.
 */
export function normalizeDigits(raw: unknown): string {
  if (typeof raw !== 'string') return ''
  return raw
    .replace(/[\u0660-\u0669]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x0660 + 0x30))
    .replace(/[\u06F0-\u06F9]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x06F0 + 0x30))
    .replace(/\p{Cf}/gu, '')
    .trim()
}
