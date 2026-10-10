/**
 * Normalizes numeric digits:
 * 1. Returns empty string if input is not a string.
 * 2. Converts Arabic-Indic (U+0660..U+0669) and Persian (U+06F0..U+06F9) digits to ASCII using code point arithmetic.
 * 3. Strips Unicode category Cf (BMP ranges matching UNICODE_CF_FALLBACK_PATTERN from report 026; regex literal \p and u flag are prohibited on mobile due to Hermes engine compatibility).
 * 4. Trims whitespace.
 */
export function normalizeDigits(raw: unknown): string {
  if (typeof raw !== 'string') return ''
  return raw
    .replace(/[\u0660-\u0669]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x0660 + 0x30))
    .replace(/[\u06F0-\u06F9]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x06F0 + 0x30))
    .replace(/[\u00AD\u0600-\u0605\u061C\u06DD\u070F\u0890-\u0891\u08E2\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u206F\uFEFF\uFFF9-\uFFFB]/g, '')
    .trim()
}
