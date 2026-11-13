import {
  resolveRequestTimeoutMs,
  TIMEOUT_INTERACTIVE_MS,
  TIMEOUT_LIST_SEARCH_MS,
  TIMEOUT_MUTATION_MS,
  TIMEOUT_UPLOAD_MS,
  notifySessionExpiredOnce,
  resetSessionExpiredNotice,
} from '../../api/client'
import { shouldRetryQuery } from '../../api/queryClient'
import { useAuthStore } from '../../store/authStore'
import { useBlockedStore } from '../../store/blockedStore'
import { dialogService } from '../../store/dialogStore'

jest.mock('../../store/dialogStore', () => ({
  dialogService: {
    alert: jest.fn(),
  },
}))

describe('G4: Operation-Aware Timeout Policy (resolveRequestTimeoutMs)', () => {
  it('assigns TIMEOUT_UPLOAD_MS (60s) to upload URLs or multipart headers', () => {
    expect(resolveRequestTimeoutMs({ url: '/api/v1/uploads/image' })).toBe(TIMEOUT_UPLOAD_MS)
    expect(
      resolveRequestTimeoutMs({
        url: '/api/v1/cars',
        method: 'POST',
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    ).toBe(TIMEOUT_UPLOAD_MS)
  })

  it('assigns TIMEOUT_MUTATION_MS (15s) to non-upload mutations', () => {
    expect(resolveRequestTimeoutMs({ url: '/api/v1/cars', method: 'POST' })).toBe(
      TIMEOUT_MUTATION_MS
    )
    expect(resolveRequestTimeoutMs({ url: '/api/v1/cars/123', method: 'PUT' })).toBe(
      TIMEOUT_MUTATION_MS
    )
    expect(resolveRequestTimeoutMs({ url: '/api/v1/cars/123', method: 'PATCH' })).toBe(
      TIMEOUT_MUTATION_MS
    )
    expect(resolveRequestTimeoutMs({ url: '/api/v1/cars/123', method: 'DELETE' })).toBe(
      TIMEOUT_MUTATION_MS
    )
  })

  it('assigns TIMEOUT_LIST_SEARCH_MS (15s) to search/browse/pagination queries', () => {
    expect(resolveRequestTimeoutMs({ url: '/api/v1/cars/search?q=toyota', method: 'GET' })).toBe(
      TIMEOUT_LIST_SEARCH_MS
    )
    expect(resolveRequestTimeoutMs({ url: '/api/v1/parts/browse', method: 'GET' })).toBe(
      TIMEOUT_LIST_SEARCH_MS
    )
    expect(resolveRequestTimeoutMs({ url: '/api/v1/services?page=1&limit=20', method: 'GET' })).toBe(
      TIMEOUT_LIST_SEARCH_MS
    )
  })

  it('assigns TIMEOUT_INTERACTIVE_MS (10s) to default GET requests', () => {
    expect(resolveRequestTimeoutMs({ url: '/api/v1/cars/car-123', method: 'GET' })).toBe(
      TIMEOUT_INTERACTIVE_MS
    )
    expect(resolveRequestTimeoutMs({ url: '/api/v1/users/me', method: 'GET' })).toBe(
      TIMEOUT_INTERACTIVE_MS
    )
  })
})

describe('G4: Smart Query Retry Policy (shouldRetryQuery)', () => {
  it('stops retry when failureCount >= 2', () => {
    expect(shouldRetryQuery(2, new Error('Network error'))).toBe(false)
    expect(shouldRetryQuery(3, new Error('Network error'))).toBe(false)
  })

  it('does not retry canceled queries', () => {
    expect(shouldRetryQuery(0, { code: 'ERR_CANCELED' })).toBe(false)
    expect(shouldRetryQuery(0, { name: 'CanceledError' })).toBe(false)
    expect(shouldRetryQuery(0, { name: 'AbortError' })).toBe(false)
  })

  it('does not retry contract parsing errors', () => {
    expect(shouldRetryQuery(0, { name: 'ListEnvelopeContractError' })).toBe(false)
  })

  it('does not retry 4xx status errors (400, 401, 403, 404, 409, 422, 429)', () => {
    for (const status of [400, 401, 403, 404, 409, 422, 429]) {
      expect(shouldRetryQuery(0, { response: { status } })).toBe(false)
    }
  })

  it('retries transient network errors, timeouts, and 5xx server errors up to 2 times', () => {
    expect(shouldRetryQuery(0, new Error('Network Error'))).toBe(true)
    expect(shouldRetryQuery(1, { code: 'ECONNABORTED' })).toBe(true)
    expect(shouldRetryQuery(0, { response: { status: 500 } })).toBe(true)
    expect(shouldRetryQuery(1, { response: { status: 503 } })).toBe(true)
  })
})

describe('G2 / S8a: Single-Flight Session Expiry Notice (notifySessionExpiredOnce)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    resetSessionExpiredNotice()
    useBlockedStore.getState().clear()
    useAuthStore.setState({ isLoggedIn: false, user: null, isGuest: false })
  })

  it('does not show notice if user is not logged in', () => {
    notifySessionExpiredOnce()
    expect(dialogService.alert).not.toHaveBeenCalled()
  })

  it('does not show notice if user is blocked (blocked screen takes precedence)', () => {
    useAuthStore.setState({ isLoggedIn: true })
    useBlockedStore.getState().setBlocked({ code: 'ACCOUNT_BANNED', suspendedUntil: null })

    notifySessionExpiredOnce()
    expect(dialogService.alert).not.toHaveBeenCalled()
  })

  it('shows single-flight notice and triggers logout once when logged in', () => {
    const logoutSpy = jest.spyOn(useAuthStore.getState(), 'logout').mockResolvedValue()
    useAuthStore.setState({ isLoggedIn: true, user: { id: 'u1' } as any })

    notifySessionExpiredOnce()
    expect(dialogService.alert).toHaveBeenCalledTimes(1)
    expect(dialogService.alert).toHaveBeenCalledWith(
      'انتهت الجلسة',
      'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى للمتابعة.',
      'warning'
    )
    expect(logoutSpy).toHaveBeenCalledTimes(1)

    // Second call in same flight must be ignored
    notifySessionExpiredOnce()
    expect(dialogService.alert).toHaveBeenCalledTimes(1)
  })

  it('resets single-flight guard when resetSessionExpiredNotice is invoked', () => {
    useAuthStore.setState({ isLoggedIn: true, user: { id: 'u1' } as any })
    notifySessionExpiredOnce()
    expect(dialogService.alert).toHaveBeenCalledTimes(1)

    resetSessionExpiredNotice()
    notifySessionExpiredOnce()
    expect(dialogService.alert).toHaveBeenCalledTimes(2)
  })
})
