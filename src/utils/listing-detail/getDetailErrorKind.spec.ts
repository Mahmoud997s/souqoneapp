import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { getDetailErrorKind } from './getDetailErrorKind'

function createMockAxiosError(partial: Partial<AxiosError>): AxiosError {
  const error = new Error(partial.message ?? 'Axios error') as AxiosError
  error.isAxiosError = true
  error.name = 'AxiosError'
  error.code = partial.code
  error.response = partial.response
  error.config = (partial.config ?? {}) as InternalAxiosRequestConfig
  return error
}

describe('getDetailErrorKind', () => {
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
    it('returns unknown for ERR_CANCELED to remain silent on unmount/navigation', () => {
      const err = createMockAxiosError({
        code: 'ERR_CANCELED',
        message: 'canceled',
      })
      expect(getDetailErrorKind(err)).toBe('unknown')
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

  describe('other Axios errors', () => {
    it('returns unknown for 400 Bad Request', () => {
      const err = createMockAxiosError({
        response: { status: 400 } as AxiosResponse,
      })
      expect(getDetailErrorKind(err)).toBe('unknown')
    })

    it('returns unknown for 403 Forbidden', () => {
      const err = createMockAxiosError({
        response: { status: 403 } as AxiosResponse,
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
