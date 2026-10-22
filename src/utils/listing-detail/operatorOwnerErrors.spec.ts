import { translateOperatorOwnerError } from './operatorOwnerErrors'

describe('translateOperatorOwnerError', () => {
  it('translates pending deletion conflict correctly', () => {
    const error = {
      response: {
        status: 409,
        data: { message: 'يوجد طلب حذف قيد المراجعة بالفعل لهذا الإعلان' },
      },
    }
    expect(translateOperatorOwnerError(error)).toBe(
      'يوجد طلب حذف قيد المراجعة بالفعل لهذا الإعلان.'
    )
  })

  it('translates 24-hour cancellation expiration message', () => {
    const error = {
      response: {
        status: 400,
        data: {
          message: 'انتهت مهلة إلغاء طلب الحذف (24 ساعة)، الطلب قيد مراجعة الإدارة الآن',
        },
      },
    }
    expect(translateOperatorOwnerError(error)).toBe(
      'انتهت مهلة إلغاء طلب الحذف (24 ساعة)، والطلب قيد مراجعة الإدارة الآن.'
    )
  })

  it('translates cancellation already resolved or cancelled', () => {
    const error = {
      response: {
        status: 400,
        data: { message: 'لا يمكن إلغاء طلب تم البت فيه بالفعل أو تم إلغاؤه' },
      },
    }
    expect(translateOperatorOwnerError(error)).toBe(
      'لا يمكن إلغاء طلب تم البت فيه بالفعل أو تم إلغاؤه.'
    )
  })

  it('translates missing deletion request (404)', () => {
    const error = {
      response: {
        status: 404,
        data: { message: 'طلب الحذف غير موجود' },
      },
    }
    expect(translateOperatorOwnerError(error)).toBe(
      'طلب الحذف غير موجود أو تم البت فيه مسبقاً.'
    )
  })

  it('translates forbidden ownership access (403)', () => {
    const error = {
      response: {
        status: 403,
        data: { message: 'Forbidden' },
      },
    }
    expect(translateOperatorOwnerError(error)).toBe(
      'ليس لديك صلاحية لتنفيذ هذا الإجراء.'
    )
  })

  it('translates unauthorized session expiration (401)', () => {
    const error = { response: { status: 401 } }
    expect(translateOperatorOwnerError(error)).toBe(
      'انتهت جلستك. يرجى تسجيل الدخول مجدداً.'
    )
  })

  it('falls back gracefully on unknown errors', () => {
    expect(translateOperatorOwnerError(null)).toBe('تعذّر تنفيذ الإجراء. حاول مرة أخرى.')
    expect(translateOperatorOwnerError(new Error('Network offline'))).toBe(
      'تعذّر تنفيذ الإجراء. حاول مرة أخرى.'
    )
  })
})
