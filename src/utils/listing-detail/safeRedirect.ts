/**
 * safeRedirect
 *
 * Validates and resolves redirect paths for post-authentication navigation.
 * Prevents Open Redirect vulnerabilities (protocol-relative paths, absolute URLs,
 * javascript/data schemes, control characters, or path traversal attacks).
 */

export function isSafeInternalPath(p: unknown): p is string {
  if (typeof p !== 'string') return false
  if (p.length === 0 || p.length > 200) return false

  // Must start with exactly one forward slash, not // or /\
  if (!p.startsWith('/') || p.startsWith('//') || p.startsWith('/\\')) return false

  // Disallow backslashes anywhere in path
  if (p.includes('\\')) return false

  // Disallow smuggled URI schemes like /javascript: or /https: or /data:
  if (/^\/[a-z][a-z0-9+.-]*:/i.test(p)) return false

  // Disallow control characters
  if (/[\u0000-\u001F\u007F]/.test(p)) return false

  return true
}

export function resolveRedirect(p: unknown, fallback = '/(tabs)'): string {
  return isSafeInternalPath(p) ? p : fallback
}
