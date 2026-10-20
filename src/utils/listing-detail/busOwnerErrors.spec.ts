import { translateBusOwnerError, extractBusOwnerErrorCode } from './busOwnerErrors'

describe('busOwnerErrors', () => {
  describe('extractBusOwnerErrorCode', () => {
    it('extracts code from response.data.code', () => {
      const err = { response: { data: { code: 'ACCOUNT_BANNED' } } }
      expect(extractBusOwnerErrorCode(err)).toBe('ACCOUNT_BANNED')
    })

    it('extracts code from response.data.message.code', () => {
      const err = { response: { data: { message: { code: 'ACCOUNT_SUSPENDED' } } } }
      expect(extractBusOwnerErrorCode(err)).toBe('ACCOUNT_SUSPENDED')
    })

    it('extracts code from response.data.message if string starting with INVALID_STATUS_TRANSITION', () => {
      const err = { response: { data: { message: 'INVALID_STATUS_TRANSITION: ACTIVE → ARCHIVED' } } }
      expect(extractBusOwnerErrorCode(err)).toBe('INVALID_STATUS_TRANSITION')
    })

    it('returns undefined when error has no response data', () => {
      expect(extractBusOwnerErrorCode(null)).toBeUndefined()
      expect(extractBusOwnerErrorCode({})).toBeUndefined()
      expect(extractBusOwnerErrorCode({ response: {} })).toBeUndefined()
    })
  })

  describe('translateBusOwnerError', () => {
    it('translates 409 conflict error', () => {
      const err = { response: { status: 409, data: { message: 'Conflict' } } }
      expect(translateBusOwnerError(err)).toBe('تم تعديل الإعلان من جهاز آخر. يرجى التحديث والمحاولة مجدداً.')
    })

    it('translates PROFILE_PHONE_REQUIRED error', () => {
      const err = { response: { status: 400, data: { code: 'PROFILE_PHONE_REQUIRED' } } }
      expect(translateBusOwnerError(err)).toBe('يجب إضافة رقم هاتفك في الملف الشخصي قبل تفعيل الإعلان.')
    })

    it('translates INVALID_STATUS_TRANSITION error', () => {
      const err = { response: { status: 400, data: { message: 'INVALID_STATUS_TRANSITION: SOLD → ACTIVE' } } }
      expect(translateBusOwnerError(err)).toBe('لا يمكن تغيير حالة الإعلان من حالته الحالية إلى الحالة المطلوبة.')
    })

    it('translates ACCOUNT_BANNED error', () => {
      const err = { response: { status: 403, data: { code: 'ACCOUNT_BANNED' } } }
      expect(translateBusOwnerError(err)).toBe('حسابك محظور ولا يمكنك تنفيذ هذا الإجراء.')
    })

    it('translates ACCOUNT_SUSPENDED error', () => {
      const err = { response: { status: 403, data: { code: 'ACCOUNT_SUSPENDED' } } }
      expect(translateBusOwnerError(err)).toBe('حسابك موقوف مؤقتاً ولا يمكنك تنفيذ هذا الإجراء.')
    })

    it('translates unknown error with generic fallback message', () => {
      const err = new Error('Unknown server failure')
      expect(translateBusOwnerError(err)).toBe('تعذّر تنفيذ الإجراء. حاول مرة أخرى.')
    })
  })
})
