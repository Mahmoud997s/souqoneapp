import { QueryClient } from '@tanstack/react-query'

/**
 * Smart query retry helper (G4):
 * - Never retries canceled queries or contract validation errors.
 * - Never retries client-side errors (400, 401, 403, 404, 409, 422, 429).
 * - Retries transient network failures, timeouts, and 5xx server errors up to 2 times.
 */
export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (failureCount >= 2) return false

  const err = error as any
  if (!err) return false

  // 1. Canceled queries
  if (err.code === 'ERR_CANCELED' || err.name === 'CanceledError' || err.name === 'AbortError') {
    return false
  }

  // 2. Schema / Contract parsing errors
  if (err.name === 'ListEnvelopeContractError') {
    return false
  }

  // 3. HTTP Status Check
  const status = err.response?.status
  if (typeof status === 'number') {
    if ([400, 401, 403, 404, 409, 422, 429].includes(status)) {
      return false
    }
  }

  return true
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: shouldRetryQuery,
      staleTime: 1000 * 60 * 5,
    },
    mutations: {
      retry: false,
    },
  },
})

