import axios from 'axios'

export type DetailErrorKind =
  | 'notFound'
  | 'offline'
  | 'timeout'
  | 'serverError'
  | 'unknown'

/**
 * Discriminates errors thrown during detail screen fetching.
 *
 * Rules:
 * 1. Not an Axios error (e.g. JS TypeError, ReferenceError) => 'unknown' (never treat runtime errors as offline!)
 * 2. ERR_CANCELED (aborted request on unmount/navigation) => 'unknown' (stays silent in UI)
 * 3. HTTP 404 => 'notFound'
 * 4. HTTP >= 500 => 'serverError' (5xx is server failure, not client offline)
 * 5. ECONNABORTED / ETIMEDOUT / message includes timeout => 'timeout'
 * 6. ERR_NETWORK or (no response && message === 'Network Error') => 'offline'
 * 7. Anything else => 'unknown'
 */
export function getDetailErrorKind(error: unknown): DetailErrorKind {
  if (!axios.isAxiosError(error)) {
    return 'unknown'
  }

  if (error.code === 'ERR_CANCELED') {
    return 'unknown'
  }

  const status = error.response?.status
  if (status === 404) {
    return 'notFound'
  }

  if (typeof status === 'number' && status >= 500) {
    return 'serverError'
  }

  const code = error.code
  const message = error.message

  if (
    code === 'ECONNABORTED' ||
    code === 'ETIMEDOUT' ||
    (typeof message === 'string' && /timeout/i.test(message))
  ) {
    return 'timeout'
  }

  if (
    code === 'ERR_NETWORK' ||
    (!error.response && typeof message === 'string' && /network\s*error/i.test(message))
  ) {
    return 'offline'
  }

  return 'unknown'
}
