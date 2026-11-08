import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { getDetailErrorKind, getMutationErrorMessage } from './getDetailErrorKind'

function createMockAxiosError(partial: Partial<AxiosError>): AxiosError {
  const error = new Error(partial.message ?? 'Axios error') as AxiosError
  error.isAxiosError = true
  error.name = 'AxiosError'
  error.code = partial.code
  error.response = partial.response
  error.config = (partial.config ?? {}) as InternalAxiosRequestConfig
  return error
}

describe('getDetailErrorKind (F8: Classified Status Categories)', () => {
  describe('non-Axios errors (never treat as offline)', () => {
    it('returns unknown for JS TypeError', () => {
      const err = new TypeError('Cannot read properties of undefined (reading "title")')
      expect(getDetailErrorKind(err)).toBe('unknown')
    })

    it('returns unknown for generic Error', () => {
      const err = new Error('Custom application fault')
      expect(getDetailErrorKind(err)).toBe('unknown')
    })

    it('returns unknown for primitive values', () => {
      expect(getDetailErrorKind(null)).toBe('unknown')
      expect(getDetailErrorKind(undefined)).toBe('unknown')
      expect(getDetailErrorKind('Error string')).toBe('unknown')
      expect(getDetailErrorKind(500)).toBe('unknown')
      expect(getDetailErrorKind({ message: 'Fake error' })).toBe('unknown')
    })
  })

  describe('request cancellation', () => {
    it('returns canceled for ERR_CANCELED code', () => {
      const err = createMockAxiosError({
        code: 'ERR_CANCELED',
        message: 'canceled',
      })
      expect(getDetailErrorKind(err)).toBe('canceled')
    })

    it('returns canceled when axios.isCancel is true', () => {
      const cancelError = new axios.Cancel('Operation canceled by user.')
      expect(getDetailErrorKind(cancelError)).toBe('canceled')
    })
  })

  describe('notFound (HTTP 404)', () => {
    it('returns notFound when response status is 404', () => {
      const err = createMockAxiosError({
        response: { status: 404 } as AxiosResponse,
      })
      expect(getDetailErrorKind(err)).toBe('notFound')
    })
  })

  describe('unauthorized (HTTP 401: session expired)', () => {
    it('returns unauthorized when response status is 401', () => {
      const err = createMockAxiosError({
        response: { status: 401 } as AxiosResponse,
      })
      expect(getDetailErrorKind(err)).toBe('unauthorized')
    })
  })

  describe('forbidden (HTTP 403: permission denied)', () => {
    it('returns forbidden when response status is 403', () => {
      const err = createMockAxiosError({
        response: { status: 403 } as AxiosResponse,
      })
      expect(getDetailErrorKind(err)).toBe('forbidden')
    })
  })

  describe('conflict (HTTP 409: optimistic locking / state conflict)', () => {
    it('returns conflict when response status is 409', () => {
      const err = createMockAxiosError({
        response: { status: 409 } as AxiosResponse,
      })
      expect(getDetailErrorKind(err)).toBe('conflict')
    })
  })

  describe('validation (HTTP 400 / 422: payload / parameter errors)', () => {
    it('returns validation when response status is 400', () => {
      const err = createMockAxiosError({
        response: { status: 400 } as AxiosResponse,
      })
      expect(getDetailErrorKind(err)).toBe('validation')
    })

    it('returns validation when response status is 422', () => {
      const err = createMockAxiosError({
        response: { status: 422 } as AxiosResponse,
      })
      expect(getDetailErrorKind(err)).toBe('validation')
    })
  })

  describe('rateLimited (HTTP 429: too many requests)', () => {
    it('returns rateLimited when response status is 429', () => {
      const err = createMockAxiosError({
        response: { status: 429 } as AxiosResponse,
      })
      expect(getDetailErrorKind(err)).toBe('rateLimited')
    })
  })

  describe('serverError (HTTP >= 500)', () => {
    it('returns serverError for 500 Internal Server Error', () => {
      const err = createMockAxiosError({
        response: { status: 500 } as AxiosResponse,
      })
      expect(getDetailErrorKind(err)).toBe('serverError')
    })

    it('returns serverError for 502 Bad Gateway', () => {
      const err = createMockAxiosError({
        response: { status: 502 } as AxiosResponse,
      })
      expect(getDetailErrorKind(err)).toBe('serverError')
    })

    it('returns serverError for 503 Service Unavailable', () => {
      const err = createMockAxiosError({
        response: { status: 503 } as AxiosResponse,
      })
      expect(getDetailErrorKind(err)).toBe('serverError')
    })
  })

  describe('timeout', () => {
    it('returns timeout for ECONNABORTED code', () => {
      const err = createMockAxiosError({
        code: 'ECONNABORTED',
        message: 'timeout of 15000ms exceeded',
      })
      expect(getDetailErrorKind(err)).toBe('timeout')
    })

    it('returns timeout for ETIMEDOUT code', () => {
      const err = createMockAxiosError({
        code: 'ETIMEDOUT',
        message: 'Connection timed out',
      })
      expect(getDetailErrorKind(err)).toBe('timeout')
    })

    it('returns timeout when message contains timeout (case-insensitive)', () => {
      const err = createMockAxiosError({
        message: 'Request Timeout after 15s',
      })
      expect(getDetailErrorKind(err)).toBe('timeout')
    })

    it('returns timeout for HTTP 408 status', () => {
      const err = createMockAxiosError({
        response: { status: 408 } as AxiosResponse,
      })
      expect(getDetailErrorKind(err)).toBe('timeout')
    })
  })

  describe('offline', () => {
    it('returns offline for ERR_NETWORK code', () => {
      const err = createMockAxiosError({
        code: 'ERR_NETWORK',
        message: 'Network Error',
      })
      expect(getDetailErrorKind(err)).toBe('offline')
    })

    it('returns offline when no response and message is Network Error', () => {
      const err = createMockAxiosError({
        response: undefined,
        message: 'Network Error',
      })
      expect(getDetailErrorKind(err)).toBe('offline')
    })
  })

  describe('other Axios errors (never rename random 4xx as network)', () => {
    it('returns unknown for HTTP 405 Method Not Allowed', () => {
      const err = createMockAxiosError({
        response: { status: 405 } as AxiosResponse,
      })
      expect(getDetailErrorKind(err)).toBe('unknown')
    })

    it('returns unknown for HTTP 418 Im a teapot', () => {
      const err = createMockAxiosError({
        response: { status: 418 } as AxiosResponse,
      })
      expect(getDetailErrorKind(err)).toBe('unknown')
    })

    it('returns unknown for generic Axios error with unrecognized code', () => {
      const err = createMockAxiosError({
        code: 'ERR_BAD_REQUEST',
        message: 'Bad Request',
      })
      expect(getDetailErrorKind(err)).toBe('unknown')
    })
  })
})

describe('getMutationErrorMessage (F8: Single Source of Truth for Mutation Error Text)', () => {
  it('returns offline Arabic copy for network errors', () => {
    const err = createMockAxiosError({
      code: 'ERR_NETWORK',
      message: 'Network Error',
    })
    const msg = getMutationErrorMessage(err)
    expect(msg).toContain('تعذر الاتصال بالإنترنت')
  })

  it('returns timeout Arabic copy for timeout errors', () => {
    const err = createMockAxiosError({
      code: 'ECONNABORTED',
      message: 'timeout of 5000ms exceeded',
    })
    const msg = getMutationErrorMessage(err)
    expect(msg).toContain('انتهت مهلة الاتصال')
  })

  it('returns session expired copy for HTTP 401', () => {
    const err = createMockAxiosError({
      response: {
        status: 401,
        data: { message: 'Unauthorized' },
      } as AxiosResponse,
    })
    const msg = getMutationErrorMessage(err)
    expect(msg).toContain('انتهت صلاحية الجلسة')
  })

  it('returns rate limit copy for HTTP 429', () => {
    const err = createMockAxiosError({
      response: {
        status: 429,
        data: { message: 'Too Many Requests' },
      } as AxiosResponse,
    })
    const msg = getMutationErrorMessage(err)
    expect(msg).toContain('تجاوزت الحد المسموح')
  })

  it('returns server error copy for HTTP 500', () => {
    const err = createMockAxiosError({
      response: {
        status: 500,
        data: { message: 'Internal Server Error' },
      } as AxiosResponse,
    })
    const msg = getMutationErrorMessage(err)
    expect(msg).toContain('حدث خطأ في الخادم')
  })

  it('preserves specific Arabic business message from backend for HTTP 400', () => {
    const err = createMockAxiosError({
      response: {
        status: 400,
        data: { message: 'قيمة السعر غير صحيحة' },
      } as AxiosResponse,
    })
    const msg = getMutationErrorMessage(err)
    expect(msg).toBe('قيمة السعر غير صحيحة')
  })

  it('preserves first Arabic message from backend array for HTTP 400', () => {
    const err = createMockAxiosError({
      response: {
        status: 400,
        data: { message: ['English text', 'العنوان مطلوب ويجب ألا يقل عن 3 أحرف'] },
      } as AxiosResponse,
    })
    const msg = getMutationErrorMessage(err)
    expect(msg).toBe('العنوان مطلوب ويجب ألا يقل عن 3 أحرف')
  })

  it('falls back to clear Arabic validation copy when 400 has no Arabic text', () => {
    const err = createMockAxiosError({
      response: {
        status: 400,
        data: { message: 'Bad Request' },
      } as AxiosResponse,
    })
    const msg = getMutationErrorMessage(err)
    expect(msg).toContain('بيانات الطلب غير صالحة')
  })

  it('preserves specific Arabic message for HTTP 409 conflict', () => {
    const err = createMockAxiosError({
      response: {
        status: 409,
        data: { message: 'تم تعديل الإعلان من جهاز آخر' },
      } as AxiosResponse,
    })
    const msg = getMutationErrorMessage(err)
    expect(msg).toBe('تم تعديل الإعلان من جهاز آخر')
  })

  it('falls back to clear conflict copy when 409 has no custom Arabic text', () => {
    const err = createMockAxiosError({
      response: {
        status: 409,
        data: { message: 'Conflict' },
      } as AxiosResponse,
    })
    const msg = getMutationErrorMessage(err)
    expect(msg).toContain('تم تعديل البيانات من جهاز آخر')
  })

  it('preserves specific Arabic message for HTTP 403 forbidden', () => {
    const err = createMockAxiosError({
      response: {
        status: 403,
        data: { message: 'حسابك محظور من تنفيذ هذا الإجراء' },
      } as AxiosResponse,
    })
    const msg = getMutationErrorMessage(err)
    expect(msg).toBe('حسابك محظور من تنفيذ هذا الإجراء')
  })

  it('falls back to clear forbidden copy when 403 has no custom Arabic text', () => {
    const err = createMockAxiosError({
      response: {
        status: 403,
        data: { message: 'Forbidden' },
      } as AxiosResponse,
    })
    const msg = getMutationErrorMessage(err)
    expect(msg).toContain('ليس لديك الصلاحية')
  })

  it('returns fallbackMessage for non-Axios generic Error', () => {
    const err = new Error('Runtime unexpected fault')
    const msg = getMutationErrorMessage(err, 'تعذر التحديث')
    expect(msg).toBe('تعذر التحديث')
  })

  it('returns fallbackMessage for null / undefined / primitives', () => {
    expect(getMutationErrorMessage(null, 'تعذر')).toBe('تعذر')
    expect(getMutationErrorMessage(undefined, 'تعذر')).toBe('تعذر')
    expect(getMutationErrorMessage('raw string', 'تعذر')).toBe('تعذر')
  })
})
