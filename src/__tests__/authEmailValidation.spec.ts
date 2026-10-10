import {
  normalizeEmail,
  isValidNormalizedEmail,
  validateLogin,
  validateRegister,
  validateForgotPassword,
  validateResetPassword,
  createUnicodeCfRegex,
  UNICODE_CF_FALLBACK_PATTERN,
} from '../utils/authValidation'

describe('AUTH-4A-1 Mobile Email Validation & Normalization', () => {
  // Unicode category Cf formatting characters:
  const cfChars = [
    { name: 'U+200E (LRM)', char: '\u200E' },
    { name: 'U+200F (RLM)', char: '\u200F' },
    { name: 'U+202A (LRE)', char: '\u202A' },
    { name: 'U+202B (RLE)', char: '\u202B' },
    { name: 'U+202C (PDF)', char: '\u202C' },
    { name: 'U+202D (LRO)', char: '\u202D' },
    { name: 'U+202E (RLO)', char: '\u202E' },
    { name: 'U+2066 (LRI)', char: '\u2066' },
    { name: 'U+2067 (RLI)', char: '\u2067' },
    { name: 'U+2068 (FSI)', char: '\u2068' },
    { name: 'U+2069 (PDI)', char: '\u2069' },
    { name: 'U+200B (ZWSP)', char: '\u200B' },
    { name: 'U+FEFF (BOM)', char: '\uFEFF' },
  ]

  // All target characters required to be stripped when attached at the beginning of a@b.com:
  const leadingChars = [
    ...cfChars,
    { name: 'U+00A0 (NBSP)', char: '\u00A0' },
  ]

  describe('normalizeEmail - Hidden Unicode Formatting Marks & Whitespace', () => {
    leadingChars.forEach(({ name, char }) => {
      it(`strips ${name} prepended to a@b.com (yielding a@b.com)`, () => {
        expect(normalizeEmail(`${char}a@b.com`)).toBe('a@b.com')
      })

      it(`strips ${name} appended to a@b.com (yielding a@b.com)`, () => {
        expect(normalizeEmail(`a@b.com${char}`)).toBe('a@b.com')
      })
    })

    cfChars.forEach(({ name, char }) => {
      it(`strips ${name} embedded inside the local part from anywhere`, () => {
        expect(normalizeEmail(`user${char}test@example.com`)).toBe('usertest@example.com')
      })
    })

    it('preserves clean emails unchanged', () => {
      expect(normalizeEmail('user@example.com')).toBe('user@example.com')
    })

    it('converts uppercase ASCII characters to lowercase', () => {
      expect(normalizeEmail('Mahmoud.User@Example.COM')).toBe('mahmoud.user@example.com')
    })

    it('trims leading and trailing regular whitespace', () => {
      expect(normalizeEmail('   user@example.com   ')).toBe('user@example.com')
    })

    it('handles null, undefined and non-string safely', () => {
      expect(normalizeEmail(null as any)).toBe('')
      expect(normalizeEmail(undefined as any)).toBe('')
      expect(normalizeEmail(123 as any)).toBe('')
    })
  })

  describe('Hermes Fallback vs Dynamic \\p{Cf} Parity', () => {
    it('both dynamic and fallback regexes strip all target Cf characters identically', () => {
      const dynamicRegex = createUnicodeCfRegex(false)
      const fallbackRegex = createUnicodeCfRegex(true)

      expect(fallbackRegex.source).toBe(UNICODE_CF_FALLBACK_PATTERN)

      cfChars.forEach(({ char }) => {
        const input = `pre${char}fix@domain.com`
        const dynamicResult = normalizeEmail(input, false)
        const fallbackResult = normalizeEmail(input, true)

        expect(dynamicResult).toBe('prefix@domain.com')
        expect(fallbackResult).toBe('prefix@domain.com')
        expect(fallbackResult).toBe(dynamicResult)
      })
    })
  })

  describe('isValidNormalizedEmail Validation Rules', () => {
    it('accepts clean valid ASCII email', () => {
      expect(isValidNormalizedEmail('user@example.com')).toBe(true)
      expect(isValidNormalizedEmail('user.name+tag@sub.domain.org')).toBe(true)
    })

    it('rejects email longer than 254 characters', () => {
      const longLocal = 'a'.repeat(245)
      const longEmail = `${longLocal}@example.com` // 257 chars
      expect(longEmail.length).toBeGreaterThan(254)
      expect(isValidNormalizedEmail(longEmail)).toBe(false)
    })

    it('rejects emails containing non-ASCII characters (e.g. Arabic letters)', () => {
      expect(isValidNormalizedEmail('مستخدم@example.com')).toBe(false)
      expect(isValidNormalizedEmail('user@موقع.عمان')).toBe(false)
    })

    it('rejects empty or malformed strings', () => {
      expect(isValidNormalizedEmail('')).toBe(false)
      expect(isValidNormalizedEmail('plainaddress')).toBe(false)
      expect(isValidNormalizedEmail('@missinglocal.com')).toBe(false)
      expect(isValidNormalizedEmail('missingdomain@')).toBe(false)
    })
  })

  describe('Form Validation Integration (All 4 Auth Screens)', () => {
    const SERVER_ERROR_MSG = 'البريد الإلكتروني غير صالح'

    describe('1. validateLogin', () => {
      it('accepts email with leading U+200F without error', () => {
        const res = validateLogin({
          email: '\u200fuser@example.com',
          password: 'Password123!',
        })
        expect(res.errors.email).toBeUndefined()
        expect(res.isValid).toBe(true)
      })

      it('rejects Arabic non-ASCII email with server error message', () => {
        const res = validateLogin({
          email: 'مستخدم@example.com',
          password: 'Password123!',
        })
        expect(res.errors.email).toBe(SERVER_ERROR_MSG)
        expect(res.isValid).toBe(false)
      })

      it('rejects email longer than 254 chars with server error message', () => {
        const longEmail = `${'a'.repeat(245)}@example.com`
        const res = validateLogin({
          email: longEmail,
          password: 'Password123!',
        })
        expect(res.errors.email).toBe(SERVER_ERROR_MSG)
        expect(res.isValid).toBe(false)
      })

      it('shows empty error when email is blank', () => {
        const res = validateLogin({ email: '   ', password: 'Password123!' })
        expect(res.errors.email).toBe('يرجى إدخال البريد الإلكتروني')
        expect(res.isValid).toBe(false)
      })
    })

    describe('2. validateRegister', () => {
      const validBaseRegister = {
        displayName: 'محمود أحمد',
        username: 'mahmoud99',
        email: 'user@example.com',
        phone: '91234567',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      }

      it('accepts email with leading U+200F without error', () => {
        const res = validateRegister({
          ...validBaseRegister,
          email: '\u200fuser@example.com',
        })
        expect(res.errors.email).toBeUndefined()
        expect(res.isValid).toBe(true)
      })

      it('rejects Arabic non-ASCII email with server error message', () => {
        const res = validateRegister({
          ...validBaseRegister,
          email: 'مستخدم@example.com',
        })
        expect(res.errors.email).toBe(SERVER_ERROR_MSG)
        expect(res.isValid).toBe(false)
      })

      it('rejects email longer than 254 chars with server error message', () => {
        const longEmail = `${'a'.repeat(245)}@example.com`
        const res = validateRegister({
          ...validBaseRegister,
          email: longEmail,
        })
        expect(res.errors.email).toBe(SERVER_ERROR_MSG)
        expect(res.isValid).toBe(false)
      })
    })

    describe('3. validateForgotPassword', () => {
      it('accepts email with leading U+200F without error', () => {
        const res = validateForgotPassword('\u200fuser@example.com')
        expect(res.errors.email).toBeUndefined()
        expect(res.isValid).toBe(true)
      })

      it('rejects Arabic non-ASCII email with server error message', () => {
        const res = validateForgotPassword('مستخدم@example.com')
        expect(res.errors.email).toBe(SERVER_ERROR_MSG)
        expect(res.isValid).toBe(false)
      })

      it('rejects email longer than 254 chars with server error message', () => {
        const longEmail = `${'a'.repeat(245)}@example.com`
        const res = validateForgotPassword(longEmail)
        expect(res.errors.email).toBe(SERVER_ERROR_MSG)
        expect(res.isValid).toBe(false)
      })

      it('shows custom empty message when email is empty', () => {
        const res = validateForgotPassword('')
        expect(res.errors.email).toBe('يرجى إدخال البريد الإلكتروني المسجل')
        expect(res.isValid).toBe(false)
      })
    })

    describe('4. validateResetPassword', () => {
      const validBaseReset = {
        email: 'user@example.com',
        code: '123456',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      }

      it('accepts email with leading U+200F without error', () => {
        const res = validateResetPassword({
          ...validBaseReset,
          email: '\u200fuser@example.com',
        })
        expect(res.errors.email).toBeUndefined()
        expect(res.isValid).toBe(true)
      })

      it('rejects Arabic non-ASCII email with server error message', () => {
        const res = validateResetPassword({
          ...validBaseReset,
          email: 'مستخدم@example.com',
        })
        expect(res.errors.email).toBe(SERVER_ERROR_MSG)
        expect(res.isValid).toBe(false)
      })

      it('rejects email longer than 254 chars with server error message', () => {
        const longEmail = `${'a'.repeat(245)}@example.com`
        const res = validateResetPassword({
          ...validBaseReset,
          email: longEmail,
        })
        expect(res.errors.email).toBe(SERVER_ERROR_MSG)
        expect(res.isValid).toBe(false)
      })
    })
  })
})
