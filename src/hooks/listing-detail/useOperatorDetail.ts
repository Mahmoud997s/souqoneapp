import { useQuery } from '@tanstack/react-query'
import { equipmentApi } from '../../api/equipment'
import type { OperatorDetailApi } from '../../types/operatorDetailApi.types'
import type { OperatorDetailViewModel } from '../../types/operatorDetailViewModel.types'
import { mapOperatorDetail } from '../../utils/listing-detail/mapOperatorDetail'
import { operatorQueryKeys } from '../../utils/listing-detail/operatorQueryKeys'
import { useAuthStore } from '../../store/authStore'

export type OperatorDetailState = 'loading' | 'ready' | 'notFound' | 'offline' | 'error'

export interface UseOperatorDetailResult {
  state: OperatorDetailState
  vm?: OperatorDetailViewModel
  raw?: OperatorDetailApi
  error: unknown | null
  refetch: () => Promise<unknown>
}

interface AxiosLikeError {
  response?: {
    status?: number
  }
  code?: string
  message?: string
  isAxiosError?: boolean
}

function isNotFoundError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const err = error as AxiosLikeError
  return err.response?.status === 404
}

function isNetworkError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const err = error as AxiosLikeError
  if (err.code === 'ERR_NETWORK' || err.code === 'ECONNABORTED') return true
  if (err.message && /network\s*error/i.test(err.message)) return true
  if (err.isAxiosError && !err.response) return true
  return false
}

/**
 * Custom hook managing fetch, error classification, and ViewModel transformation
 * for the Operator Detail screen.
 *
 * Query Key: ['operator-detail', id, 'auth' | 'guest']
 * States:
 * - 'loading': initial fetch in progress
 * - 'ready': data successfully fetched and transformed into OperatorDetailViewModel
 * - 'notFound': HTTP 404 returned from API (non-existent, hidden, or non-active)
 * - 'offline': Network disconnection or timeout
 * - 'error': Any other server or client error
 */
export function useOperatorDetail(
  id: string | undefined | null
): UseOperatorDetailResult {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)

  const query = useQuery({
    queryKey: operatorQueryKeys.detail(id ?? '', isLoggedIn),
    queryFn: async (): Promise<OperatorDetailApi> => {
      if (!id) throw new Error('Missing operator ID')
      const res = await equipmentApi.getOperatorById(id)
      return res.data as unknown as OperatorDetailApi
    },
    enabled: Boolean(id),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })

  let state: OperatorDetailState = 'loading'
  let vm: OperatorDetailViewModel | undefined
  let raw: OperatorDetailApi | undefined

  if (!id) {
    state = 'error'
  } else if (query.data) {
    state = 'ready'
    raw = query.data
    vm = mapOperatorDetail(query.data)
  } else if (query.isLoading) {
    state = 'loading'
  } else if (query.isError) {
    if (isNotFoundError(query.error)) {
      state = 'notFound'
    } else if (isNetworkError(query.error)) {
      state = 'offline'
    } else {
      state = 'error'
    }
  }

  return {
    state,
    vm,
    raw,
    error: query.error ?? null,
    refetch: query.refetch,
  }
}
