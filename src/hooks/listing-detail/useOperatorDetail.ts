import { useQuery, useQueryClient } from '@tanstack/react-query'
import { equipmentApi } from '../../api/equipment'
import type { OperatorDetailApi } from '../../types/operatorDetailApi.types'
import type { OperatorDetailViewModel } from '../../types/operatorDetailViewModel.types'
import { mapOperatorDetail } from '../../utils/listing-detail/mapOperatorDetail'
import { operatorQueryKeys } from '../../utils/listing-detail/operatorQueryKeys'
import { useAuthStore } from '../../store/authStore'
import { getDetailErrorKind, DetailErrorKind } from '../../utils/listing-detail/getDetailErrorKind'

export type OperatorDetailState = 'loading' | 'ready' | 'notFound' | 'offline' | 'error'

export interface UseOperatorDetailResult {
  state: OperatorDetailState
  vm?: OperatorDetailViewModel
  raw?: OperatorDetailApi
  error: unknown | null
  errorKind: DetailErrorKind
  isRefetchError: boolean
  refetch: () => Promise<unknown>
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
  const queryClient = useQueryClient()
  const disableRetry = queryClient.getDefaultOptions().queries?.retry === false

  const query = useQuery({
    queryKey: operatorQueryKeys.detail(id ?? '', isLoggedIn),
    queryFn: async ({ signal }): Promise<OperatorDetailApi> => {
      if (!id) throw new Error('Missing operator ID')
      const res = await equipmentApi.getOperatorById(id, { timeout: 15_000, signal })
      return res.data as unknown as OperatorDetailApi
    },
    enabled: Boolean(id),
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: disableRetry ? false : 1,
  })

  const errorKind = getDetailErrorKind(query.error)
  const isRefetchError = Boolean(query.data) && Boolean(query.isRefetchError)

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
    if (errorKind === 'notFound') {
      state = 'notFound'
    } else if (errorKind === 'offline') {
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
    errorKind,
    isRefetchError,
    refetch: query.refetch,
  }
}
