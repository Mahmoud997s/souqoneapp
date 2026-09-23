import { isSafeInternalPath, resolveRedirect } from './safeRedirect'

describe('safeRedirect', () => {
  describe('isSafeInternalPath', () => {
    it('accepts valid internal paths', () => {
      expect(isSafeInternalPath('/cars/abc123')).toBe(true)
      expect(isSafeInternalPath('/cars/browse?search=x')).toBe(true)
      expect(isSafeInternalPath('/(tabs)')).toBe(true)
      expect(isSafeInternalPath('/listings/999?foo=bar&baz=1')).toBe(true)
      expect(isSafeInternalPath('/user/profile')).toBe(true)
      expect(isSafeInternalPath('/')).toBe(true)
    })

    it('rejects protocol-relative open redirects', () => {
      expect(isSafeInternalPath('//evil.com')).toBe(false)
      expect(isSafeInternalPath('//evil.com/phish')).toBe(false)
      expect(isSafeInternalPath('///evil.com')).toBe(false)
    })

    it('rejects absolute URLs with http/https schemes', () => {
      expect(isSafeInternalPath('https://evil.com')).toBe(false)
      expect(isSafeInternalPath('http://evil.com')).toBe(false)
      expect(isSafeInternalPath('ftp://evil.com')).toBe(false)
    })

    it('rejects javascript and data schemes (with or without leading slash)', () => {
      expect(isSafeInternalPath('javascript:alert(1)')).toBe(false)
      expect(isSafeInternalPath('/javascript:alert(1)')).toBe(false)
      expect(isSafeInternalPath('data:text/html,evil')).toBe(false)
      expect(isSafeInternalPath('/data:text/html,evil')).toBe(false)
      expect(isSafeInternalPath('/https:evil.com')).toBe(false)
    })

    it('rejects backslash bypasses', () => {
      expect(isSafeInternalPath('/\\evil.com')).toBe(false)
      expect(isSafeInternalPath('/path\\traversal')).toBe(false)
      expect(isSafeInternalPath('\\evil.com')).toBe(false)
    })

    it('rejects control characters', () => {
      expect(isSafeInternalPath('/cars/\nexploit')).toBe(false)
      expect(isSafeInternalPath('/cars/\x00null')).toBe(false)
      expect(isSafeInternalPath('/cars/\r\nreturn')).toBe(false)
    })

    it('rejects strings exceeding 200 characters', () => {
      const longPath = '/' + 'a'.repeat(205)
      expect(isSafeInternalPath(longPath)).toBe(false)

      const exact200Path = '/' + 'a'.repeat(199)
      expect(isSafeInternalPath(exact200Path)).toBe(true)
    })

    it('rejects empty strings and non-string inputs', () => {
      expect(isSafeInternalPath('')).toBe(false)
      expect(isSafeInternalPath('   ')).toBe(false)
      expect(isSafeInternalPath(undefined)).toBe(false)
      expect(isSafeInternalPath(null)).toBe(false)
      expect(isSafeInternalPath(123)).toBe(false)
      expect(isSafeInternalPath({})).toBe(false)
      expect(isSafeInternalPath([])).toBe(false)
    })
  })

  describe('resolveRedirect', () => {
    it('returns the valid internal path when safe', () => {
      expect(resolveRedirect('/cars/123')).toBe('/cars/123')
      expect(resolveRedirect('/listings/456?ref=share')).toBe('/listings/456?ref=share')
    })

    it('falls back to /(tabs) when path is unsafe or absent', () => {
      expect(resolveRedirect('//evil.com')).toBe('/(tabs)')
      expect(resolveRedirect('https://evil.com')).toBe('/(tabs)')
      expect(resolveRedirect('/javascript:alert(1)')).toBe('/(tabs)')
      expect(resolveRedirect('')).toBe('/(tabs)')
      expect(resolveRedirect(undefined)).toBe('/(tabs)')
      expect(resolveRedirect(null)).toBe('/(tabs)')
    })

    it('uses a custom fallback when specified', () => {
      expect(resolveRedirect('//evil.com', '/fallback')).toBe('/fallback')
      expect(resolveRedirect(undefined, '/cars/browse')).toBe('/cars/browse')
      expect(resolveRedirect('/valid/path', '/fallback')).toBe('/valid/path')
    })
  })
})
