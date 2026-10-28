import { useQuery, useQueryClient } from '@tanstack/react-query'
import { partsApi } from '../../../api/parts'
import { Part } from '../../../types/listing.types'
import { PartDetailViewModel } from '../../../types/partDetailViewModel.types'
import { mapPartDetailViewModel } from '../mappers/partDetailViewModel'
import { partQueryKeys } from './partQueryKeys'
import { useAuthStore } from '../../../store/authStore'
import { getDetailErrorKind, DetailErrorKind } from '../../../utils/listing-detail/getDetailErrorKind'

export type PartDetailState = 'loading' | 'ready' | 'notFound' | 'offline' | 'error'

export interface UsePartDetailResult {
  state: PartDetailState
  vm?: PartDetailViewModel
  raw?: Part
  error: unknown | null
  errorKind: DetailErrorKind
  isRefetchError: boolean
  refetch: () => Promise<unknown>
}

/**
 * Custom hook managing fetch, error classification, and ViewModel transformation
 * for the Spare Part Detail screen.
 *
 * Query Key: ['parts-detail', id, 'auth' | 'guest']
 * States:
 * - 'loading': initial fetch in progress
 * - 'ready': data successfully fetched and transformed into PartDetailViewModel
 * - 'notFound': HTTP 404 returned from API (soft-deleted, hidden, or non-existent)
 * - 'offline': Network disconnection or timeout
 * - 'error': Any other server or client error
 */
export function usePartDetail(
  id: string | undefined | null,
  options?: { now?: Date }
): UsePartDetailResult {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const queryClient = useQueryClient()
  const disableRetry = queryClient.getDefaultOptions().queries?.retry === false

  const query = useQuery<Part, unknown>({
    queryKey: partQueryKeys.detail(id ?? '', Boolean(isLoggedIn)),
    queryFn: async ({ signal }) => {
      if (!id) {
        throw new Error('Part listing ID is required')
      }
      const res = await partsApi.getById(id, { timeout: 15_000, signal })
      return res.data
    },
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 2,
    retry: disableRetry ? false : 1,
  })

  const errorKind = getDetailErrorKind(query.error)
  const isRefetchError = Boolean(query.data) && Boolean(query.isRefetchError)

  let state: PartDetailState = 'loading'
  let vm: PartDetailViewModel | undefined
  let raw: Part | undefined

  if (!id) {
    state = 'error'
  } else if (query.data) {
    state = 'ready'
    raw = query.data
    vm = mapPartDetailViewModel(query.data, {
      now: options?.now,
    })
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
