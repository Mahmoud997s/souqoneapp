import fs from 'fs'
import path from 'path'
import { normalizeDigits as normalizeDigitsFromAppInput } from '../components/ui/AppInput'
import { normalizeDigits } from '../utils/digits'
import {
  validateLogin,
  validateRegister,
  validateOtp,
  validateResetPassword,
} from '../utils/authValidation'

describe('Auth Input Validation Suite (Mobile)', () => {
  describe('1. normalizeDigits utility (src/utils/digits.ts)', () => {
    it('converts Arabic-Indic digits (٠-٩) and Persian digits (۰-۹) to ASCII', () => {
      expect(normalizeDigits('٠١٢٣٤٥٦٧٨٩')).toBe('0123456789')
      expect(normalizeDigits('۰۱۲۳۴۵۶۷۸۹')).toBe('0123456789')
      expect(normalizeDigits('١٢٣٤٥٦')).toBe('123456')
      expect(normalizeDigits('۱۲۳۴۵۶')).toBe('123456')
    });

    it('preserves ASCII digits and regular text unchanged', () => {
      expect(normalizeDigits('123456')).toBe('123456')
      expect(normalizeDigits('Hello 123')).toBe('Hello 123')
    });

    it('returns empty string for null, undefined, or non-string inputs', () => {
      expect(normalizeDigits(null as any)).toBe('')
      expect(normalizeDigits(undefined as any)).toBe('')
      expect(normalizeDigits(123456 as any)).toBe('')
    });

    it('matches output of AppInput normalizeDigits on Arabic-Indic numbers', () => {
      const arabicIndicCases = ['٠١٢٣٤٥٦٧٨٩', '٥٠٠', '٩١٢٣٤٥٦٧']
      for (const str of arabicIndicCases) {
        expect(normalizeDigits(str)).toBe(normalizeDigitsFromAppInput(str))
      }
    });
  });

  describe('2. validateRegister', () => {
    const baseValidInput = {
      displayName: 'محمود أحمد',
      username: 'mahmoud_99',
      email: 'user@example.com',
      phone: '91234567',
      password: 'Password1',
      confirmPassword: 'Password1',
    }

    it('accepts Arabic-Indic phone number "٩١٢٣٤٥٦٧"', () => {
      const res = validateRegister({
        ...baseValidInput,
        phone: '٩١٢٣٤٥٦٧',
      })
      expect(res.errors.phone).toBeUndefined()
      expect(res.isValid).toBe(true)
    });

    it('accepts Arabic-Indic phone number with space "٩١٢٣ ٤٥٦٧"', () => {
      const res = validateRegister({
        ...baseValidInput,
        phone: '٩١٢٣ ٤٥٦٧',
      })
      expect(res.errors.phone).toBeUndefined()
      expect(res.isValid).toBe(true)
    });

    it('accepts valid 8-digit Omani phone "91234567" and strictly rejects prefix "96891234567"', () => {
      const valid = validateRegister({
        ...baseValidInput,
        phone: '91234567',
      })
      expect(valid.errors.phone).toBeUndefined()
      expect(valid.isValid).toBe(true)

      const invalid = validateRegister({
        ...baseValidInput,
        phone: '96891234567',
      })
      expect(invalid.errors.phone).toBe('رقم عماني غير صحيح (8 أرقام يبدأ بـ 9 أو 7)')
      expect(invalid.isValid).toBe(false)
    });

    it('accepts username with dot "a.b_c"', () => {
      const res = validateRegister({
        ...baseValidInput,
        username: 'a.b_c',
      })
      expect(res.errors.username).toBeUndefined()
      expect(res.isValid).toBe(true)
    });

    it('lowercases username: "Abc" passes after lowercase and length check', () => {
      const res = validateRegister({
        ...baseValidInput,
        username: 'Abc',
      })
      expect(res.errors.username).toBeUndefined()
      expect(res.isValid).toBe(true)
    });

    it('rejects Arabic characters in username "محمود"', () => {
      const res = validateRegister({
        ...baseValidInput,
        username: 'محمود',
      })
      expect(res.errors.username).toBe('من 3 إلى 30 حرفاً إنجليزياً صغيراً أو أرقاماً أو _ أو .')
      expect(res.isValid).toBe(false)
    });

    it('rejects username longer than 30 chars', () => {
      const res = validateRegister({
        ...baseValidInput,
        username: 'a'.repeat(31),
      })
      expect(res.errors.username).toBe('من 3 إلى 30 حرفاً إنجليزياً صغيراً أو أرقاماً أو _ أو .')
      expect(res.isValid).toBe(false)
    });

    it('displayName: accepts 2 characters and rejects 1 character', () => {
      const valid2 = validateRegister({
        ...baseValidInput,
        displayName: 'علي',
      })
      expect(valid2.errors.displayName).toBeUndefined()

      const invalid1 = validateRegister({
        ...baseValidInput,
        displayName: 'ع',
      })
      expect(invalid1.errors.displayName).toBe('الاسم الكامل يجب أن يتكون من حرفين على الأقل')
      expect(invalid1.isValid).toBe(false)
    });
  });

  describe('3. validateOtp and validateResetPassword', () => {
    it('validateOtp accepts Arabic-Indic digits "١٢٣٤٥٦"', () => {
      const res = validateOtp('١٢٣٤٥٦')
      expect(res.errors.code).toBeUndefined()
      expect(res.isValid).toBe(true)
    });

    it('validateResetPassword accepts Arabic-Indic code "١٢٣٤٥٦"', () => {
      const res = validateResetPassword({
        code: '١٢٣٤٥٦',
        password: 'Password1',
        confirmPassword: 'Password1',
      })
      expect(res.errors.code).toBeUndefined()
      expect(res.isValid).toBe(true)
    });

    it('validateResetPassword rejects code of 5 digits', () => {
      const res = validateResetPassword({
        code: '12345',
        password: 'Password1',
        confirmPassword: 'Password1',
      })
      expect(res.errors.code).toBe('رمز التحقق يجب أن يتكون من 6 أرقام')
      expect(res.isValid).toBe(false)
    });

    it('validateResetPassword rejects code containing letters', () => {
      const res = validateResetPassword({
        code: '12345a',
        password: 'Password1',
        confirmPassword: 'Password1',
      })
      expect(res.errors.code).toBe('رمز التحقق يجب أن يتكون من 6 أرقام')
      expect(res.isValid).toBe(false)
    });
  });

  describe('4. validateLogin', () => {
    it('accepts password of 3 characters (server is authoritative)', () => {
      const res = validateLogin({
        email: 'user@example.com',
        password: '123',
      })
      expect(res.errors.password).toBeUndefined()
      expect(res.isValid).toBe(true)
    });

    it('rejects empty password with "يرجى إدخال كلمة المرور"', () => {
      const res = validateLogin({
        email: 'user@example.com',
        password: '',
      })
      expect(res.errors.password).toBe('يرجى إدخال كلمة المرور')
      expect(res.isValid).toBe(false)
    });
  });

  describe('5. Hermes-safe digits & direction marks validation (AUTH-4A2-MOBILE-FIX)', () => {
    it('normalizes ASCII digits wrapped in direction marks \\u200F and \\u200E', () => {
      expect(normalizeDigits('\u200F123456\u200E')).toBe('123456')
    });

    it('normalizes Arabic-Indic digits containing embedded direction mark \\u200F', () => {
      expect(normalizeDigits('١٢٣\u200F٤٥٦')).toBe('123456')
    });

    it('validateOtp accepts code containing direction mark \\u200F123456', () => {
      const res = validateOtp('\u200F123456')
      expect(res.errors.code).toBeUndefined()
      expect(res.isValid).toBe(true)
    });

    it('validateResetPassword accepts code containing direction mark \\u200F123456', () => {
      const res = validateResetPassword({
        code: '\u200F123456',
        password: 'Password1',
        confirmPassword: 'Password1',
      })
      expect(res.errors.code).toBeUndefined()
      expect(res.isValid).toBe(true)
    });

    it('src/utils/digits.ts does not contain \\p{ or regex literal with u flag (Hermes safety)', () => {
      const filePath = path.resolve(__dirname, '../utils/digits.ts')
      const content = fs.readFileSync(filePath, 'utf8')
      expect(content.includes('\\p{')).toBe(false)
      expect(/\/[^\n\/]+\/[a-z]*u[a-z]*/.test(content)).toBe(false)
    });
  });
});

