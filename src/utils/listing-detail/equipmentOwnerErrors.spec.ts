import {
  extractEquipmentOwnerErrorCode,
  translateEquipmentOwnerError,
} from './equipmentOwnerErrors'

describe('equipmentOwnerErrors', () => {
  describe('extractEquipmentOwnerErrorCode', () => {
    it('returns undefined for non-objects or empty data', () => {
      expect(extractEquipmentOwnerErrorCode(null)).toBeUndefined()
      expect(extractEquipmentOwnerErrorCode({})).toBeUndefined()
      expect(extractEquipmentOwnerErrorCode({ response: {} })).toBeUndefined()
    })

    it('extracts top-level data.code', () => {
      const err = { response: { data: { code: 'ACCOUNT_BANNED' } } }
      expect(extractEquipmentOwnerErrorCode(err)).toBe('ACCOUNT_BANNED')
    })

    it('extracts nested data.message.code', () => {
      const err = { response: { data: { message: { code: 'PROFILE_PHONE_REQUIRED' } } } }
      expect(extractEquipmentOwnerErrorCode(err)).toBe('PROFILE_PHONE_REQUIRED')
    })

    it('extracts INVALID_STATUS_TRANSITION prefix from string message', () => {
      const err = { response: { data: { message: 'INVALID_STATUS_TRANSITION: ACTIVE -> DRAFT' } } }
      expect(extractEquipmentOwnerErrorCode(err)).toBe('INVALID_STATUS_TRANSITION')
    })
  })

  describe('translateEquipmentOwnerError', () => {
    it('handles 409 conflict error', () => {
      const err = { response: { status: 409 } }
      expect(translateEquipmentOwnerError(err)).toBe(
        'تم تعديل الإعلان من جهاز آخر. يرجى التحديث والمحاولة مجدداً.'
      )
    })

    it('handles PROFILE_PHONE_REQUIRED error', () => {
      const err = { response: { data: { code: 'PROFILE_PHONE_REQUIRED' } } }
      expect(translateEquipmentOwnerError(err)).toBe(
        'يجب إضافة رقم هاتفك في الملف الشخصي قبل تفعيل الإعلان.'
      )
    })

    it('handles INVALID_STATUS_TRANSITION error', () => {
      const err = { response: { data: { message: 'INVALID_STATUS_TRANSITION: SOLD -> ACTIVE' } } }
      expect(translateEquipmentOwnerError(err)).toBe(
        'لا يمكن تغيير حالة الإعلان من حالته الحالية إلى الحالة المطلوبة.'
      )
    })

    it('handles ACCOUNT_BANNED error', () => {
      const err = { response: { data: { code: 'ACCOUNT_BANNED' } } }
      expect(translateEquipmentOwnerError(err)).toBe(
        'حسابك محظور ولا يمكنك تنفيذ هذا الإجراء.'
      )
    })

    it('handles ACCOUNT_SUSPENDED error', () => {
      const err = { response: { data: { code: 'ACCOUNT_SUSPENDED' } } }
      expect(translateEquipmentOwnerError(err)).toBe(
        'حسابك موقوف مؤقتاً ولا يمكنك تنفيذ هذا الإجراء.'
      )
    })

    it('falls back to default message on unknown errors', () => {
      const err = new Error('Unknown server failure')
      expect(translateEquipmentOwnerError(err)).toBe(
        'تعذّر تنفيذ الإجراء. حاول مرة أخرى.'
      )
    })
  })
})
